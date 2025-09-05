// CineBook Performance Monitoring System
// Comprehensive frontend metrics collection and monitoring

import { useCallback, useEffect, useRef } from 'react'

// Performance Metrics Interface
interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  tags: Record<string, string>
  unit?: string
}

// Core Web Vitals Interface
interface CoreWebVitals {
  FCP?: number  // First Contentful Paint
  LCP?: number  // Largest Contentful Paint
  FID?: number  // First Input Delay
  CLS?: number  // Cumulative Layout Shift
  TTFB?: number // Time to First Byte
  TTI?: number  // Time to Interactive
}

// User Interaction Metrics
interface InteractionMetrics {
  pageViews: number
  sessionDuration: number
  bounceRate: number
  clickThroughRate: number
  formCompletionRate: number
  errorRate: number
}

// Performance Monitoring Configuration
interface MonitoringConfig {
  enabled: boolean
  sampleRate: number
  endpoint: string
  apiKey?: string
  debug: boolean
  bufferSize: number
  flushInterval: number
}

class PerformanceMonitor {
  private config: MonitoringConfig
  private metrics: PerformanceMetric[] = []
  private sessionStart: number
  private observer: PerformanceObserver | null = null
  private vitals: CoreWebVitals = {}
  private interactions: InteractionMetrics = {
    pageViews: 0,
    sessionDuration: 0,
    bounceRate: 0,
    clickThroughRate: 0,
    formCompletionRate: 0,
    errorRate: 0
  }
  private flushTimer: NodeJS.Timeout | null = null

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enabled: true,
      sampleRate: 1.0,
      endpoint: '/api/metrics',
      debug: false,
      bufferSize: 100,
      flushInterval: 30000, // 30 seconds
      ...config
    }

    this.sessionStart = Date.now()
    this.initialize()
  }

  // Initialize monitoring
  private initialize(): void {
    if (!this.config.enabled || Math.random() > this.config.sampleRate) {
      return
    }

    this.setupPerformanceObserver()
    this.setupWebVitalsTracking()
    this.setupErrorTracking()
    this.setupInteractionTracking()
    this.startAutoFlush()

    // Track initial page load
    this.trackPageView(window.location.pathname)
  }

  // Setup Performance Observer for standard metrics
  private setupPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry)
        }
      })

      // Observe multiple entry types
      this.observer.observe({
        entryTypes: ['navigation', 'resource', 'paint', 'measure', 'mark']
      })
    } catch (error) {
      console.warn('PerformanceObserver not supported:', error)
    }
  }

  // Process performance entries
  private processPerformanceEntry(entry: PerformanceEntry): void {
    const timestamp = Date.now()

    switch (entry.entryType) {
      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming
        this.recordMetric('navigation.dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart, { page: window.location.pathname })
        this.recordMetric('navigation.load_complete', navEntry.loadEventEnd - navEntry.loadEventStart, { page: window.location.pathname })
        this.recordMetric('navigation.dns_lookup', navEntry.domainLookupEnd - navEntry.domainLookupStart, { page: window.location.pathname })
        break

      case 'resource':
        const resEntry = entry as PerformanceResourceTiming
        if (resEntry.name.includes('/api/')) {
          this.recordMetric('api.request_duration', resEntry.responseEnd - resEntry.requestStart, {
            endpoint: this.extractEndpoint(resEntry.name),
            status: 'success'
          })
        }
        break

      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          this.vitals.FCP = entry.startTime
          this.recordMetric('web_vitals.fcp', entry.startTime, { page: window.location.pathname })
        }
        break
    }
  }

  // Setup Core Web Vitals tracking
  private setupWebVitalsTracking(): void {
    // LCP (Largest Contentful Paint)
    this.observeWebVital('largest-contentful-paint', (entry: any) => {
      this.vitals.LCP = entry.startTime
      this.recordMetric('web_vitals.lcp', entry.startTime, { page: window.location.pathname })
    })

    // FID (First Input Delay)
    this.observeWebVital('first-input', (entry: any) => {
      this.vitals.FID = entry.processingStart - entry.startTime
      this.recordMetric('web_vitals.fid', this.vitals.FID, { page: window.location.pathname })
    })

    // CLS (Cumulative Layout Shift)
    let clsValue = 0
    this.observeWebVital('layout-shift', (entry: any) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value
        this.vitals.CLS = clsValue
        this.recordMetric('web_vitals.cls', clsValue, { page: window.location.pathname })
      }
    })
  }

  // Observe specific web vital
  private observeWebVital(type: string, callback: (entry: any) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry)
        }
      })
      observer.observe({ type, buffered: true })
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error)
    }
  }

  // Setup error tracking
  private setupErrorTracking(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.recordMetric('errors.javascript', 1, {
        message: event.message,
        filename: event.filename || 'unknown',
        line: event.lineno?.toString() || '0',
        page: window.location.pathname
      })
      this.interactions.errorRate++
    })

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.recordMetric('errors.promise_rejection', 1, {
        reason: event.reason?.toString() || 'unknown',
        page: window.location.pathname
      })
      this.interactions.errorRate++
    })
  }

  // Setup interaction tracking
  private setupInteractionTracking(): void {
    // Click tracking
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        this.recordMetric('interactions.clicks', 1, {
          element: target.tagName,
          text: target.textContent?.substring(0, 50) || '',
          page: window.location.pathname
        })
      }
    })

    // Form interaction tracking
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement
      this.recordMetric('interactions.form_submit', 1, {
        form_id: form.id || 'unknown',
        page: window.location.pathname
      })
      this.interactions.formCompletionRate++
    })

    // Scroll depth tracking
    this.setupScrollTracking()

    // Session duration tracking
    this.setupSessionTracking()
  }

  // Setup scroll depth tracking
  private setupScrollTracking(): void {
    let maxScrollDepth = 0
    const trackScrollDepth = () => {
      const scrollDepth = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      )
      
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth
        
        // Track milestones
        if ([25, 50, 75, 100].includes(scrollDepth)) {
          this.recordMetric('engagement.scroll_depth', scrollDepth, {
            milestone: `${scrollDepth}%`,
            page: window.location.pathname
          })
        }
      }
    }

    window.addEventListener('scroll', trackScrollDepth, { passive: true })
  }

  // Setup session tracking
  private setupSessionTracking(): void {
    const updateSessionDuration = () => {
      this.interactions.sessionDuration = Date.now() - this.sessionStart
    }

    // Update session duration periodically
    setInterval(updateSessionDuration, 10000) // Every 10 seconds

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.recordMetric('engagement.page_hidden', Date.now() - this.sessionStart, {
          page: window.location.pathname
        })
      } else {
        this.recordMetric('engagement.page_visible', Date.now(), {
          page: window.location.pathname
        })
      }
    })

    // Track when user leaves page
    window.addEventListener('beforeunload', () => {
      this.recordMetric('engagement.session_duration', this.interactions.sessionDuration, {
        page: window.location.pathname
      })
      this.flush()
    })
  }

  // Record a metric
  public recordMetric(name: string, value: number, tags: Record<string, string> = {}, unit?: string): void {
    if (!this.config.enabled) return

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags: {
        ...tags,
        user_agent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        connection: (navigator as any).connection?.effectiveType || 'unknown'
      },
      unit
    }

    this.metrics.push(metric)

    if (this.config.debug) {
      console.log('Metric recorded:', metric)
    }

    // Auto-flush if buffer is full
    if (this.metrics.length >= this.config.bufferSize) {
      this.flush()
    }
  }

  // Track page view
  public trackPageView(path: string, title?: string): void {
    this.interactions.pageViews++
    this.recordMetric('page_views', 1, {
      path,
      title: title || document.title,
      referrer: document.referrer || 'direct'
    })
  }

  // Track custom event
  public trackEvent(event: string, properties: Record<string, any> = {}): void {
    this.recordMetric(`events.${event}`, 1, {
      ...properties,
      page: window.location.pathname
    })
  }

  // Track API call performance
  public trackAPICall(endpoint: string, duration: number, status: string, method: string = 'GET'): void {
    this.recordMetric('api.request_duration', duration, {
      endpoint: this.sanitizeEndpoint(endpoint),
      status,
      method
    }, 'ms')

    if (status.startsWith('4') || status.startsWith('5')) {
      this.recordMetric('api.errors', 1, {
        endpoint: this.sanitizeEndpoint(endpoint),
        status,
        method
      })
    }
  }

  // Track React component render performance
  public trackComponentRender(componentName: string, renderTime: number): void {
    this.recordMetric('react.component_render', renderTime, {
      component: componentName,
      page: window.location.pathname
    }, 'ms')
  }

  // Start automatic flushing
  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      if (this.metrics.length > 0) {
        this.flush()
      }
    }, this.config.flushInterval)
  }

  // Flush metrics to server
  public async flush(): Promise<void> {
    if (this.metrics.length === 0) return

    const metricsToSend = [...this.metrics]
    this.metrics = []

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          metrics: metricsToSend,
          session: {
            sessionId: this.getSessionId(),
            timestamp: Date.now(),
            vitals: this.vitals,
            interactions: this.interactions
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      if (this.config.debug) {
        console.log(`Flushed ${metricsToSend.length} metrics successfully`)
      }
    } catch (error) {
      console.warn('Failed to flush metrics:', error)
      
      // Re-add metrics to queue if flush failed (with limit)
      if (this.metrics.length < this.config.bufferSize) {
        this.metrics.unshift(...metricsToSend.slice(0, this.config.bufferSize - this.metrics.length))
      }
    }
  }

  // Get current performance summary
  public getPerformanceSummary(): {
    vitals: CoreWebVitals
    interactions: InteractionMetrics
    metricsCount: number
  } {
    return {
      vitals: { ...this.vitals },
      interactions: { ...this.interactions },
      metricsCount: this.metrics.length
    }
  }

  // Utility methods
  private extractEndpoint(url: string): string {
    try {
      const pathname = new URL(url).pathname
      return pathname.replace(/\/\d+/g, '/:id') // Replace IDs with :id
    } catch {
      return 'unknown'
    }
  }

  private sanitizeEndpoint(endpoint: string): string {
    return endpoint.replace(/\/\d+/g, '/:id').replace(/\?.*$/, '')
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('monitoring_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('monitoring_session_id', sessionId)
    }
    return sessionId
  }

  // Cleanup
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect()
    }
    
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }

    this.flush()
  }
}

// Create global performance monitor instance
const performanceMonitor = new PerformanceMonitor({
  enabled: import.meta.env.VITE_MONITORING_ENABLED !== 'false',
  sampleRate: parseFloat(import.meta.env.VITE_MONITORING_SAMPLE_RATE || '1.0'),
  endpoint: import.meta.env.VITE_MONITORING_ENDPOINT || '/api/metrics',
  apiKey: import.meta.env.VITE_MONITORING_API_KEY,
  debug: import.meta.env.VITE_ENVIRONMENT === 'development'
})

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  const renderStartRef = useRef<number>()

  const startRender = useCallback((componentName: string) => {
    renderStartRef.current = performance.now()
  }, [])

  const endRender = useCallback((componentName: string) => {
    if (renderStartRef.current) {
      const renderTime = performance.now() - renderStartRef.current
      performanceMonitor.trackComponentRender(componentName, renderTime)
    }
  }, [])

  const trackEvent = useCallback((event: string, properties?: Record<string, any>) => {
    performanceMonitor.trackEvent(event, properties)
  }, [])

  const trackAPICall = useCallback((endpoint: string, duration: number, status: string, method?: string) => {
    performanceMonitor.trackAPICall(endpoint, duration, status, method)
  }, [])

  const getPerformanceSummary = useCallback(() => {
    return performanceMonitor.getPerformanceSummary()
  }, [])

  return {
    startRender,
    endRender,
    trackEvent,
    trackAPICall,
    getPerformanceSummary,
    recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor)
  }
}

// Higher-order component for automatic performance tracking
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component'

  return function PerformanceTrackedComponent(props: P) {
    const { startRender, endRender } = usePerformanceMonitoring()

    useEffect(() => {
      startRender(displayName)
      return () => {
        endRender(displayName)
      }
    }, [])

    return <WrappedComponent {...props} />
  }
}

export default performanceMonitor
export type { PerformanceMetric, CoreWebVitals, InteractionMetrics, MonitoringConfig }