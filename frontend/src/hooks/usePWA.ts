import { useState, useEffect, useCallback } from 'react'

interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  isUpdateAvailable: boolean
  registration: ServiceWorkerRegistration | null
}

interface PWAActions {
  install: () => Promise<void>
  update: () => Promise<void>
  showInstallPrompt: () => Promise<void>
  enableNotifications: () => Promise<boolean>
  shareContent: (data: ShareData) => Promise<void>
}

interface ShareData {
  title?: string
  text?: string
  url?: string
}

/**
 * React hook for managing PWA functionality
 * Handles service worker registration, installation prompts, notifications, and sharing
 */
export function usePWA(): PWAState & PWAActions {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker()
    setupEventListeners()
    checkInstallationStatus()
  }, [])

  // Setup online/offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })

        console.log('✅ Service Worker registered:', reg)
        setRegistration(reg)

        // Check for updates
        reg.addEventListener('updatefound', () => {
          console.log('🔄 Service Worker update found')
          const newWorker = reg.installing

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('📱 New service worker installed, update available')
                setIsUpdateAvailable(true)
              }
            })
          }
        })

        // Listen for controller changes (when SW updates)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload()
        })

      } catch (error) {
        console.error('❌ Service Worker registration failed:', error)
      }
    }
  }

  const setupEventListeners = () => {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📲 PWA install prompt available')
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    })

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed successfully')
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
      
      // Track installation
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'pwa_install', {
          event_category: 'PWA',
          event_label: 'App Installed'
        })
      }
    })
  }

  const checkInstallationStatus = () => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Check for iOS standalone mode
    if ((window.navigator as any).standalone === true) {
      setIsInstalled(true)
    }
  }

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      throw new Error('Install prompt not available')
    }

    try {
      const result = await deferredPrompt.prompt()
      console.log('📲 Install prompt result:', result)

      if (result.outcome === 'accepted') {
        console.log('✅ User accepted install prompt')
        setIsInstallable(false)
        setDeferredPrompt(null)
      } else {
        console.log('❌ User dismissed install prompt')
      }
    } catch (error) {
      console.error('❌ Install prompt failed:', error)
      throw error
    }
  }, [deferredPrompt])

  const update = useCallback(async () => {
    if (!registration) {
      throw new Error('Service worker not registered')
    }

    try {
      // Skip waiting and activate new service worker
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        setIsUpdateAvailable(false)
      }
    } catch (error) {
      console.error('❌ Update failed:', error)
      throw error
    }
  }, [registration])

  const showInstallPrompt = useCallback(async () => {
    if (isInstalled) {
      throw new Error('App is already installed')
    }

    if (isInstallable && deferredPrompt) {
      return install()
    }

    // For iOS users or when prompt is not available
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    
    if (isIOS) {
      alert(
        'To install CineBook on iOS:\n\n' +
        '1. Tap the Share button\n' +
        '2. Scroll down and tap \"Add to Home Screen\"\n' +
        '3. Tap \"Add\" to confirm'
      )
    } else {
      alert(
        'To install CineBook:\n\n' +
        '1. Open browser menu (⋮)\n' +
        '2. Select \"Install CineBook\" or \"Add to Home screen\"\n' +
        '3. Follow the prompts'
      )
    }
  }, [isInstalled, isInstallable, deferredPrompt, install])

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('⚠️ Notifications not supported')
      return false
    }

    if (!registration) {
      console.warn('⚠️ Service worker not registered')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted')
        
        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
        })

        // Send subscription to server
        if (import.meta.env.VITE_API_URL) {
          await fetch(`${import.meta.env.VITE_API_URL}/api/push/subscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(subscription)
          })
        }

        return true
      } else {
        console.log('❌ Notification permission denied')
        return false
      }
    } catch (error) {
      console.error('❌ Notification setup failed:', error)
      return false
    }
  }, [registration])

  const shareContent = useCallback(async (data: ShareData) => {
    if (!('share' in navigator)) {
      // Fallback for browsers without Web Share API
      const url = data.url || window.location.href
      const text = `${data.title || ''} ${data.text || ''} ${url}`.trim()
      
      try {
        await (navigator as any).clipboard.writeText(text)
        alert('Đã sao chép liên kết vào clipboard!')
      } catch (error) {
        // Fallback to legacy copy method
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        alert('Đã sao chép liên kết vào clipboard!')
      }
      return
    }

    try {
      await (navigator as any).share({
        title: data.title || 'CineBook',
        text: data.text || 'Đặt vé xem phim online tại CineBook',
        url: data.url || window.location.href
      })
      console.log('✅ Content shared successfully')
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('❌ Share failed:', error)
        throw error
      }
    }
  }, [])

  return {
    // State
    isInstallable,
    isInstalled,
    isOnline,
    isUpdateAvailable,
    registration,
    
    // Actions
    install,
    update,
    showInstallPrompt,
    enableNotifications,
    shareContent
  }
}

export default usePWA