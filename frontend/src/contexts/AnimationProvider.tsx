import React, { createContext, useContext, useState, useEffect, type ReactNode, useMemo } from 'react'

interface AnimationSettings {
  enableAnimations: boolean
  reduceMotion: boolean
  animationSpeed: 'slow' | 'normal' | 'fast'
  transitionDuration: number
  easingFunction: string
}

interface AnimationContextType {
  settings: AnimationSettings
  updateSettings: (newSettings: Partial<AnimationSettings>) => void
  isAnimating: boolean
  setIsAnimating: (animating: boolean) => void
  registerAnimation: (id: string) => void
  unregisterAnimation: (id: string) => void
  prefersReducedMotion: boolean
  getTransitionDuration: (multiplier?: number) => number
  getEasing: () => string
}

const defaultSettings: AnimationSettings = {
  enableAnimations: true,
  reduceMotion: false,
  animationSpeed: 'normal',
  transitionDuration: 300,
  easingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined)

interface AnimationProviderProps {
  children: ReactNode
  defaultSettings?: Partial<AnimationSettings>
}

export function AnimationProvider({ children, defaultSettings: customDefaults }: AnimationProviderProps) {
  const [settings, setSettings] = useState<AnimationSettings>({
    ...defaultSettings,
    ...customDefaults
  })
  const [isAnimating, setIsAnimating] = useState(false)
  const [activeAnimations, setActiveAnimations] = useState<Set<string>>(new Set())
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Detect user's motion preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
      if (e.matches) {
        setSettings(prev => ({ ...prev, reduceMotion: true, enableAnimations: false }))
      }
    }

    setPrefersReducedMotion(mediaQuery.matches)
    if (mediaQuery.matches) {
      setSettings(prev => ({ ...prev, reduceMotion: true, enableAnimations: false }))
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('animationSettings', JSON.stringify(settings))
  }, [settings])

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('animationSettings')
      if (saved) {
        const parsedSettings = JSON.parse(saved)
        setSettings(prev => ({ ...prev, ...parsedSettings }))
      }
    } catch (error) {
      console.warn('Failed to load animation settings from localStorage:', error)
    }
  }, [])

  const updateSettings = (newSettings: Partial<AnimationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  const registerAnimation = (id: string) => {
    setActiveAnimations(prev => new Set(prev).add(id))
    setIsAnimating(true)
  }

  const unregisterAnimation = (id: string) => {
    setActiveAnimations(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      if (newSet.size === 0) {
        setIsAnimating(false)
      }
      return newSet
    })
  }

  const getTransitionDuration = (multiplier: number = 1): number => {
    if (!settings.enableAnimations || settings.reduceMotion) return 0
    
    const speedMultipliers = {
      slow: 1.5,
      normal: 1,
      fast: 0.75
    }
    
    return settings.transitionDuration * speedMultipliers[settings.animationSpeed] * multiplier
  }

  const getEasing = (): string => {
    if (!settings.enableAnimations || settings.reduceMotion) return 'linear'
    return settings.easingFunction
  }

  const value: AnimationContextType = useMemo(() => ({
    settings,
    updateSettings,
    isAnimating,
    setIsAnimating,
    registerAnimation,
    unregisterAnimation,
    prefersReducedMotion,
    getTransitionDuration,
    getEasing
  }), [settings, updateSettings, isAnimating, setIsAnimating, registerAnimation, unregisterAnimation, prefersReducedMotion, getTransitionDuration, getEasing])

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  )
}

export function useAnimation() {
  const context = useContext(AnimationContext)
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider')
  }
  return context
}

// Custom hook for individual animation control
export function useAnimationState(animationId: string) {
  const { registerAnimation, unregisterAnimation, getTransitionDuration, getEasing, settings } = useAnimation()
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (isActive) {
      registerAnimation(animationId)
    } else {
      unregisterAnimation(animationId)
    }

    return () => unregisterAnimation(animationId)
  }, [isActive, animationId, registerAnimation, unregisterAnimation])

  const startAnimation = () => setIsActive(true)
  const endAnimation = () => setIsActive(false)

  return {
    isActive,
    startAnimation,
    endAnimation,
    duration: getTransitionDuration(),
    easing: getEasing(),
    enabled: settings.enableAnimations && !settings.reduceMotion
  }
}

// Utility hook for CSS-in-JS animation styles
export function useAnimationStyles() {
  const { getTransitionDuration, getEasing, settings } = useAnimation()

  const transition = (properties: string | string[], multiplier?: number) => {
    if (!settings.enableAnimations || settings.reduceMotion) return 'none'
    
    const props = Array.isArray(properties) ? properties.join(', ') : properties
    const duration = getTransitionDuration(multiplier)
    const easing = getEasing()
    
    return `${props} ${duration}ms ${easing}`
  }

  const fadeIn = (multiplier?: number) => ({
    opacity: 1,
    transition: transition('opacity', multiplier)
  })

  const fadeOut = (multiplier?: number) => ({
    opacity: 0,
    transition: transition('opacity', multiplier)
  })

  const slideInUp = (distance: number = 20, multiplier?: number) => ({
    transform: 'translateY(0)',
    opacity: 1,
    transition: transition(['transform', 'opacity'], multiplier)
  })

  const slideOutDown = (distance: number = 20, multiplier?: number) => ({
    transform: `translateY(${distance}px)`,
    opacity: 0,
    transition: transition(['transform', 'opacity'], multiplier)
  })

  const scaleIn = (scale: number = 0.95, multiplier?: number) => ({
    transform: 'scale(1)',
    opacity: 1,
    transition: transition(['transform', 'opacity'], multiplier)
  })

  const scaleOut = (scale: number = 0.95, multiplier?: number) => ({
    transform: `scale(${scale})`,
    opacity: 0,
    transition: transition(['transform', 'opacity'], multiplier)
  })

  return {
    transition,
    fadeIn,
    fadeOut,
    slideInUp,
    slideOutDown,
    scaleIn,
    scaleOut,
    enabled: settings.enableAnimations && !settings.reduceMotion
  }
}

export default AnimationProvider