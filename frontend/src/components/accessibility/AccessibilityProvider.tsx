// CineBook Accessibility Provider
// Comprehensive WCAG 2.1 AA compliance and accessibility management

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { Logger, LogLevel, ErrorCategory } from '../../services/Logger'

// Accessibility Preferences
interface AccessibilityPreferences {
  reducedMotion: boolean
  highContrast: boolean
  largeText: boolean
  screenReader: boolean
  keyboardNavigation: boolean
  focusIndicators: boolean
  announcements: boolean
  autoplay: boolean
  fontSize: number
  colorTheme: 'default' | 'high-contrast' | 'dark' | 'light'
}

// Accessibility Context
interface AccessibilityContextType {
  preferences: AccessibilityPreferences
  updatePreference: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => void
  announce: (message: string, priority?: 'polite' | 'assertive') => void
  skipToContent: () => void
  toggleHighContrast: () => void
  increaseFontSize: () => void
  decreaseFontSize: () => void
  resetFontSize: () => void
  isSupported: (feature: string) => boolean
}

// Default accessibility preferences
const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  screenReader: false,
  keyboardNavigation: true,
  focusIndicators: true,
  announcements: true,
  autoplay: true,
  fontSize: 16,
  colorTheme: 'default'
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(DEFAULT_PREFERENCES)
  const [announcer, setAnnouncer] = useState<HTMLDivElement | null>(null)
  const logger = new Logger({ level: LogLevel.INFO })

  // Initialize accessibility preferences
  useEffect(() => {
    // Load saved preferences
    const saved = localStorage.getItem('accessibility-preferences')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setPreferences(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        logger.error('accessibility_preferences_load_error', error as Error, ErrorCategory.UI_COMPONENT)
      }
    }

    // Detect system preferences
    detectSystemPreferences()
    
    // Create screen reader announcer
    createAnnouncer()
    
    // Setup keyboard navigation
    setupKeyboardNavigation()
    
    // Apply initial accessibility styles
    applyAccessibilityStyles()
  }, [])

  // Detect system accessibility preferences
  const detectSystemPreferences = () => {
    if (typeof window !== 'undefined') {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const highContrast = window.matchMedia('(prefers-contrast: high)').matches
      const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      
      setPreferences(prev => ({
        ...prev,
        reducedMotion,
        highContrast,
        colorTheme: darkMode ? 'dark' : 'default'
      }))

      // Listen for changes
      window.matchMedia('(prefers-reduced-motion: reduce)')
        .addEventListener('change', (e) => {
          updatePreference('reducedMotion', e.matches)
        })
        
      window.matchMedia('(prefers-contrast: high)')
        .addEventListener('change', (e) => {
          updatePreference('highContrast', e.matches)
        })
    }
  }

  // Create screen reader announcer
  const createAnnouncer = () => {
    const announcerElement = document.createElement('div')
    announcerElement.setAttribute('aria-live', 'polite')
    announcerElement.setAttribute('aria-atomic', 'true')
    announcerElement.className = 'sr-only'
    announcerElement.style.cssText = `
      position: absolute !important;
      left: -10000px !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
    `
    document.body.appendChild(announcerElement)
    setAnnouncer(announcerElement)
  }

  // Setup keyboard navigation
  const setupKeyboardNavigation = () => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip to content with Alt+1
      if (event.altKey && event.key === '1') {
        event.preventDefault()
        skipToContent()
      }
      
      // Toggle high contrast with Alt+H
      if (event.altKey && event.key.toLowerCase() === 'h') {
        event.preventDefault()
        toggleHighContrast()
      }
      
      // Increase font size with Alt++
      if (event.altKey && event.key === '=') {
        event.preventDefault()
        increaseFontSize()
      }
      
      // Decrease font size with Alt+-
      if (event.altKey && event.key === '-') {
        event.preventDefault()
        decreaseFontSize()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }

  // Apply accessibility styles
  const applyAccessibilityStyles = () => {
    const root = document.documentElement
    
    // Apply font size
    root.style.setProperty('--base-font-size', `${preferences.fontSize}px`)
    
    // Apply color theme
    root.setAttribute('data-theme', preferences.colorTheme)
    
    // Apply high contrast
    if (preferences.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }
    
    // Apply reduced motion
    if (preferences.reducedMotion) {
      root.classList.add('reduced-motion')
    } else {
      root.classList.remove('reduced-motion')
    }
    
    // Apply large text
    if (preferences.largeText) {
      root.classList.add('large-text')
    } else {
      root.classList.remove('large-text')
    }
    
    // Apply focus indicators
    if (preferences.focusIndicators) {
      root.classList.add('enhanced-focus')
    } else {
      root.classList.remove('enhanced-focus')
    }
  }

  // Update preference
  const updatePreference = useCallback(<K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: value }
      
      // Save to localStorage
      try {
        localStorage.setItem('accessibility-preferences', JSON.stringify(updated))
      } catch (error) {
        logger.error('accessibility_preferences_save_error', error as Error, ErrorCategory.UI_COMPONENT)
      }
      
      return updated
    })
    
    logger.info('accessibility_preference_updated', ErrorCategory.UI_COMPONENT, { key, value })
  }, [])

  // Apply styles when preferences change
  useEffect(() => {
    applyAccessibilityStyles()
  }, [preferences])

  // Screen reader announcement
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!preferences.announcements || !announcer) return
    
    announcer.setAttribute('aria-live', priority)
    announcer.textContent = message
    
    // Clear after announcement
    setTimeout(() => {
      if (announcer) {
        announcer.textContent = ''
      }
    }, 1000)
    
    logger.info('accessibility_announcement', ErrorCategory.UI_COMPONENT, { message, priority })
  }, [preferences.announcements, announcer])

  // Skip to main content
  const skipToContent = useCallback(() => {
    const mainContent = document.getElementById('main-content') || 
                      document.querySelector('main') || 
                      document.querySelector('[role="main"]')
    
    if (mainContent) {
      mainContent.focus()
      mainContent.scrollIntoView({ behavior: 'smooth' })
      announce('Skipped to main content')
    }
  }, [announce])

  // Toggle high contrast
  const toggleHighContrast = useCallback(() => {
    const newValue = !preferences.highContrast
    updatePreference('highContrast', newValue)
    announce(newValue ? 'High contrast enabled' : 'High contrast disabled')
  }, [preferences.highContrast, updatePreference, announce])

  // Font size controls
  const increaseFontSize = useCallback(() => {
    const newSize = Math.min(preferences.fontSize + 2, 24)
    updatePreference('fontSize', newSize)
    announce(`Font size increased to ${newSize} pixels`)
  }, [preferences.fontSize, updatePreference, announce])

  const decreaseFontSize = useCallback(() => {
    const newSize = Math.max(preferences.fontSize - 2, 12)
    updatePreference('fontSize', newSize)
    announce(`Font size decreased to ${newSize} pixels`)
  }, [preferences.fontSize, updatePreference, announce])

  const resetFontSize = useCallback(() => {
    updatePreference('fontSize', 16)
    announce('Font size reset to default')
  }, [updatePreference, announce])

  // Check if accessibility feature is supported
  const isSupported = useCallback((feature: string): boolean => {
    switch (feature) {
      case 'reducedMotion':
        return typeof window !== 'undefined' && 
               'matchMedia' in window &&
               window.matchMedia('(prefers-reduced-motion)').media !== 'not all'
      
      case 'highContrast':
        return typeof window !== 'undefined' && 
               'matchMedia' in window &&
               window.matchMedia('(prefers-contrast)').media !== 'not all'
      
      case 'screenReader':
        return typeof window !== 'undefined' && 
               'speechSynthesis' in window
      
      case 'keyboardNavigation':
        return true // Always supported
      
      default:
        return false
    }
  }, [])

  const contextValue: AccessibilityContextType = useMemo(() => ({
    preferences,
    updatePreference,
    announce,
    skipToContent,
    toggleHighContrast,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    isSupported
  }), [preferences, updatePreference, announce, skipToContent, toggleHighContrast, increaseFontSize, decreaseFontSize, resetFontSize, isSupported])

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  )
}

// Hook to use accessibility context
export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

// Accessibility toolbar component
export const AccessibilityToolbar: React.FC = () => {
  const { 
    preferences, 
    toggleHighContrast, 
    increaseFontSize, 
    decreaseFontSize, 
    resetFontSize,
    skipToContent,
    updatePreference
  } = useAccessibility()

  return (
    <div 
      className="accessibility-toolbar"
      role="toolbar"
      aria-label="Accessibility options"
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'var(--bg-color, white)',
        border: '2px solid var(--border-color, #ccc)',
        borderRadius: '8px',
        padding: '8px',
        zIndex: 9999,
        display: 'flex',
        gap: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
      }}
    >
      <button
        onClick={skipToContent}
        className="accessibility-btn"
        aria-label="Skip to main content"
        title="Skip to main content (Alt+1)"
      >
        ⤵️
      </button>
      
      <button
        onClick={toggleHighContrast}
        className="accessibility-btn"
        aria-label={`${preferences.highContrast ? 'Disable' : 'Enable'} high contrast`}
        title={`${preferences.highContrast ? 'Disable' : 'Enable'} high contrast (Alt+H)`}
        aria-pressed={preferences.highContrast}
      >
        🌓
      </button>
      
      <button
        onClick={decreaseFontSize}
        className="accessibility-btn"
        aria-label="Decrease font size"
        title="Decrease font size (Alt+-)"
      >
        A-
      </button>
      
      <button
        onClick={resetFontSize}
        className="accessibility-btn"
        aria-label="Reset font size"
        title="Reset font size"
      >
        A
      </button>
      
      <button
        onClick={increaseFontSize}
        className="accessibility-btn"
        aria-label="Increase font size"
        title="Increase font size (Alt+=)"
      >
        A+
      </button>
      
      <button
        onClick={() => updatePreference('reducedMotion', !preferences.reducedMotion)}
        className="accessibility-btn"
        aria-label={`${preferences.reducedMotion ? 'Enable' : 'Disable'} animations`}
        title={`${preferences.reducedMotion ? 'Enable' : 'Disable'} animations`}
        aria-pressed={preferences.reducedMotion}
      >
        {preferences.reducedMotion ? '▶️' : '⏸️'}
      </button>
    </div>
  )
}

// Skip link component
export const SkipLink: React.FC = () => {
  const { skipToContent } = useAccessibility()

  return (
    <button
      className="skip-link"
      onClick={skipToContent}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          skipToContent()
        }
      }}
      style={{
        position: 'absolute',
        left: '-9999px',
        zIndex: 10000,
        padding: '8px 16px',
        background: '#000',
        color: '#fff',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: 'bold'
      }}
      onFocus={(e) => {
        e.target.style.left = '10px'
        e.target.style.top = '10px'
      }}
      onBlur={(e) => {
        e.target.style.left = '-9999px'
      }}
    >
      Skip to main content
    </button>
  )
}

export default AccessibilityProvider