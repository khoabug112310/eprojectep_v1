import { useEffect, useCallback } from 'react'

interface ErrorTrackingConfig {
  apiKey?: string
  userId?: string | number
  environment?: 'development' | 'staging' | 'production'
  release?: string
  enabled?: boolean
}

interface ErrorReport {
  message: string
  stack?: string
  componentStack?: string
  timestamp: string
  url: string
  userAgent: string
  userId?: string | number
  sessionId: string
  breadcrumbs: Breadcrumb[]
  tags: Record<string, string>
  level: 'error' | 'warning' | 'info'
  fingerprint?: string[]
}

interface Breadcrumb {
  timestamp: string
  message: string
  category: string
  level: 'error' | 'warning' | 'info' | 'debug'
  data?: Record<string, any>
}

class ErrorTracker {
  private config: ErrorTrackingConfig = {
    enabled: true,
    environment: 'development'
  }
  private breadcrumbs: Breadcrumb[] = []
  private sessionId: string
  private maxBreadcrumbs = 20

  constructor(config?: ErrorTrackingConfig) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
    this.sessionId = this.generateSessionId()
    this.setupGlobalHandlers()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private setupGlobalHandlers(): void {
    if (!this.config.enabled) return

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureException(new Error(event.reason), {
        tags: { type: 'unhandled_promise_rejection' },
        level: 'error'
      })
    })

    // Handle global errors
    window.addEventListener('error', (event) => {
      this.captureException(event.error, {
        tags: { 
          type: 'global_error',
          filename: event.filename,
          lineno: event.lineno?.toString(),
          colno: event.colno?.toString()
        },
        level: 'error'
      })
    })

    // Track navigation changes
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function(...args) {
      originalPushState.apply(history, args)
      window.dispatchEvent(new Event('locationchange'))
    }

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args)
      window.dispatchEvent(new Event('locationchange'))
    }

    window.addEventListener('popstate', () => {
      window.dispatchEvent(new Event('locationchange'))
    })

    window.addEventListener('locationchange', () => {
      this.addBreadcrumb({
        message: `Navigation to ${window.location.pathname}`,
        category: 'navigation',
        level: 'info',
        data: {
          url: window.location.href,
          pathname: window.location.pathname,
          search: window.location.search
        }
      })
    })
  }

  public addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    const fullBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: new Date().toISOString()
    }

    this.breadcrumbs.push(fullBreadcrumb)

    // Keep only the last N breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift()
    }
  }

  public captureException(
    error: Error,
    options: {
      tags?: Record<string, string>
      level?: 'error' | 'warning' | 'info'
      fingerprint?: string[]
      extra?: Record<string, any>
    } = {}
  ): void {
    if (!this.config.enabled) {
      console.error('Error captured (tracking disabled):', error)
      return
    }

    const report: ErrorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.config.userId,
      sessionId: this.sessionId,
      breadcrumbs: [...this.breadcrumbs],
      tags: {
        environment: this.config.environment || 'unknown',
        release: this.config.release || 'unknown',
        ...options.tags
      },
      level: options.level || 'error',
      fingerprint: options.fingerprint
    }

    // Add error as breadcrumb
    this.addBreadcrumb({
      message: `Error: ${error.message}`,
      category: 'error',
      level: 'error',
      data: {
        stack: error.stack,
        ...options.extra
      }
    })

    this.sendReport(report)
  }

  public captureMessage(
    message: string,
    level: 'error' | 'warning' | 'info' = 'info',
    tags?: Record<string, string>
  ): void {
    if (!this.config.enabled) {
      console.log(`Message captured (tracking disabled): ${message}`)
      return
    }

    const report: ErrorReport = {
      message,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.config.userId,
      sessionId: this.sessionId,
      breadcrumbs: [...this.breadcrumbs],
      tags: {
        environment: this.config.environment || 'unknown',
        release: this.config.release || 'unknown',
        ...tags
      },
      level
    }

    this.addBreadcrumb({
      message,
      category: 'message',
      level,
      data: { tags }
    })

    this.sendReport(report)
  }

  private async sendReport(report: ErrorReport): Promise<void> {
    try {
      // Send to configured error tracking service
      if (import.meta.env.VITE_ERROR_TRACKING_URL) {
        await fetch(import.meta.env.VITE_ERROR_TRACKING_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
          },
          body: JSON.stringify(report)
        })
      }

      // Always store locally for debugging
      this.storeLocalReport(report)

      console.error('Error reported:', report)
    } catch (error) {
      console.error('Failed to send error report:', error)
      // Fallback: store locally
      this.storeLocalReport(report)
    }
  }

  private storeLocalReport(report: ErrorReport): void {
    try {
      const key = 'cinebook_error_reports'
      const existingReports = JSON.parse(localStorage.getItem(key) || '[]')
      existingReports.push({
        ...report,
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })

      // Keep only last 50 reports
      if (existingReports.length > 50) {
        existingReports.splice(0, existingReports.length - 50)
      }

      localStorage.setItem(key, JSON.stringify(existingReports))
    } catch (error) {
      console.error('Failed to store error report locally:', error)
    }
  }

  public setUser(userId: string | number): void {
    this.config.userId = userId
    this.addBreadcrumb({
      message: `User identified: ${userId}`,
      category: 'user',
      level: 'info',
      data: { userId }
    })
  }

  public setTag(key: string, value: string): void {
    this.addBreadcrumb({
      message: `Tag set: ${key}=${value}`,
      category: 'tag',
      level: 'debug',
      data: { key, value }
    })
  }

  public clearBreadcrumbs(): void {
    this.breadcrumbs = []
  }
}

// Create singleton instance
const errorTracker = new ErrorTracker({
  enabled: import.meta.env.VITE_ERROR_TRACKING_ENABLED === 'true',
  environment: import.meta.env.VITE_ENVIRONMENT as any || 'development',
  release: import.meta.env.VITE_APP_VERSION || 'unknown'
})

/**
 * React hook for error tracking
 */
export function useErrorTracking() {
  const trackError = useCallback((error: Error, context?: string) => {
    errorTracker.captureException(error, {
      tags: { context: context || 'unknown' },
      level: 'error'
    })
  }, [])

  const trackEvent = useCallback((message: string, level: 'error' | 'warning' | 'info' = 'info') => {
    errorTracker.captureMessage(message, level)
  }, [])

  const addBreadcrumb = useCallback((message: string, category: string, data?: Record<string, any>) => {
    errorTracker.addBreadcrumb({
      message,
      category,
      level: 'info',
      data
    })
  }, [])

  const setUser = useCallback((userId: string | number) => {
    errorTracker.setUser(userId)
  }, [])

  // Track component mount
  useEffect(() => {
    const componentName = new Error().stack?.split('\n')[1]?.trim() || 'Unknown'
    addBreadcrumb(`Component mounted`, 'component', { componentName })

    return () => {
      addBreadcrumb(`Component unmounted`, 'component', { componentName })
    }
  }, [])

  return {
    trackError,
    trackEvent,
    addBreadcrumb,
    setUser
  }
}

export { errorTracker }
export default useErrorTracking