// CineBook Comprehensive Error Tracking and Logging System
// Advanced structured logging with contextual information and real-time monitoring

import { useErrorTracking } from './useErrorTracking'

// Log Level Enumeration
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

// Error Categories
export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  BUSINESS_LOGIC = 'business_logic',
  UI_COMPONENT = 'ui_component',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  THIRD_PARTY = 'third_party',
  UNKNOWN = 'unknown'
}

// Structured Log Entry Interface
export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  category: ErrorCategory
  message: string
  details?: Record<string, any>
  context: LogContext
  stackTrace?: string
  fingerprint: string
  tags: string[]
  userId?: string
  sessionId: string
  requestId?: string
  correlation?: CorrelationData
}

// Log Context Information
export interface LogContext {
  component?: string
  function?: string
  file?: string
  line?: number
  url: string
  userAgent: string
  viewport: string
  timestamp: string
  buildVersion: string
  environment: string
}

// Correlation Data for Distributed Tracing
export interface CorrelationData {
  traceId: string
  spanId: string
  parentSpanId?: string
  operation: string
  duration?: number
}

// Logger Configuration
export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableRemote: boolean
  remoteEndpoint: string
  apiKey?: string
  bufferSize: number
  flushInterval: number
  enableCorrelation: boolean
  includeStackTrace: boolean
  maxLogSize: number
  retentionDays: number
}

// Log Transport Interface
export interface LogTransport {
  name: string
  log(entry: LogEntry): Promise<void>
  flush?(): Promise<void>
}

// Console Transport Implementation
class ConsoleTransport implements LogTransport {
  name = 'console'

  async log(entry: LogEntry): Promise<void> {
    const timestamp = new Date(entry.timestamp).toISOString()
    const levelName = LogLevel[entry.level]
    const prefix = `[${timestamp}] [${levelName}] [${entry.category}]`
    
    const logMethod = this.getConsoleMethod(entry.level)
    
    if (entry.details || entry.stackTrace) {
      logMethod(prefix, entry.message, {
        details: entry.details,
        context: entry.context,
        stackTrace: entry.stackTrace,
        fingerprint: entry.fingerprint
      })
    } else {
      logMethod(prefix, entry.message)
    }
  }

  private getConsoleMethod(level: LogLevel) {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug
      case LogLevel.INFO:
        return console.info
      case LogLevel.WARN:
        return console.warn
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return console.error
      default:
        return console.log
    }
  }
}

// Remote Transport Implementation
class RemoteTransport implements LogTransport {
  name = 'remote'
  private buffer: LogEntry[] = []
  private flushTimer: NodeJS.Timeout | null = null

  constructor(
    private endpoint: string,
    private apiKey?: string,
    private bufferSize: number = 50,
    private flushInterval: number = 30000
  ) {
    this.startAutoFlush()
  }

  async log(entry: LogEntry): Promise<void> {
    this.buffer.push(entry)
    
    if (this.buffer.length >= this.bufferSize) {
      await this.flush()
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return

    const entries = [...this.buffer]
    this.buffer = []

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          logs: entries,
          metadata: {
            source: 'cinebook-frontend',
            version: import.meta.env.VITE_APP_VERSION || 'unknown',
            timestamp: new Date().toISOString()
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.warn('Failed to flush logs to remote endpoint:', error)
      
      // Re-add entries to buffer (with limit)
      if (this.buffer.length < this.bufferSize) {
        this.buffer.unshift(...entries.slice(0, this.bufferSize - this.buffer.length))
      }
    }
  }

  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush()
      }
    }, this.flushInterval)
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.flush()
  }
}

// Main Logger Class
export class Logger {
  private transports: LogTransport[] = []
  private config: LoggerConfig
  private correlationContext: Map<string, CorrelationData> = new Map()
  private sessionId: string
  private requestCounter = 0

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableRemote: true,
      remoteEndpoint: '/api/logs',
      bufferSize: 50,
      flushInterval: 30000,
      enableCorrelation: true,
      includeStackTrace: true,
      maxLogSize: 1024 * 1024, // 1MB
      retentionDays: 30,
      ...config
    }

    this.sessionId = this.generateSessionId()
    this.setupTransports()
  }

  private setupTransports(): void {
    if (this.config.enableConsole) {
      this.transports.push(new ConsoleTransport())
    }

    if (this.config.enableRemote) {
      this.transports.push(new RemoteTransport(
        this.config.remoteEndpoint,
        this.config.apiKey,
        this.config.bufferSize,
        this.config.flushInterval
      ))
    }
  }

  // Core logging method
  private async log(
    level: LogLevel,
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    details?: Record<string, any>,
    error?: Error
  ): Promise<void> {
    if (level < this.config.level) return

    const entry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level,
      category,
      message: this.truncateMessage(message),
      details: this.sanitizeDetails(details),
      context: this.getLogContext(),
      stackTrace: error?.stack || (this.config.includeStackTrace ? this.captureStackTrace() : undefined),
      fingerprint: this.generateFingerprint(message, category, error?.stack),
      tags: this.extractTags(message, details),
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      requestId: this.generateRequestId(),
      correlation: this.getCurrentCorrelation()
    }

    // Send to all transports
    await Promise.allSettled(
      this.transports.map(transport => transport.log(entry))
    )

    // Report to error tracking if error level
    if (level >= LogLevel.ERROR && error) {
      const { captureException } = useErrorTracking()
      captureException(error, {
        tags: {
          category,
          component: entry.context.component || 'unknown'
        },
        extra: details
      })
    }
  }

  // Public logging methods
  debug(message: string, details?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, ErrorCategory.UNKNOWN, details)
  }

  info(message: string, category: ErrorCategory = ErrorCategory.UNKNOWN, details?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, category, details)
  }

  warn(message: string, category: ErrorCategory = ErrorCategory.UNKNOWN, details?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, category, details)
  }

  error(message: string, error?: Error, category: ErrorCategory = ErrorCategory.UNKNOWN, details?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, category, details, error)
  }

  fatal(message: string, error?: Error, category: ErrorCategory = ErrorCategory.UNKNOWN, details?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, category, details, error)
  }

  // Specialized logging methods
  logAPIError(endpoint: string, status: number, error: Error, duration?: number): void {
    this.error(`API Error: ${endpoint}`, error, ErrorCategory.NETWORK, {
      endpoint,
      status,
      duration,
      method: 'unknown'
    })
  }

  logValidationError(field: string, rule: string, value: any): void {
    this.warn(`Validation failed: ${field}`, ErrorCategory.VALIDATION, {
      field,
      rule,
      value: typeof value === 'string' ? value.substring(0, 100) : value
    })
  }

  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: Record<string, any>): void {
    const level = severity === 'critical' ? LogLevel.FATAL : 
                 severity === 'high' ? LogLevel.ERROR :
                 severity === 'medium' ? LogLevel.WARN : LogLevel.INFO

    this.log(level, `Security Event: ${event}`, ErrorCategory.SECURITY, {
      severity,
      ...details
    })
  }

  logPerformanceIssue(metric: string, value: number, threshold: number, details?: Record<string, any>): void {
    this.warn(`Performance Issue: ${metric}`, ErrorCategory.PERFORMANCE, {
      metric,
      value,
      threshold,
      exceedBy: value - threshold,
      ...details
    })
  }

  logBusinessLogicError(operation: string, error: Error, context?: Record<string, any>): void {
    this.error(`Business Logic Error: ${operation}`, error, ErrorCategory.BUSINESS_LOGIC, context)
  }

  // Correlation and tracing
  startTrace(operation: string): string {
    const traceId = this.generateTraceId()
    const spanId = this.generateSpanId()
    
    const correlation: CorrelationData = {
      traceId,
      spanId,
      operation,
      duration: Date.now()
    }

    this.correlationContext.set(traceId, correlation)
    return traceId
  }

  endTrace(traceId: string): void {
    const correlation = this.correlationContext.get(traceId)
    if (correlation) {
      correlation.duration = Date.now() - (correlation.duration || 0)
      this.info(`Trace completed: ${correlation.operation}`, ErrorCategory.UNKNOWN, {
        traceId,
        duration: correlation.duration
      })
      this.correlationContext.delete(traceId)
    }
  }

  createSpan(traceId: string, operation: string): string {
    const parentCorrelation = this.correlationContext.get(traceId)
    const spanId = this.generateSpanId()
    
    if (parentCorrelation) {
      const spanCorrelation: CorrelationData = {
        traceId,
        spanId,
        parentSpanId: parentCorrelation.spanId,
        operation,
        duration: Date.now()
      }
      
      this.correlationContext.set(`${traceId}:${spanId}`, spanCorrelation)
    }
    
    return spanId
  }

  // Utility methods
  private getLogContext(): LogContext {
    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString(),
      buildVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
      environment: import.meta.env.VITE_ENVIRONMENT || 'development'
    }
  }

  private getCurrentCorrelation(): CorrelationData | undefined {
    // Get the most recent correlation from context
    const entries = Array.from(this.correlationContext.entries())
    return entries.length > 0 ? entries[entries.length - 1][1] : undefined
  }

  private getCurrentUserId(): string | undefined {
    // Try to get user ID from various sources
    const user = localStorage.getItem('user')
    if (user) {
      try {
        const userData = JSON.parse(user)
        return userData.id || userData.userId
      } catch {
        return undefined
      }
    }
    return undefined
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateRequestId(): string {
    this.requestCounter++
    return `req_${this.sessionId}_${this.requestCounter}`
  }

  private generateSessionId(): string {
    let sessionId = sessionStorage.getItem('logger_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('logger_session_id', sessionId)
    }
    return sessionId
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSpanId(): string {
    return `span_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateFingerprint(message: string, category: ErrorCategory, stackTrace?: string): string {
    const content = `${category}:${message}:${stackTrace?.split('\n')[0] || ''}`
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  private captureStackTrace(): string {
    const stack = new Error().stack
    return stack?.split('\n').slice(2).join('\n') || ''
  }

  private truncateMessage(message: string): string {
    const maxLength = 1000
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message
  }

  private sanitizeDetails(details?: Record<string, any>): Record<string, any> | undefined {
    if (!details) return undefined

    const sanitized: Record<string, any> = {}
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization']

    for (const [key, value] of Object.entries(details)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = value.substring(0, 1000) + '...'
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }

  private extractTags(message: string, details?: Record<string, any>): string[] {
    const tags: string[] = []
    
    // Extract from message
    const messageWords = message.toLowerCase().split(' ')
    if (messageWords.includes('api')) tags.push('api')
    if (messageWords.includes('database')) tags.push('database')
    if (messageWords.includes('auth')) tags.push('auth')
    if (messageWords.includes('payment')) tags.push('payment')
    if (messageWords.includes('booking')) tags.push('booking')

    // Extract from details
    if (details) {
      if (details.component) tags.push(`component:${details.component}`)
      if (details.endpoint) tags.push(`endpoint:${details.endpoint}`)
      if (details.status) tags.push(`status:${details.status}`)
    }

    return tags
  }

  // Cleanup method
  async flush(): Promise<void> {
    await Promise.allSettled(
      this.transports.map(transport => transport.flush?.())
    )
  }

  destroy(): void {
    this.transports.forEach(transport => {
      if ('destroy' in transport && typeof transport.destroy === 'function') {
        (transport as any).destroy()
      }
    })
  }
}

// Create global logger instance
export const logger = new Logger({
  level: import.meta.env.VITE_LOG_LEVEL === 'debug' ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: import.meta.env.VITE_ENVIRONMENT !== 'production',
  enableRemote: import.meta.env.VITE_ENABLE_REMOTE_LOGGING !== 'false',
  remoteEndpoint: import.meta.env.VITE_LOGGING_ENDPOINT || '/api/logs',
  apiKey: import.meta.env.VITE_LOGGING_API_KEY
})

// React hook for logging
export function useLogger() {
  return {
    debug: logger.debug.bind(logger),
    info: logger.info.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
    fatal: logger.fatal.bind(logger),
    logAPIError: logger.logAPIError.bind(logger),
    logValidationError: logger.logValidationError.bind(logger),
    logSecurityEvent: logger.logSecurityEvent.bind(logger),
    logPerformanceIssue: logger.logPerformanceIssue.bind(logger),
    logBusinessLogicError: logger.logBusinessLogicError.bind(logger),
    startTrace: logger.startTrace.bind(logger),
    endTrace: logger.endTrace.bind(logger),
    createSpan: logger.createSpan.bind(logger)
  }
}

// Higher-order component for automatic error logging
export function withErrorLogging<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component'

  return function ErrorLoggedComponent(props: P) {
    const { error: logError } = useLogger()

    React.useEffect(() => {
      const errorHandler = (event: ErrorEvent) => {
        logError(`Component Error in ${displayName}`, event.error, ErrorCategory.UI_COMPONENT, {
          component: displayName,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        })
      }

      window.addEventListener('error', errorHandler)
      return () => window.removeEventListener('error', errorHandler)
    }, [logError])

    return <WrappedComponent {...props} />
  }
}

export default logger