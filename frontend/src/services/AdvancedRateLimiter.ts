// CineBook Advanced Rate Limiting System
// User-specific rate limiting with adaptive protection and behavior analysis

import { Logger } from './Logger'

// Rate Limit Configuration
interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  enableReset?: boolean
}

// User-specific Rate Limit Rules
interface UserRateLimitRules {
  userId?: string
  userTier: 'guest' | 'basic' | 'premium' | 'admin'
  customLimits?: Partial<RateLimitConfig>
  whitelisted: boolean
  blacklisted: boolean
  trustedScore: number // 0-100
}

// Rate Limit Entry
interface RateLimitEntry {
  count: number
  resetTime: number
  firstRequest: number
  violations: number
  lastViolation?: number
  suspended: boolean
  suspendedUntil?: number
}

// Rate Limit Context
interface RateLimitContext {
  endpoint: string
  method: string
  userId?: string
  ip: string
  userAgent: string
  headers: Record<string, string>
  timestamp: number
}

// Rate Limit Result
interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
  reason?: string
  violationLevel: 'none' | 'warning' | 'moderate' | 'severe' | 'critical'
}

// Default rate limit configurations for different endpoints
const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Authentication endpoints
  'POST:/api/auth/login': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    skipSuccessfulRequests: true
  },
  'POST:/api/auth/register': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    skipSuccessfulRequests: true
  },
  'POST:/api/auth/forgot-password': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3
  },
  
  // Booking endpoints
  'POST:/api/bookings': {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3
  },
  'GET:/api/showtimes/*/seats': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30
  },
  
  // Search and browse
  'GET:/api/movies': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100
  },
  'POST:/api/search': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50
  },
  
  // Admin endpoints
  'POST:/api/admin/*': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100
  },
  
  // Global fallback
  'global': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200
  }
}

// User tier multipliers for rate limits
const TIER_MULTIPLIERS: Record<string, number> = {
  guest: 0.5,
  basic: 1.0,
  premium: 2.0,
  admin: 10.0
}

class AdvancedRateLimiter {
  private rateLimitStore: Map<string, RateLimitEntry> = new Map()
  private userRulesStore: Map<string, UserRateLimitRules> = new Map()
  private suspiciousPatterns: Map<string, number> = new Map()
  private logger: Logger
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    this.logger = new Logger({
      level: 'INFO',
      enableConsole: true,
      enableRemote: true,
      remoteEndpoint: '/api/monitoring/rate-limits'
    })

    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries()
    }, 5 * 60 * 1000)
  }

  // Check if request is allowed
  public checkRateLimit(context: RateLimitContext): RateLimitResult {
    const key = this.generateKey(context)
    const config = this.getRateLimitConfig(context)
    const userRules = this.getUserRules(context.userId, context.ip)
    
    // Apply user-specific adjustments
    const adjustedConfig = this.adjustConfigForUser(config, userRules)
    
    // Check if user is blacklisted
    if (userRules.blacklisted) {
      this.logger.logSecurityEvent('rate_limit_blacklisted', {
        userId: context.userId,
        ip: context.ip,
        endpoint: context.endpoint
      })
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + adjustedConfig.windowMs,
        retryAfter: adjustedConfig.windowMs / 1000,
        reason: 'User is blacklisted',
        violationLevel: 'critical'
      }
    }
    
    // Check if user is whitelisted
    if (userRules.whitelisted) {
      return {
        allowed: true,
        remaining: adjustedConfig.maxRequests,
        resetTime: Date.now() + adjustedConfig.windowMs,
        violationLevel: 'none'
      }
    }

    // Get or create rate limit entry
    let entry = this.rateLimitStore.get(key)
    if (!entry || this.isExpired(entry, adjustedConfig.windowMs)) {
      entry = {
        count: 0,
        resetTime: Date.now() + adjustedConfig.windowMs,
        firstRequest: Date.now(),
        violations: 0,
        suspended: false
      }
    }

    // Check if user is temporarily suspended
    if (entry.suspended && entry.suspendedUntil && Date.now() < entry.suspendedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.suspendedUntil - Date.now()) / 1000),
        reason: 'Temporarily suspended due to rate limit violations',
        violationLevel: 'severe'
      }
    }

    // Clear suspension if time has passed
    if (entry.suspended && entry.suspendedUntil && Date.now() >= entry.suspendedUntil) {
      entry.suspended = false
      entry.suspendedUntil = undefined
      entry.violations = Math.max(0, entry.violations - 1) // Reduce violation count
    }

    // Increment request count
    entry.count++
    
    // Check if limit exceeded
    const allowed = entry.count <= adjustedConfig.maxRequests
    let violationLevel: RateLimitResult['violationLevel'] = 'none'
    
    if (!allowed) {
      entry.violations++
      entry.lastViolation = Date.now()
      violationLevel = this.calculateViolationLevel(entry, context)
      
      // Apply progressive penalties
      this.applyProgressivePenalties(entry, context, userRules)
      
      this.logger.logSecurityEvent('rate_limit_exceeded', {
        userId: context.userId,
        ip: context.ip,
        endpoint: context.endpoint,
        method: context.method,
        violations: entry.violations,
        violationLevel,
        userTier: userRules.userTier
      })
    }

    // Store updated entry
    this.rateLimitStore.set(key, entry)
    
    // Update user trust score
    this.updateUserTrustScore(context.userId || context.ip, allowed, violationLevel)
    
    // Detect suspicious patterns
    this.detectSuspiciousPatterns(context)

    return {
      allowed,
      remaining: Math.max(0, adjustedConfig.maxRequests - entry.count),
      resetTime: entry.resetTime,
      retryAfter: allowed ? undefined : Math.ceil((entry.resetTime - Date.now()) / 1000),
      reason: allowed ? undefined : 'Rate limit exceeded',
      violationLevel
    }
  }

  // Generate unique key for rate limiting
  private generateKey(context: RateLimitContext): string {
    const endpoint = `${context.method}:${context.endpoint}`
    const identifier = context.userId || context.ip
    return `${endpoint}:${identifier}`
  }

  // Get rate limit configuration for endpoint
  private getRateLimitConfig(context: RateLimitContext): RateLimitConfig {
    const endpoint = `${context.method}:${context.endpoint}`
    
    // Check for exact match
    if (DEFAULT_RATE_LIMITS[endpoint]) {
      return DEFAULT_RATE_LIMITS[endpoint]
    }
    
    // Check for wildcard matches
    for (const pattern in DEFAULT_RATE_LIMITS) {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'))
        if (regex.test(endpoint)) {
          return DEFAULT_RATE_LIMITS[pattern]
        }
      }
    }
    
    // Return global default
    return DEFAULT_RATE_LIMITS.global
  }

  // Get user-specific rules
  private getUserRules(userId?: string, ip?: string): UserRateLimitRules {
    const key = userId || ip || 'anonymous'
    
    if (this.userRulesStore.has(key)) {
      return this.userRulesStore.get(key)!
    }
    
    // Default rules for new users
    const defaultRules: UserRateLimitRules = {
      userId,
      userTier: userId ? 'basic' : 'guest',
      whitelisted: false,
      blacklisted: false,
      trustedScore: userId ? 50 : 30 // Authenticated users start with higher trust
    }
    
    this.userRulesStore.set(key, defaultRules)
    return defaultRules
  }

  // Adjust rate limit config based on user rules
  private adjustConfigForUser(config: RateLimitConfig, rules: UserRateLimitRules): RateLimitConfig {
    const multiplier = TIER_MULTIPLIERS[rules.userTier] || 1.0
    const trustMultiplier = 0.5 + (rules.trustedScore / 100) // 0.5 to 1.5x based on trust
    
    const finalMultiplier = multiplier * trustMultiplier
    
    return {
      ...config,
      ...rules.customLimits,
      maxRequests: Math.ceil(config.maxRequests * finalMultiplier)
    }
  }

  // Check if entry is expired
  private isExpired(entry: RateLimitEntry, windowMs: number): boolean {
    return Date.now() > entry.resetTime
  }

  // Calculate violation severity level
  private calculateViolationLevel(entry: RateLimitEntry, context: RateLimitContext): RateLimitResult['violationLevel'] {
    const violationRate = entry.violations / Math.max(1, (Date.now() - entry.firstRequest) / (60 * 1000)) // violations per minute
    
    if (violationRate > 10) return 'critical'
    if (violationRate > 5) return 'severe'
    if (violationRate > 2) return 'moderate'
    if (entry.violations > 3) return 'warning'
    
    return 'none'
  }

  // Apply progressive penalties based on violations
  private applyProgressivePenalties(entry: RateLimitEntry, context: RateLimitContext, rules: UserRateLimitRules): void {
    const violationLevel = this.calculateViolationLevel(entry, context)
    
    switch (violationLevel) {
      case 'warning':
        // Extend reset time by 50%
        entry.resetTime = Math.max(entry.resetTime, Date.now() + (60 * 1000))
        break
        
      case 'moderate':
        // Temporary 5-minute suspension
        entry.suspended = true
        entry.suspendedUntil = Date.now() + (5 * 60 * 1000)
        break
        
      case 'severe':
        // 30-minute suspension
        entry.suspended = true
        entry.suspendedUntil = Date.now() + (30 * 60 * 1000)
        break
        
      case 'critical':
        // 24-hour suspension and potential blacklisting
        entry.suspended = true
        entry.suspendedUntil = Date.now() + (24 * 60 * 60 * 1000)
        
        // Consider blacklisting repeat offenders
        if (entry.violations > 50) {
          rules.blacklisted = true
          this.userRulesStore.set(context.userId || context.ip, rules)
          
          this.logger.logSecurityEvent('user_blacklisted', {
            userId: context.userId,
            ip: context.ip,
            violations: entry.violations,
            reason: 'Excessive rate limit violations'
          })
        }
        break
    }
  }

  // Update user trust score based on behavior
  private updateUserTrustScore(identifier: string, allowed: boolean, violationLevel: RateLimitResult['violationLevel']): void {
    const rules = this.userRulesStore.get(identifier)
    if (!rules) return
    
    if (allowed) {
      // Gradually increase trust for good behavior
      rules.trustedScore = Math.min(100, rules.trustedScore + 0.1)
    } else {
      // Decrease trust based on violation severity
      const penalty = {
        warning: 1,
        moderate: 3,
        severe: 10,
        critical: 25,
        none: 0
      }[violationLevel] || 0
      
      rules.trustedScore = Math.max(0, rules.trustedScore - penalty)
    }
    
    this.userRulesStore.set(identifier, rules)
  }

  // Detect suspicious request patterns
  private detectSuspiciousPatterns(context: RateLimitContext): void {
    const patterns = [
      // High frequency requests from same IP
      `high_freq:${context.ip}`,
      // Unusual user agent patterns
      `user_agent:${this.normalizeUserAgent(context.userAgent)}`,
      // Multiple endpoints from same IP quickly
      `multi_endpoint:${context.ip}`,
      // Requests outside normal hours
      `off_hours:${context.ip}`
    ]
    
    patterns.forEach(pattern => {
      const count = this.suspiciousPatterns.get(pattern) || 0
      this.suspiciousPatterns.set(pattern, count + 1)
      
      // Alert on suspicious thresholds
      if (count > 50) {
        this.logger.logSecurityEvent('suspicious_pattern_detected', {
          pattern,
          count,
          ip: context.ip,
          userId: context.userId,
          endpoint: context.endpoint
        })
      }
    })
  }

  // Normalize user agent for pattern detection
  private normalizeUserAgent(userAgent: string): string {
    // Remove version numbers and specific details
    return userAgent
      .replace(/\d+\.\d+[\.\d]*/g, 'X.X')
      .replace(/\([^)]*\)/g, '()')
      .toLowerCase()
  }

  // Clean up expired entries
  private cleanupExpiredEntries(): void {
    const now = Date.now()
    let cleanedCount = 0
    
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (now > entry.resetTime && !entry.suspended) {
        this.rateLimitStore.delete(key)
        cleanedCount++
      }
    }
    
    // Clean up old suspicious patterns
    for (const [pattern, count] of this.suspiciousPatterns.entries()) {
      if (count < 5) { // Remove low-count patterns
        this.suspiciousPatterns.delete(pattern)
      }
    }
    
    if (cleanedCount > 0) {
      this.logger.logInfo('rate_limit_cleanup', {
        cleanedEntries: cleanedCount,
        remainingEntries: this.rateLimitStore.size
      })
    }
  }

  // Manual user management methods
  public whitelistUser(userId: string): void {
    const rules = this.getUserRules(userId)
    rules.whitelisted = true
    rules.blacklisted = false
    rules.trustedScore = 100
    this.userRulesStore.set(userId, rules)
    
    this.logger.logInfo('user_whitelisted', { userId })
  }

  public blacklistUser(userId: string, reason?: string): void {
    const rules = this.getUserRules(userId)
    rules.blacklisted = true
    rules.whitelisted = false
    rules.trustedScore = 0
    this.userRulesStore.set(userId, rules)
    
    this.logger.logSecurityEvent('user_blacklisted', { userId, reason })
  }

  public setUserTier(userId: string, tier: UserRateLimitRules['userTier']): void {
    const rules = this.getUserRules(userId)
    rules.userTier = tier
    this.userRulesStore.set(userId, rules)
    
    this.logger.logInfo('user_tier_updated', { userId, tier })
  }

  // Get current statistics
  public getStatistics(): {
    totalEntries: number
    suspendedUsers: number
    blacklistedUsers: number
    whitelistedUsers: number
    averageTrustScore: number
    topViolators: Array<{ identifier: string; violations: number }>
  } {
    const suspended = Array.from(this.rateLimitStore.values()).filter(e => e.suspended).length
    const blacklisted = Array.from(this.userRulesStore.values()).filter(r => r.blacklisted).length
    const whitelisted = Array.from(this.userRulesStore.values()).filter(r => r.whitelisted).length
    
    const trustScores = Array.from(this.userRulesStore.values()).map(r => r.trustedScore)
    const averageTrust = trustScores.length > 0 ? trustScores.reduce((a, b) => a + b, 0) / trustScores.length : 0
    
    const violators = Array.from(this.rateLimitStore.entries())
      .map(([key, entry]) => ({ identifier: key, violations: entry.violations }))
      .filter(v => v.violations > 0)
      .sort((a, b) => b.violations - a.violations)
      .slice(0, 10)
    
    return {
      totalEntries: this.rateLimitStore.size,
      suspendedUsers: suspended,
      blacklistedUsers: blacklisted,
      whitelistedUsers: whitelisted,
      averageTrustScore: Math.round(averageTrust),
      topViolators: violators
    }
  }

  // Cleanup on shutdown
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
  }
}

// Create global instance
const advancedRateLimiter = new AdvancedRateLimiter()

// React Hook for rate limiting integration
export function useRateLimiting() {
  const checkRateLimit = (endpoint: string, method: string = 'GET') => {
    const context: RateLimitContext = {
      endpoint,
      method,
      ip: 'client-side', // Will be replaced by server
      userAgent: navigator.userAgent,
      headers: {},
      timestamp: Date.now()
    }
    
    return advancedRateLimiter.checkRateLimit(context)
  }
  
  return {
    checkRateLimit,
    getStatistics: () => advancedRateLimiter.getStatistics()
  }
}

export default advancedRateLimiter
export type { 
  RateLimitConfig, 
  UserRateLimitRules, 
  RateLimitContext, 
  RateLimitResult 
}