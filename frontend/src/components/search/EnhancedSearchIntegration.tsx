// CineBook Enhanced Search Integration
// Complete search system with real-time suggestions and advanced filtering

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { 
  Search, 
  Filter, 
  X, 
  Clock, 
  TrendingUp, 
  Star,
  SlidersHorizontal,
  ArrowUpDown,
  Bookmark,
  History
} from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'
import { useLocalStorage } from '../../hooks/useLocalStorage'

// Search Interfaces
interface SearchSuggestion {
  id: string
  type: 'movie' | 'theater' | 'actor' | 'director' | 'genre'
  title: string
  subtitle?: string
  category: string
  popularity: number
  image?: string
}

interface SearchFilters {
  genres: string[]
  languages: string[]
  theaters: string[]
  dateRange: { start: Date | null; end: Date | null }
  priceRange: { min: number; max: number }
  rating: { min: number; max: number }
  sortBy: 'relevance' | 'title' | 'rating' | 'release_date' | 'price'
  sortOrder: 'asc' | 'desc'
  showAvailableOnly: boolean
  location: string
}

interface SearchResult {
  id: string
  type: 'movie' | 'theater' | 'showtime'
  title: string
  subtitle?: string
  description?: string
  image?: string
  rating?: number
  price?: number
  availability?: boolean
  metadata?: Record<string, any>
  highlightedText?: string
}

interface SearchHistory {
  id: string
  query: string
  filters: Partial<SearchFilters>
  timestamp: number
  resultCount: number
}

const DEFAULT_FILTERS: SearchFilters = {
  genres: [],
  languages: [],
  theaters: [],
  dateRange: { start: null, end: null },
  priceRange: { min: 0, max: 500000 },
  rating: { min: 0, max: 5 },
  sortBy: 'relevance',
  sortOrder: 'desc',
  showAvailableOnly: true,
  location: ''
}

const AVAILABLE_GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'Horror', 'Music', 'Mystery',
  'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'
]

const AVAILABLE_LANGUAGES = [
  'Tiếng Việt', 'English', 'Korean', 'Japanese', 'Chinese', 'Thai', 'French'
]

export const EnhancedSearchIntegration: React.FC = () => {
  // State Management
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  
  // Persistent Storage
  const [searchHistory, setSearchHistory] = useLocalStorage<SearchHistory[]>('search_history', [])
  const [savedFilters, setSavedFilters] = useLocalStorage<SearchFilters>('saved_filters', DEFAULT_FILTERS)
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('recent_searches', [])
  const [bookmarkedSearches, setBookmarkedSearches] = useLocalStorage<SearchHistory[]>('bookmarked_searches', [])

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Debounced Query
  const debouncedQuery = useDebounce(query, 300)

  // Popular Searches
  const popularSearches = useMemo(() => [
    'Avengers', 'Spider-Man', 'The Batman', 'Black Widow',
    'Fast & Furious', 'John Wick', 'Mission Impossible'
  ], [])

  // Search Suggestions Effect
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      fetchSuggestions(debouncedQuery)
    } else {
      setSuggestions([])
    }
  }, [debouncedQuery])

  // Fetch Search Suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      if (data.success) {
        setSuggestions(data.data.suggestions || [])
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
      setSuggestions([])
    }
  }, [])

  // Perform Search
  const performSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters) => {
    setIsLoading(true)
    
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        genres: searchFilters.genres.join(','),
        languages: searchFilters.languages.join(','),
        sortBy: searchFilters.sortBy,
        sortOrder: searchFilters.sortOrder
      })

      const response = await fetch(`/api/search?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setResults(data.data.results || [])
        addToSearchHistory(searchQuery, searchFilters, data.data.results?.length || 0)
        updateRecentSearches(searchQuery)
      } else {
        setResults([])
      }
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Add to Search History
  const addToSearchHistory = useCallback((searchQuery: string, searchFilters: SearchFilters, resultCount: number) => {
    const historyEntry: SearchHistory = {
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      query: searchQuery,
      filters: searchFilters,
      timestamp: Date.now(),
      resultCount
    }

    setSearchHistory(prev => {
      const updated = [historyEntry, ...prev.filter(h => h.query !== searchQuery)]
      return updated.slice(0, 50)
    })
  }, [setSearchHistory])

  // Update Recent Searches
  const updateRecentSearches = useCallback((searchQuery: string) => {
    setRecentSearches(prev => {
      const updated = [searchQuery, ...prev.filter(q => q !== searchQuery)]
      return updated.slice(0, 10)
    })
  }, [setRecentSearches])

  // Handle Input Change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setSelectedSuggestionIndex(-1)
    
    if (value.length >= 2) {
      setShowSuggestions(true)
      performSearch(value, filters)
    } else {
      setShowSuggestions(false)
      setResults([])
    }
  }, [filters])

  // Handle Filter Change
  const handleFilterChange = useCallback(<K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters(prev => {
      const updated = { ...prev, [key]: value }
      setSavedFilters(updated)
      if (query.length >= 2) {
        performSearch(query, updated)
      }
      return updated
    })
  }, [setSavedFilters, query])

  // Handle Suggestion Click
  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.title)
    setShowSuggestions(false)
    searchInputRef.current?.blur()
    performSearch(suggestion.title, filters)
  }, [filters])

  // Clear Search
  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setSuggestions([])
    setShowSuggestions(false)
    searchInputRef.current?.focus()
  }, [])

  // Reset Filters
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setSavedFilters(DEFAULT_FILTERS)
  }, [setSavedFilters])

  // Toggle Filter Item
  const toggleFilterItem = useCallback((filterKey: keyof Pick<SearchFilters, 'genres' | 'languages' | 'theaters'>, item: string) => {
    setFilters(prev => {
      const currentArray = prev[filterKey] as string[]
      const updated = currentArray.includes(item)
        ? currentArray.filter(i => i !== item)
        : [...currentArray, item]
      
      const newFilters = { ...prev, [filterKey]: updated }
      setSavedFilters(newFilters)
      return newFilters
    })
  }, [setSavedFilters])

  // Format Price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  // Get Suggestion Icon
  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'movie': return '🎬'
      case 'theater': return '🏢'
      case 'actor': return '👤'
      case 'director': return '🎭'
      case 'genre': return '🎯'
      default: return '🔍'
    }
  }

  return (
    <div className="enhanced-search-integration">
      {/* Search Header */}
      <div className="search-header bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Main Search Bar */}
          <div className="relative">
            <div className="flex items-center bg-gray-50 rounded-lg border border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
              <Search className="ml-3 h-5 w-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder="Tìm phim, rạp, diễn viên..."
                className="flex-1 bg-transparent px-3 py-3 text-gray-900 placeholder-gray-500 focus:outline-none"
                data-testid="movie-search"
              />
              
              {query && (
                <button
                  onClick={clearSearch}
                  className="mr-2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`mr-3 p-2 rounded-md transition-colors ${
                  showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                data-testid="filter-toggle"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </button>
            </div>

            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 ${
                      index === selectedSuggestionIndex ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span className="text-lg">{getSuggestionIcon(suggestion.type)}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{suggestion.title}</div>
                      {suggestion.subtitle && (
                        <div className="text-sm text-gray-500">{suggestion.subtitle}</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 capitalize">{suggestion.category}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {recentSearches.slice(0, 5).map((recentQuery) => (
              <button
                key={recentQuery}
                onClick={() => {
                  setQuery(recentQuery)
                  setShowSuggestions(false)
                  performSearch(recentQuery, filters)
                }}
                className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
              >
                <Clock className="h-3 w-3" />
                <span>{recentQuery}</span>
              </button>
            ))}
            
            {popularSearches.slice(0, 3).map((popular) => (
              <button
                key={popular}
                onClick={() => {
                  setQuery(popular)
                  setShowSuggestions(false)
                  performSearch(popular, filters)
                }}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
              >
                <TrendingUp className="h-3 w-3" />
                <span>{popular}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="filters-panel bg-gray-50 border-b border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Genre Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thể loại</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {AVAILABLE_GENRES.map((genre) => (
                    <label key={genre} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.genres.includes(genre)}
                        onChange={() => toggleFilterItem('genres', genre)}
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{genre}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Language Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngôn ngữ</label>
                <div className="space-y-2">
                  {AVAILABLE_LANGUAGES.map((language) => (
                    <label key={language} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.languages.includes(language)}
                        onChange={() => toggleFilterItem('languages', language)}
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{language}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sắp xếp</label>
                <div className="flex space-x-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value as SearchFilters['sortBy'])}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="relevance">Độ phù hợp</option>
                    <option value="title">Tên phim</option>
                    <option value="rating">Đánh giá</option>
                    <option value="release_date">Ngày phát hành</option>
                    <option value="price">Giá vé</option>
                  </select>
                  <button
                    onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.showAvailableOnly}
                  onChange={(e) => handleFilterChange('showAvailableOnly', e.target.checked)}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Chỉ hiển thị suất chiếu còn vé</span>
              </label>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Xóa bộ lọc
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="search-results p-4">
        <div className="max-w-4xl mx-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Đang tìm kiếm...</span>
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="text-center py-8">
              <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy kết quả</h3>
              <p className="text-gray-600 mb-4">Thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc</p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Tìm thấy {results.length} kết quả
                  {query && <span className="text-gray-600"> cho "{query}"</span>}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="movie-grid">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    data-testid="movie-card"
                  >
                    {result.image && (
                      <img
                        src={result.image}
                        alt={result.title}
                        className="w-full h-48 object-cover rounded-md mb-3"
                        data-testid="movie-poster"
                      />
                    )}
                    
                    <h3 className="font-semibold text-gray-900 mb-1" data-testid="movie-title">
                      {result.highlightedText ? (
                        <span dangerouslySetInnerHTML={{ __html: result.highlightedText }} />
                      ) : (
                        result.title
                      )}
                    </h3>
                    
                    {result.subtitle && (
                      <p className="text-sm text-gray-600 mb-2">{result.subtitle}</p>
                    )}
                    
                    {result.description && (
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{result.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {result.rating && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">{result.rating}</span>
                          </div>
                        )}
                        
                        {result.price && (
                          <span className="text-sm text-gray-600">{formatPrice(result.price)}</span>
                        )}
                      </div>
                      
                      <button
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                        data-testid="book-showtime"
                      >
                        {result.type === 'movie' ? 'Đặt vé' : 'Xem chi tiết'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search History */}
          {!query && !isLoading && searchHistory.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử tìm kiếm</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchHistory.slice(0, 6).map((historyItem) => (
                  <div
                    key={historyItem.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => {
                          setQuery(historyItem.query)
                          performSearch(historyItem.query, { ...filters, ...historyItem.filters })
                        }}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {historyItem.query}
                      </button>
                      
                      <button
                        onClick={() => {
                          const isBookmarked = bookmarkedSearches.some(b => b.id === historyItem.id)
                          if (isBookmarked) {
                            setBookmarkedSearches(prev => prev.filter(b => b.id !== historyItem.id))
                          } else {
                            setBookmarkedSearches(prev => [...prev, historyItem].slice(0, 20))
                          }
                        }}
                        className={`p-1 rounded ${
                          bookmarkedSearches.some(b => b.id === historyItem.id)
                            ? 'text-yellow-500'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <Bookmark className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{historyItem.resultCount} kết quả</span>
                      <span>{new Date(historyItem.timestamp).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EnhancedSearchIntegration