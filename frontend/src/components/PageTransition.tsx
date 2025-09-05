import React, { useEffect, useState, ReactNode, cloneElement, isValidElement } from 'react'
import { useLocation } from 'react-router-dom'
import { useAnimation } from '../contexts/AnimationProvider'

interface PageTransitionProps {
  children: ReactNode
  mode?: 'fade' | 'slide' | 'scale' | 'slideUp' | 'slideDown' | 'custom'
  duration?: number
  className?: string
  appear?: boolean
  unmountOnExit?: boolean
  onEnter?: () => void
  onEntered?: () => void
  onExit?: () => void
  onExited?: () => void
}

interface TransitionState {
  status: 'entering' | 'entered' | 'exiting' | 'exited'
  key: string
}

export function PageTransition({
  children,
  mode = 'fade',
  duration,
  className = '',
  appear = true,
  unmountOnExit = false,
  onEnter,
  onEntered,
  onExit,
  onExited
}: PageTransitionProps) {
  const location = useLocation()
  const { getTransitionDuration, getEasing, settings } = useAnimation()
  const [transitionState, setTransitionState] = useState<TransitionState>({
    status: appear ? 'exited' : 'entered',
    key: location.pathname
  })
  const [isAnimating, setIsAnimating] = useState(false)

  const transitionDuration = duration || getTransitionDuration()
  const easing = getEasing()

  // Handle route changes
  useEffect(() => {
    const newKey = location.pathname
    
    if (newKey !== transitionState.key && !isAnimating) {
      setIsAnimating(true)
      
      // Start exit transition
      setTransitionState(prev => ({
        ...prev,
        status: 'exiting'
      }))
      
      onExit?.()
      
      // After exit duration, switch to new route and enter
      setTimeout(() => {
        setTransitionState({
          status: 'entering',
          key: newKey
        })
        
        onExited?.()
        onEnter?.()
        
        // Complete enter transition
        setTimeout(() => {
          setTransitionState(prev => ({
            ...prev,
            status: 'entered'
          }))
          setIsAnimating(false)
          onEntered?.()
        }, transitionDuration)
        
      }, transitionDuration)
    }
  }, [location.pathname, transitionState.key, isAnimating, transitionDuration, onEnter, onEntered, onExit, onExited])

  // Handle initial mount animation
  useEffect(() => {
    if (appear && transitionState.status === 'exited') {
      setTransitionState(prev => ({
        ...prev,
        status: 'entering'
      }))
      
      onEnter?.()
      
      setTimeout(() => {
        setTransitionState(prev => ({
          ...prev,
          status: 'entered'
        }))
        onEntered?.()
      }, transitionDuration)
    }
  }, [appear, transitionState.status, transitionDuration, onEnter, onEntered])

  // Get transition styles based on mode and status
  const getTransitionStyles = (): React.CSSProperties => {
    if (!settings.enableAnimations || settings.reduceMotion) {
      return {}
    }

    const baseStyles: React.CSSProperties = {
      transition: `all ${transitionDuration}ms ${easing}`,
      willChange: 'transform, opacity'
    }

    const { status } = transitionState

    switch (mode) {
      case 'fade':
        return {
          ...baseStyles,
          opacity: status === 'entered' ? 1 : 0
        }

      case 'slide':
        return {
          ...baseStyles,
          opacity: status === 'entered' ? 1 : 0,
          transform: status === 'entered' 
            ? 'translateX(0)' 
            : status === 'entering' 
              ? 'translateX(30px)' 
              : 'translateX(-30px)'
        }

      case 'slideUp':
        return {
          ...baseStyles,
          opacity: status === 'entered' ? 1 : 0,
          transform: status === 'entered' 
            ? 'translateY(0)' 
            : 'translateY(20px)'
        }

      case 'slideDown':
        return {
          ...baseStyles,
          opacity: status === 'entered' ? 1 : 0,
          transform: status === 'entered' 
            ? 'translateY(0)' 
            : 'translateY(-20px)'
        }

      case 'scale':
        return {
          ...baseStyles,
          opacity: status === 'entered' ? 1 : 0,
          transform: status === 'entered' 
            ? 'scale(1)' 
            : 'scale(0.95)'
        }

      default:
        return baseStyles
    }
  }

  // Don't render if unmountOnExit is true and component is exited
  if (unmountOnExit && transitionState.status === 'exited') {
    return null
  }

  const transitionStyles = getTransitionStyles()
  const combinedClassName = `page-transition page-transition-${mode} page-transition-${transitionState.status} ${className}`.trim()

  // If children is a valid React element, clone it with transition props
  if (isValidElement(children)) {
    return cloneElement(children, {
      style: {
        ...transitionStyles,
        ...(children.props.style || {})
      },
      className: `${children.props.className || ''} ${combinedClassName}`.trim()
    })
  }

  // Otherwise, wrap in a div
  return (
    <div
      style={transitionStyles}
      className={combinedClassName}
      data-transition-status={transitionState.status}
    >
      {children}
    </div>
  )
}

// Route-specific transition wrapper
interface RouteTransitionProps extends Omit<PageTransitionProps, 'children'> {
  children: ReactNode
  routeKey?: string
}

export function RouteTransition({ children, routeKey, ...props }: RouteTransitionProps) {
  const location = useLocation()
  const key = routeKey || location.pathname + location.search

  return (
    <PageTransition key={key} {...props}>
      {children}
    </PageTransition>
  )
}

// Transition group for handling multiple transitions
interface TransitionGroupProps {
  children: ReactNode
  mode?: 'out-in' | 'in-out' | 'simultaneous'
  className?: string
}

export function TransitionGroup({ 
  children, 
  mode = 'out-in',
  className = ''
}: TransitionGroupProps) {
  const location = useLocation()
  const [currentRoute, setCurrentRoute] = useState(location.pathname)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    if (location.pathname !== currentRoute && !isTransitioning) {
      setIsTransitioning(true)
      
      if (mode === 'out-in') {
        // Wait for exit, then enter
        setTimeout(() => {
          setCurrentRoute(location.pathname)
          setTimeout(() => {
            setIsTransitioning(false)
          }, 300)
        }, 300)
      } else {
        // Immediate transition
        setCurrentRoute(location.pathname)
        setTimeout(() => {
          setIsTransitioning(false)
        }, 300)
      }
    }
  }, [location.pathname, currentRoute, isTransitioning, mode])

  return (
    <div className={`transition-group transition-group-${mode} ${className}`}>
      {children}
    </div>
  )
}

// Hook for controlling page transitions
export function usePageTransition() {
  const location = useLocation()
  const { settings, getTransitionDuration } = useAnimation()
  const [isTransitioning, setIsTransitioning] = useState(false)

  const startTransition = () => setIsTransitioning(true)
  const endTransition = () => setIsTransitioning(false)

  const transitionTo = (path: string, options: { replace?: boolean } = {}) => {
    if (!settings.enableAnimations) {
      window.location.href = path
      return
    }

    startTransition()
    
    setTimeout(() => {
      if (options.replace) {
        window.history.replaceState(null, '', path)
      } else {
        window.history.pushState(null, '', path)
      }
      endTransition()
    }, getTransitionDuration())
  }

  return {
    isTransitioning,
    currentPath: location.pathname,
    transitionTo,
    startTransition,
    endTransition,
    canTransition: settings.enableAnimations && !settings.reduceMotion
  }
}

// HOC for wrapping components with page transitions
export function withPageTransition<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  transitionProps: Partial<PageTransitionProps> = {}
) {
  const WithPageTransitionComponent = (props: P) => (
    <PageTransition {...transitionProps}>
      <WrappedComponent {...props} />
    </PageTransition>
  )

  WithPageTransitionComponent.displayName = `withPageTransition(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return WithPageTransitionComponent
}

export default PageTransition