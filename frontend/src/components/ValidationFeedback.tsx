import React, { useEffect, useRef, useState } from 'react'
import { useAriaAnnounce } from './AriaComponents'

export interface ValidationMessage {
  id: string
  field: string
  type: 'error' | 'warning' | 'success' | 'info'
  message: string
  details?: string
  severity?: 'high' | 'medium' | 'low'
  timestamp?: number
  duration?: number
}

export interface ValidationFeedbackProps {
  messages: ValidationMessage[]
  mode?: 'inline' | 'floating' | 'summary' | 'tooltip'
  position?: 'top' | 'bottom' | 'left' | 'right'
  showIcons?: boolean
  autoHide?: boolean
  maxMessages?: number
  groupByField?: boolean
  animationDuration?: number
  className?: string
  onMessageClick?: (message: ValidationMessage) => void
  onMessageDismiss?: (messageId: string) => void
}

export function ValidationFeedback({
  messages = [],
  mode = 'inline',
  position = 'bottom',
  showIcons = true,
  autoHide = true,
  maxMessages = 5,
  groupByField = false,
  animationDuration = 300,
  className = '',
  onMessageClick,
  onMessageDismiss
}: ValidationFeedbackProps) {
  const [visibleMessages, setVisibleMessages] = useState<ValidationMessage[]>([])
  const [dismissedMessages, setDismissedMessages] = useState<Set<string>>(new Set())
  const feedbackRef = useRef<HTMLDivElement>(null)
  const { announce } = useAriaAnnounce()

  // Process and filter messages
  useEffect(() => {
    let processedMessages = messages
      .filter(msg => !dismissedMessages.has(msg.id))
      .slice(0, maxMessages)

    if (groupByField) {
      const groupedByField = processedMessages.reduce((acc, msg) => {
        if (!acc[msg.field]) acc[msg.field] = []
        acc[msg.field].push(msg)
        return acc
      }, {} as Record<string, ValidationMessage[]>)

      processedMessages = Object.values(groupedByField).flat()
    }

    setVisibleMessages(processedMessages)

    // Announce new error messages to screen readers
    const newErrors = processedMessages.filter(msg => 
      msg.type === 'error' && 
      !visibleMessages.some(existing => existing.id === msg.id)
    )

    if (newErrors.length > 0) {
      const errorText = newErrors.map(err => `${err.field}: ${err.message}`).join('. ')
      announce(`Validation errors: ${errorText}`, 'assertive')
    }
  }, [messages, dismissedMessages, maxMessages, groupByField, visibleMessages, announce])

  // Auto-hide messages
  useEffect(() => {
    if (!autoHide) return

    const timers = visibleMessages
      .filter(msg => msg.duration && msg.duration > 0)
      .map(msg => 
        setTimeout(() => {
          handleDismiss(msg.id)
        }, msg.duration)
      )

    return () => timers.forEach(timer => clearTimeout(timer))
  }, [visibleMessages, autoHide])

  const handleDismiss = (messageId: string) => {
    setDismissedMessages(prev => new Set([...prev, messageId]))
    onMessageDismiss?.(messageId)
  }

  const handleMessageClick = (message: ValidationMessage) => {
    onMessageClick?.(message)
  }

  const getMessageIcon = (type: ValidationMessage['type']) => {
    const icons = {
      error: '❌',
      warning: '⚠️',
      success: '✅',
      info: 'ℹ️'
    }
    return icons[type] || '📝'
  }

  const getMessageClassName = (message: ValidationMessage) => {
    const baseClass = 'validation-feedback__message'
    const typeClass = `validation-feedback__message--${message.type}`
    const severityClass = message.severity ? `validation-feedback__message--${message.severity}` : ''
    const clickableClass = onMessageClick ? 'validation-feedback__message--clickable' : ''
    
    return [baseClass, typeClass, severityClass, clickableClass].filter(Boolean).join(' ')
  }

  const renderMessage = (message: ValidationMessage, index: number) => (
    <div
      key={message.id}
      className={getMessageClassName(message)}
      onClick={() => handleMessageClick(message)}
      style={{
        animationDelay: `${index * 100}ms`,
        animationDuration: `${animationDuration}ms`
      }}
      role="alert"
      aria-live={message.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      {showIcons && (
        <span 
          className="validation-feedback__icon"
          aria-hidden="true"
        >
          {getMessageIcon(message.type)}
        </span>
      )}
      
      <div className="validation-feedback__content">
        <div className="validation-feedback__field">
          {message.field}
        </div>
        
        <div className="validation-feedback__text">
          {message.message}
        </div>
        
        {message.details && (
          <div className="validation-feedback__details">
            {message.details}
          </div>
        )}
        
        {message.timestamp && (
          <div className="validation-feedback__timestamp">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
      
      {onMessageDismiss && (
        <button
          className="validation-feedback__dismiss"
          onClick={(e) => {
            e.stopPropagation()
            handleDismiss(message.id)
          }}
          aria-label={`Dismiss ${message.type} message for ${message.field}`}
        >
          ×
        </button>
      )}
    </div>
  )

  const renderSummary = () => {
    const errorCount = visibleMessages.filter(m => m.type === 'error').length
    const warningCount = visibleMessages.filter(m => m.type === 'warning').length
    const successCount = visibleMessages.filter(m => m.type === 'success').length

    if (visibleMessages.length === 0) return null

    return (
      <div className="validation-feedback__summary" role="status" aria-live="polite">
        <div className="validation-feedback__summary-header">
          Validation Summary
        </div>
        
        <div className="validation-feedback__summary-counts">
          {errorCount > 0 && (
            <span className="validation-feedback__summary-count validation-feedback__summary-count--error">
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          
          {warningCount > 0 && (
            <span className="validation-feedback__summary-count validation-feedback__summary-count--warning">
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </span>
          )}
          
          {successCount > 0 && (
            <span className="validation-feedback__summary-count validation-feedback__summary-count--success">
              {successCount} success{successCount !== 1 ? 'es' : ''}
            </span>
          )}
        </div>
      </div>
    )
  }

  if (visibleMessages.length === 0) return null

  const containerClassName = [
    'validation-feedback',
    `validation-feedback--${mode}`,
    `validation-feedback--${position}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <div 
      ref={feedbackRef}
      className={containerClassName}
      data-testid="validation-feedback"
    >
      {mode === 'summary' ? (
        <>
          {renderSummary()}
          <div className="validation-feedback__messages">
            {visibleMessages.map(renderMessage)}
          </div>
        </>
      ) : (
        <div className="validation-feedback__messages">
          {visibleMessages.map(renderMessage)}
        </div>
      )}
    </div>
  )
}

// Real-time validation feedback hook
export function useValidationFeedback() {
  const [messages, setMessages] = useState<ValidationMessage[]>([])
  
  const addMessage = (message: Omit<ValidationMessage, 'id' | 'timestamp'>) => {
    const newMessage: ValidationMessage = {
      ...message,
      id: `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }
    
    setMessages(prev => [...prev, newMessage])
    return newMessage.id
  }

  const updateMessage = (id: string, updates: Partial<ValidationMessage>) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === id 
          ? { ...msg, ...updates, timestamp: Date.now() }
          : msg
      )
    )
  }

  const removeMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id))
  }

  const clearMessages = (field?: string) => {
    if (field) {
      setMessages(prev => prev.filter(msg => msg.field !== field))
    } else {
      setMessages([])
    }
  }

  const getMessagesForField = (field: string) => {
    return messages.filter(msg => msg.field === field)
  }

  const hasErrors = (field?: string) => {
    const targetMessages = field ? getMessagesForField(field) : messages
    return targetMessages.some(msg => msg.type === 'error')
  }

  const getErrorCount = (field?: string) => {
    const targetMessages = field ? getMessagesForField(field) : messages
    return targetMessages.filter(msg => msg.type === 'error').length
  }

  return {
    messages,
    addMessage,
    updateMessage,
    removeMessage,
    clearMessages,
    getMessagesForField,
    hasErrors,
    getErrorCount
  }
}

// Enhanced field validation feedback component
interface FieldValidationFeedbackProps {
  fieldName: string
  messages: ValidationMessage[]
  mode?: 'inline' | 'tooltip'
  showOnFocus?: boolean
  showOnHover?: boolean
  className?: string
}

export function FieldValidationFeedback({
  fieldName,
  messages,
  mode = 'inline',
  showOnFocus = false,
  showOnHover = false,
  className = ''
}: FieldValidationFeedbackProps) {
  const [isVisible, setIsVisible] = useState(!showOnFocus && !showOnHover)
  const fieldMessages = messages.filter(msg => msg.field === fieldName)

  const handleFocus = () => {
    if (showOnFocus) setIsVisible(true)
  }

  const handleBlur = () => {
    if (showOnFocus) setIsVisible(false)
  }

  const handleMouseEnter = () => {
    if (showOnHover) setIsVisible(true)
  }

  const handleMouseLeave = () => {
    if (showOnHover) setIsVisible(false)
  }

  if (fieldMessages.length === 0) return null

  return (
    <div 
      className={`field-validation-feedback field-validation-feedback--${mode} ${className}`}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isVisible && (
        <ValidationFeedback
          messages={fieldMessages}
          mode={mode}
          showIcons={true}
          autoHide={false}
          maxMessages={3}
        />
      )}
    </div>
  )
}

// Floating validation notification component
interface FloatingValidationProps {
  messages: ValidationMessage[]
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  maxVisible?: number
  autoHide?: boolean
  duration?: number
  className?: string
}

export function FloatingValidation({
  messages,
  position = 'top-right',
  maxVisible = 3,
  autoHide = true,
  duration = 5000,
  className = ''
}: FloatingValidationProps) {
  const [visibleMessages, setVisibleMessages] = useState<ValidationMessage[]>([])

  useEffect(() => {
    const newMessages = messages
      .slice(-maxVisible)
      .map(msg => ({
        ...msg,
        duration: autoHide ? duration : undefined
      }))

    setVisibleMessages(newMessages)
  }, [messages, maxVisible, autoHide, duration])

  const handleDismiss = (messageId: string) => {
    setVisibleMessages(prev => prev.filter(msg => msg.id !== messageId))
  }

  if (visibleMessages.length === 0) return null

  return (
    <div 
      className={`floating-validation floating-validation--${position} ${className}`}
    >
      <ValidationFeedback
        messages={visibleMessages}
        mode="floating"
        showIcons={true}
        autoHide={autoHide}
        onMessageDismiss={handleDismiss}
      />
    </div>
  )
}

export default ValidationFeedback