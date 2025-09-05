import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useKeyboardNavigation, useFocusManagement } from './KeyboardNavigation'

interface Seat {
  id: string
  row: string
  number: number
  type: 'gold' | 'platinum' | 'box'
  status: 'available' | 'occupied' | 'selected'
  price: number
}

interface SeatMapProps {
  seats: Seat[][]
  selectedSeats: string[]
  onSeatSelect: (seatId: string) => void
  maxSeats?: number
  disabled?: boolean
  showPrices?: boolean
}

export function AccessibleSeatMap({
  seats,
  selectedSeats,
  onSeatSelect,
  maxSeats = 8,
  disabled = false,
  showPrices = true
}: SeatMapProps) {
  const seatMapRef = useRef<HTMLDivElement>(null)
  const [focusedSeat, setFocusedSeat] = useState<string | null>(null)
  const { focusFirstElement } = useFocusManagement()

  useKeyboardNavigation(seatMapRef)

  // Calculate total columns for grid navigation
  const totalColumns = Math.max(...seats.map(row => row.length))

  // Flatten seats for easier navigation
  const flatSeats = seats.flat()
  const availableSeats = flatSeats.filter(seat => seat.status === 'available')

  const handleSeatClick = useCallback((seat: Seat) => {
    if (disabled || seat.status === 'occupied') return

    // Check if we can select more seats
    if (!selectedSeats.includes(seat.id) && selectedSeats.length >= maxSeats) {
      // Announce limitation to screen readers
      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', 'polite')
      announcement.setAttribute('aria-atomic', 'true')
      announcement.textContent = `Maximum ${maxSeats} seats can be selected`
      announcement.className = 'sr-only'
      document.body.appendChild(announcement)
      setTimeout(() => document.body.removeChild(announcement), 1000)
      return
    }

    onSeatSelect(seat.id)
  }, [disabled, selectedSeats, maxSeats, onSeatSelect])

  const handleSeatKeyDown = useCallback((event: React.KeyboardEvent, seat: Seat) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleSeatClick(seat)
    }
  }, [handleSeatClick])

  const getSeatAriaLabel = useCallback((seat: Seat) => {
    const seatType = seat.type.charAt(0).toUpperCase() + seat.type.slice(1)
    const status = selectedSeats.includes(seat.id) ? 'selected' : seat.status
    const price = showPrices ? `, ${seat.price.toLocaleString()} VND` : ''
    
    return `${seatType} seat ${seat.row}${seat.number}, ${status}${price}`
  }, [selectedSeats, showPrices])

  const getSeatClassName = useCallback((seat: Seat) => {
    const baseClass = 'seat-map__seat'
    const typeClass = `seat-map__seat--${seat.type}`
    const statusClass = selectedSeats.includes(seat.id) 
      ? 'seat-map__seat--selected' 
      : `seat-map__seat--${seat.status}`
    
    return `${baseClass} ${typeClass} ${statusClass}`
  }, [selectedSeats])

  // Focus management for initial load
  useEffect(() => {
    if (seatMapRef.current && availableSeats.length > 0) {
      const firstAvailableSeat = seatMapRef.current.querySelector(
        '.seat-map__seat--available'
      ) as HTMLElement
      if (firstAvailableSeat && !focusedSeat) {
        setFocusedSeat(firstAvailableSeat.getAttribute('data-seat-id'))
      }
    }
  }, [availableSeats, focusedSeat])

  return (
    <div className="seat-map-container">
      {/* Screen info */}
      <div className="seat-map__screen" aria-hidden="true">
        <div className="seat-map__screen-text">SCREEN</div>
      </div>

      {/* Seat map with proper ARIA structure */}
      <div
        ref={seatMapRef}
        className="seat-map grid-navigation"
        role="grid"
        aria-label="Movie theater seat selection"
        data-columns={totalColumns.toString()}
      >
        {/* Instructions for screen readers */}
        <div className="sr-only" aria-live="polite">
          Use arrow keys to navigate between seats. Press Enter or Space to select a seat.
          {maxSeats && ` You can select up to ${maxSeats} seats.`}
          {selectedSeats.length > 0 && ` Currently ${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''} selected.`}
        </div>

        {seats.map((row, rowIndex) => (
          <div 
            key={`row-${rowIndex}`} 
            className="seat-map__row"
            role="row"
            aria-label={`Row ${row[0]?.row || rowIndex + 1}`}
          >
            {/* Row label */}
            <div className="seat-map__row-label" aria-hidden="true">
              {row[0]?.row || String.fromCharCode(65 + rowIndex)}
            </div>

            {row.map((seat) => (
              <button
                key={seat.id}
                data-seat-id={seat.id}
                className={getSeatClassName(seat)}
                onClick={() => handleSeatClick(seat)}
                onKeyDown={(e) => handleSeatKeyDown(e, seat)}
                disabled={disabled || seat.status === 'occupied'}
                aria-label={getSeatAriaLabel(seat)}
                aria-pressed={selectedSeats.includes(seat.id)}
                role="gridcell"
                tabIndex={seat.status === 'available' ? 0 : -1}
              >
                <span aria-hidden="true">{seat.number}</span>
              </button>
            ))}

            {/* Row label (right side) */}
            <div className="seat-map__row-label" aria-hidden="true">
              {row[0]?.row || String.fromCharCode(65 + rowIndex)}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="seat-map__legend" role="region" aria-label="Seat type and status legend">
        <h3 className="seat-map__legend-title">Legend</h3>
        <div className="seat-map__legend-items">
          <div className="seat-map__legend-item">
            <div className="seat-map__legend-color seat-map__seat--available" aria-hidden="true"></div>
            <span>Available</span>
          </div>
          <div className="seat-map__legend-item">
            <div className="seat-map__legend-color seat-map__seat--selected" aria-hidden="true"></div>
            <span>Selected</span>
          </div>
          <div className="seat-map__legend-item">
            <div className="seat-map__legend-color seat-map__seat--occupied" aria-hidden="true"></div>
            <span>Occupied</span>
          </div>
          <div className="seat-map__legend-item">
            <div className="seat-map__legend-color seat-map__seat--gold" aria-hidden="true"></div>
            <span>Gold ({availableSeats.find(s => s.type === 'gold')?.price.toLocaleString()} VND)</span>
          </div>
          <div className="seat-map__legend-item">
            <div className="seat-map__legend-color seat-map__seat--platinum" aria-hidden="true"></div>
            <span>Platinum ({availableSeats.find(s => s.type === 'platinum')?.price.toLocaleString()} VND)</span>
          </div>
          <div className="seat-map__legend-item">
            <div className="seat-map__legend-color seat-map__seat--box" aria-hidden="true"></div>
            <span>Box ({availableSeats.find(s => s.type === 'box')?.price.toLocaleString()} VND)</span>
          </div>
        </div>
      </div>

      {/* Selection summary for screen readers */}
      <div 
        className="seat-map__summary sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {selectedSeats.length > 0 ? (
          `Selected seats: ${selectedSeats.map(id => {
            const seat = flatSeats.find(s => s.id === id)
            return seat ? `${seat.row}${seat.number}` : id
          }).join(', ')}`
        ) : (
          'No seats selected'
        )}
      </div>

      {/* Keyboard instructions */}
      <div className="seat-map__instructions" role="region" aria-label="Keyboard navigation instructions">
        <details>
          <summary>Keyboard Navigation Help</summary>
          <ul>
            <li><kbd>Arrow Keys</kbd> - Navigate between seats</li>
            <li><kbd>Enter</kbd> or <kbd>Space</kbd> - Select/deselect seat</li>
            <li><kbd>Tab</kbd> - Move to next interactive element</li>
            <li><kbd>Shift + Tab</kbd> - Move to previous interactive element</li>
            <li><kbd>Home</kbd> - Go to first available seat</li>
            <li><kbd>End</kbd> - Go to last available seat</li>
          </ul>
        </details>
      </div>
    </div>
  )
}

// Enhanced dropdown component for theater/movie selection
interface AccessibleDropdownProps {
  label: string
  value: string
  options: { value: string; label: string; disabled?: boolean }[]
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  helperText?: string
}

export function AccessibleDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  required = false,
  error,
  helperText
}: AccessibleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listboxRef = useRef<HTMLUListElement>(null)
  const [focusedOptionIndex, setFocusedOptionIndex] = useState(-1)

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedOption = options.find(option => option.value === value)

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          setFocusedOptionIndex(0)
        } else {
          setFocusedOptionIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          )
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (isOpen) {
          setFocusedOptionIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          )
        }
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          setFocusedOptionIndex(0)
        } else if (focusedOptionIndex >= 0) {
          const option = filteredOptions[focusedOptionIndex]
          if (option && !option.disabled) {
            onChange(option.value)
            setIsOpen(false)
            setFocusedOptionIndex(-1)
          }
        }
        break
      case 'Escape':
        if (isOpen) {
          setIsOpen(false)
          setFocusedOptionIndex(-1)
          triggerRef.current?.focus()
        }
        break
      case 'Home':
        if (isOpen) {
          event.preventDefault()
          setFocusedOptionIndex(0)
        }
        break
      case 'End':
        if (isOpen) {
          event.preventDefault()
          setFocusedOptionIndex(filteredOptions.length - 1)
        }
        break
      default:
        // Type-ahead search
        if (event.key.length === 1 && isOpen) {
          setSearchTerm(prev => prev + event.key)
          const matchingIndex = filteredOptions.findIndex(option =>
            option.label.toLowerCase().startsWith((searchTerm + event.key).toLowerCase())
          )
          if (matchingIndex >= 0) {
            setFocusedOptionIndex(matchingIndex)
          }
        }
        break
    }
  }, [isOpen, focusedOptionIndex, filteredOptions, onChange, searchTerm])

  // Clear search term after a delay
  useEffect(() => {
    if (searchTerm) {
      const timer = setTimeout(() => setSearchTerm(''), 1000)
      return () => clearTimeout(timer)
    }
  }, [searchTerm])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setFocusedOptionIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const dropdownId = `dropdown-${Math.random().toString(36).substr(2, 9)}`
  const listboxId = `${dropdownId}-listbox`
  const errorId = error ? `${dropdownId}-error` : undefined
  const helperTextId = helperText ? `${dropdownId}-helper` : undefined

  return (
    <div className="accessible-dropdown" ref={dropdownRef}>
      <label 
        htmlFor={dropdownId}
        className="accessible-dropdown__label"
      >
        {label}
        {required && <span className="accessible-dropdown__required" aria-label="required">*</span>}
      </label>

      <button
        ref={triggerRef}
        id={dropdownId}
        className={`accessible-dropdown__trigger ${error ? 'accessible-dropdown__trigger--error' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={dropdownId}
        aria-describedby={[errorId, helperTextId].filter(Boolean).join(' ') || undefined}
        aria-required={required}
        aria-invalid={!!error}
      >
        <span className="accessible-dropdown__value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="accessible-dropdown__arrow" aria-hidden="true">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <ul
          ref={listboxRef}
          id={listboxId}
          className="accessible-dropdown__listbox"
          role="listbox"
          aria-labelledby={dropdownId}
          tabIndex={-1}
        >
          {filteredOptions.length === 0 ? (
            <li className="accessible-dropdown__option accessible-dropdown__option--empty" role="option">
              No options available
            </li>
          ) : (
            filteredOptions.map((option, index) => (
              <li
                key={option.value}
                className={`accessible-dropdown__option ${
                  index === focusedOptionIndex ? 'accessible-dropdown__option--focused' : ''
                } ${option.disabled ? 'accessible-dropdown__option--disabled' : ''} ${
                  option.value === value ? 'accessible-dropdown__option--selected' : ''
                }`}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled}
                onClick={() => {
                  if (!option.disabled) {
                    onChange(option.value)
                    setIsOpen(false)
                    setFocusedOptionIndex(-1)
                  }
                }}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      )}

      {helperText && (
        <div id={helperTextId} className="accessible-dropdown__helper">
          {helperText}
        </div>
      )}

      {error && (
        <div id={errorId} className="accessible-dropdown__error" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}

export default AccessibleSeatMap