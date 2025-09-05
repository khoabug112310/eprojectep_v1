import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useDebounce } from '../hooks/useDebounce'

export interface FilterOption {
  id: string
  label: string
  value: any
  count?: number
  disabled?: boolean
  description?: string
  category?: string
  color?: string
  icon?: string
}

export interface FilterGroup {
  id: string
  label: string
  type: 'single' | 'multiple' | 'range' | 'date' | 'rating' | 'price' | 'custom'
  options?: FilterOption[]
  placeholder?: string
  min?: number
  max?: number
  step?: number
  unit?: string
  required?: boolean
  collapsible?: boolean
  defaultCollapsed?: boolean
  searchable?: boolean
  sortable?: boolean
  customComponent?: React.ComponentType<any>
}

export interface FilterState {
  [groupId: string]: any
}

export interface AdvancedFiltersProps {
  filterGroups: FilterGroup[]
  initialFilters?: FilterState
  onFiltersChange?: (filters: FilterState) => void
  onApplyFilters?: (filters: FilterState) => void
  onResetFilters?: () => void
  showApplyButton?: boolean
  showResetButton?: boolean
  showActiveCount?: boolean
  showPresets?: boolean
  presets?: FilterPreset[]
  layout?: 'vertical' | 'horizontal' | 'grid'
  collapsible?: boolean
  searchable?: boolean
  realTimeUpdate?: boolean
  className?: string
}

export interface FilterPreset {
  id: string
  name: string
  description?: string
  filters: FilterState
  icon?: string
  isDefault?: boolean
}

export function AdvancedFilters({
  filterGroups,
  initialFilters = {},
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
  showApplyButton = false,
  showResetButton = true,
  showActiveCount = true,
  showPresets = false,
  presets = [],
  layout = 'vertical',
  collapsible = true,
  searchable = false,
  realTimeUpdate = true,
  className = ''
}: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(filterGroups.filter(g => g.defaultCollapsed).map(g => g.id))
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [activePreset, setActivePreset] = useState<string | null>(null)
  
  const filtersRef = useRef<HTMLDivElement>(null)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Handle real-time updates
  useEffect(() => {
    if (realTimeUpdate) {
      onFiltersChange?.(filters)
    }
  }, [filters, realTimeUpdate, onFiltersChange])

  // Filter groups based on search
  const filteredGroups = useMemo(() => {
    if (!debouncedSearchTerm) return filterGroups

    return filterGroups.filter(group => 
      group.label.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      group.options?.some(option => 
        option.label.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    )
  }, [filterGroups, debouncedSearchTerm])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (value === null || value === undefined || value === '') return count
      if (Array.isArray(value) && value.length === 0) return count
      if (typeof value === 'object' && Object.keys(value).length === 0) return count
      return count + 1
    }, 0)
  }, [filters])

  const handleFilterChange = useCallback((groupId: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [groupId]: value
    }))
    setActivePreset(null) // Clear active preset when filters change manually
  }, [])

  const handleGroupToggle = useCallback((groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }, [])

  const handleApplyFilters = useCallback(() => {
    onApplyFilters?.(filters)
  }, [filters, onApplyFilters])

  const handleResetFilters = useCallback(() => {
    setFilters({})
    setActivePreset(null)
    onResetFilters?.()
    if (realTimeUpdate) {
      onFiltersChange?.({})
    }
  }, [onResetFilters, onFiltersChange, realTimeUpdate])

  const handlePresetSelect = useCallback((preset: FilterPreset) => {
    setFilters(preset.filters)
    setActivePreset(preset.id)
    if (realTimeUpdate) {
      onFiltersChange?.(preset.filters)
    }
  }, [onFiltersChange, realTimeUpdate])

  const renderFilterGroup = useCallback((group: FilterGroup) => {
    const isCollapsed = collapsedGroups.has(group.id)
    const currentValue = filters[group.id]

    return (
      <div 
        key={group.id}
        className={`advanced-filters__group ${
          isCollapsed ? 'advanced-filters__group--collapsed' : ''
        }`}
      >
        <div 
          className="advanced-filters__group-header"
          onClick={group.collapsible !== false && collapsible ? () => handleGroupToggle(group.id) : undefined}
          role={group.collapsible !== false && collapsible ? 'button' : undefined}
          tabIndex={group.collapsible !== false && collapsible ? 0 : undefined}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && group.collapsible !== false && collapsible) {
              e.preventDefault()
              handleGroupToggle(group.id)
            }
          }}
        >
          <span className="advanced-filters__group-title">
            {group.label}
            {group.required && <span className="advanced-filters__required">*</span>}
          </span>
          
          {currentValue && (
            <span className="advanced-filters__group-indicator">
              {getFilterValueLabel(group, currentValue)}
            </span>
          )}
          
          {group.collapsible !== false && collapsible && (
            <span className={`advanced-filters__group-arrow ${
              isCollapsed ? 'advanced-filters__group-arrow--collapsed' : ''
            }`}>
              ▼
            </span>
          )}
        </div>

        {!isCollapsed && (
          <div className="advanced-filters__group-content">
            {renderFilterControl(group, currentValue)}
          </div>
        )}
      </div>
    )
  }, [filters, collapsedGroups, collapsible, handleGroupToggle])

  const renderFilterControl = useCallback((group: FilterGroup, value: any) => {
    switch (group.type) {
      case 'single':
        return renderSingleSelect(group, value)
      case 'multiple':
        return renderMultipleSelect(group, value)
      case 'range':
        return renderRangeSlider(group, value)
      case 'date':
        return renderDatePicker(group, value)
      case 'rating':
        return renderRatingFilter(group, value)
      case 'price':
        return renderPriceFilter(group, value)
      case 'custom':
        return group.customComponent ? 
          React.createElement(group.customComponent, {
            value,
            onChange: (newValue: any) => handleFilterChange(group.id, newValue),
            options: group.options
          }) : null
      default:
        return null
    }
  }, [handleFilterChange])

  const renderSingleSelect = (group: FilterGroup, value: any) => (
    <div className="advanced-filters__single-select">
      {group.searchable && group.options && group.options.length > 10 && (
        <input
          type="text"
          placeholder={`Search ${group.label.toLowerCase()}...`}
          className="advanced-filters__search-input"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      )}
      
      <div className="advanced-filters__options">
        {group.options?.map(option => (
          <label 
            key={option.id}
            className={`advanced-filters__option ${
              value === option.value ? 'advanced-filters__option--selected' : ''
            } ${option.disabled ? 'advanced-filters__option--disabled' : ''}`}
          >
            <input
              type="radio"
              name={group.id}
              value={option.value}
              checked={value === option.value}
              disabled={option.disabled}
              onChange={() => handleFilterChange(group.id, option.value)}
              className="advanced-filters__option-input"
            />
            
            <span className="advanced-filters__option-content">
              {option.icon && (
                <span className="advanced-filters__option-icon">{option.icon}</span>
              )}
              
              <span className="advanced-filters__option-label">{option.label}</span>
              
              {option.count !== undefined && (
                <span className="advanced-filters__option-count">({option.count})</span>
              )}
            </span>
          </label>
        ))}
      </div>
    </div>
  )

  const renderMultipleSelect = (group: FilterGroup, value: any[] = []) => (
    <div className="advanced-filters__multiple-select">
      {group.searchable && group.options && group.options.length > 10 && (
        <input
          type="text"
          placeholder={`Search ${group.label.toLowerCase()}...`}
          className="advanced-filters__search-input"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      )}
      
      <div className="advanced-filters__options">
        {group.options?.map(option => (
          <label 
            key={option.id}
            className={`advanced-filters__option ${
              value.includes(option.value) ? 'advanced-filters__option--selected' : ''
            } ${option.disabled ? 'advanced-filters__option--disabled' : ''}`}
          >
            <input
              type="checkbox"
              checked={value.includes(option.value)}
              disabled={option.disabled}
              onChange={(e) => {
                const newValue = e.target.checked
                  ? [...value, option.value]
                  : value.filter(v => v !== option.value)
                handleFilterChange(group.id, newValue)
              }}
              className="advanced-filters__option-input"
            />
            
            <span className="advanced-filters__option-content">
              {option.icon && (
                <span className="advanced-filters__option-icon">{option.icon}</span>
              )}
              
              <span className="advanced-filters__option-label">{option.label}</span>
              
              {option.count !== undefined && (
                <span className="advanced-filters__option-count">({option.count})</span>
              )}
            </span>
          </label>
        ))}
      </div>
    </div>
  )

  const renderRangeSlider = (group: FilterGroup, value: [number, number] = [group.min || 0, group.max || 100]) => (
    <div className="advanced-filters__range">
      <div className="advanced-filters__range-inputs">
        <input
          type="number"
          min={group.min}
          max={group.max}
          step={group.step}
          value={value[0]}
          onChange={(e) => handleFilterChange(group.id, [Number(e.target.value), value[1]])}
          className="advanced-filters__range-input"
          placeholder="Min"
        />
        <span className="advanced-filters__range-separator">to</span>
        <input
          type="number"
          min={group.min}
          max={group.max}
          step={group.step}
          value={value[1]}
          onChange={(e) => handleFilterChange(group.id, [value[0], Number(e.target.value)])}
          className="advanced-filters__range-input"
          placeholder="Max"
        />
        {group.unit && (
          <span className="advanced-filters__range-unit">{group.unit}</span>
        )}
      </div>
      
      <div className="advanced-filters__range-slider">
        <input
          type="range"
          min={group.min}
          max={group.max}
          step={group.step}
          value={value[0]}
          onChange={(e) => handleFilterChange(group.id, [Number(e.target.value), value[1]])}
          className="advanced-filters__slider advanced-filters__slider--min"
        />
        <input
          type="range"
          min={group.min}
          max={group.max}
          step={group.step}
          value={value[1]}
          onChange={(e) => handleFilterChange(group.id, [value[0], Number(e.target.value)])}
          className="advanced-filters__slider advanced-filters__slider--max"
        />
      </div>
    </div>
  )

  const renderDatePicker = (group: FilterGroup, value: { from?: string; to?: string } = {}) => (
    <div className="advanced-filters__date">
      <div className="advanced-filters__date-inputs">
        <input
          type="date"
          value={value.from || ''}
          onChange={(e) => handleFilterChange(group.id, { ...value, from: e.target.value })}
          className="advanced-filters__date-input"
          placeholder="From date"
        />
        <span className="advanced-filters__date-separator">to</span>
        <input
          type="date"
          value={value.to || ''}
          onChange={(e) => handleFilterChange(group.id, { ...value, to: e.target.value })}
          className="advanced-filters__date-input"
          placeholder="To date"
        />
      </div>
    </div>
  )

  const renderRatingFilter = (group: FilterGroup, value: number = 0) => (
    <div className="advanced-filters__rating">
      <div className="advanced-filters__rating-stars">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className={`advanced-filters__star ${
              star <= value ? 'advanced-filters__star--active' : ''
            }`}
            onClick={() => handleFilterChange(group.id, star === value ? 0 : star)}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
      </div>
      
      <span className="advanced-filters__rating-label">
        {value > 0 ? `${value}+ stars` : 'Any rating'}
      </span>
    </div>
  )

  const renderPriceFilter = (group: FilterGroup, value: [number, number] = [group.min || 0, group.max || 1000000]) => (
    <div className="advanced-filters__price">
      <div className="advanced-filters__price-inputs">
        <div className="advanced-filters__price-input-wrapper">
          <span className="advanced-filters__price-currency">₫</span>
          <input
            type="number"
            min={group.min}
            max={group.max}
            step={group.step || 1000}
            value={value[0]}
            onChange={(e) => handleFilterChange(group.id, [Number(e.target.value), value[1]])}
            className="advanced-filters__price-input"
            placeholder="Min price"
          />
        </div>
        
        <span className="advanced-filters__price-separator">to</span>
        
        <div className="advanced-filters__price-input-wrapper">
          <span className="advanced-filters__price-currency">₫</span>
          <input
            type="number"
            min={group.min}
            max={group.max}
            step={group.step || 1000}
            value={value[1]}
            onChange={(e) => handleFilterChange(group.id, [value[0], Number(e.target.value)])}
            className="advanced-filters__price-input"
            placeholder="Max price"
          />
        </div>
      </div>
      
      <div className="advanced-filters__price-labels">
        <span>{formatPrice(value[0])}</span>
        <span>{formatPrice(value[1])}</span>
      </div>
    </div>
  )

  const getFilterValueLabel = (group: FilterGroup, value: any): string => {
    switch (group.type) {
      case 'single':
        const option = group.options?.find(o => o.value === value)
        return option?.label || String(value)
      case 'multiple':
        return Array.isArray(value) ? `${value.length} selected` : '0 selected'
      case 'range':
        return Array.isArray(value) ? `${value[0]} - ${value[1]}${group.unit || ''}` : ''
      case 'date':
        return value?.from && value?.to ? `${value.from} - ${value.to}` : 
               value?.from ? `From ${value.from}` :
               value?.to ? `To ${value.to}` : ''
      case 'rating':
        return value > 0 ? `${value}+ stars` : ''
      case 'price':
        return Array.isArray(value) ? `${formatPrice(value[0])} - ${formatPrice(value[1])}` : ''
      default:
        return String(value || '')
    }
  }

  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div ref={filtersRef} className={`advanced-filters advanced-filters--${layout} ${className}`}>
      {searchable && (
        <div className="advanced-filters__search">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search filters..."
            className="advanced-filters__search-input"
          />
        </div>
      )}

      {showPresets && presets.length > 0 && (
        <div className="advanced-filters__presets">
          <div className="advanced-filters__presets-label">Quick Filters:</div>
          <div className="advanced-filters__presets-list">
            {presets.map(preset => (
              <button
                key={preset.id}
                type="button"
                className={`advanced-filters__preset ${
                  activePreset === preset.id ? 'advanced-filters__preset--active' : ''
                }`}
                onClick={() => handlePresetSelect(preset)}
                title={preset.description}
              >
                {preset.icon && <span className="advanced-filters__preset-icon">{preset.icon}</span>}
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="advanced-filters__groups">
        {filteredGroups.map(renderFilterGroup)}
      </div>

      <div className="advanced-filters__actions">
        {showActiveCount && activeFilterCount > 0 && (
          <span className="advanced-filters__active-count">
            {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
          </span>
        )}

        <div className="advanced-filters__buttons">
          {showResetButton && (
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={activeFilterCount === 0}
              className="advanced-filters__reset-button"
            >
              Reset Filters
            </button>
          )}

          {showApplyButton && (
            <button
              type="button"
              onClick={handleApplyFilters}
              className="advanced-filters__apply-button"
            >
              Apply Filters
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Hook for managing filter state
export function useAdvancedFilters(initialFilters: FilterState = {}) {
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)

  const updateFilter = useCallback((groupId: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [groupId]: value
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({})
  }, [])

  const toggleFilterPanel = useCallback(() => {
    setIsFilterPanelOpen(prev => !prev)
  }, [])

  const getActiveFilterCount = useCallback(() => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (value === null || value === undefined || value === '') return count
      if (Array.isArray(value) && value.length === 0) return count
      if (typeof value === 'object' && Object.keys(value).length === 0) return count
      return count + 1
    }, 0)
  }, [filters])

  const hasActiveFilters = useCallback(() => {
    return getActiveFilterCount() > 0
  }, [getActiveFilterCount])

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    isFilterPanelOpen,
    setIsFilterPanelOpen,
    toggleFilterPanel,
    getActiveFilterCount,
    hasActiveFilters
  }
}

export default AdvancedFilters