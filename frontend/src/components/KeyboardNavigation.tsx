import React, { useEffect, useRef, ReactNode, HTMLAttributes } from 'react'

// Enhanced keyboard navigation hook
export function useKeyboardNavigation(containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (event.key === 'Tab') {
        // Trap focus within container
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement?.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement?.focus()
          }
        }
      }

      // Arrow key navigation for grids and lists
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as Element)
        if (currentIndex === -1) return

        let nextIndex = currentIndex
        const isGrid = container.getAttribute('role') === 'grid' || container.classList.contains('grid-navigation')
        
        if (isGrid) {
          const columns = parseInt(container.getAttribute('data-columns') || '4')
          const rows = Math.ceil(focusableElements.length / columns)
          const currentRow = Math.floor(currentIndex / columns)
          const currentCol = currentIndex % columns

          switch (event.key) {
            case 'ArrowLeft':
              nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1
              break
            case 'ArrowRight':
              nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0
              break
            case 'ArrowUp':
              if (currentRow > 0) {
                nextIndex = (currentRow - 1) * columns + currentCol
              } else {
                nextIndex = Math.min((rows - 1) * columns + currentCol, focusableElements.length - 1)
              }
              break
            case 'ArrowDown':
              if (currentRow < rows - 1) {
                nextIndex = Math.min((currentRow + 1) * columns + currentCol, focusableElements.length - 1)
              } else {
                nextIndex = currentCol
              }
              break
          }
        } else {
          // Linear navigation for lists
          switch (event.key) {
            case 'ArrowUp':
            case 'ArrowLeft':
              nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1
              break
            case 'ArrowDown':
            case 'ArrowRight':
              nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0
              break
          }
        }

        if (nextIndex !== currentIndex) {
          event.preventDefault()
          ;(focusableElements[nextIndex] as HTMLElement)?.focus()
        }
      }

      // Home and End key navigation
      if (event.key === 'Home') {
        event.preventDefault()
        ;(focusableElements[0] as HTMLElement)?.focus()
      } else if (event.key === 'End') {
        event.preventDefault()
        ;(focusableElements[focusableElements.length - 1] as HTMLElement)?.focus()
      }

      // Escape key to close modals/dropdowns
      if (event.key === 'Escape') {
        const closeButton = container.querySelector('[data-close-on-escape]') as HTMLElement
        if (closeButton) {
          closeButton.click()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [containerRef])
}

// Enhanced focus management hook
export function useFocusManagement() {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const captureFocus = () => {
    previousFocusRef.current = document.activeElement as HTMLElement
  }

  const restoreFocus = () => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }

  const moveFocusToElement = (element: HTMLElement | null) => {
    if (element) {
      element.focus()
    }
  }

  const focusFirstElement = (container: HTMLElement) => {
    const firstFocusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement
    if (firstFocusable) {
      firstFocusable.focus()
    }
  }

  return {
    captureFocus,
    restoreFocus,
    moveFocusToElement,
    focusFirstElement
  }
}

// Enhanced focus trap component
interface FocusTrapProps {
  children: ReactNode
  active?: boolean
  restoreFocus?: boolean
  className?: string
}

export function FocusTrap({ children, active = true, restoreFocus = true, className = '' }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { captureFocus, restoreFocus: restore } = useFocusManagement()

  useKeyboardNavigation(containerRef)

  useEffect(() => {
    if (active && restoreFocus) {
      captureFocus()
      return () => restore()
    }
  }, [active, restoreFocus, captureFocus, restore])

  useEffect(() => {
    if (active && containerRef.current) {
      const firstFocusable = containerRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      if (firstFocusable) {
        firstFocusable.focus()
      }
    }
  }, [active])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

// Skip link component for accessibility
interface SkipLinkProps {
  href: string
  children: ReactNode
}

export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="skip-link"
      onFocus={(e) => e.currentTarget.classList.add('focused')}
      onBlur={(e) => e.currentTarget.classList.remove('focused')}
    >
      {children}
    </a>
  )
}

// Enhanced button with keyboard navigation
interface KeyboardButtonProps extends HTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  children: ReactNode
  type?: 'button' | 'submit' | 'reset'
}

export function KeyboardButton({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  children,
  className = '',
  type = 'button',
  onKeyDown,
  ...props
}: KeyboardButtonProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    // Space or Enter key activation
    if (event.key === ' ' || event.key === 'Enter') {
      if (!disabled && !loading) {
        event.preventDefault()
        event.currentTarget.click()
      }
    }
    
    // Call parent onKeyDown if provided
    onKeyDown?.(event)
  }

  const buttonClasses = [
    'keyboard-button',
    `keyboard-button--${variant}`,
    `keyboard-button--${size}`,
    disabled && 'keyboard-button--disabled',
    loading && 'keyboard-button--loading',
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onKeyDown={handleKeyDown}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span aria-hidden="true">Loading...</span>
      ) : (
        children
      )}
    </button>
  )
}

// Enhanced dropdown with keyboard navigation
interface KeyboardDropdownProps {
  trigger: ReactNode
  children: ReactNode
  isOpen: boolean
  onToggle: (open: boolean) => void
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  className?: string
}

export function KeyboardDropdown({
  trigger,
  children,
  isOpen,
  onToggle,
  placement = 'bottom-start',
  className = ''
}: KeyboardDropdownProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { captureFocus, restoreFocus } = useFocusManagement()

  useKeyboardNavigation(menuRef)

  const handleTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!isOpen) {
        captureFocus()
        onToggle(true)
      }
    } else if (event.key === 'Escape' && isOpen) {
      onToggle(false)
      restoreFocus()
    }
  }

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const firstItem = menuRef.current.querySelector('[role="menuitem"]') as HTMLElement
      if (firstItem) {
        firstItem.focus()
      }
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onToggle(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onToggle])

  return (
    <div className={`keyboard-dropdown ${className}`}>
      <button
        ref={triggerRef}
        className="keyboard-dropdown__trigger"
        onClick={() => onToggle(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {trigger}
      </button>
      
      {isOpen && (
        <div
          ref={menuRef}
          className={`keyboard-dropdown__menu keyboard-dropdown__menu--${placement}`}
          role="menu"
          data-close-on-escape="true"
        >
          {children}
        </div>
      )}
    </div>
  )
}

// Enhanced dropdown item
interface KeyboardDropdownItemProps {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  className?: string
}

export function KeyboardDropdownItem({
  children,
  onClick,
  disabled = false,
  className = ''
}: KeyboardDropdownItemProps) {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!disabled) {
        onClick()
      }
    }
  }

  return (
    <div
      role="menuitem"
      className={`keyboard-dropdown__item ${disabled ? 'keyboard-dropdown__item--disabled' : ''} ${className}`}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
    >
      {children}
    </div>
  )
}

// Enhanced modal with keyboard navigation
interface KeyboardModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
  size?: 'small' | 'medium' | 'large' | 'fullscreen'
}

export function KeyboardModal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  size = 'medium'
}: KeyboardModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const { captureFocus, restoreFocus } = useFocusManagement()

  useKeyboardNavigation(modalRef)

  useEffect(() => {
    if (isOpen) {
      captureFocus()
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.body.style.overflow = ''
        restoreFocus()
      }
    }
  }, [isOpen, captureFocus, restoreFocus])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="keyboard-modal__overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className={`keyboard-modal keyboard-modal--${size} ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        data-close-on-escape="true"
      >
        <div className="keyboard-modal__header">
          <h2 id="modal-title" className="keyboard-modal__title">
            {title}
          </h2>
          <button
            className="keyboard-modal__close"
            onClick={onClose}
            aria-label="Close modal"
            data-close-on-escape="true"
          >
            ×
          </button>
        </div>
        
        <div className="keyboard-modal__content">
          {children}
        </div>
      </div>
    </div>
  )
}

export default {
  useKeyboardNavigation,
  useFocusManagement,
  FocusTrap,
  SkipLink,
  KeyboardButton,
  KeyboardDropdown,
  KeyboardDropdownItem,
  KeyboardModal
}