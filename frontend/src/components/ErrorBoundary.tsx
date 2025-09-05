
import React, { Component, ReactNode, ErrorInfo } from 'react'
import './ErrorBoundary.css'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showErrorDetails?: boolean
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  eventId?: string
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null

  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate a unique event ID for error tracking
    const eventId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return { 
      hasError: true, 
      error,
      eventId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({ errorInfo })
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Report to error tracking service
    this.reportError(error, errorInfo)
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state
    
    if (hasError && prevProps.resetKeys !== resetKeys && resetOnPropsChange) {
      if (resetKeys?.some((key, index) => prevProps.resetKeys?.[index] !== key)) {
        this.resetError()
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      eventId: this.state.eventId
    }

    // Send to error tracking service (e.g., Sentry, LogRocket, etc.)
    if (import.meta.env.VITE_ERROR_TRACKING_URL) {
      fetch(import.meta.env.VITE_ERROR_TRACKING_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport)
      }).catch(err => console.error('Failed to report error:', err))
    }

    // Store in localStorage for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('error_reports') || '[]')
      existingErrors.push(errorReport)
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.shift()
      }
      localStorage.setItem('error_reports', JSON.stringify(existingErrors))
    } catch (err) {
      console.error('Failed to store error report:', err)
    }
  }

  private resetError = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      eventId: undefined
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleRetry = () => {
    this.resetError()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private copyErrorDetails = () => {
    const { error, errorInfo, eventId } = this.state
    const errorDetails = `
Error ID: ${eventId}
Error: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
`
    
    navigator.clipboard.writeText(errorDetails).then(() => {
      alert('Error details copied to clipboard')
    }).catch(err => {
      console.error('Failed to copy error details:', err)
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, errorInfo, eventId } = this.state
      const { showErrorDetails = false } = this.props
      const isDevelopment = import.meta.env.DEV

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">💥</div>
            <h1>Oops! Something went wrong</h1>
            <p className="error-message">
              We're sorry, but there was an unexpected error. Our team has been notified.
            </p>
            
            {eventId && (
              <p className="error-id">
                Error ID: <code>{eventId}</code>
              </p>
            )}

            <div className="error-actions">
              <button 
                onClick={this.handleRetry} 
                className="btn btn-primary"
              >
                Try Again
              </button>
              <button 
                onClick={this.handleReload} 
                className="btn btn-secondary"
              >
                Reload Page
              </button>
              <button 
                onClick={this.handleGoHome} 
                className="btn btn-outline"
              >
                Go Home
              </button>
            </div>

            {(showErrorDetails || isDevelopment) && error && (
              <details className="error-details">
                <summary>Technical Details</summary>
                <div className="error-content">
                  <div className="error-section">
                    <h4>Error Message:</h4>
                    <pre>{error.message}</pre>
                  </div>
                  
                  {error.stack && (
                    <div className="error-section">
                      <h4>Stack Trace:</h4>
                      <pre>{error.stack}</pre>
                    </div>
                  )}
                  
                  {errorInfo?.componentStack && (
                    <div className="error-section">
                      <h4>Component Stack:</h4>
                      <pre>{errorInfo.componentStack}</pre>
                    </div>
                  )}
                  
                  <button 
                    onClick={this.copyErrorDetails}
                    className="btn btn-small"
                  >
                    Copy Error Details
                  </button>
                </div>
              </details>
            )}

            <div className="error-help">
              <p>If this problem persists, please contact support:</p>
              <ul>
                <li>Email: <a href="mailto:support@cinebook.com">support@cinebook.com</a></li>
                <li>Phone: 1900 xxxx</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
