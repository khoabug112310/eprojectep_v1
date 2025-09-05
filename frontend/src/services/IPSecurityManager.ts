// CineBook IP-based Security System
// Geolocation controls, IP reputation, VPN/Proxy detection

import { Logger } from './Logger'

// IP Security Configuration
interface IPSecurityConfig {
  enableGeolocation: boolean
  enableReputationScoring: boolean
  enableVPNDetection: boolean
  allowedCountries: string[]
  blockedCountries: string[]
  reputationThreshold: number
  enableAutoBlocking: boolean
}

// IP Geolocation Data
interface IPGeolocation {
  ip: string
  country: string
  countryCode: string
  region: string
  city: string
  latitude: number
  longitude: number
  timezone: string
  isp: string
  organization: string
  asn: string
}

// IP Reputation Data
interface IPReputation {
  ip: string
  score: number // 0-100 (0 = very bad, 100 = very good)
  categories: string[]
  lastUpdated: number
  sources: string[]
  threatTypes: string[]
}

// VPN/Proxy Detection Result
interface VPNProxyDetection {
  ip: string
  isVPN: boolean
  isProxy: boolean
  isTor: boolean
  isDatacenter: boolean
  confidence: number
  provider?: string
  lastChecked: number
}

// IP Security Assessment
interface IPSecurityAssessment {
  ip: string
  allowed: boolean
  riskLevel: 'very_low' | 'low' | 'medium' | 'high' | 'critical'
  blockedReason?: string
  geolocation?: IPGeolocation
  reputation?: IPReputation
  vpnProxy?: VPNProxyDetection
  recommendations: string[]
  timestamp: number
}

// IP Activity Log
interface IPActivity {
  ip: string
  firstSeen: number
  lastSeen: number
  requestCount: number
  successfulRequests: number
  failedRequests: number
  endpoints: Set<string>
  userAgents: Set<string>
  suspiciousActivity: boolean
  blocked: boolean
  blockedAt?: number
  blockedReason?: string
}

class IPSecurityManager {
  private config: IPSecurityConfig
  private ipCache: Map<string, IPSecurityAssessment> = new Map()
  private ipActivity: Map<string, IPActivity> = new Map()
  private geolocationCache: Map<string, IPGeolocation> = new Map()
  private reputationCache: Map<string, IPReputation> = new Map()
  private vpnProxyCache: Map<string, VPNProxyDetection> = new Map()
  private logger: Logger
  private cleanupInterval: NodeJS.Timeout

  constructor(config: Partial<IPSecurityConfig> = {}) {
    this.config = {
      enableGeolocation: true,
      enableReputationScoring: true,
      enableVPNDetection: true,
      allowedCountries: [], // Empty = allow all
      blockedCountries: ['CN', 'RU', 'KP'], // Block high-risk countries by default
      reputationThreshold: 30, // Block IPs with reputation < 30
      enableAutoBlocking: true,
      ...config
    }

    this.logger = new Logger({
      level: 'INFO',
      enableConsole: true,
      enableRemote: true,
      remoteEndpoint: '/api/monitoring/ip-security'
    })

    // Cleanup expired cache entries every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupCache()
    }, 60 * 60 * 1000)
  }

  // Main IP security assessment
  public async assessIP(ip: string, context?: {
    endpoint?: string
    userAgent?: string
    userId?: string
  }): Promise<IPSecurityAssessment> {
    // Check cache first
    const cached = this.ipCache.get(ip)
    if (cached && this.isCacheValid(cached.timestamp)) {
      this.updateIPActivity(ip, context)
      return cached
    }

    // Perform comprehensive assessment
    const assessment = await this.performFullAssessment(ip, context)
    
    // Cache the result
    this.ipCache.set(ip, assessment)
    
    // Update activity tracking
    this.updateIPActivity(ip, context)
    
    // Log security assessment
    this.logger.logSecurityEvent('ip_security_assessment', {
      ip,
      riskLevel: assessment.riskLevel,
      allowed: assessment.allowed,
      blockedReason: assessment.blockedReason,
      geolocation: assessment.geolocation?.country,
      reputationScore: assessment.reputation?.score,
      isVPN: assessment.vpnProxy?.isVPN,
      context
    })

    return assessment
  }

  // Perform comprehensive IP assessment
  private async performFullAssessment(ip: string, context?: any): Promise<IPSecurityAssessment> {
    const assessment: IPSecurityAssessment = {
      ip,
      allowed: true,
      riskLevel: 'very_low',
      recommendations: [],
      timestamp: Date.now()
    }

    try {
      // Get geolocation if enabled
      if (this.config.enableGeolocation) {
        assessment.geolocation = await this.getIPGeolocation(ip)
      }

      // Get reputation if enabled
      if (this.config.enableReputationScoring) {
        assessment.reputation = await this.getIPReputation(ip)
      }

      // Check VPN/Proxy if enabled
      if (this.config.enableVPNDetection) {
        assessment.vpnProxy = await this.detectVPNProxy(ip)
      }

      // Evaluate security rules
      this.evaluateSecurityRules(assessment)

    } catch (error) {
      this.logger.logError('ip_assessment_error', error as Error, { ip })
      // On error, allow but with medium risk
      assessment.riskLevel = 'medium'
      assessment.recommendations.push('Failed to complete security assessment')
    }

    return assessment
  }

  // Get IP geolocation data
  private async getIPGeolocation(ip: string): Promise<IPGeolocation> {
    // Check cache first
    const cached = this.geolocationCache.get(ip)
    if (cached) return cached

    try {
      // In production, use a real geolocation service like MaxMind or IPapi
      // This is a mock implementation
      const response = await fetch(`https://ipapi.co/${ip}/json/`)
      
      if (response.ok) {
        const data = await response.json()
        
        const geolocation: IPGeolocation = {
          ip,
          country: data.country_name || 'Unknown',
          countryCode: data.country_code || 'XX',
          region: data.region || 'Unknown',
          city: data.city || 'Unknown',
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          timezone: data.timezone || 'Unknown',
          isp: data.org || 'Unknown',
          organization: data.org || 'Unknown',
          asn: data.asn || 'Unknown'
        }
        
        this.geolocationCache.set(ip, geolocation)
        return geolocation
      }
    } catch (error) {
      this.logger.logError('geolocation_lookup_failed', error as Error, { ip })
    }

    // Return default geolocation on failure
    const defaultGeo: IPGeolocation = {
      ip,
      country: 'Unknown',
      countryCode: 'XX',
      region: 'Unknown',
      city: 'Unknown',
      latitude: 0,
      longitude: 0,
      timezone: 'Unknown',
      isp: 'Unknown',
      organization: 'Unknown',
      asn: 'Unknown'
    }
    
    this.geolocationCache.set(ip, defaultGeo)
    return defaultGeo
  }

  // Get IP reputation score
  private async getIPReputation(ip: string): Promise<IPReputation> {
    // Check cache first
    const cached = this.reputationCache.get(ip)
    if (cached && Date.now() - cached.lastUpdated < 24 * 60 * 60 * 1000) { // 24 hours
      return cached
    }

    try {
      // In production, integrate with threat intelligence services
      // This is a mock implementation that simulates reputation scoring
      const reputation = await this.simulateReputationLookup(ip)
      
      this.reputationCache.set(ip, reputation)
      return reputation
    } catch (error) {
      this.logger.logError('reputation_lookup_failed', error as Error, { ip })
    }

    // Return neutral reputation on failure
    const neutralReputation: IPReputation = {
      ip,
      score: 50,
      categories: [],
      lastUpdated: Date.now(),
      sources: ['fallback'],
      threatTypes: []
    }
    
    this.reputationCache.set(ip, neutralReputation)
    return neutralReputation
  }

  // Simulate reputation lookup (replace with real service in production)
  private async simulateReputationLookup(ip: string): Promise<IPReputation> {
    // Simulate some IPs as having bad reputation
    const badIPs = ['1.2.3.4', '5.6.7.8', '10.0.0.1']
    const isBad = badIPs.includes(ip) || ip.startsWith('192.168.') || ip.startsWith('10.')
    
    return {
      ip,
      score: isBad ? 15 : 85,
      categories: isBad ? ['malware', 'spam'] : ['legitimate'],
      lastUpdated: Date.now(),
      sources: ['simulation'],
      threatTypes: isBad ? ['botnet', 'malware'] : []
    }
  }

  // Detect VPN/Proxy usage
  private async detectVPNProxy(ip: string): Promise<VPNProxyDetection> {
    // Check cache first
    const cached = this.vpnProxyCache.get(ip)
    if (cached && Date.now() - cached.lastChecked < 6 * 60 * 60 * 1000) { // 6 hours
      return cached
    }

    try {
      // In production, use services like IPQualityScore, VPNapi, etc.
      // This is a mock implementation
      const detection = await this.simulateVPNProxyDetection(ip)
      
      this.vpnProxyCache.set(ip, detection)
      return detection
    } catch (error) {
      this.logger.logError('vpn_proxy_detection_failed', error as Error, { ip })
    }

    // Return safe default on failure
    const defaultDetection: VPNProxyDetection = {
      ip,
      isVPN: false,
      isProxy: false,
      isTor: false,
      isDatacenter: false,
      confidence: 0,
      lastChecked: Date.now()
    }
    
    this.vpnProxyCache.set(ip, defaultDetection)
    return defaultDetection
  }

  // Simulate VPN/Proxy detection (replace with real service in production)
  private async simulateVPNProxyDetection(ip: string): Promise<VPNProxyDetection> {
    // Simulate some patterns
    const isDatacenter = ip.startsWith('8.8.') || ip.startsWith('1.1.')
    const isPrivate = ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')
    const isVPN = ip.includes('.') && parseInt(ip.split('.')[0]) % 7 === 0 // Arbitrary VPN detection
    
    return {
      ip,
      isVPN,
      isProxy: isDatacenter && !isPrivate,
      isTor: false,
      isDatacenter,
      confidence: isVPN || isDatacenter ? 85 : 95,
      provider: isVPN ? 'SimulatedVPN' : undefined,
      lastChecked: Date.now()
    }
  }

  // Evaluate security rules and determine if IP should be allowed
  private evaluateSecurityRules(assessment: IPSecurityAssessment): void {
    let riskScore = 0
    const recommendations: string[] = []

    // Geolocation-based rules
    if (assessment.geolocation) {
      const geo = assessment.geolocation
      
      // Check blocked countries
      if (this.config.blockedCountries.includes(geo.countryCode)) {
        assessment.allowed = false
        assessment.blockedReason = `Access blocked from ${geo.country}`
        assessment.riskLevel = 'critical'
        return
      }
      
      // Check allowed countries (if specified)
      if (this.config.allowedCountries.length > 0 && 
          !this.config.allowedCountries.includes(geo.countryCode)) {
        assessment.allowed = false
        assessment.blockedReason = `Access restricted to specific countries`
        assessment.riskLevel = 'high'
        return
      }
    }

    // Reputation-based rules
    if (assessment.reputation) {
      const rep = assessment.reputation
      riskScore += (100 - rep.score) / 2 // Higher risk for lower reputation
      
      if (rep.score < this.config.reputationThreshold) {
        if (this.config.enableAutoBlocking) {
          assessment.allowed = false
          assessment.blockedReason = `Low reputation score: ${rep.score}`
        }
        riskScore += 30
        recommendations.push('IP has low reputation score')
      }
      
      if (rep.threatTypes.length > 0) {
        riskScore += rep.threatTypes.length * 10
        recommendations.push(`Associated with threats: ${rep.threatTypes.join(', ')}`)
      }
    }

    // VPN/Proxy rules
    if (assessment.vpnProxy) {
      const vpn = assessment.vpnProxy
      
      if (vpn.isVPN) {
        riskScore += 20
        recommendations.push('Traffic appears to be from VPN')
      }
      
      if (vpn.isProxy) {
        riskScore += 15
        recommendations.push('Traffic appears to be from proxy')
      }
      
      if (vpn.isTor) {
        riskScore += 40
        recommendations.push('Traffic appears to be from Tor network')
      }
      
      if (vpn.isDatacenter) {
        riskScore += 10
        recommendations.push('Traffic originates from datacenter')
      }
    }

    // Calculate final risk level
    assessment.riskLevel = this.calculateRiskLevel(riskScore)
    assessment.recommendations = recommendations

    // Additional blocking logic for high risk
    if (assessment.riskLevel === 'critical' && this.config.enableAutoBlocking) {
      assessment.allowed = false
      assessment.blockedReason = assessment.blockedReason || 'High risk score'
    }
  }

  // Calculate risk level from score
  private calculateRiskLevel(score: number): IPSecurityAssessment['riskLevel'] {
    if (score >= 80) return 'critical'
    if (score >= 60) return 'high'
    if (score >= 40) return 'medium'
    if (score >= 20) return 'low'
    return 'very_low'
  }

  // Update IP activity tracking
  private updateIPActivity(ip: string, context?: any): void {
    let activity = this.ipActivity.get(ip)
    
    if (!activity) {
      activity = {
        ip,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        requestCount: 0,
        successfulRequests: 0,
        failedRequests: 0,
        endpoints: new Set(),
        userAgents: new Set(),
        suspiciousActivity: false,
        blocked: false
      }
    }
    
    activity.lastSeen = Date.now()
    activity.requestCount++
    
    if (context?.endpoint) {
      activity.endpoints.add(context.endpoint)
    }
    
    if (context?.userAgent) {
      activity.userAgents.add(context.userAgent)
    }
    
    // Detect suspicious patterns
    if (activity.endpoints.size > 20 || activity.userAgents.size > 10) {
      activity.suspiciousActivity = true
    }
    
    this.ipActivity.set(ip, activity)
  }

  // Check if cache entry is still valid
  private isCacheValid(timestamp: number): boolean {
    const maxAge = 4 * 60 * 60 * 1000 // 4 hours
    return Date.now() - timestamp < maxAge
  }

  // Clean up expired cache entries
  private cleanupCache(): void {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    let cleanedCount = 0
    
    // Clean IP assessments
    for (const [ip, assessment] of this.ipCache.entries()) {
      if (now - assessment.timestamp > maxAge) {
        this.ipCache.delete(ip)
        cleanedCount++
      }
    }
    
    // Clean geolocation cache
    for (const [ip, geo] of this.geolocationCache.entries()) {
      // Keep geolocation data longer (7 days)
      if (now - Date.now() > 7 * 24 * 60 * 60 * 1000) {
        this.geolocationCache.delete(ip)
      }
    }
    
    // Clean old activity records
    for (const [ip, activity] of this.ipActivity.entries()) {
      if (now - activity.lastSeen > 7 * 24 * 60 * 60 * 1000) {
        this.ipActivity.delete(ip)
      }
    }
    
    if (cleanedCount > 0) {
      this.logger.logInfo('ip_security_cache_cleanup', {
        cleanedAssessments: cleanedCount,
        remainingAssessments: this.ipCache.size,
        totalIPsTracked: this.ipActivity.size
      })
    }
  }

  // Manual IP management
  public blockIP(ip: string, reason: string): void {
    const activity = this.ipActivity.get(ip) || {
      ip,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      requestCount: 0,
      successfulRequests: 0,
      failedRequests: 0,
      endpoints: new Set(),
      userAgents: new Set(),
      suspiciousActivity: false,
      blocked: false
    }
    
    activity.blocked = true
    activity.blockedAt = Date.now()
    activity.blockedReason = reason
    
    this.ipActivity.set(ip, activity)
    
    // Update assessment cache
    const assessment = this.ipCache.get(ip)
    if (assessment) {
      assessment.allowed = false
      assessment.blockedReason = reason
      assessment.riskLevel = 'critical'
      this.ipCache.set(ip, assessment)
    }
    
    this.logger.logSecurityEvent('ip_manually_blocked', { ip, reason })
  }

  public unblockIP(ip: string): void {
    const activity = this.ipActivity.get(ip)
    if (activity) {
      activity.blocked = false
      activity.blockedAt = undefined
      activity.blockedReason = undefined
      this.ipActivity.set(ip, activity)
    }
    
    // Remove from cache to force re-assessment
    this.ipCache.delete(ip)
    
    this.logger.logSecurityEvent('ip_manually_unblocked', { ip })
  }

  // Get security statistics
  public getStatistics(): {
    totalIPs: number
    blockedIPs: number
    suspiciousIPs: number
    topCountries: Array<{ country: string; count: number }>
    riskDistribution: Record<string, number>
    vpnDetected: number
    recentActivity: number
  } {
    const stats = {
      totalIPs: this.ipActivity.size,
      blockedIPs: 0,
      suspiciousIPs: 0,
      topCountries: [] as Array<{ country: string; count: number }>,
      riskDistribution: { very_low: 0, low: 0, medium: 0, high: 0, critical: 0 },
      vpnDetected: 0,
      recentActivity: 0
    }
    
    const countryCount = new Map<string, number>()
    const now = Date.now()
    const recentThreshold = 24 * 60 * 60 * 1000 // 24 hours
    
    // Analyze IP activity
    for (const activity of this.ipActivity.values()) {
      if (activity.blocked) stats.blockedIPs++
      if (activity.suspiciousActivity) stats.suspiciousIPs++
      if (now - activity.lastSeen < recentThreshold) stats.recentActivity++
    }
    
    // Analyze assessments
    for (const assessment of this.ipCache.values()) {
      stats.riskDistribution[assessment.riskLevel]++
      
      if (assessment.geolocation) {
        const country = assessment.geolocation.country
        countryCount.set(country, (countryCount.get(country) || 0) + 1)
      }
      
      if (assessment.vpnProxy?.isVPN) {
        stats.vpnDetected++
      }
    }
    
    // Get top countries
    stats.topCountries = Array.from(countryCount.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    return stats
  }

  // Cleanup on shutdown
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
  }
}

// Create global instance
const ipSecurityManager = new IPSecurityManager()

// React Hook for IP security
export function useIPSecurity() {
  const assessCurrentIP = async () => {
    // Get user's IP from browser (limited info available)
    try {
      const response = await fetch('/api/user/ip')
      const data = await response.json()
      return await ipSecurityManager.assessIP(data.ip)
    } catch (error) {
      console.warn('Could not assess current IP:', error)
      return null
    }
  }
  
  return {
    assessCurrentIP,
    getStatistics: () => ipSecurityManager.getStatistics()
  }
}

export default ipSecurityManager
export type {
  IPSecurityConfig,
  IPGeolocation,
  IPReputation,
  VPNProxyDetection,
  IPSecurityAssessment,
  IPActivity
}