// Rate Limiting and Brute Force Protection for CineBook
// Advanced rate limiting with multiple strategies and adaptive protection

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (identifier: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  resetOnSuccess?: boolean;
  enableAdaptive?: boolean;
  adaptiveThreshold?: number;
}

export interface RateLimitRule {
  endpoint: string | RegExp;
  config: RateLimitConfig;
  description: string;
}

export interface AttackPattern {
  type: 'brute_force' | 'ddos' | 'enumeration' | 'scraping';
  threshold: number;
  timeWindow: number;
  description: string;
  action: 'block' | 'captcha' | 'delay' | 'alert';
}

export interface RateLimitAttempt {
  identifier: string;
  endpoint: string;
  timestamp: number;
  success: boolean;
  userAgent?: string;
  ipAddress?: string;
}

export interface RateLimitStatus {
  remaining: number;
  reset: number;
  total: number;
  isBlocked: boolean;
  retryAfter?: number;
  adaptiveMultiplier?: number;
}

export interface SecurityAlert {
  type: 'rate_limit_exceeded' | 'attack_detected' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  identifier: string;
  endpoint: string;
  description: string;
  timestamp: number;
  metadata: Record<string, any>;
}

class RateLimiter {
  private static instance: RateLimiter;
  private attempts: Map<string, RateLimitAttempt[]>;
  private blockedIdentifiers: Map<string, number>;
  private rules: Map<string, RateLimitRule>;
  private attackPatterns: AttackPattern[];
  private alertCallbacks: ((alert: SecurityAlert) => void)[];

  private constructor() {
    this.attempts = new Map();
    this.blockedIdentifiers = new Map();
    this.rules = new Map();
    this.attackPatterns = [];
    this.alertCallbacks = [];
    this.initializeDefaultRules();
    this.initializeAttackPatterns();
    this.startCleanupTimer();
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  // Initialize default rate limiting rules
  private initializeDefaultRules(): void {
    // Login attempts - strict limiting
    this.addRule('auth_login', {
      endpoint: '/api/auth/login',
      config: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
        resetOnSuccess: true,
        enableAdaptive: true,
        adaptiveThreshold: 3
      },
      description: 'Login attempts protection against brute force'
    });

    // Registration - moderate limiting
    this.addRule('auth_register', {
      endpoint: '/api/auth/register',
      config: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3,
        skipSuccessfulRequests: true
      },
      description: 'Registration rate limiting'
    });

    // Password reset - strict limiting
    this.addRule('auth_reset', {
      endpoint: '/api/auth/reset-password',
      config: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3,
        skipSuccessfulRequests: false
      },
      description: 'Password reset protection'
    });

    // Booking attempts - moderate limiting
    this.addRule('booking_create', {
      endpoint: '/api/bookings',
      config: {
        windowMs: 5 * 60 * 1000, // 5 minutes
        maxRequests: 10,
        enableAdaptive: true,
        adaptiveThreshold: 7
      },
      description: 'Booking creation rate limiting'
    });

    // Search API - lenient limiting
    this.addRule('search_api', {
      endpoint: /^\/api\/(movies|theaters)\/search/,
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 60,
        skipSuccessfulRequests: true
      },
      description: 'Search API rate limiting'
    });

    // Admin API - moderate limiting
    this.addRule('admin_api', {
      endpoint: /^\/api\/admin/,
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 30,
        enableAdaptive: true,
        adaptiveThreshold: 20
      },
      description: 'Admin API rate limiting'
    });

    // File upload - strict limiting
    this.addRule('file_upload', {
      endpoint: /upload/,
      config: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 10,
        skipFailedRequests: true
      },
      description: 'File upload rate limiting'
    });
  }

  // Initialize attack pattern detection
  private initializeAttackPatterns(): void {
    this.attackPatterns = [
      {
        type: 'brute_force',
        threshold: 20,
        timeWindow: 5 * 60 * 1000, // 5 minutes
        description: 'Rapid failed login attempts',
        action: 'block'
      },
      {
        type: 'ddos',
        threshold: 100,
        timeWindow: 60 * 1000, // 1 minute
        description: 'High frequency requests',
        action: 'delay'
      },
      {
        type: 'enumeration',
        threshold: 50,
        timeWindow: 10 * 60 * 1000, // 10 minutes
        description: 'User/email enumeration attempts',
        action: 'captcha'
      },
      {
        type: 'scraping',
        threshold: 200,
        timeWindow: 60 * 1000, // 1 minute
        description: 'Automated data scraping',
        action: 'block'
      }
    ];
  }

  // Add custom rate limiting rule
  public addRule(name: string, rule: RateLimitRule): void {
    this.rules.set(name, rule);
  }

  // Remove rate limiting rule
  public removeRule(name: string): void {
    this.rules.delete(name);
  }

  // Check rate limit for a request
  public checkRateLimit(
    identifier: string,
    endpoint: string,
    success: boolean = true,
    metadata: Record<string, any> = {}
  ): RateLimitStatus {
    const rule = this.findMatchingRule(endpoint);
    if (!rule) {
      return {
        remaining: Infinity,
        reset: 0,
        total: Infinity,
        isBlocked: false
      };
    }

    const key = this.generateKey(identifier, endpoint, rule);
    const now = Date.now();

    // Check if identifier is currently blocked
    const blockExpiry = this.blockedIdentifiers.get(identifier);
    if (blockExpiry && blockExpiry > now) {
      return {
        remaining: 0,
        reset: blockExpiry,
        total: rule.config.maxRequests,
        isBlocked: true,
        retryAfter: Math.ceil((blockExpiry - now) / 1000)
      };
    }

    // Record the attempt
    this.recordAttempt({
      identifier,
      endpoint,
      timestamp: now,
      success,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress
    });

    // Get attempts within the time window
    const attempts = this.getAttemptsInWindow(key, rule.config.windowMs);
    
    // Filter attempts based on rule configuration
    const relevantAttempts = this.filterAttempts(attempts, rule.config);

    // Calculate adaptive multiplier if enabled
    const adaptiveMultiplier = this.calculateAdaptiveMultiplier(attempts, rule.config);
    const effectiveLimit = Math.floor(rule.config.maxRequests / adaptiveMultiplier);

    // Check if limit is exceeded
    const remaining = Math.max(0, effectiveLimit - relevantAttempts.length);
    const isBlocked = remaining === 0;

    if (isBlocked) {
      this.handleRateLimitExceeded(identifier, endpoint, rule, attempts);
    }

    // Detect attack patterns
    this.detectAttackPatterns(identifier, endpoint, attempts);

    return {
      remaining,
      reset: now + rule.config.windowMs,
      total: effectiveLimit,
      isBlocked,
      retryAfter: isBlocked ? Math.ceil(rule.config.windowMs / 1000) : undefined,
      adaptiveMultiplier
    };
  }

  // Find matching rule for endpoint
  private findMatchingRule(endpoint: string): RateLimitRule | null {
    for (const rule of this.rules.values()) {
      if (typeof rule.endpoint === 'string') {
        if (endpoint === rule.endpoint) {
          return rule;
        }
      } else if (rule.endpoint instanceof RegExp) {
        if (rule.endpoint.test(endpoint)) {
          return rule;
        }
      }
    }
    return null;
  }

  // Generate cache key for rate limiting
  private generateKey(identifier: string, endpoint: string, rule: RateLimitRule): string {
    if (rule.config.keyGenerator) {
      return rule.config.keyGenerator(identifier);
    }
    return `${identifier}:${endpoint}`;
  }

  // Record rate limit attempt
  private recordAttempt(attempt: RateLimitAttempt): void {
    const key = `${attempt.identifier}:${attempt.endpoint}`;
    
    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }
    
    const attempts = this.attempts.get(key)!;
    attempts.push(attempt);
    
    // Keep only last 1000 attempts to prevent memory leaks
    if (attempts.length > 1000) {
      attempts.splice(0, attempts.length - 1000);
    }
  }

  // Get attempts within time window
  private getAttemptsInWindow(key: string, windowMs: number): RateLimitAttempt[] {
    const attempts = this.attempts.get(key) || [];
    const cutoff = Date.now() - windowMs;
    return attempts.filter(attempt => attempt.timestamp > cutoff);
  }

  // Filter attempts based on rule configuration
  private filterAttempts(attempts: RateLimitAttempt[], config: RateLimitConfig): RateLimitAttempt[] {
    let filtered = attempts;

    if (config.skipSuccessfulRequests) {
      filtered = filtered.filter(attempt => !attempt.success);
    }

    if (config.skipFailedRequests) {
      filtered = filtered.filter(attempt => attempt.success);
    }

    return filtered;
  }

  // Calculate adaptive multiplier based on recent behavior
  private calculateAdaptiveMultiplier(attempts: RateLimitAttempt[], config: RateLimitConfig): number {
    if (!config.enableAdaptive || !config.adaptiveThreshold) {
      return 1;
    }

    const recentFailures = attempts.filter(attempt => !attempt.success).length;
    
    if (recentFailures >= config.adaptiveThreshold) {
      // Increase restrictions for suspicious behavior
      return Math.min(4, 1 + (recentFailures - config.adaptiveThreshold) * 0.5);
    }

    return 1;
  }

  // Handle rate limit exceeded
  private handleRateLimitExceeded(
    identifier: string,
    endpoint: string,
    rule: RateLimitRule,
    attempts: RateLimitAttempt[]
  ): void {
    const now = Date.now();
    const blockDuration = this.calculateBlockDuration(attempts, rule);
    
    // Block the identifier
    this.blockedIdentifiers.set(identifier, now + blockDuration);

    // Generate security alert
    this.generateAlert({
      type: 'rate_limit_exceeded',
      severity: this.calculateSeverity(attempts, rule),
      identifier,
      endpoint,
      description: `Rate limit exceeded for ${rule.description}`,
      timestamp: now,
      metadata: {
        rule: rule.description,
        attempts: attempts.length,
        blockDuration,
        recentFailures: attempts.filter(a => !a.success).length
      }
    });
  }

  // Calculate block duration based on violation severity
  private calculateBlockDuration(attempts: RateLimitAttempt[], rule: RateLimitRule): number {
    const baseBlockTime = rule.config.windowMs;
    const violations = attempts.length - rule.config.maxRequests;
    const failureRate = attempts.filter(a => !a.success).length / attempts.length;

    // Exponential backoff for repeated violations
    let multiplier = 1 + Math.log2(Math.max(1, violations));
    
    // Increase for high failure rates
    if (failureRate > 0.5) {
      multiplier *= 2;
    }

    return Math.min(baseBlockTime * multiplier, 24 * 60 * 60 * 1000); // Max 24 hours
  }

  // Calculate severity based on attempts and rule
  private calculateSeverity(attempts: RateLimitAttempt[], rule: RateLimitRule): SecurityAlert['severity'] {
    const violations = attempts.length - rule.config.maxRequests;
    const failureRate = attempts.filter(a => !a.success).length / attempts.length;

    if (violations > rule.config.maxRequests * 2 && failureRate > 0.8) {
      return 'critical';
    }
    if (violations > rule.config.maxRequests && failureRate > 0.6) {
      return 'high';
    }
    if (violations > rule.config.maxRequests * 0.5) {
      return 'medium';
    }
    return 'low';
  }

  // Detect attack patterns
  private detectAttackPatterns(identifier: string, endpoint: string, attempts: RateLimitAttempt[]): void {
    for (const pattern of this.attackPatterns) {
      const patternAttempts = this.getAttemptsForPattern(attempts, pattern);
      
      if (patternAttempts.length >= pattern.threshold) {
        this.handleAttackDetection(identifier, endpoint, pattern, patternAttempts);
      }
    }
  }

  // Get attempts relevant to attack pattern
  private getAttemptsForPattern(attempts: RateLimitAttempt[], pattern: AttackPattern): RateLimitAttempt[] {
    const cutoff = Date.now() - pattern.timeWindow;
    const relevantAttempts = attempts.filter(attempt => attempt.timestamp > cutoff);

    switch (pattern.type) {
      case 'brute_force':
        return relevantAttempts.filter(attempt => !attempt.success);
      case 'ddos':
        return relevantAttempts;
      case 'enumeration':
        return relevantAttempts.filter(attempt => !attempt.success);
      case 'scraping':
        return relevantAttempts.filter(attempt => attempt.success);
      default:
        return relevantAttempts;
    }
  }

  // Handle attack pattern detection
  private handleAttackDetection(
    identifier: string,
    endpoint: string,
    pattern: AttackPattern,
    attempts: RateLimitAttempt[]
  ): void {
    const now = Date.now();

    // Apply action based on pattern
    if (pattern.action === 'block') {
      this.blockedIdentifiers.set(identifier, now + pattern.timeWindow);
    }

    // Generate security alert
    this.generateAlert({
      type: 'attack_detected',
      severity: 'high',
      identifier,
      endpoint,
      description: `${pattern.description} detected`,
      timestamp: now,
      metadata: {
        attackType: pattern.type,
        threshold: pattern.threshold,
        attempts: attempts.length,
        action: pattern.action,
        timeWindow: pattern.timeWindow
      }
    });
  }

  // Generate security alert
  private generateAlert(alert: SecurityAlert): void {
    console.warn('Security Alert:', alert);
    
    // Notify registered callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
  }

  // Register alert callback
  public onAlert(callback: (alert: SecurityAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  // Remove alert callback
  public removeAlertCallback(callback: (alert: SecurityAlert) => void): void {
    const index = this.alertCallbacks.indexOf(callback);
    if (index > -1) {
      this.alertCallbacks.splice(index, 1);
    }
  }

  // Manually block identifier
  public blockIdentifier(identifier: string, duration: number = 60 * 60 * 1000): void {
    this.blockedIdentifiers.set(identifier, Date.now() + duration);
  }

  // Manually unblock identifier
  public unblockIdentifier(identifier: string): void {
    this.blockedIdentifiers.delete(identifier);
  }

  // Check if identifier is blocked
  public isBlocked(identifier: string): boolean {
    const blockExpiry = this.blockedIdentifiers.get(identifier);
    if (!blockExpiry) return false;
    
    if (blockExpiry <= Date.now()) {
      this.blockedIdentifiers.delete(identifier);
      return false;
    }
    
    return true;
  }

  // Get rate limit statistics
  public getStatistics(): Record<string, any> {
    const now = Date.now();
    const stats: Record<string, any> = {
      totalAttempts: 0,
      blockedIdentifiers: this.blockedIdentifiers.size,
      activeRules: this.rules.size,
      attackPatterns: this.attackPatterns.length,
      alerts: this.alertCallbacks.length
    };

    // Count total attempts
    for (const attempts of this.attempts.values()) {
      stats.totalAttempts += attempts.length;
    }

    // Count attempts by endpoint
    stats.endpointStats = {};
    for (const [key, attempts] of this.attempts.entries()) {
      const endpoint = key.split(':')[1];
      if (!stats.endpointStats[endpoint]) {
        stats.endpointStats[endpoint] = 0;
      }
      stats.endpointStats[endpoint] += attempts.length;
    }

    return stats;
  }

  // Reset all rate limits for identifier
  public resetRateLimit(identifier: string): void {
    const keysToDelete = [];
    for (const key of this.attempts.keys()) {
      if (key.startsWith(identifier + ':')) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.attempts.delete(key));
    this.blockedIdentifiers.delete(identifier);
  }

  // Clear expired data
  private cleanup(): void {
    const now = Date.now();

    // Remove expired blocks
    for (const [identifier, expiry] of this.blockedIdentifiers.entries()) {
      if (expiry <= now) {
        this.blockedIdentifiers.delete(identifier);
      }
    }

    // Remove old attempts (older than 24 hours)
    const cutoff = now - 24 * 60 * 60 * 1000;
    for (const [key, attempts] of this.attempts.entries()) {
      const filteredAttempts = attempts.filter(attempt => attempt.timestamp > cutoff);
      if (filteredAttempts.length === 0) {
        this.attempts.delete(key);
      } else if (filteredAttempts.length !== attempts.length) {
        this.attempts.set(key, filteredAttempts);
      }
    }
  }

  // Start cleanup timer
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Cleanup every 5 minutes
  }

  // Destroy instance and cleanup
  public destroy(): void {
    this.attempts.clear();
    this.blockedIdentifiers.clear();
    this.rules.clear();
    this.alertCallbacks.length = 0;
  }
}

// Export singleton instance
export const rateLimiter = RateLimiter.getInstance();

// React Hook for rate limiting
export function useRateLimit(endpoint: string) {
  const checkLimit = (success: boolean = true, metadata: Record<string, any> = {}): RateLimitStatus => {
    const identifier = metadata.userId || metadata.ipAddress || 'anonymous';
    return rateLimiter.checkRateLimit(identifier, endpoint, success, metadata);
  };

  const isBlocked = (identifier: string): boolean => {
    return rateLimiter.isBlocked(identifier);
  };

  const resetLimit = (identifier: string): void => {
    rateLimiter.resetRateLimit(identifier);
  };

  return {
    checkLimit,
    isBlocked,
    resetLimit
  };
}

export default rateLimiter;