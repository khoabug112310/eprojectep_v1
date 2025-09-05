// CineBook Security Headers Manager
// Comprehensive security headers implementation and monitoring

import { Logger, LogLevel, ErrorCategory } from './Logger'

// Security Headers Configuration
interface SecurityHeadersConfig {
  contentSecurityPolicy: {
    enabled: boolean
    reportOnly: boolean
    directives: Record<string, string[]>
    reportUri?: string
  }
  strictTransportSecurity: {
    enabled: boolean
    maxAge: number
    includeSubDomains: boolean
    preload: boolean
  }
  frameOptions: {
    enabled: boolean
    value: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM'
    allowFrom?: string
  }
  contentTypeOptions: {
    enabled: boolean
  }
  referrerPolicy: {
    enabled: boolean
    policy: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url'
  }
  permissionsPolicy: {
    enabled: boolean
    features: Record<string, string[]>
  }
  crossOriginEmbedderPolicy: {
    enabled: boolean
    value: 'unsafe-none' | 'require-corp'
  }
  crossOriginOpenerPolicy: {
    enabled: boolean
    value: 'unsafe-none' | 'same-origin-allow-popups' | 'same-origin'
  }
  crossOriginResourcePolicy: {
    enabled: boolean
    value: 'same-site' | 'same-origin' | 'cross-origin'
  }
}

// Security Header Violation Report
interface SecurityViolation {
  type: 'csp' | 'mixed-content' | 'coep' | 'coop' | 'corp'
  directive?: string
  blockedUri?: string
  lineNumber?: number
  columnNumber?: number
  sourceFile?: string
  violatedDirective?: string
  documentUri: string
  timestamp: number
  userAgent: string
  ip?: string
}

// Security Headers Status
interface SecurityHeadersStatus {
  compliant: boolean
  missingHeaders: string[]
  weakHeaders: string[]
  violations: SecurityViolation[]
  score: number
  recommendations: string[]
}

class SecurityHeadersManager {
  private config: SecurityHeadersConfig
  private violations: SecurityViolation[] = []
  private logger: Logger
  private violationEndpoint: string

  constructor(config?: Partial<SecurityHeadersConfig>) {
    this.config = {
      contentSecurityPolicy: {
        enabled: true,
        reportOnly: false,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'", "'unsafe-inline'", "https://apis.google.com", "https://www.gstatic.com"],
          'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          'img-src': ["'self'", "data:", "https:", "blob:"],
          'font-src': ["'self'", "https://fonts.gstatic.com"],
          'connect-src': ["'self'", "https://api.cinebook.com", "wss://api.cinebook.com"],
          'media-src': ["'self'", "https:"],
          'object-src': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
          'frame-ancestors': ["'none'"],
          'upgrade-insecure-requests': []
        },
        reportUri: '/api/security/csp-report'
      },
      strictTransportSecurity: {
        enabled: true,
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },
      frameOptions: {
        enabled: true,
        value: 'DENY'
      },
      contentTypeOptions: {
        enabled: true
      },
      referrerPolicy: {
        enabled: true,
        policy: 'strict-origin-when-cross-origin'
      },
      permissionsPolicy: {
        enabled: true,
        features: {
          camera: [],
          microphone: [],
          geolocation: ["'self'"],
          payment: ["'self'"],
          usb: [],
          magnetometer: [],
          gyroscope: [],
          accelerometer: []
        }
      },
      crossOriginEmbedderPolicy: {
        enabled: true,
        value: 'unsafe-none'
      },
      crossOriginOpenerPolicy: {
        enabled: true,
        value: 'same-origin-allow-popups'
      },
      crossOriginResourcePolicy: {
        enabled: true,
        value: 'same-site'
      },
      ...config
    }

    this.logger = new Logger({
      level: LogLevel.INFO,
      enableConsole: true,
      enableRemote: true,
      remoteEndpoint: '/api/monitoring/security-headers'
    })

    this.violationEndpoint = '/api/security/violations'
    this.initializeViolationReporting()
  }

  // Generate security headers for HTTP responses
  public generateHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}

    // Content Security Policy
    if (this.config.contentSecurityPolicy.enabled) {
      const cspDirectives = Object.entries(this.config.contentSecurityPolicy.directives)
        .map(([directive, sources]) => {
          if (sources.length === 0) {
            return directive
          }
          return `${directive} ${sources.join(' ')}`
        })
        .join('; ')

      const reportDirective = this.config.contentSecurityPolicy.reportUri 
        ? `; report-uri ${this.config.contentSecurityPolicy.reportUri}`
        : ''

      const headerName = this.config.contentSecurityPolicy.reportOnly 
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy'

      headers[headerName] = cspDirectives + reportDirective
    }

    // HTTP Strict Transport Security
    if (this.config.strictTransportSecurity.enabled) {
      let hstsValue = `max-age=${this.config.strictTransportSecurity.maxAge}`
      
      if (this.config.strictTransportSecurity.includeSubDomains) {
        hstsValue += '; includeSubDomains'
      }
      
      if (this.config.strictTransportSecurity.preload) {
        hstsValue += '; preload'
      }
      
      headers['Strict-Transport-Security'] = hstsValue
    }

    // X-Frame-Options
    if (this.config.frameOptions.enabled) {
      let frameValue = this.config.frameOptions.value
      
      if (frameValue === 'ALLOW-FROM' && this.config.frameOptions.allowFrom) {
        frameValue += ` ${this.config.frameOptions.allowFrom}`
      }
      
      headers['X-Frame-Options'] = frameValue
    }

    // X-Content-Type-Options
    if (this.config.contentTypeOptions.enabled) {
      headers['X-Content-Type-Options'] = 'nosniff'
    }

    // Referrer-Policy
    if (this.config.referrerPolicy.enabled) {
      headers['Referrer-Policy'] = this.config.referrerPolicy.policy
    }

    // Permissions-Policy
    if (this.config.permissionsPolicy.enabled) {
      const permissions = Object.entries(this.config.permissionsPolicy.features)
        .map(([feature, allowlist]) => {
          if (allowlist.length === 0) {
            return `${feature}=()`
          }
          return `${feature}=(${allowlist.join(' ')})`
        })
        .join(', ')

      headers['Permissions-Policy'] = permissions
    }

    // Cross-Origin-Embedder-Policy
    if (this.config.crossOriginEmbedderPolicy.enabled) {
      headers['Cross-Origin-Embedder-Policy'] = this.config.crossOriginEmbedderPolicy.value
    }

    // Cross-Origin-Opener-Policy
    if (this.config.crossOriginOpenerPolicy.enabled) {
      headers['Cross-Origin-Opener-Policy'] = this.config.crossOriginOpenerPolicy.value
    }

    // Cross-Origin-Resource-Policy
    if (this.config.crossOriginResourcePolicy.enabled) {
      headers['Cross-Origin-Resource-Policy'] = this.config.crossOriginResourcePolicy.value
    }

    // Additional security headers
    headers['X-DNS-Prefetch-Control'] = 'off'
    headers['X-Download-Options'] = 'noopen'
    headers['X-Permitted-Cross-Domain-Policies'] = 'none'

    return headers
  }

  // Initialize violation reporting
  private initializeViolationReporting(): void {
    // CSP Violation Reporting
    if (typeof window !== 'undefined') {
      window.addEventListener('securitypolicyviolation', (event) => {
        this.handleCSPViolation(event)
      })

      // Legacy CSP violation reporting
      document.addEventListener('securitypolicyviolation', (event) => {
        this.handleCSPViolation(event)
      })
    }
  }

  // Handle CSP violations
  private handleCSPViolation(event: SecurityPolicyViolationEvent): void {
    const violation: SecurityViolation = {
      type: 'csp',
      directive: event.effectiveDirective,
      blockedUri: event.blockedURI,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
      sourceFile: event.sourceFile,
      violatedDirective: event.violatedDirective,
      documentUri: event.documentURI,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    }

    this.violations.push(violation)
    this.reportViolation(violation)

    this.logger.logSecurityEvent('csp_violation', 'high', {
      directive: violation.directive,
      blockedUri: violation.blockedUri,
      sourceFile: violation.sourceFile,
      documentUri: violation.documentUri
    })
  }

  // Report violation to server
  private async reportViolation(violation: SecurityViolation): Promise<void> {
    try {
      await fetch(this.violationEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(violation)
      })
    } catch (error) {
      console.warn('Failed to report security violation:', error)
    }
  }

  // Check current page security headers
  public async checkCurrentHeaders(): Promise<SecurityHeadersStatus> {
    const status: SecurityHeadersStatus = {
      compliant: true,
      missingHeaders: [],
      weakHeaders: [],
      violations: [...this.violations],
      score: 100,
      recommendations: []
    }

    try {
      // Fetch current page headers (limited in browser)
      const response = await fetch(window.location.href, {
        method: 'HEAD'
      })

      const headers = response.headers
      this.analyzeHeaders(headers, status)

    } catch (error) {
      this.logger.error('header_check_failed', error as Error, ErrorCategory.SECURITY)
      status.compliant = false
      status.score = 0
      status.recommendations.push('Unable to check security headers')
    }

    return status
  }

  // Analyze headers for compliance
  private analyzeHeaders(headers: Headers, status: SecurityHeadersStatus): void {
    const requiredHeaders = [
      'content-security-policy',
      'strict-transport-security',
      'x-frame-options',
      'x-content-type-options',
      'referrer-policy'
    ]

    const optionalHeaders = [
      'permissions-policy',
      'cross-origin-embedder-policy',
      'cross-origin-opener-policy',
      'cross-origin-resource-policy'
    ]

    let missingCount = 0
    let weakCount = 0

    // Check required headers
    for (const header of requiredHeaders) {
      const value = headers.get(header)
      
      if (!value) {
        status.missingHeaders.push(header)
        missingCount++
        status.recommendations.push(`Missing required header: ${header}`)
      } else {
        // Check for weak configurations
        const weakness = this.checkHeaderWeakness(header, value)
        if (weakness) {
          status.weakHeaders.push(`${header}: ${weakness}`)
          weakCount++
          status.recommendations.push(`Weak ${header}: ${weakness}`)
        }
      }
    }

    // Check optional headers
    for (const header of optionalHeaders) {
      const value = headers.get(header)
      
      if (!value) {
        status.recommendations.push(`Consider adding ${header} for enhanced security`)
      }
    }

    // Calculate compliance score
    const totalHeaders = requiredHeaders.length + optionalHeaders.length
    const presentHeaders = totalHeaders - missingCount
    const strongHeaders = presentHeaders - weakCount
    
    status.score = Math.round((strongHeaders / totalHeaders) * 100)
    status.compliant = missingCount === 0 && weakCount === 0

    // Add violation-based penalties
    if (status.violations.length > 0) {
      const violationPenalty = Math.min(30, status.violations.length * 5)
      status.score = Math.max(0, status.score - violationPenalty)
      status.compliant = false
    }
  }

  // Check for weak header configurations
  private checkHeaderWeakness(header: string, value: string): string | null {
    switch (header) {
      case 'content-security-policy':
        if (value.includes("'unsafe-eval'")) {
          return "Contains 'unsafe-eval'"
        }
        if (value.includes("'unsafe-inline'") && !value.includes('nonce-') && !value.includes('hash-')) {
          return "Contains 'unsafe-inline' without nonce or hash"
        }
        if (value.includes('http:')) {
          return 'Allows insecure HTTP resources'
        }
        break

      case 'strict-transport-security':
        const maxAgeMatch = value.match(/max-age=(\d+)/)
        if (maxAgeMatch) {
          const maxAge = parseInt(maxAgeMatch[1])
          if (maxAge < 31536000) { // Less than 1 year
            return 'max-age is less than 1 year'
          }
        }
        if (!value.includes('includeSubDomains')) {
          return 'Missing includeSubDomains'
        }
        break

      case 'x-frame-options':
        if (value === 'ALLOWALL') {
          return 'Allows framing from any domain'
        }
        break

      case 'referrer-policy':
        if (value === 'unsafe-url' || value === 'no-referrer-when-downgrade') {
          return 'May leak sensitive information'
        }
        break
    }

    return null
  }

  // Generate CSP nonce for inline scripts/styles
  public generateNonce(): string {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode(...array))
  }

  // Update CSP with nonce
  public updateCSPWithNonce(nonce: string): void {
    const scriptSrc = this.config.contentSecurityPolicy.directives['script-src'] || []
    const styleSrc = this.config.contentSecurityPolicy.directives['style-src'] || []

    // Add nonce to directives
    if (!scriptSrc.includes(`'nonce-${nonce}'`)) {
      scriptSrc.push(`'nonce-${nonce}'`)
    }
    
    if (!styleSrc.includes(`'nonce-${nonce}'`)) {
      styleSrc.push(`'nonce-${nonce}'`)
    }

    this.config.contentSecurityPolicy.directives['script-src'] = scriptSrc
    this.config.contentSecurityPolicy.directives['style-src'] = styleSrc
  }

  // Get violation statistics
  public getViolationStats(): {
    totalViolations: number
    violationsByType: Record<string, number>
    topBlockedUris: Array<{ uri: string; count: number }>
    recentViolations: SecurityViolation[]
  } {
    const violationsByType: Record<string, number> = {}
    const uriCounts = new Map<string, number>()

    for (const violation of this.violations) {
      violationsByType[violation.type] = (violationsByType[violation.type] || 0) + 1
      
      if (violation.blockedUri) {
        uriCounts.set(violation.blockedUri, (uriCounts.get(violation.blockedUri) || 0) + 1)
      }
    }

    const topBlockedUris = Array.from(uriCounts.entries())
      .map(([uri, count]) => ({ uri, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const recentViolations = this.violations
      .filter(v => Date.now() - v.timestamp < 24 * 60 * 60 * 1000) // Last 24 hours
      .slice(-20) // Last 20 violations

    return {
      totalViolations: this.violations.length,
      violationsByType,
      topBlockedUris,
      recentViolations
    }
  }

  // Clear old violations
  public clearOldViolations(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge
    this.violations = this.violations.filter(v => v.timestamp > cutoff)
  }

  // Update configuration
  public updateConfig(newConfig: Partial<SecurityHeadersConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    this.logger.info('security_headers_config_updated', ErrorCategory.SECURITY, {
      updatedFields: Object.keys(newConfig)
    })
  }

  // Get current configuration
  public getConfig(): SecurityHeadersConfig {
    return { ...this.config }
  }
}

// Create global instance
const securityHeadersManager = new SecurityHeadersManager()

// React Hook for security headers
export function useSecurityHeaders() {
  const checkHeaders = () => securityHeadersManager.checkCurrentHeaders()
  const getViolations = () => securityHeadersManager.getViolationStats()
  const generateNonce = () => securityHeadersManager.generateNonce()
  
  return {
    checkHeaders,
    getViolations,
    generateNonce,
    generateHeaders: () => securityHeadersManager.generateHeaders(),
    getConfig: () => securityHeadersManager.getConfig()
  }
}

export default securityHeadersManager
export type {
  SecurityHeadersConfig,
  SecurityViolation,
  SecurityHeadersStatus
}