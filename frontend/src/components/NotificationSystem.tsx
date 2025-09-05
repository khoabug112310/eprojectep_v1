import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import './NotificationSystem.css'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number // milliseconds, 0 = permanent
  actions?: NotificationAction[]
  metadata?: Record<string, any>
  persistent?: boolean
  dismissible?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

interface NotificationAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary' | 'danger'
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => string
  removeNotification: (id: string) => void
  clearAll: () => void
  clearByType: (type: Notification['type']) => void
  updateNotification: (id: string, updates: Partial<Notification>) => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

/**
 * Notification Provider Component
 * Manages global notification state and provides notification functions
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id'>): string => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newNotification: Notification = {
      id,
      duration: 5000, // Default 5 seconds
      dismissible: true,
      position: 'top-right',
      ...notification
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto-remove after duration (if not permanent)
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    // Announce to screen readers
    const message = `${newNotification.type}: ${newNotification.title}. ${newNotification.message}`
    announceToScreenReader(message)

    return id
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const clearByType = useCallback((type: Notification['type']) => {
    setNotifications(prev => prev.filter(notification => notification.type !== type))
  }, [])

  const updateNotification = useCallback((id: string, updates: Partial<Notification>) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, ...updates }
          : notification
      )
    )
  }, [])

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  const contextValue: NotificationContextType = useMemo(() => ({
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    clearByType,
    updateNotification
  }), [notifications, addNotification, removeNotification, clearAll, clearByType, updateNotification])

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

/**
 * Hook to use notification system
 */
export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

/**
 * Notification Container Component
 * Renders notifications in different positions
 */
function NotificationContainer() {
  const { notifications } = useNotifications()

  // Group notifications by position
  const notificationsByPosition = notifications.reduce((acc, notification) => {
    const position = notification.position || 'top-right'
    if (!acc[position]) {
      acc[position] = []
    }
    acc[position].push(notification)
    return acc
  }, {} as Record<string, Notification[]>)

  return (
    <>
      {Object.entries(notificationsByPosition).map(([position, positionNotifications]) => (
        <div
          key={position}
          className={`notification-container notification-container--${position}`}
          role="region"
          aria-label={`Notifications - ${position}`}
        >
          {positionNotifications.map(notification => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      ))}
    </>
  )
}

/**
 * Individual Notification Item Component
 */
function NotificationItem({ notification }: { notification: Notification }) {
  const { removeNotification } = useNotifications()
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  // Animation entrance
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = useCallback(() => {
    if (!notification.dismissible) return

    setIsExiting(true)
    setTimeout(() => {
      removeNotification(notification.id)
    }, 300) // Match CSS animation duration
  }, [notification.id, notification.dismissible, removeNotification])

  const handleAction = useCallback((action: NotificationAction) => {
    action.action()
    handleDismiss()
  }, [handleDismiss])

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return 'ℹ️'
    }
  }

  return (
    <div
      className={`
        notification
        notification--${notification.type}
        ${isVisible ? 'notification--visible' : ''}
        ${isExiting ? 'notification--exiting' : ''}
        ${!notification.dismissible ? 'notification--persistent' : ''}
      `}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="notification__icon">
        {getIcon()}
      </div>
      
      <div className="notification__content">
        <div className="notification__title">
          {notification.title}
        </div>
        <div className="notification__message">
          {notification.message}
        </div>
        
        {notification.actions && notification.actions.length > 0 && (
          <div className="notification__actions">
            {notification.actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleAction(action)}
                className={`notification__action notification__action--${action.style || 'secondary'}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {notification.dismissible && (
        <button
          onClick={handleDismiss}
          className="notification__dismiss"
          aria-label="Dismiss notification"
        >
          ×
        </button>
      )}
    </div>
  )
}

/**
 * Convenience hooks for different notification types
 */
export function useNotificationHelpers() {
  const { addNotification } = useNotifications()

  const showSuccess = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'success',
      title,
      message,
      ...options
    })
  }, [addNotification])

  const showError = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'error',
      title,
      message,
      duration: 0, // Error notifications should be permanent by default
      ...options
    })
  }, [addNotification])

  const showWarning = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      duration: 8000, // Longer duration for warnings
      ...options
    })
  }, [addNotification])

  const showInfo = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'info',
      title,
      message,
      ...options
    })
  }, [addNotification])

  const showBookingSuccess = useCallback((bookingId: string, seats: string[]) => {
    return addNotification({
      type: 'success',
      title: 'Booking Confirmed!',
      message: `Your booking ${bookingId} for seats ${seats.join(', ')} has been confirmed.`,
      duration: 0,
      actions: [
        {
          label: 'View E-Ticket',
          action: () => window.location.href = `/booking/confirmation?bookingId=${bookingId}`,
          style: 'primary'
        },
        {
          label: 'View Bookings',
          action: () => window.location.href = '/profile/bookings',
          style: 'secondary'
        }
      ]
    })
  }, [addNotification])

  const showPaymentError = useCallback((error: string, retryAction?: () => void) => {
    return addNotification({
      type: 'error',
      title: 'Payment Failed',
      message: error,
      duration: 0,
      actions: retryAction ? [
        {
          label: 'Retry Payment',
          action: retryAction,
          style: 'primary'
        },
        {
          label: 'Contact Support',
          action: () => window.location.href = 'mailto:support@cinebook.com',
          style: 'secondary'
        }
      ] : [
        {
          label: 'Contact Support',
          action: () => window.location.href = 'mailto:support@cinebook.com',
          style: 'primary'
        }
      ]
    })
  }, [addNotification])

  const showConnectionError = useCallback(() => {
    return addNotification({
      type: 'warning',
      title: 'Connection Issue',
      message: 'You appear to be offline. Some features may not work properly.',
      duration: 0,
      actions: [
        {
          label: 'Retry',
          action: () => window.location.reload(),
          style: 'primary'
        }
      ]
    })
  }, [addNotification])

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showBookingSuccess,
    showPaymentError,
    showConnectionError
  }
}

export default NotificationProvider