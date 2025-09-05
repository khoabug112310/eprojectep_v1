import React, { useState, useEffect } from 'react'
import usePWA from '../hooks/usePWA'
import './PWAInstallBanner.css'

interface PWAInstallBannerProps {
  onInstall?: () => void
  onDismiss?: () => void
  showAfterDelay?: number // milliseconds
  persistDismissal?: boolean
}

export default function PWAInstallBanner({
  onInstall,
  onDismiss,
  showAfterDelay = 3000,
  persistDismissal = true
}: PWAInstallBannerProps) {
  const { isInstallable, isInstalled, install, showInstallPrompt } = usePWA()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if banner was previously dismissed
  useEffect(() => {
    if (persistDismissal) {
      const dismissed = localStorage.getItem('pwa-install-banner-dismissed')
      if (dismissed === 'true') {
        setIsDismissed(true)
      }
    }
  }, [])

  // Show banner after delay if conditions are met
  useEffect(() => {
    if (isInstallable && !isInstalled && !isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, showAfterDelay)

      return () => clearTimeout(timer)
    }
  }, [isInstallable, isInstalled, isDismissed, showAfterDelay])

  const handleInstall = async () => {
    setIsLoading(true)
    
    try {
      await install()
      setIsVisible(false)
      onInstall?.()
    } catch (error) {
      console.error('Install failed:', error)
      // Fallback to manual instructions
      await showInstallPrompt()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    
    if (persistDismissal) {
      localStorage.setItem('pwa-install-banner-dismissed', 'true')
    }
    
    onDismiss?.()
  }

  const handleNotNow = () => {
    setIsVisible(false)
    // Don't persist this dismissal, allow banner to show again later
  }

  if (!isVisible || isInstalled) {
    return null
  }

  return (
    <div className="pwa-install-banner">
      <div className="pwa-banner-content">
        <div className="pwa-banner-icon">
          <img src="/pwa/icon-72x72.png" alt="CineBook" className="pwa-app-icon" />
        </div>
        
        <div className="pwa-banner-text">
          <h3>Cài đặt CineBook</h3>
          <p>Đặt vé nhanh chóng và tiện lợi hơn với ứng dụng CineBook</p>
          
          <div className="pwa-features">
            <span className="feature">⚡ Truy cập nhanh</span>
            <span className="feature">📱 Offline Support</span>
            <span className="feature">🔔 Thông báo</span>
          </div>
        </div>
        
        <div className="pwa-banner-actions">
          <button 
            onClick={handleInstall}
            className="pwa-install-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                Đang cài đặt...
              </>
            ) : (
              'Cài đặt'
            )}
          </button>
          
          <div className="pwa-secondary-actions">
            <button onClick={handleNotNow} className="pwa-btn-text">
              Để sau
            </button>
            <button onClick={handleDismiss} className="pwa-btn-text">
              Không quan tâm
            </button>
          </div>
        </div>
      </div>
      
      <button onClick={handleDismiss} className="pwa-close-btn" aria-label="Đóng">
        ×
      </button>
    </div>
  )
}

// Mini install button component for use in other places
export function PWAInstallButton({ className = '', children }: { className?: string; children?: React.ReactNode }) {
  const { isInstallable, isInstalled, install, showInstallPrompt } = usePWA()
  const [isLoading, setIsLoading] = useState(false)

  const handleInstall = async () => {
    setIsLoading(true)
    
    try {
      await install()
    } catch (error) {
      console.error('Install failed:', error)
      // Fallback to manual instructions
      await showInstallPrompt()
    } finally {
      setIsLoading(false)
    }
  }

  if (!isInstallable || isInstalled) {
    return null
  }

  return (
    <button 
      onClick={handleInstall}
      className={`pwa-install-button ${className}`}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <div className="loading-spinner small"></div>
          Đang cài...
        </>
      ) : (
        children || (
          <>
            📱 Cài đặt App
          </>
        )
      )}
    </button>
  )
}

// Update notification component
export function PWAUpdateNotification() {
  const { isUpdateAvailable, update } = usePWA()
  const [isVisible, setIsVisible] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (isUpdateAvailable) {
      setIsVisible(true)
    }
  }, [isUpdateAvailable])

  const handleUpdate = async () => {
    setIsUpdating(true)
    
    try {
      await update()
      setIsVisible(false)
    } catch (error) {
      console.error('Update failed:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="pwa-update-notification">
      <div className="pwa-update-content">
        <div className="pwa-update-icon">🔄</div>
        <div className="pwa-update-text">
          <h4>Cập nhật có sẵn</h4>
          <p>Phiên bản mới của CineBook đã sẵn sàng</p>
        </div>
        <div className="pwa-update-actions">
          <button 
            onClick={handleUpdate}
            className="pwa-update-btn"
            disabled={isUpdating}
          >
            {isUpdating ? 'Đang cập nhật...' : 'Cập nhật'}
          </button>
          <button onClick={handleDismiss} className="pwa-btn-text">
            Để sau
          </button>
        </div>
      </div>
    </div>
  )
}