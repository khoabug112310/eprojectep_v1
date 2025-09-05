// CineBook Error Tracking Integration
// Comprehensive error tracking with external service integration

import { Logger, LogEntry, ErrorCategory } from './Logger'
import { StandardizedError, ErrorTypes, ErrorCodes } from './StandardizedErrorHandler'

// Error Tracking Configuration
interface ErrorTrackingConfig {
  enabled: boolean
  environment: 'development' | 'staging' | 'production'
  services: {
    sentry?: {
      dsn: string
      enabled: boolean
    }
    bugsnag?: {
      apiKey: string
      enabled: boolean
    }
    custom?: {
      endpoint: string
      enabled: boolean
    }
  }
  sampling: {
    errorRate: number
    performanceRate: number
  }
  filters: {
    ignoreErrors: string[]
    ignoreUrls: string[]
  }
  user: {
    trackUserId: boolean
    trackUserAgent: boolean
    trackIpAddress: boolean
  }
}

// Error Context Interface
interface ErrorContext {
  user?: {
    id?: string
    email?: string
    role?: string
  }
  request?: {
    url: string
    method: string
    headers?: Record<string, string>
    params?: Record<string, any>
    body?: any
  }
  device?: {
    userAgent: string
    platform: string
    viewport: {
      width: number
      height: number
    }
    connection?: {
      effectiveType?: string
      downlink?: number
    }
  }
  application?: {
    version: string
    environment: string
    feature?: string
    component?: string
  }
  performance?: {
    loadTime?: number
    memoryUsage?: number
    jsHeapSize?: number
  }
  breadcrumbs?: Breadcrumb[]
}

// Breadcrumb Interface
interface Breadcrumb {
  timestamp: number
  message: string
  category: 'navigation' | 'user' | 'api' | 'error' | 'info'
  level: 'debug' | 'info' | 'warning' | 'error'
  data?: Record<string, any>
}

// Error Report Interface
interface ErrorReport {
  id: string
  timestamp: number
  error: {
    name: string
    message: string
    stack?: string
    code?: string
    type?: string
  }
  context: ErrorContext
  severity: 'low' | 'medium' | 'high' | 'critical'
  fingerprint: string
  tags: Record<string, string>
  extra: Record<string, any>
}

// Error Tracking Service
class ErrorTrackingService {
  private config: ErrorTrackingConfig
  private logger: Logger
  private breadcrumbs: Breadcrumb[] = []
  private maxBreadcrumbs = 100
  private userId?: string
  private sessionId: string
  private context: Partial<ErrorContext> = {}

  constructor(config: ErrorTrackingConfig) {
    this.config = config
    this.sessionId = this.generateSessionId()
    
    this.logger = new Logger({
      level: 'ERROR',
      enableConsole: true,
      enableRemote: true,
      remoteEndpoint: '/api/monitoring/error-tracking'
    })

    this.setupGlobalErrorHandlers()
    this.setupPerformanceMonitoring()
    this.initializeContext()
  }

  // Initialize Error Tracking
  initialize(userId?: string, userContext?: Partial<ErrorContext['user']>): void {
    this.userId = userId
    
    if (userContext) {
      this.context.user = { ...this.context.user, ...userContext }
    }

    this.addBreadcrumb({
      message: 'Error tracking initialized',
      category: 'info',
      level: 'info',
      data: { userId, sessionId: this.sessionId }
    })
  }

  // Capture Error
  captureError(error: Error | StandardizedError, context?: Partial<ErrorContext>): string {
    if (!this.config.enabled) return ''
    
    // Check if error should be ignored
    if (this.shouldIgnoreError(error)) return ''

    const errorReport = this.createErrorReport(error, context)
    
    // Send to configured services
    this.sendToServices(errorReport)
    
    // Log locally
    this.logger.logError('error_tracked', error, {
      reportId: errorReport.id,
      fingerprint: errorReport.fingerprint,
      severity: errorReport.severity,
      context: context
    })

    return errorReport.id
  }

  // Capture Message
  captureMessage(message: string, level: 'debug' | 'info' | 'warning' | 'error' = 'info', context?: Partial<ErrorContext>): string {
    if (!this.config.enabled) return ''

    const error = new Error(message)
    error.name = 'CapturedMessage'
    
    return this.captureError(error, { ...context, extra: { level } })
  }

  // Capture Exception
  captureException(exception: any, context?: Partial<ErrorContext>): string {
    const error = exception instanceof Error ? exception : new Error(String(exception))
    return this.captureError(error, context)
  }

  // Add Breadcrumb
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    const fullBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: Date.now()
    }

    this.breadcrumbs.push(fullBreadcrumb)
    
    // Keep only recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs)
    }
  }

  // Set User Context
  setUser(user: ErrorContext['user']): void {
    this.context.user = { ...this.context.user, ...user }
    this.userId = user?.id
  }

  // Set Tags
  setTags(tags: Record<string, string>): void {
    this.context.extra = { ...this.context.extra, tags }
  }

  // Set Extra Context
  setExtra(key: string, value: any): void {
    this.context.extra = { ...this.context.extra, [key]: value }
  }

  // Clear Context
  clearContext(): void {
    this.context = {}
    this.breadcrumbs = []
  }

  // Setup Global Error Handlers
  private setupGlobalErrorHandlers(): void {
    // Unhandled errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        request: {
          url: window.location.href,
          method: 'GET'
        },
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      })
    })

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      this.captureError(error, {
        extra: {
          type: 'unhandledrejection',
          reason: event.reason
        }
      })
    })

    // Console errors
    const originalConsoleError = console.error
    console.error = (...args) => {
      originalConsoleError.apply(console, args)
      
      const message = args.map(arg => String(arg)).join(' ')
      this.captureMessage(message, 'error', {
        extra: { source: 'console.error', args }
      })
    }
  }

  // Setup Performance Monitoring
  private setupPerformanceMonitoring(): void {
    if (!this.config.services.custom?.enabled) return

    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          this.addBreadcrumb({
            message: `LCP: ${entry.startTime}ms`,
            category: 'performance',
            level: 'info',
            data: { metric: 'LCP', value: entry.startTime }
          })
        }
      }
    })

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (error) {
      // Ignore if not supported
    }

    // Monitor navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigation) {
          this.addBreadcrumb({
            message: `Page load completed in ${navigation.loadEventEnd - navigation.fetchStart}ms`,
            category: 'performance',
            level: 'info',
            data: {
              loadTime: navigation.loadEventEnd - navigation.fetchStart,
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
              firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime
            }
          })
        }
      }, 1000)
    })
  }

  // Initialize Context
  private initializeContext(): void {
    this.context = {
      device: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      },
      application: {
        version: process.env.REACT_APP_VERSION || '1.0.0',
        environment: this.config.environment
      }
    }

    // Add connection info if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (connection) {
      this.context.device!.connection = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink
      }
    }

    // Add memory info if available
    const memory = (performance as any).memory
    if (memory) {
      this.context.performance = {
        jsHeapSize: memory.usedJSHeapSize,
        memoryUsage: memory.usedJSHeapSize / memory.totalJSHeapSize
      }
    }
  }

  // Create Error Report
  private createErrorReport(error: Error | StandardizedError, context?: Partial<ErrorContext>): ErrorReport {
    const errorId = this.generateErrorId()
    const fingerprint = this.generateFingerprint(error)
    
    const fullContext: ErrorContext = {
      ...this.context,
      ...context,
      breadcrumbs: [...this.breadcrumbs],
      request: {
        url: window.location.href,
        method: 'GET',
        ...context?.request
      }
    }

    const severity = this.calculateSeverity(error)
    const tags = this.generateTags(error, fullContext)

    return {
      id: errorId,
      timestamp: Date.now(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error instanceof StandardizedError ? error.code : undefined,
        type: error instanceof StandardizedError ? error.type : undefined
      },
      context: fullContext,
      severity,
      fingerprint,
      tags,
      extra: {
        sessionId: this.sessionId,
        userId: this.userId,
        ...fullContext.extra
      }
    }
  }

  // Calculate Error Severity
  private calculateSeverity(error: Error | StandardizedError): 'low' | 'medium' | 'high' | 'critical' {
    if (error instanceof StandardizedError) {
      switch (error.type) {
        case ErrorTypes.SYSTEM:
          return 'critical'
        case ErrorTypes.AUTHENTICATION:
        case ErrorTypes.AUTHORIZATION:
          return 'high'
        case ErrorTypes.BUSINESS:
          return 'medium'
        case ErrorTypes.VALIDATION:
        case ErrorTypes.NETWORK:
          return 'low'
        default:
          return 'medium'
      }
    }

    // Check error message for severity indicators
    const message = error.message.toLowerCase()
    if (message.includes('critical') || message.includes('fatal')) return 'critical'
    if (message.includes('security') || message.includes('unauthorized')) return 'high'
    if (message.includes('validation') || message.includes('network')) return 'low'
    
    return 'medium'
  }

  // Generate Tags
  private generateTags(error: Error | StandardizedError, context: ErrorContext): Record<string, string> {
    const tags: Record<string, string> = {
      environment: this.config.environment,
      errorName: error.name,
      platform: context.device?.platform || 'unknown',
      browser: this.getBrowserName(context.device?.userAgent || ''),
      sessionId: this.sessionId
    }

    if (error instanceof StandardizedError) {
      tags.errorCode = error.code
      tags.errorType = error.type
    }

    if (context.user?.role) {
      tags.userRole = context.user.role
    }

    if (context.application?.feature) {
      tags.feature = context.application.feature
    }

    if (context.application?.component) {
      tags.component = context.application.component
    }

    return tags
  }

  // Get Browser Name from User Agent
  private getBrowserName(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    if (userAgent.includes('Opera')) return 'Opera'
    return 'Unknown'
  }

  // Generate Fingerprint
  private generateFingerprint(error: Error): string {
    const message = error.message.replace(/\d+/g, 'N').replace(/['"]/g, '')
    const stack = error.stack?.split('\n')[1]?.replace(/:\d+:\d+/g, '') || ''
    const fingerprint = `${error.name}:${message}:${stack}`
    
    return btoa(fingerprint).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)
  }

  // Generate Error ID
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Generate Session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Check if Error Should be Ignored
  private shouldIgnoreError(error: Error): boolean {
    // Check ignore patterns
    for (const pattern of this.config.filters.ignoreErrors) {
      if (error.message.includes(pattern) || error.name.includes(pattern)) {
        return true
      }
    }

    // Check ignore URLs
    const currentUrl = window.location.href
    for (const pattern of this.config.filters.ignoreUrls) {
      if (currentUrl.includes(pattern)) {
        return true
      }
    }

    return false
  }

  // Send to External Services
  private async sendToServices(errorReport: ErrorReport): Promise<void> {
    const promises: Promise<void>[] = []

    // Send to Sentry
    if (this.config.services.sentry?.enabled) {
      promises.push(this.sendToSentry(errorReport))
    }

    // Send to Bugsnag
    if (this.config.services.bugsnag?.enabled) {
      promises.push(this.sendToBugsnag(errorReport))
    }

    // Send to Custom Service
    if (this.config.services.custom?.enabled) {
      promises.push(this.sendToCustomService(errorReport))
    }

    try {
      await Promise.allSettled(promises)
    } catch (error) {
      console.error('Error sending to tracking services:', error)
    }
  }

  // Send to Sentry
  private async sendToSentry(errorReport: ErrorReport): Promise<void> {
    // Implementation would integrate with Sentry SDK
    console.log('Sending to Sentry:', errorReport.id)
  }

  // Send to Bugsnag
  private async sendToBugsnag(errorReport: ErrorReport): Promise<void> {
    // Implementation would integrate with Bugsnag SDK
    console.log('Sending to Bugsnag:', errorReport.id)
  }

  // Send to Custom Service
  private async sendToCustomService(errorReport: ErrorReport): Promise<void> {
    try {
      await fetch(this.config.services.custom!.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.REACT_APP_ERROR_TRACKING_API_KEY || ''
        },
        body: JSON.stringify(errorReport)
      })
    } catch (error) {
      console.error('Failed to send error to custom service:', error)
    }
  }

  // Get Error Reports for Dashboard
  getErrorReports(filters?: {
    severity?: string[]
    timeRange?: { start: Date; end: Date }
    tags?: Record<string, string>
    limit?: number
  }): Promise<ErrorReport[]> {
    return this.logger.getLogs({
      level: 'ERROR',
      ...filters
    }) as Promise<ErrorReport[]>
  }

  // Get Error Statistics
  getErrorStatistics(): Promise<{
    totalErrors: number
    errorsByType: Record<string, number>
    errorsBySeverity: Record<string, number>
    topErrors: Array<{ fingerprint: string; count: number; message: string }>
  }> {
    // This would typically fetch from the backend API
    return Promise.resolve({
      totalErrors: 0,
      errorsByType: {},
      errorsBySeverity: {},
      topErrors: []
    })
  }
}

// React Hook for Error Tracking
export function useErrorTracking() {
  const [errorTracker] = React.useState(() => 
    new ErrorTrackingService({
      enabled: process.env.NODE_ENV === 'production',
      environment: process.env.NODE_ENV as any || 'development',
      services: {
        custom: {
          endpoint: '/api/monitoring/error-tracking',
          enabled: true
        }
      },
      sampling: {
        errorRate: 1.0,
        performanceRate: 0.1
      },
      filters: {
        ignoreErrors: ['ResizeObserver loop limit exceeded', 'Non-Error promise rejection captured'],
        ignoreUrls: ['/health', '/ping']
      },
      user: {
        trackUserId: true,
        trackUserAgent: true,
        trackIpAddress: false
      }
    })
  )

  const captureError = React.useCallback((error: Error | StandardizedError, context?: Partial<ErrorContext>) => {
    return errorTracker.captureError(error, context)
  }, [errorTracker])

  const captureMessage = React.useCallback((message: string, level: 'debug' | 'info' | 'warning' | 'error' = 'info') => {
    return errorTracker.captureMessage(message, level)
  }, [errorTracker])

  const addBreadcrumb = React.useCallback((breadcrumb: Omit<Breadcrumb, 'timestamp'>) => {
    errorTracker.addBreadcrumb(breadcrumb)
  }, [errorTracker])

  const setUser = React.useCallback((user: ErrorContext['user']) => {
    errorTracker.setUser(user)
  }, [errorTracker])

  const setContext = React.useCallback((key: string, value: any) => {
    errorTracker.setExtra(key, value)
  }, [errorTracker])

  return {
    captureError,
    captureMessage,
    addBreadcrumb,
    setUser,
    setContext,
    errorTracker
  }
}

// Error Tracking Provider Component
export const ErrorTrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { errorTracker, setUser } = useErrorTracking()

  React.useEffect(() => {
    // Initialize with user context if available
    const userData = localStorage.getItem('user_data')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUser({ id: user.id, email: user.email, role: user.role })
      } catch (error) {
        console.error('Failed to parse user data for error tracking:', error)
      }
    }

    errorTracker.initialize()
  }, [errorTracker, setUser])

  return <>{children}</>
}

export default ErrorTrackingService
export type {
  ErrorTrackingConfig,
  ErrorContext,
  ErrorReport,
  Breadcrumb
}