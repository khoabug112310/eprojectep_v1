import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useDebounce } from '../hooks/useDebounce'

export interface SearchSuggestion {
  id: string
  text: string
  type: 'movie' | 'actor' | 'director' | 'genre' | 'theater' | 'keyword' | 'history'
  category?: string
  metadata?: Record<string, any>
  weight?: number
  isRecent?: boolean
  isTrending?: boolean
}

export interface SearchSuggestionsOptions {
  minChars?: number
  maxSuggestions?: number
  debounceMs?: number
  showCategories?: boolean
  enableHistory?: boolean
  enableTrending?: boolean
  enableTypoTolerance?: boolean
  prioritizeRecent?: boolean
  customCategories?: string[]
}

interface SearchSuggestionsProps {
  query: string
  suggestions: SearchSuggestion[]
  isLoading?: boolean
  isVisible?: boolean
  options?: SearchSuggestionsOptions
  placeholder?: string
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void
  onSuggestionHover?: (suggestion: SearchSuggestion | null) => void
  onQueryChange?: (query: string) => void
  onSearch?: (query: string) => void
  className?: string
}

const DEFAULT_OPTIONS: Required<SearchSuggestionsOptions> = {
  minChars: 2,
  maxSuggestions: 10,
  debounceMs: 300,
  showCategories: true,
  enableHistory: true,
  enableTrending: true,
  enableTypoTolerance: true,
  prioritizeRecent: true,
  customCategories: []
}

export function SearchSuggestions({
  query,
  suggestions = [],
  isLoading = false,
  isVisible = false,
  options = {},
  placeholder = 'Search movies, actors, genres...',
  onSuggestionSelect,
  onSuggestionHover,
  onQueryChange,
  onSearch,
  className = ''
}: SearchSuggestionsProps) {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [highlightedSuggestion, setHighlightedSuggestion] = useState<SearchSuggestion | null>(null)
  const [internalQuery, setInternalQuery] = useState(query)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionRefs = useRef<(HTMLElement | null)[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(internalQuery, config.debounceMs)

  // Sync internal query with prop
  useEffect(() => {
    if (query !== internalQuery) {
      setInternalQuery(query)
    }
  }, [query])

  // Handle query change
  useEffect(() => {
    if (debouncedQuery !== query) {
      onQueryChange?.(debouncedQuery)
    }
  }, [debouncedQuery, onQueryChange])

  // Load search history from localStorage
  useEffect(() => {
    if (config.enableHistory) {
      const saved = localStorage.getItem('cinebook-search-history')
      if (saved) {
        try {
          setSearchHistory(JSON.parse(saved))
        } catch (error) {
          console.warn('Failed to load search history:', error)
        }
      }
    }
  }, [config.enableHistory])

  // Process and filter suggestions
  const processedSuggestions = useMemo(() => {
    let filtered = suggestions

    // Filter by minimum characters
    if (debouncedQuery.length < config.minChars) {
      return []
    }

    // Add search history suggestions
    if (config.enableHistory && searchHistory.length > 0) {
      const historySuggestions: SearchSuggestion[] = searchHistory
        .filter(item => 
          item.toLowerCase().includes(debouncedQuery.toLowerCase()) &&
          item.toLowerCase() !== debouncedQuery.toLowerCase()
        )
        .slice(0, 3)
        .map((item, index) => ({
          id: `history-${index}`,
          text: item,
          type: 'history' as const,
          isRecent: true,
          weight: 10
        }))

      filtered = [...historySuggestions, ...filtered]
    }

    // Apply typo tolerance (basic implementation)
    if (config.enableTypoTolerance) {
      const typoTolerant = filtered.filter(suggestion => {
        const similarity = calculateSimilarity(debouncedQuery, suggestion.text)
        return similarity > 0.6 // 60% similarity threshold
      })
      filtered = typoTolerant
    }

    // Sort by relevance
    filtered.sort((a, b) => {
      // Prioritize exact matches
      const aExact = a.text.toLowerCase().startsWith(debouncedQuery.toLowerCase())
      const bExact = b.text.toLowerCase().startsWith(debouncedQuery.toLowerCase())
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1

      // Prioritize recent searches
      if (config.prioritizeRecent) {
        if (a.isRecent && !b.isRecent) return -1
        if (!a.isRecent && b.isRecent) return 1
      }

      // Sort by weight
      const aWeight = a.weight || 0
      const bWeight = b.weight || 0
      if (aWeight !== bWeight) return bWeight - aWeight

      // Sort by type priority
      const typePriority = {
        history: 10,
        movie: 9,
        actor: 8,
        director: 7,
        theater: 6,
        genre: 5,
        keyword: 4
      }
      const aPriority = typePriority[a.type] || 0
      const bPriority = typePriority[b.type] || 0
      return bPriority - aPriority
    })

    // Group by category if enabled
    if (config.showCategories) {
      const grouped = filtered.reduce((acc, suggestion) => {
        const category = suggestion.category || suggestion.type
        if (!acc[category]) acc[category] = []
        acc[category].push(suggestion)
        return acc
      }, {} as Record<string, SearchSuggestion[]>)

      // Flatten while maintaining category order
      const ordered: SearchSuggestion[] = []
      const categories = ['history', 'movie', 'actor', 'director', 'theater', 'genre', 'keyword', ...config.customCategories]
      
      for (const category of categories) {
        if (grouped[category]) {
          ordered.push(...grouped[category])
        }
      }

      // Add any remaining categories
      for (const [category, items] of Object.entries(grouped)) {
        if (!categories.includes(category)) {
          ordered.push(...items)
        }
      }

      filtered = ordered
    }

    return filtered.slice(0, config.maxSuggestions)
  }, [suggestions, debouncedQuery, config, searchHistory])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isDropdownOpen || processedSuggestions.length === 0) {
      if (event.key === 'Enter') {
        handleSearch()
      }
      return
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setSelectedIndex(prev => {
          const next = prev < processedSuggestions.length - 1 ? prev + 1 : 0
          const suggestion = processedSuggestions[next]
          setHighlightedSuggestion(suggestion)
          onSuggestionHover?.(suggestion)
          
          // Scroll into view
          suggestionRefs.current[next]?.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth'
          })
          
          return next
        })
        break

      case 'ArrowUp':
        event.preventDefault()
        setSelectedIndex(prev => {
          const next = prev > 0 ? prev - 1 : processedSuggestions.length - 1
          const suggestion = processedSuggestions[next]
          setHighlightedSuggestion(suggestion)
          onSuggestionHover?.(suggestion)
          
          // Scroll into view
          suggestionRefs.current[next]?.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth'
          })
          
          return next
        })
        break

      case 'Enter':
        event.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < processedSuggestions.length) {
          handleSuggestionSelect(processedSuggestions[selectedIndex])
        } else {
          handleSearch()
        }
        break

      case 'Escape':
        event.preventDefault()
        setIsDropdownOpen(false)
        setSelectedIndex(-1)
        setHighlightedSuggestion(null)
        inputRef.current?.blur()
        break

      case 'Tab':
        if (selectedIndex >= 0 && selectedIndex < processedSuggestions.length) {
          event.preventDefault()
          handleSuggestionSelect(processedSuggestions[selectedIndex])
        }
        break
    }
  }, [isDropdownOpen, processedSuggestions, selectedIndex, onSuggestionHover])

  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setInternalQuery(suggestion.text)
    onQueryChange?.(suggestion.text)
    onSuggestionSelect?.(suggestion)
    setIsDropdownOpen(false)
    setSelectedIndex(-1)
    setHighlightedSuggestion(null)

    // Add to search history
    if (config.enableHistory && suggestion.type !== 'history') {
      const newHistory = [suggestion.text, ...searchHistory.filter(item => item !== suggestion.text)]
        .slice(0, 10) // Keep only last 10 searches
      setSearchHistory(newHistory)
      localStorage.setItem('cinebook-search-history', JSON.stringify(newHistory))
    }
  }, [onQueryChange, onSuggestionSelect, config.enableHistory, searchHistory])

  const handleSearch = useCallback(() => {
    onSearch?.(internalQuery)
    setIsDropdownOpen(false)
    setSelectedIndex(-1)

    // Add to search history
    if (config.enableHistory && internalQuery.trim()) {
      const newHistory = [internalQuery.trim(), ...searchHistory.filter(item => item !== internalQuery.trim())]
        .slice(0, 10)
      setSearchHistory(newHistory)
      localStorage.setItem('cinebook-search-history', JSON.stringify(newHistory))
    }
  }, [onSearch, internalQuery, config.enableHistory, searchHistory])

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setInternalQuery(value)
    setSelectedIndex(-1)
    setHighlightedSuggestion(null)
    
    if (value.length >= config.minChars) {
      setIsDropdownOpen(true)
    } else {
      setIsDropdownOpen(false)
    }
  }, [config.minChars])

  const handleInputFocus = useCallback(() => {
    if (internalQuery.length >= config.minChars || processedSuggestions.length > 0) {
      setIsDropdownOpen(true)
    }
  }, [internalQuery.length, config.minChars, processedSuggestions.length])

  const handleInputBlur = useCallback((event: React.FocusEvent) => {
    // Delay hiding to allow click on suggestions
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsDropdownOpen(false)
        setSelectedIndex(-1)
        setHighlightedSuggestion(null)
        onSuggestionHover?.(null)
      }
    }, 150)
  }, [onSuggestionHover])

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    const icons = {
      movie: '🎬',
      actor: '👤',
      director: '🎭',
      genre: '🏷️',
      theater: '🏢',
      keyword: '🔍',
      history: '🕒'
    }
    return icons[type] || '🔍'
  }

  const getCategoryLabel = (category: string) => {
    const labels = {
      history: 'Recent Searches',
      movie: 'Movies',
      actor: 'Actors',
      director: 'Directors',
      genre: 'Genres',
      theater: 'Theaters',
      keyword: 'Keywords'
    }
    return labels[category as keyof typeof labels] || category.charAt(0).toUpperCase() + category.slice(1)
  }

  const renderSuggestion = (suggestion: SearchSuggestion, index: number) => {
    const isSelected = index === selectedIndex
    const isHighlighted = highlightedSuggestion?.id === suggestion.id

    return (
      <div
        key={suggestion.id}
        ref={el => suggestionRefs.current[index] = el}
        className={`search-suggestions__item ${
          isSelected ? 'search-suggestions__item--selected' : ''
        } ${isHighlighted ? 'search-suggestions__item--highlighted' : ''}`}
        onClick={() => handleSuggestionSelect(suggestion)}
        onMouseEnter={() => {
          setSelectedIndex(index)
          setHighlightedSuggestion(suggestion)
          onSuggestionHover?.(suggestion)
        }}
        onMouseLeave={() => {
          setHighlightedSuggestion(null)
          onSuggestionHover?.(null)
        }}
        role="option"
        aria-selected={isSelected}
      >
        <span className="search-suggestions__icon">
          {getSuggestionIcon(suggestion.type)}
        </span>
        
        <div className="search-suggestions__content">
          <div className="search-suggestions__text">
            <HighlightedText text={suggestion.text} highlight={debouncedQuery} />
          </div>
          
          {suggestion.metadata?.subtitle && (
            <div className="search-suggestions__subtitle">
              {suggestion.metadata.subtitle}
            </div>
          )}
        </div>

        <div className="search-suggestions__badges">
          {suggestion.isTrending && (
            <span className="search-suggestions__badge search-suggestions__badge--trending">
              🔥 Trending
            </span>
          )}
          
          {suggestion.isRecent && (
            <span className="search-suggestions__badge search-suggestions__badge--recent">
              Recent
            </span>
          )}
        </div>
      </div>
    )
  }

  const groupedSuggestions = useMemo(() => {
    if (!config.showCategories) {
      return [{ category: '', suggestions: processedSuggestions }]
    }

    const groups: { category: string; suggestions: SearchSuggestion[] }[] = []
    let currentCategory = ''
    let currentGroup: SearchSuggestion[] = []

    for (const suggestion of processedSuggestions) {
      const category = suggestion.category || suggestion.type
      
      if (category !== currentCategory) {
        if (currentGroup.length > 0) {
          groups.push({ category: currentCategory, suggestions: currentGroup })
        }
        currentCategory = category
        currentGroup = [suggestion]
      } else {
        currentGroup.push(suggestion)
      }
    }

    if (currentGroup.length > 0) {
      groups.push({ category: currentCategory, suggestions: currentGroup })
    }

    return groups
  }, [processedSuggestions, config.showCategories])

  const shouldShowDropdown = isDropdownOpen && (processedSuggestions.length > 0 || isLoading) && (isVisible !== false)

  return (
    <div className={`search-suggestions ${className}`}>
      <div className="search-suggestions__input-container">
        <input
          ref={inputRef}
          type="text"
          value={internalQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="search-suggestions__input"
          autoComplete="off"
          role="combobox"
          aria-expanded={shouldShowDropdown}
          aria-haspopup="listbox"
          aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
        />
        
        {(isLoading || internalQuery) && (
          <div className="search-suggestions__input-actions">
            {isLoading && (
              <div className="search-suggestions__loading">
                <div className="search-suggestions__spinner" />
              </div>
            )}
            
            {internalQuery && (
              <button
                className="search-suggestions__clear"
                onClick={() => {
                  setInternalQuery('')
                  onQueryChange?.('')
                  setIsDropdownOpen(false)
                  inputRef.current?.focus()
                }}
                aria-label="Clear search"
                type="button"
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>

      {shouldShowDropdown && (
        <div
          ref={dropdownRef}
          className="search-suggestions__dropdown"
          role="listbox"
          aria-label="Search suggestions"
        >
          {isLoading && processedSuggestions.length === 0 ? (
            <div className="search-suggestions__loading-state">
              <div className="search-suggestions__spinner" />
              <span>Searching...</span>
            </div>
          ) : (
            groupedSuggestions.map((group, groupIndex) => (
              <div key={group.category || 'default'} className="search-suggestions__group">
                {config.showCategories && group.category && (
                  <div className="search-suggestions__category">
                    {getCategoryLabel(group.category)}
                  </div>
                )}
                
                {group.suggestions.map((suggestion, suggestionIndex) => {
                  const globalIndex = groupedSuggestions
                    .slice(0, groupIndex)
                    .reduce((acc, g) => acc + g.suggestions.length, 0) + suggestionIndex
                  
                  return renderSuggestion(suggestion, globalIndex)
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// Component for highlighting matched text
interface HighlightedTextProps {
  text: string
  highlight: string
}

function HighlightedText({ text, highlight }: HighlightedTextProps) {
  if (!highlight.trim()) {
    return <span>{text}</span>
  }

  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)

  return (
    <span>
      {parts.map((part, index) => 
        regex.test(part) ? (
          <mark key={index} className="search-suggestions__highlight">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  )
}

// Utility function for similarity calculation (Levenshtein distance)
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null))

  for (let i = 0; i <= len1; i++) matrix[0][i] = i
  for (let j = 0; j <= len2; j++) matrix[j][0] = j

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }

  const distance = matrix[len2][len1]
  const maxLength = Math.max(len1, len2)
  return maxLength === 0 ? 1 : (maxLength - distance) / maxLength
}

// Hook for search suggestions functionality
export function useSearchSuggestions(options?: SearchSuggestionsOptions) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const config = { ...DEFAULT_OPTIONS, ...options }

  const generateSuggestions = useCallback(async (
    query: string,
    searchFunction: (query: string) => Promise<SearchSuggestion[]>
  ) => {
    if (query.length < config.minChars) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const results = await searchFunction(query)
      setSuggestions(results)
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [config.minChars])

  const clearSuggestions = useCallback(() => {
    setSuggestions([])
    setIsLoading(false)
  }, [])

  return {
    suggestions,
    isLoading,
    generateSuggestions,
    clearSuggestions
  }
}

export default SearchSuggestions