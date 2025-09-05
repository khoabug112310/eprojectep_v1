import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface AccessibilitySettings {
  enableScreenReader: boolean
  enableKeyboardNavigation: boolean
  enableHighContrast: boolean
  enableReducedMotion: boolean
  fontSize: 'small' | 'medium' | 'large' | 'extra-large'
  announceChanges: boolean
  enableSoundEffects: boolean
  enableVoiceCommands: boolean
}

interface AccessibilityContextType {
  settings: AccessibilitySettings
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void
  isScreenReaderEnabled: boolean
  isHighContrastEnabled: boolean
  isReducedMotionEnabled: boolean
  announce: (message: string, priority?: 'polite' | 'assertive') => void
  setFocusToMain: () => void
  setFocusToSkipLink: () => void
  enabledFeatures: {
    keyboardNavigation: boolean
    screenReader: boolean
    highContrast: boolean
    reducedMotion: boolean
  }
}

const defaultSettings: AccessibilitySettings = {
  enableScreenReader: false,
  enableKeyboardNavigation: true,
  enableHighContrast: false,
  enableReducedMotion: false,
  fontSize: 'medium',
  announceChanges: true,
  enableSoundEffects: false,
  enableVoiceCommands: false
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

interface AccessibilityProviderProps {
  children: ReactNode
  defaultSettings?: Partial<AccessibilitySettings>
}

export function AccessibilityProvider({ children, defaultSettings: customDefaults }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    ...defaultSettings,
    ...customDefaults
  })

  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false)
  const [isHighContrastEnabled, setIsHighContrastEnabled] = useState(false)
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = useState(false)

  // Detect user preferences from system
  useEffect(() => {
    // Detect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsReducedMotionEnabled(prefersReducedMotion.matches)
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotionEnabled(e.matches)
      if (e.matches) {
        setSettings(prev => ({ ...prev, enableReducedMotion: true }))
      }
    }
    
    prefersReducedMotion.addEventListener('change', handleReducedMotionChange)

    // Detect high contrast preference
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)')
    setIsHighContrastEnabled(prefersHighContrast.matches)
    
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setIsHighContrastEnabled(e.matches)
      if (e.matches) {
        setSettings(prev => ({ ...prev, enableHighContrast: true }))
      }
    }
    
    prefersHighContrast.addEventListener('change', handleHighContrastChange)

    // Detect screen reader (heuristic approach)
    const detectScreenReader = () => {
      // Check for common screen reader user agents or accessibility APIs
      const hasAccessibilityAPI = 'speechSynthesis' in window
      const hasAriaSupport = document.body.getAttribute('aria-hidden') !== null
      const screenReaderIndicators = [
        navigator.userAgent.includes('NVDA'),
        navigator.userAgent.includes('JAWS'),
        navigator.userAgent.includes('VoiceOver'),
        hasAccessibilityAPI,
        hasAriaSupport
      ]
      
      setIsScreenReaderEnabled(screenReaderIndicators.some(Boolean))
    }

    detectScreenReader()

    return () => {
      prefersReducedMotion.removeEventListener('change', handleReducedMotionChange)
      prefersHighContrast.removeEventListener('change', handleHighContrastChange)
    }
  }, [])

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement

    // Font size
    root.style.setProperty('--font-size-multiplier', {
      'small': '0.875',
      'medium': '1',
      'large': '1.125',
      'extra-large': '1.25'
    }[settings.fontSize])

    // High contrast mode
    if (settings.enableHighContrast || isHighContrastEnabled) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Reduced motion
    if (settings.enableReducedMotion || isReducedMotionEnabled) {
      root.classList.add('reduced-motion')
    } else {
      root.classList.remove('reduced-motion')
    }

    // Keyboard navigation
    if (settings.enableKeyboardNavigation) {
      root.classList.add('keyboard-navigation')
    } else {
      root.classList.remove('keyboard-navigation')
    }

    // Screen reader optimization
    if (settings.enableScreenReader || isScreenReaderEnabled) {
      root.classList.add('screen-reader-enabled')
    } else {
      root.classList.remove('screen-reader-enabled')
    }

  }, [settings, isHighContrastEnabled, isReducedMotionEnabled, isScreenReaderEnabled])

  // Load and save settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.warn('Failed to load accessibility settings:', error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings))
  }, [settings])

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  // Announcement system
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.announceChanges) return

    const announcer = document.getElementById('aria-announcer')
    if (!announcer) {
      console.warn('ARIA announcer not found')
      return
    }

    // Clear previous content
    announcer.textContent = ''
    announcer.setAttribute('aria-live', priority)
    
    // Small delay to ensure screen readers pick up the change
    setTimeout(() => {
      announcer.textContent = message
    }, 100)

    // Clear after announcement
    setTimeout(() => {
      announcer.textContent = ''
    }, 3000)
  }

  // Focus management
  const setFocusToMain = () => {
    const mainElement = document.querySelector('main, #main-content, [role="main"]') as HTMLElement
    if (mainElement) {
      mainElement.focus()
      announce('Focused on main content', 'polite')
    }
  }

  const setFocusToSkipLink = () => {
    const skipLink = document.querySelector('.skip-link') as HTMLElement
    if (skipLink) {
      skipLink.focus()
    }
  }

  const enabledFeatures = {
    keyboardNavigation: settings.enableKeyboardNavigation,
    screenReader: settings.enableScreenReader || isScreenReaderEnabled,
    highContrast: settings.enableHighContrast || isHighContrastEnabled,
    reducedMotion: settings.enableReducedMotion || isReducedMotionEnabled
  }

  const value: AccessibilityContextType = {
    settings,
    updateSettings,
    isScreenReaderEnabled: settings.enableScreenReader || isScreenReaderEnabled,
    isHighContrastEnabled: settings.enableHighContrast || isHighContrastEnabled,
    isReducedMotionEnabled: settings.enableReducedMotion || isReducedMotionEnabled,
    announce,
    setFocusToMain,
    setFocusToSkipLink,
    enabledFeatures
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

// Accessibility settings panel component
export function AccessibilitySettingsPanel({ onClose }: { onClose?: () => void }) {
  const { settings, updateSettings, enabledFeatures } = useAccessibility()

  return (
    <div className="accessibility-settings-panel">
      <div className="accessibility-settings-panel__header">
        <h2>Accessibility Settings</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="accessibility-settings-panel__close"
            aria-label="Close accessibility settings"
          >
            ×
          </button>
        )}
      </div>

      <div className="accessibility-settings-panel__content">
        <section className="accessibility-settings-panel__section">
          <h3>Display Settings</h3>
          
          <div className="accessibility-settings-panel__option">
            <label htmlFor="font-size">Font Size</label>
            <select
              id="font-size"
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: e.target.value as any })}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="extra-large">Extra Large</option>
            </select>
          </div>

          <div className="accessibility-settings-panel__option">
            <label>
              <input
                type="checkbox"
                checked={settings.enableHighContrast}
                onChange={(e) => updateSettings({ enableHighContrast: e.target.checked })}
              />
              Enable High Contrast Mode
            </label>
          </div>

          <div className="accessibility-settings-panel__option">
            <label>
              <input
                type="checkbox"
                checked={settings.enableReducedMotion}
                onChange={(e) => updateSettings({ enableReducedMotion: e.target.checked })}
              />
              Reduce Motion and Animations
            </label>
          </div>
        </section>

        <section className="accessibility-settings-panel__section">
          <h3>Navigation Settings</h3>
          
          <div className="accessibility-settings-panel__option">
            <label>
              <input
                type="checkbox"
                checked={settings.enableKeyboardNavigation}
                onChange={(e) => updateSettings({ enableKeyboardNavigation: e.target.checked })}
              />
              Enhanced Keyboard Navigation
            </label>
          </div>

          <div className="accessibility-settings-panel__option">
            <label>
              <input
                type="checkbox"
                checked={settings.enableScreenReader}
                onChange={(e) => updateSettings({ enableScreenReader: e.target.checked })}
              />
              Screen Reader Optimizations
            </label>
          </div>
        </section>

        <section className="accessibility-settings-panel__section">
          <h3>Audio Settings</h3>
          
          <div className="accessibility-settings-panel__option">
            <label>
              <input
                type="checkbox"
                checked={settings.announceChanges}
                onChange={(e) => updateSettings({ announceChanges: e.target.checked })}
              />
              Announce Page Changes
            </label>
          </div>

          <div className="accessibility-settings-panel__option">
            <label>
              <input
                type="checkbox"
                checked={settings.enableSoundEffects}
                onChange={(e) => updateSettings({ enableSoundEffects: e.target.checked })}
              />
              Enable Sound Effects
            </label>
          </div>
        </section>

        <section className="accessibility-settings-panel__section">
          <h3>Current Status</h3>
          <div className="accessibility-settings-panel__status">
            <div className={`status-indicator ${enabledFeatures.keyboardNavigation ? 'active' : 'inactive'}`}>
              Keyboard Navigation: {enabledFeatures.keyboardNavigation ? 'Enabled' : 'Disabled'}
            </div>
            <div className={`status-indicator ${enabledFeatures.screenReader ? 'active' : 'inactive'}`}>
              Screen Reader: {enabledFeatures.screenReader ? 'Detected' : 'Not Detected'}
            </div>
            <div className={`status-indicator ${enabledFeatures.highContrast ? 'active' : 'inactive'}`}>
              High Contrast: {enabledFeatures.highContrast ? 'Enabled' : 'Disabled'}
            </div>
            <div className={`status-indicator ${enabledFeatures.reducedMotion ? 'active' : 'inactive'}`}>
              Reduced Motion: {enabledFeatures.reducedMotion ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

// Hook for component-level accessibility features
export function useComponentAccessibility(componentName: string) {
  const { announce, enabledFeatures } = useAccessibility()

  const announceAction = (action: string, result?: string) => {
    const message = result ? `${action}: ${result}` : action
    announce(`${componentName} - ${message}`, 'polite')
  }

  const announceError = (error: string) => {
    announce(`${componentName} error: ${error}`, 'assertive')
  }

  const announceSuccess = (message: string) => {
    announce(`${componentName} success: ${message}`, 'polite')
  }

  return {
    announceAction,
    announceError,
    announceSuccess,
    isScreenReaderEnabled: enabledFeatures.screenReader,
    isKeyboardNavigationEnabled: enabledFeatures.keyboardNavigation,
    isHighContrastEnabled: enabledFeatures.highContrast,
    isReducedMotionEnabled: enabledFeatures.reducedMotion
  }
}

export default AccessibilityProvider