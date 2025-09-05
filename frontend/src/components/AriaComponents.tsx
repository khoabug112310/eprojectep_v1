import React, { useEffect, useRef, useState, ReactNode, useCallback } from 'react'

// Enhanced ARIA announcement system
class AriaAnnouncer {
  private static instance: AriaAnnouncer
  private announceElement: HTMLElement | null = null

  static getInstance(): AriaAnnouncer {
    if (!AriaAnnouncer.instance) {
      AriaAnnouncer.instance = new AriaAnnouncer()
    }
    return AriaAnnouncer.instance
  }

  constructor() {
    this.setupAnnouncer()
  }

  private setupAnnouncer() {
    if (typeof window === 'undefined') return

    // Create the announcer element if it doesn't exist
    this.announceElement = document.getElementById('aria-announcer')
    
    if (!this.announceElement) {
      this.announceElement = document.createElement('div')
      this.announceElement.id = 'aria-announcer'
      this.announceElement.setAttribute('aria-live', 'polite')
      this.announceElement.setAttribute('aria-atomic', 'true')
      this.announceElement.className = 'sr-only'
      document.body.appendChild(this.announceElement)
    }
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.announceElement) return

    // Clear previous content
    this.announceElement.textContent = ''
    
    // Update aria-live priority
    this.announceElement.setAttribute('aria-live', priority)
    
    // Small delay to ensure screen readers pick up the change
    setTimeout(() => {
      if (this.announceElement) {
        this.announceElement.textContent = message
      }
    }, 100)

    // Clear after announcing to avoid repetition
    setTimeout(() => {
      if (this.announceElement) {
        this.announceElement.textContent = ''
      }
    }, 3000)
  }

  announceRoute(routeName: string) {
    this.announce(`Navigated to ${routeName} page`, 'polite')
  }

  announceError(error: string) {
    this.announce(`Error: ${error}`, 'assertive')
  }

  announceSuccess(message: string) {
    this.announce(`Success: ${message}`, 'polite')
  }

  announceLoading(isLoading: boolean, context?: string) {
    if (isLoading) {
      this.announce(`Loading${context ? ` ${context}` : ''}...`, 'polite')
    } else {
      this.announce(`Finished loading${context ? ` ${context}` : ''}`, 'polite')
    }
  }
}

// Hook for ARIA announcements
export function useAriaAnnounce() {
  const announcer = AriaAnnouncer.getInstance()

  return {
    announce: announcer.announce.bind(announcer),
    announceRoute: announcer.announceRoute.bind(announcer),
    announceError: announcer.announceError.bind(announcer),
    announceSuccess: announcer.announceSuccess.bind(announcer),
    announceLoading: announcer.announceLoading.bind(announcer)
  }
}

// Enhanced heading component with proper hierarchy
interface AccessibleHeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6
  children: ReactNode
  className?: string
  id?: string
  tabIndex?: number
}

export function AccessibleHeading({ 
  level, 
  children, 
  className = '', 
  id, 
  tabIndex 
}: AccessibleHeadingProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements
  
  return (
    <Tag 
      className={`accessible-heading accessible-heading--level-${level} ${className}`}
      id={id}
      tabIndex={tabIndex}
    >
      {children}
    </Tag>
  )
}

// Enhanced form field with comprehensive ARIA support
interface AccessibleFormFieldProps {
  label: string
  id: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'search'
  value: string
  onChange: (value: string) => void
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  autoComplete?: string
  maxLength?: number
  pattern?: string
  className?: string
}

export function AccessibleFormField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder,
  autoComplete,
  maxLength,
  pattern,
  className = ''
}: AccessibleFormFieldProps) {
  const [isFocused, setIsFocused] = useState(false)
  const { announce } = useAriaAnnounce()
  
  const errorId = error ? `${id}-error` : undefined
  const helperId = helperText ? `${id}-helper` : undefined
  const describedBy = [errorId, helperId].filter(Boolean).join(' ')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    
    // Announce validation errors immediately for screen readers
    if (error && !isFocused) {
      announce(`Validation error: ${error}`, 'assertive')
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
    if (helperText) {
      announce(helperText, 'polite')
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    if (error) {
      announce(`Validation error for ${label}: ${error}`, 'assertive')
    }
  }

  return (
    <div className={`accessible-form-field ${className}`}>
      <label 
        htmlFor={id}
        className="accessible-form-field__label"
      >
        {label}
        {required && (
          <span className="accessible-form-field__required" aria-label="required">
            *
          </span>
        )}
      </label>
      
      <input
        id={id}
        type={type}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        pattern={pattern}
        className={`accessible-form-field__input ${error ? 'accessible-form-field__input--error' : ''}`}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy || undefined}
      />
      
      {helperText && (
        <div 
          id={helperId}
          className="accessible-form-field__helper"
        >
          {helperText}
        </div>
      )}
      
      {error && (
        <div 
          id={errorId}
          className="accessible-form-field__error"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  )
}

// Enhanced status indicator with screen reader support
interface AccessibleStatusProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'loading'
  message: string
  details?: string
  showIcon?: boolean
  className?: string
}

export function AccessibleStatus({
  status,
  message,
  details,
  showIcon = true,
  className = ''
}: AccessibleStatusProps) {
  const { announce } = useAriaAnnounce()
  
  useEffect(() => {
    // Announce status changes to screen readers
    const priority = status === 'error' ? 'assertive' : 'polite'
    announce(`${status}: ${message}`, priority)
  }, [status, message, announce])

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return '✓'
      case 'error': return '✗'
      case 'warning': return '⚠'
      case 'info': return 'ℹ'
      case 'loading': return '⟳'
      default: return ''
    }
  }

  const getAriaLabel = () => {
    return `${status} status: ${message}${details ? `. ${details}` : ''}`
  }

  return (
    <div 
      className={`accessible-status accessible-status--${status} ${className}`}
      role="status"
      aria-live={status === 'error' ? 'assertive' : 'polite'}
      aria-label={getAriaLabel()}
    >
      {showIcon && (
        <span 
          className="accessible-status__icon"
          aria-hidden="true"
        >
          {getStatusIcon()}
        </span>
      )}
      
      <div className="accessible-status__content">
        <span className="accessible-status__message">
          {message}
        </span>
        
        {details && (
          <span className="accessible-status__details">
            {details}
          </span>
        )}
      </div>
    </div>
  )
}

// Enhanced table with comprehensive ARIA support
interface AccessibleTableProps {
  data: Array<Record<string, any>>
  columns: Array<{
    key: string
    label: string
    sortable?: boolean
    width?: string
    render?: (value: any, row: Record<string, any>) => ReactNode
  }>
  caption?: string
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (column: string) => void
  onRowClick?: (row: Record<string, any>) => void
  className?: string
}

export function AccessibleTable({
  data,
  columns,
  caption,
  sortColumn,
  sortDirection,
  onSort,
  onRowClick,
  className = ''
}: AccessibleTableProps) {
  const { announce } = useAriaAnnounce()
  const tableRef = useRef<HTMLTableElement>(null)

  const handleSort = (columnKey: string) => {
    if (onSort) {
      onSort(columnKey)
      const column = columns.find(col => col.key === columnKey)
      const newDirection = sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc'
      announce(`Table sorted by ${column?.label} in ${newDirection}ending order`, 'polite')
    }
  }

  const getSortAriaLabel = (column: any) => {
    if (!column.sortable) return undefined
    
    if (sortColumn === column.key) {
      return `Sort by ${column.label}, currently sorted ${sortDirection}ending`
    }
    return `Sort by ${column.label}`
  }

  return (
    <div className={`accessible-table-wrapper ${className}`}>
      <table 
        ref={tableRef}
        className="accessible-table"
        role="table"
      >
        {caption && (
          <caption className="accessible-table__caption">
            {caption}
          </caption>
        )}
        
        <thead>
          <tr role="row">
            {columns.map((column) => (
              <th 
                key={column.key}
                className="accessible-table__header"
                role="columnheader"
                scope="col"
                style={{ width: column.width }}
                aria-sort={
                  sortColumn === column.key 
                    ? sortDirection === 'asc' ? 'ascending' : 'descending'
                    : column.sortable ? 'none' : undefined
                }
              >
                {column.sortable ? (
                  <button
                    className="accessible-table__sort-button"
                    onClick={() => handleSort(column.key)}
                    aria-label={getSortAriaLabel(column)}
                  >
                    {column.label}
                    <span 
                      className="accessible-table__sort-indicator"
                      aria-hidden="true"
                    >
                      {sortColumn === column.key ? (
                        sortDirection === 'asc' ? ' ↑' : ' ↓'
                      ) : ' ↕'}
                    </span>
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex}
              className={onRowClick ? 'accessible-table__row--clickable' : ''}
              role="row"
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={onRowClick ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onRowClick(row)
                }
              } : undefined}
            >
              {columns.map((column) => (
                <td 
                  key={column.key}
                  className="accessible-table__cell"
                  role="gridcell"
                >
                  {column.render 
                    ? column.render(row[column.key], row)
                    : row[column.key]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {data.length === 0 && (
        <div 
          className="accessible-table__empty"
          role="status"
          aria-live="polite"
        >
          No data available
        </div>
      )}
    </div>
  )
}

// Enhanced breadcrumb navigation
interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

interface AccessibleBreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function AccessibleBreadcrumbs({ items, className = '' }: AccessibleBreadcrumbsProps) {
  return (
    <nav 
      className={`accessible-breadcrumbs ${className}`}
      aria-label="Breadcrumb navigation"
    >
      <ol className="accessible-breadcrumbs__list">
        {items.map((item, index) => (
          <li 
            key={index}
            className="accessible-breadcrumbs__item"
          >
            {item.current ? (
              <span 
                className="accessible-breadcrumbs__current"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <a 
                href={item.href}
                className="accessible-breadcrumbs__link"
              >
                {item.label}
              </a>
            )}
            
            {index < items.length - 1 && (
              <span 
                className="accessible-breadcrumbs__separator"
                aria-hidden="true"
              >
                /
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Enhanced progress indicator
interface AccessibleProgressProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  showValue?: boolean
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export function AccessibleProgress({
  value,
  max = 100,
  label,
  showPercentage = true,
  showValue = false,
  size = 'medium',
  className = ''
}: AccessibleProgressProps) {
  const percentage = Math.round((value / max) * 100)
  const { announce } = useAriaAnnounce()
  
  useEffect(() => {
    // Announce significant progress changes
    if (percentage % 25 === 0 && percentage > 0) {
      announce(`Progress: ${percentage}% complete`, 'polite')
    }
  }, [percentage, announce])

  const getAriaLabel = () => {
    if (label) {
      return `${label}: ${percentage}% complete`
    }
    return `${percentage}% complete`
  }

  return (
    <div className={`accessible-progress accessible-progress--${size} ${className}`}>
      {label && (
        <label className="accessible-progress__label">
          {label}
        </label>
      )}
      
      <div 
        className="accessible-progress__container"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={getAriaLabel()}
      >
        <div 
          className="accessible-progress__bar"
          style={{ width: `${percentage}%` }}
        />
        
        {(showPercentage || showValue) && (
          <span className="accessible-progress__text">
            {showValue && `${value}/${max}`}
            {showValue && showPercentage && ' - '}
            {showPercentage && `${percentage}%`}
          </span>
        )}
      </div>
    </div>
  )
}

// Screen reader testing component
export function ScreenReaderTest() {
  const { announce } = useAriaAnnounce()

  const testAnnouncements = () => {
    announce('This is a test announcement for screen readers', 'polite')
    setTimeout(() => {
      announce('This is an assertive announcement', 'assertive')
    }, 2000)
  }

  return (
    <div className="screen-reader-test" style={{ display: 'none' }}>
      <button onClick={testAnnouncements}>
        Test Screen Reader Announcements
      </button>
    </div>
  )
}

export default {
  useAriaAnnounce,
  AccessibleHeading,
  AccessibleFormField,
  AccessibleStatus,
  AccessibleTable,
  AccessibleBreadcrumbs,
  AccessibleProgress,
  ScreenReaderTest
}