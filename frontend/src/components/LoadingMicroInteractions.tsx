import React, { useEffect, useState, ReactNode } from 'react'
import { useAnimation } from '../contexts/AnimationProvider'

interface LoadingMicroInteractionsProps {
  type?: 'spinner' | 'dots' | 'pulse' | 'skeleton' | 'progress' | 'wave' | 'bounce'
  size?: 'small' | 'medium' | 'large'
  color?: 'primary' | 'secondary' | 'accent' | 'muted'
  text?: string
  duration?: number
  className?: string
  showProgress?: boolean
  progress?: number
  children?: ReactNode
}

export function LoadingMicroInteractions({
  type = 'spinner',
  size = 'medium',
  color = 'primary',
  text,
  duration,
  className = '',
  showProgress = false,
  progress = 0,
  children
}: LoadingMicroInteractionsProps) {
  const { settings, getTransitionDuration } = useAnimation()
  const [animationClass, setAnimationClass] = useState('')

  useEffect(() => {
    if (settings.enableAnimations && !settings.reduceMotion) {
      setAnimationClass(`loading-${type}`)
    }
  }, [type, settings])

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'loading-sm'
      case 'large': return 'loading-lg'
      default: return 'loading-md'
    }
  }

  const getColorClass = () => {
    switch (color) {
      case 'secondary': return 'loading-secondary'
      case 'accent': return 'loading-accent'
      case 'muted': return 'loading-muted'
      default: return 'loading-primary'
    }
  }

  const baseClasses = `loading-micro-interaction ${animationClass} ${getSizeClass()} ${getColorClass()} ${className}`

  if (type === 'skeleton') {
    return <SkeletonLoader className={baseClasses} />
  }

  if (type === 'progress') {
    return (
      <ProgressLoader 
        className={baseClasses}
        progress={progress}
        showProgress={showProgress}
        text={text}
      />
    )
  }

  return (
    <div className={baseClasses} role="status" aria-live="polite" aria-label={text || 'Loading'}>
      {type === 'spinner' && <SpinnerLoader />}
      {type === 'dots' && <DotsLoader />}
      {type === 'pulse' && <PulseLoader />}
      {type === 'wave' && <WaveLoader />}
      {type === 'bounce' && <BounceLoader />}
      
      {text && (
        <span className="loading-text" aria-hidden="true">
          {text}
        </span>
      )}
      
      {children && (
        <div className="loading-content">
          {children}
        </div>
      )}
    </div>
  )
}

// Individual loader components
function SpinnerLoader() {
  return (
    <div className="spinner-container">
      <div className="spinner-ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  )
}

function DotsLoader() {
  return (
    <div className="dots-container">
      <div className="dot dot-1"></div>
      <div className="dot dot-2"></div>
      <div className="dot dot-3"></div>
    </div>
  )
}

function PulseLoader() {
  return (
    <div className="pulse-container">
      <div className="pulse-circle pulse-1"></div>
      <div className="pulse-circle pulse-2"></div>
    </div>
  )
}

function WaveLoader() {
  return (
    <div className="wave-container">
      <div className="wave-bar wave-1"></div>
      <div className="wave-bar wave-2"></div>
      <div className="wave-bar wave-3"></div>
      <div className="wave-bar wave-4"></div>
      <div className="wave-bar wave-5"></div>
    </div>
  )
}

function BounceLoader() {
  return (
    <div className="bounce-container">
      <div className="bounce-ball bounce-1"></div>
      <div className="bounce-ball bounce-2"></div>
      <div className="bounce-ball bounce-3"></div>
    </div>
  )
}

interface SkeletonLoaderProps {
  className?: string
  lines?: number
  width?: string | number
  height?: string | number
}

function SkeletonLoader({ 
  className = '', 
  lines = 3, 
  width = '100%',
  height = '1rem'
}: SkeletonLoaderProps) {
  return (
    <div className={`skeleton-container ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div 
          key={index}
          className="skeleton-line"
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            marginBottom: index < lines - 1 ? '0.5rem' : 0
          }}
        />
      ))}
    </div>
  )
}

interface ProgressLoaderProps {
  className?: string
  progress?: number
  showProgress?: boolean
  text?: string
}

function ProgressLoader({ 
  className = '',
  progress = 0,
  showProgress = false,
  text
}: ProgressLoaderProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress)
    }, 100)

    return () => clearTimeout(timer)
  }, [progress])

  return (
    <div className={`progress-container ${className}`}>
      <div className="progress-bar-wrapper">
        <div 
          className="progress-bar"
          style={{ width: `${Math.min(100, Math.max(0, animatedProgress))}%` }}
        />
      </div>
      
      {(showProgress || text) && (
        <div className="progress-info">
          {text && <span className="progress-text">{text}</span>}
          {showProgress && (
            <span className="progress-percentage">
              {Math.round(animatedProgress)}%
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// Overlay loader for full-screen loading
interface LoadingOverlayProps {
  isVisible: boolean
  type?: LoadingMicroInteractionsProps['type']
  text?: string
  onCancel?: () => void
  cancelText?: string
  backdrop?: boolean
}

export function LoadingOverlay({
  isVisible,
  type = 'spinner',
  text = 'Loading...',
  onCancel,
  cancelText = 'Cancel',
  backdrop = true
}: LoadingOverlayProps) {
  const { settings } = useAnimation()

  if (!isVisible) return null

  return (
    <div 
      className={`loading-overlay ${backdrop ? 'with-backdrop' : ''}`}
      role="dialog" 
      aria-modal="true"
      aria-labelledby="loading-text"
    >
      <div className="loading-overlay-content">
        <LoadingMicroInteractions 
          type={type}
          size="large"
          text={text}
        />
        
        {onCancel && (
          <button 
            onClick={onCancel}
            className="loading-cancel-btn"
            type="button"
          >
            {cancelText}
          </button>
        )}
      </div>
    </div>
  )
}

// Button with loading state
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  loadingType?: LoadingMicroInteractionsProps['type']
  children: ReactNode
}

export function LoadingButton({
  loading = false,
  loadingText,
  loadingType = 'spinner',
  children,
  disabled,
  className = '',
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`loading-button ${loading ? 'loading' : ''} ${className}`}
      aria-busy={loading}
    >
      {loading ? (
        <div className="loading-button-content">
          <LoadingMicroInteractions 
            type={loadingType}
            size="small"
            color="secondary"
          />
          {loadingText && (
            <span className="loading-button-text">
              {loadingText}
            </span>
          )}
        </div>
      ) : (
        children
      )}
    </button>
  )
}

// Hook for managing loading states
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')

  const startLoading = (msg?: string) => {
    setIsLoading(true)
    setProgress(0)
    if (msg) setMessage(msg)
  }

  const stopLoading = () => {
    setIsLoading(false)
    setProgress(0)
    setMessage('')
  }

  const updateProgress = (value: number, msg?: string) => {
    setProgress(Math.min(100, Math.max(0, value)))
    if (msg) setMessage(msg)
  }

  const updateMessage = (msg: string) => {
    setMessage(msg)
  }

  return {
    isLoading,
    progress,
    message,
    startLoading,
    stopLoading,
    updateProgress,
    updateMessage
  }
}

// Higher-order component for adding loading states
export function withLoading<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  loadingProps: Partial<LoadingMicroInteractionsProps> = {}
) {
  return function WithLoadingComponent(props: P & { loading?: boolean }) {
    const { loading, ...otherProps } = props

    if (loading) {
      return <LoadingMicroInteractions {...loadingProps} />
    }

    return <WrappedComponent {...(otherProps as P)} />
  }
}

// Lazy loading wrapper with loading state
interface LazyLoadWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  className?: string
}

export function LazyLoadWrapper({ 
  children, 
  fallback,
  className = '' 
}: LazyLoadWrapperProps) {
  return (
    <React.Suspense 
      fallback={
        fallback || (
          <div className={`lazy-load-fallback ${className}`}>
            <LoadingMicroInteractions 
              type="skeleton" 
              size="large"
              text="Loading component..."
            />
          </div>
        )
      }
    >
      {children}
    </React.Suspense>
  )
}

export default LoadingMicroInteractions