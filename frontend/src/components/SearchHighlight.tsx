import React, { useMemo, useCallback } from 'react'

export interface SearchHighlightOptions {
  caseSensitive?: boolean
  wholeWords?: boolean
  maxHighlights?: number
  highlightClassName?: string
  wrapperClassName?: string
  fuzzyMatching?: boolean
  multipleTerms?: boolean
  termSeparator?: string
}

interface SearchHighlightProps {
  text: string
  searchTerms: string | string[]
  options?: SearchHighlightOptions
  className?: string
  onClick?: (highlightedText: string, index: number) => void
  onHighlightHover?: (highlightedText: string, index: number) => void
}

const DEFAULT_OPTIONS: Required<SearchHighlightOptions> = {
  caseSensitive: false,
  wholeWords: false,
  maxHighlights: 100,
  highlightClassName: 'search-highlight',
  wrapperClassName: 'search-highlight-wrapper',
  fuzzyMatching: false,
  multipleTerms: true,
  termSeparator: ' '
}

export function SearchHighlight({
  text,
  searchTerms,
  options = {},
  className = '',
  onClick,
  onHighlightHover
}: SearchHighlightProps) {
  const config = { ...DEFAULT_OPTIONS, ...options }

  // Process search terms
  const processedTerms = useMemo(() => {
    if (!searchTerms) return []

    let terms: string[] = []
    
    if (Array.isArray(searchTerms)) {
      terms = searchTerms
    } else if (config.multipleTerms) {
      terms = searchTerms.split(config.termSeparator).filter(term => term.trim())
    } else {
      terms = [searchTerms]
    }

    // Filter out empty terms and sort by length (longest first for better matching)
    return terms
      .filter(term => term.trim().length > 0)
      .sort((a, b) => b.length - a.length)
      .slice(0, config.maxHighlights)
  }, [searchTerms, config.multipleTerms, config.termSeparator, config.maxHighlights])

  // Generate highlighted text
  const highlightedContent = useMemo(() => {
    if (!text || processedTerms.length === 0) {
      return [{ text, isHighlight: false, index: -1 }]
    }

    return highlightText(text, processedTerms, config)
  }, [text, processedTerms, config])

  const handleHighlightClick = useCallback((highlightedText: string, index: number, event: React.MouseEvent) => {
    event.stopPropagation()
    onClick?.(highlightedText, index)
  }, [onClick])

  const handleHighlightHover = useCallback((highlightedText: string, index: number) => {
    onHighlightHover?.(highlightedText, index)
  }, [onHighlightHover])

  return (
    <span className={`${config.wrapperClassName} ${className}`}>
      {highlightedContent.map((segment, index) => (
        segment.isHighlight ? (
          <mark
            key={index}
            className={config.highlightClassName}
            onClick={onClick ? (e) => handleHighlightClick(segment.text, segment.index, e) : undefined}
            onMouseEnter={onHighlightHover ? () => handleHighlightHover(segment.text, segment.index) : undefined}
            data-highlight-index={segment.index}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleHighlightClick(segment.text, segment.index, e as any)
              }
            } : undefined}
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      ))}
    </span>
  )
}

// Function to highlight text based on search terms
function highlightText(
  text: string,
  terms: string[],
  options: Required<SearchHighlightOptions>
): Array<{ text: string; isHighlight: boolean; index: number }> {
  if (!text || terms.length === 0) {
    return [{ text, isHighlight: false, index: -1 }]
  }

  let workingText = text
  let segments: Array<{ text: string; isHighlight: boolean; index: number }> = []
  let currentOffset = 0
  let highlightIndex = 0

  // Create a map to track all matches
  const matches: Array<{ start: number; end: number; term: string; index: number }> = []

  // Find all matches for all terms
  terms.forEach(term => {
    if (!term.trim()) return

    const searchText = options.caseSensitive ? workingText : workingText.toLowerCase()
    const searchTerm = options.caseSensitive ? term : term.toLowerCase()

    if (options.fuzzyMatching) {
      // Fuzzy matching implementation
      const fuzzyMatches = findFuzzyMatches(searchText, searchTerm, options.wholeWords)
      fuzzyMatches.forEach(match => {
        matches.push({
          start: match.start,
          end: match.end,
          term: workingText.substring(match.start, match.end),
          index: highlightIndex++
        })
      })
    } else {
      // Exact matching
      const regex = options.wholeWords 
        ? new RegExp(`\\b${escapeRegExp(searchTerm)}\\b`, options.caseSensitive ? 'g' : 'gi')
        : new RegExp(escapeRegExp(searchTerm), options.caseSensitive ? 'g' : 'gi')

      let match
      while ((match = regex.exec(searchText)) !== null && matches.length < options.maxHighlights) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          term: workingText.substring(match.index, match.index + match[0].length),
          index: highlightIndex++
        })
      }
    }
  })

  // Sort matches by start position and remove overlaps
  matches.sort((a, b) => a.start - b.start)
  const nonOverlappingMatches = removeOverlaps(matches)

  // Build segments
  let lastEnd = 0
  
  nonOverlappingMatches.forEach(match => {
    // Add text before the match
    if (match.start > lastEnd) {
      segments.push({
        text: workingText.substring(lastEnd, match.start),
        isHighlight: false,
        index: -1
      })
    }

    // Add the highlighted match
    segments.push({
      text: match.term,
      isHighlight: true,
      index: match.index
    })

    lastEnd = match.end
  })

  // Add remaining text
  if (lastEnd < workingText.length) {
    segments.push({
      text: workingText.substring(lastEnd),
      isHighlight: false,
      index: -1
    })
  }

  return segments.length > 0 ? segments : [{ text: workingText, isHighlight: false, index: -1 }]
}

// Remove overlapping matches, keeping the first ones
function removeOverlaps(matches: Array<{ start: number; end: number; term: string; index: number }>) {
  if (matches.length === 0) return matches

  const result = [matches[0]]
  
  for (let i = 1; i < matches.length; i++) {
    const current = matches[i]
    const last = result[result.length - 1]
    
    // If current match doesn't overlap with the last one, add it
    if (current.start >= last.end) {
      result.push(current)
    }
  }
  
  return result
}

// Fuzzy matching implementation
function findFuzzyMatches(
  text: string, 
  pattern: string, 
  wholeWords: boolean
): Array<{ start: number; end: number }> {
  const matches: Array<{ start: number; end: number }> = []
  const patternLength = pattern.length
  
  if (patternLength === 0) return matches

  for (let i = 0; i <= text.length - patternLength; i++) {
    const substring = text.substring(i, i + patternLength)
    const similarity = calculateSimilarity(substring, pattern)
    
    // Consider it a match if similarity is above threshold (80%)
    if (similarity >= 0.8) {
      if (wholeWords) {
        // Check if it's a whole word
        const beforeChar = i > 0 ? text[i - 1] : ' '
        const afterChar = i + patternLength < text.length ? text[i + patternLength] : ' '
        
        if (/\w/.test(beforeChar) || /\w/.test(afterChar)) {
          continue // Skip if not a whole word
        }
      }
      
      matches.push({ start: i, end: i + patternLength })
    }
  }
  
  return matches
}

// Calculate string similarity (Jaro-Winkler distance)
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0
  if (str1.length === 0 || str2.length === 0) return 0.0

  const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1
  if (matchWindow < 0) return 0.0

  const str1Matches = new Array(str1.length).fill(false)
  const str2Matches = new Array(str2.length).fill(false)

  let matches = 0
  let transpositions = 0

  // Find matches
  for (let i = 0; i < str1.length; i++) {
    const start = Math.max(0, i - matchWindow)
    const end = Math.min(i + matchWindow + 1, str2.length)

    for (let j = start; j < end; j++) {
      if (str2Matches[j] || str1[i] !== str2[j]) continue
      str1Matches[i] = true
      str2Matches[j] = true
      matches++
      break
    }
  }

  if (matches === 0) return 0.0

  // Find transpositions
  let k = 0
  for (let i = 0; i < str1.length; i++) {
    if (!str1Matches[i]) continue
    while (!str2Matches[k]) k++
    if (str1[i] !== str2[k]) transpositions++
    k++
  }

  return (matches / str1.length + matches / str2.length + (matches - transpositions / 2) / matches) / 3.0
}

// Escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Advanced highlight component with multiple search terms
interface MultiTermSearchHighlightProps {
  text: string
  searchTerms: Array<{ term: string; className?: string; color?: string }>
  options?: SearchHighlightOptions
  className?: string
}

export function MultiTermSearchHighlight({
  text,
  searchTerms,
  options = {},
  className = ''
}: MultiTermSearchHighlightProps) {
  const config = { ...DEFAULT_OPTIONS, ...options }

  const highlightedContent = useMemo(() => {
    if (!text || searchTerms.length === 0) {
      return [{ text, isHighlight: false, index: -1, className: '', color: '' }]
    }

    return highlightMultipleTerms(text, searchTerms, config)
  }, [text, searchTerms, config])

  return (
    <span className={`${config.wrapperClassName} ${className}`}>
      {highlightedContent.map((segment, index) => (
        segment.isHighlight ? (
          <mark
            key={index}
            className={`${config.highlightClassName} ${segment.className || ''}`}
            style={segment.color ? { backgroundColor: segment.color } : undefined}
            data-highlight-index={segment.index}
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      ))}
    </span>
  )
}

// Highlight multiple terms with different styling
function highlightMultipleTerms(
  text: string,
  searchTerms: Array<{ term: string; className?: string; color?: string }>,
  options: Required<SearchHighlightOptions>
): Array<{ text: string; isHighlight: boolean; index: number; className?: string; color?: string }> {
  if (!text || searchTerms.length === 0) {
    return [{ text, isHighlight: false, index: -1 }]
  }

  let segments: Array<{ text: string; isHighlight: boolean; index: number; className?: string; color?: string }> = []
  let matches: Array<{ 
    start: number; 
    end: number; 
    term: string; 
    index: number; 
    className?: string; 
    color?: string 
  }> = []
  let highlightIndex = 0

  // Find matches for each term
  searchTerms.forEach(({ term, className, color }) => {
    if (!term.trim()) return

    const searchText = options.caseSensitive ? text : text.toLowerCase()
    const searchTerm = options.caseSensitive ? term : term.toLowerCase()

    const regex = options.wholeWords 
      ? new RegExp(`\\b${escapeRegExp(searchTerm)}\\b`, options.caseSensitive ? 'g' : 'gi')
      : new RegExp(escapeRegExp(searchTerm), options.caseSensitive ? 'g' : 'gi')

    let match
    while ((match = regex.exec(searchText)) !== null && matches.length < options.maxHighlights) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        term: text.substring(match.index, match.index + match[0].length),
        index: highlightIndex++,
        className,
        color
      })
    }
  })

  // Sort and remove overlaps
  matches.sort((a, b) => a.start - b.start)
  const nonOverlappingMatches = removeOverlaps(matches)

  // Build segments
  let lastEnd = 0
  
  nonOverlappingMatches.forEach(match => {
    // Add text before the match
    if (match.start > lastEnd) {
      segments.push({
        text: text.substring(lastEnd, match.start),
        isHighlight: false,
        index: -1
      })
    }

    // Add the highlighted match
    segments.push({
      text: match.term,
      isHighlight: true,
      index: match.index,
      className: match.className,
      color: match.color
    })

    lastEnd = match.end
  })

  // Add remaining text
  if (lastEnd < text.length) {
    segments.push({
      text: text.substring(lastEnd),
      isHighlight: false,
      index: -1
    })
  }

  return segments.length > 0 ? segments : [{ text, isHighlight: false, index: -1 }]
}

// Hook for search highlighting
export function useSearchHighlight(searchTerms: string | string[], options?: SearchHighlightOptions) {
  const config = { ...DEFAULT_OPTIONS, ...options }

  const highlightText = useCallback((text: string) => {
    if (!text || !searchTerms) return text

    const terms = Array.isArray(searchTerms) ? searchTerms : [searchTerms]
    const processedTerms = terms
      .filter(term => term.trim().length > 0)
      .sort((a, b) => b.length - a.length)

    if (processedTerms.length === 0) return text

    let result = text
    let offset = 0

    processedTerms.forEach(term => {
      const searchText = config.caseSensitive ? result : result.toLowerCase()
      const searchTerm = config.caseSensitive ? term : term.toLowerCase()

      const regex = config.wholeWords 
        ? new RegExp(`\\b${escapeRegExp(searchTerm)}\\b`, config.caseSensitive ? 'g' : 'gi')
        : new RegExp(escapeRegExp(searchTerm), config.caseSensitive ? 'g' : 'gi')

      result = result.replace(regex, `<mark class="${config.highlightClassName}">$&</mark>`)
    })

    return result
  }, [searchTerms, config])

  const getHighlightCount = useCallback((text: string) => {
    if (!text || !searchTerms) return 0

    const terms = Array.isArray(searchTerms) ? searchTerms : [searchTerms]
    let count = 0

    terms.forEach(term => {
      if (!term.trim()) return

      const searchText = config.caseSensitive ? text : text.toLowerCase()
      const searchTerm = config.caseSensitive ? term : term.toLowerCase()

      const regex = config.wholeWords 
        ? new RegExp(`\\b${escapeRegExp(searchTerm)}\\b`, config.caseSensitive ? 'g' : 'gi')
        : new RegExp(escapeRegExp(searchTerm), config.caseSensitive ? 'g' : 'gi')

      const matches = searchText.match(regex)
      if (matches) count += matches.length
    })

    return count
  }, [searchTerms, config])

  return {
    highlightText,
    getHighlightCount
  }
}

export default SearchHighlight