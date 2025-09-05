import React, { ComponentType } from 'react'
import ErrorBoundary from './ErrorBoundary'

interface WithErrorBoundaryOptions {
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showErrorDetails?: boolean
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
}

/**
 * Higher-order component that wraps a component with an ErrorBoundary
 * 
 * @param Component - The component to wrap
 * @param options - Error boundary configuration options
 * @returns Wrapped component with error boundary
 * 
 * @example
 * ```tsx
 * const SafeMovieList = withErrorBoundary(MovieList, {
 *   fallback: <div>Failed to load movies</div>,
 *   onError: (error) => console.error('Movie list error:', error)
 * })
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
) {
  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundary
        fallback={options.fallback}
        onError={options.onError}
        showErrorDetails={options.showErrorDetails}
        resetOnPropsChange={options.resetOnPropsChange}
        resetKeys={options.resetKeys}
      >
        <Component {...props} />
      </ErrorBoundary>
    )
  }

  // Set display name for debugging
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

/**
 * Hook for error boundary functionality in functional components
 * Note: This is a utility hook, actual error boundaries must be class components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
    console.error('Captured error:', error)
  }, [])

  // Throw error to be caught by error boundary
  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return {
    captureError,
    resetError,
    hasError: !!error
  }
}

/**
 * Error fallback components for common scenarios
 */
export const ErrorFallbacks = {
  // Generic fallback
  Generic: ({ error, resetError }: { error?: Error; resetError?: () => void }) => (
    <div className=\"error-fallback\">
      <div className=\"error-fallback-content\">
        <div className=\"error-fallback-icon\">⚠️</div>
        <h3>Something went wrong</h3>
        <p>An unexpected error occurred. Please try again.</p>
        {resetError && (
          <button onClick={resetError} className=\"btn btn-primary\">
            Try Again
          </button>
        )}
      </div>
    </div>
  ),

  // Movie-specific fallback
  Movie: ({ error, resetError }: { error?: Error; resetError?: () => void }) => (
    <div className=\"error-fallback\">
      <div className=\"error-fallback-content\">
        <div className=\"error-fallback-icon\">🎬</div>
        <h3>Failed to load movie</h3>
        <p>We couldn't load the movie information. Please check your connection and try again.</p>
        <div className=\"error-actions\">
          {resetError && (
            <button onClick={resetError} className=\"btn btn-primary\">
              Retry
            </button>
          )}
          <button onClick={() => window.location.href = '/movies'} className=\"btn btn-outline\">
            Browse Movies
          </button>
        </div>
      </div>
    </div>
  ),

  // Booking-specific fallback
  Booking: ({ error, resetError }: { error?: Error; resetError?: () => void }) => (
    <div className=\"error-fallback\">
      <div className=\"error-fallback-content\">
        <div className=\"error-fallback-icon\">🎫</div>
        <h3>Booking Error</h3>
        <p>There was an issue with your booking. Your seats have been released. Please try booking again.</p>
        <div className=\"error-actions\">
          {resetError && (
            <button onClick={resetError} className=\"btn btn-primary\">
              Try Again
            </button>
          )}
          <button onClick={() => window.location.href = '/movies'} className=\"btn btn-outline\">
            Select Another Movie
          </button>
        </div>
      </div>
    </div>
  ),

  // Payment-specific fallback
  Payment: ({ error, resetError }: { error?: Error; resetError?: () => void }) => (
    <div className=\"error-fallback\">
      <div className=\"error-fallback-content\">
        <div className=\"error-fallback-icon\">💳</div>
        <h3>Payment Error</h3>
        <p>There was an issue processing your payment. Please check your payment method and try again.</p>
        <div className=\"error-actions\">
          {resetError && (
            <button onClick={resetError} className=\"btn btn-primary\">
              Retry Payment
            </button>
          )}
          <button onClick={() => window.location.href = '/profile/bookings'} className=\"btn btn-outline\">
            View Bookings
          </button>
        </div>
      </div>
    </div>
  ),

  // Network-specific fallback
  Network: ({ error, resetError }: { error?: Error; resetError?: () => void }) => (
    <div className=\"error-fallback\">
      <div className=\"error-fallback-content\">
        <div className=\"error-fallback-icon\">🌐</div>
        <h3>Connection Error</h3>
        <p>Please check your internet connection and try again.</p>
        <div className=\"error-actions\">
          {resetError && (
            <button onClick={resetError} className=\"btn btn-primary\">
              Retry
            </button>
          )}
          <button onClick={() => window.location.reload()} className=\"btn btn-secondary\">
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  )
}

export default withErrorBoundary