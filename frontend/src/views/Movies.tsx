import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MovieListSkeleton } from '../components/Skeleton'
import api from '../services/api'
import './Movies.css'

interface Movie {
  id: number
  title: string
  genre: string
  duration: number
  rating: number
  status: 'now_showing' | 'coming_soon' | 'ended'
  poster_url?: string
  synopsis?: string
  release_date?: string
  language?: string
  director?: string
  cast?: string[]
  age_rating?: string
  average_rating?: number
}

export default function Movies() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Search and filters - Initialize with empty strings to prevent controlled/uncontrolled warnings
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [sortBy, setSortBy] = useState('title')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const itemsPerPage = 12

  useEffect(() => {
    fetchMovies()
  }, [currentPage, searchTerm, selectedGenre, selectedStatus, selectedLanguage, sortBy, sortOrder])

  const fetchMovies = async () => {
    setLoading(true)
    setError(null)
    
    // Sample data as fallback
    const sampleMovies: Movie[] = [
      {
        id: 1,
        title: "Avengers: Endgame",
        genre: "Action",
        duration: 181,
        rating: 4.8,
        average_rating: 4.8,
        status: "now_showing",
        poster_url: "https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_UX182_CR0,0,182,268_AL_.jpg",
        synopsis: "After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more.",
        language: "English",
        director: "Anthony Russo, Joe Russo",
        age_rating: "T13",
        release_date: "2019-04-26"
      },
      {
        id: 2,
        title: "Spider-Man: No Way Home",
        genre: "Action",
        duration: 148,
        rating: 4.7,
        average_rating: 4.7,
        status: "now_showing",
        poster_url: "https://m.media-amazon.com/images/M/MV5BZWMyYzFjYTYtNTRjYi00OGExLWE2YzgtOGRmYjAxZTU3NzBiXkEyXkFqcGdeQXVyMzQ0MzA0NTM@._V1_UX182_CR0,0,182,268_AL_.jpg",
        synopsis: "Peter Parker's secret identity is revealed to the entire world. Desperate for help, Peter turns to Doctor Strange.",
        language: "English",
        director: "Jon Watts",
        age_rating: "T13",
        release_date: "2021-12-17"
      }
    ]
    
    try {
      const params: Record<string, string> = {
        page: currentPage.toString(),
        per_page: itemsPerPage.toString(),
        sort_by: sortBy,
        sort_order: sortOrder
      }

      if (searchTerm) params.search = searchTerm
      if (selectedGenre) params.genre = selectedGenre
      if (selectedStatus) params.status = selectedStatus
      if (selectedLanguage) params.language = selectedLanguage

      const response = await api.get('/movies', { params })
      
      if (response.data?.success) {
        // Handle different possible response structures
        let moviesData: any[] = []
        let paginationMeta: any = {}
        
        // Check if response.data.data is paginated (Laravel paginated response)
        if (response.data.data && typeof response.data.data === 'object' && response.data.data.data) {
          // Paginated response: response.data.data.data contains the actual array
          moviesData = Array.isArray(response.data.data.data) ? response.data.data.data : []
          paginationMeta = response.data.data
          console.log('Movies: Successfully loaded paginated API response', { 
            totalItems: moviesData.length, 
            currentPage: paginationMeta.current_page,
            totalPages: paginationMeta.last_page,
            totalRecords: paginationMeta.total
          })
        } else if (Array.isArray(response.data.data)) {
          // Direct array response
          moviesData = response.data.data
          console.log('Movies: Handling direct array API response', { totalItems: moviesData.length })
        } else {
          console.warn('Movies: API returned non-array movies data:', typeof response.data.data, response.data.data)
          moviesData = []
        }
        
        // Process movies data to ensure compatibility
        const processedMoviesData = moviesData.map((movie: any) => {
          // Handle genre field - it might be a JSON string from database
          let genreText = 'Unknown'
          if (movie.genre) {
            if (Array.isArray(movie.genre)) {
              genreText = movie.genre.join(', ')
            } else if (typeof movie.genre === 'string') {
              try {
                // Try to parse JSON string from database
                const parsed = JSON.parse(movie.genre)
                genreText = Array.isArray(parsed) ? parsed.join(', ') : movie.genre
              } catch {
                // If not JSON, use as-is
                genreText = movie.genre
              }
            }
          }
          
          return {
            ...movie,
            // Ensure required fields have defaults
            status: movie.status || 'active',
            average_rating: movie.average_rating || movie.rating || 0,
            poster_url: movie.poster_url || movie.poster,
            genre: genreText
          }
        })
        
        setMovies(processedMoviesData)
        setTotalPages(paginationMeta.last_page || Math.ceil(processedMoviesData.length / itemsPerPage))
        setTotalResults(paginationMeta.total || processedMoviesData.length)
      } else {
        console.warn('Movies: Invalid API response format, using sample data')
        setMovies(sampleMovies)
        setTotalPages(Math.ceil(sampleMovies.length / itemsPerPage))
        setTotalResults(sampleMovies.length)
      }
    } catch (err: any) {
      console.error('Error fetching movies:', err)
      setError(err.response?.data?.message || 'Không thể tải danh sách phim từ server')
      
      // Use sample data as fallback
      setMovies(sampleMovies)
      setTotalPages(Math.ceil(sampleMovies.length / itemsPerPage))
      setTotalResults(sampleMovies.length)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedGenre('')
    setSelectedStatus('')
    setSelectedLanguage('')
    setSortBy('title')
    setSortOrder('asc')
    setCurrentPage(1)
  }

  const getGenres = () => {
    // Ensure movies is an array before calling map
    if (!Array.isArray(movies)) {
      return []
    }
    // Filter out null/undefined genres and ensure we have a string
    const genres = [...new Set(movies.map(movie => movie.genre).filter(Boolean))]
    return genres.sort()
  }

  const getLanguages = () => {
    // Ensure movies is an array before calling map  
    if (!Array.isArray(movies)) {
      return []
    }
    // Filter out null/undefined languages and ensure we have a string
    const languages = [...new Set(movies.map(movie => movie.language).filter(Boolean))]
    return languages.sort()
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN')
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'now_showing':
        return 'Đang chiếu'
      case 'coming_soon':
        return 'Sắp chiếu'
      case 'ended':
        return 'Đã kết thúc'
      default:
        return status
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'now_showing':
        return 'status-now-showing'
      case 'coming_soon':
        return 'status-coming-soon'
      case 'ended':
        return 'status-ended'
      default:
        return 'status-default'
    }
  }

  // Ensure movies is an array before filtering
  const moviesArray = Array.isArray(movies) ? movies : []
  
  const filteredMovies = moviesArray.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movie.synopsis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movie.director?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGenre = !selectedGenre || movie.genre === selectedGenre
    const matchesStatus = !selectedStatus || movie.status === selectedStatus
    const matchesLanguage = !selectedLanguage || movie.language === selectedLanguage
    return matchesSearch && matchesGenre && matchesStatus && matchesLanguage
  })

  const sortedMovies = [...filteredMovies].sort((a, b) => {
    let aValue: any = a[sortBy as keyof Movie]
    let bValue: any = b[sortBy as keyof Movie]
    
    if (sortBy === 'title') {
      aValue = aValue?.toLowerCase()
      bValue = bValue?.toLowerCase()
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedMovies = sortedMovies.slice(startIndex, endIndex)

  // Default fallback poster URL
  const defaultPosterUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgdmlld0JveD0iMCAwIDUwMCA3NTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNzUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNTAgMzAwQzI3NS4yMjkgMzAwIDI5NSAyODAuMjI5IDI5NSAyNTVDMjk1IDIyOS43NzEgMjc1LjIyOSAyMTAgMjUwIDIxMEMyMjQuNzcxIDIxMCAyMDUgMjI5Ljc3MSAyMDUgMjU1QzIwNSAyODAuMjI5IDIyNC43NzEgMzAwIDI1MCAzMDBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0yNTAgMzUwQzI3NS4yMjkgMzUwIDI5NSAzMzAuMjI5IDI5NSAzMDVDMjk1IDI3OS43NzEgMjc1LjIyOSAyNjAgMjUwIDI2MEMyMjQuNzcxIDI2MCAyMDUgMjc5Ljc3MSAyMDUgMzA1QzIwNSAzMzAuMjI5IDIyNC43NzEgMzUwIDI1MCAzNTBaIiBmaWxsPSIjOUI5QkEwIi8+Cjx0ZXh0IHg9IjI1MCIgeT0iNDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QkEwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K'

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = event.target as HTMLImageElement
    target.src = defaultPosterUrl
  }

  if (loading) {
    return (
      <div className="movies-page">
        <div className="movies-header">
          <div className="header-content">
            <h1>🎬 Danh sách phim</h1>
            <p>Khám phá những bộ phim hay nhất đang chiếu và sắp ra mắt</p>
          </div>
        </div>
        <div className="movies-filters">
          <div className="filters-container">
            <div className="search-section">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Tìm kiếm phim theo tên, diễn viên, đạo diễn..."
                  className="search-input"
                  value=""
                  disabled
                />
                <button className="search-btn" disabled>
                  🔍
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="movies-content">
          <div className="movies-container">
            <MovieListSkeleton />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="movies-page">
        <div className="movies-header">
          <div className="header-content">
            <h1>🎬 Danh sách phim</h1>
            <p>Khám phá những bộ phim hay nhất đang chiếu và sắp ra mắt</p>
          </div>
        </div>
        <div className="movies-error">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h2>Đã xảy ra lỗi</h2>
            <p>{error}</p>
            <button onClick={fetchMovies} className="btn btn-primary">
              Thử lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="movies-page">
      {/* Header */}
      <div className="movies-header">
        <div className="header-content">
          <h1>🎬 Danh sách phim</h1>
          <p>Khám phá những bộ phim hay nhất đang chiếu và sắp ra mắt</p>
        </div>
      </div>

      {/* Filters */}
      <div className="movies-filters">
        <div className="filters-container">
          {/* Search */}
          <div className="search-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Tìm kiếm phim theo tên, diễn viên, đạo diễn..."
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <button className="search-btn">
                🔍
              </button>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="filter-controls">
            <div className="filter-row">
              <div className="filter-group">
                <label>Thể loại:</label>
                <select
                  value={selectedGenre || ''}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Tất cả thể loại</option>
                  {getGenres().map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Trạng thái:</label>
                <select
                  value={selectedStatus || ''}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="now_showing">Đang chiếu</option>
                  <option value="coming_soon">Sắp chiếu</option>
                  <option value="ended">Đã kết thúc</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Ngôn ngữ:</label>
                <select
                  value={selectedLanguage || ''}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Tất cả ngôn ngữ</option>
                  {getLanguages().map(language => (
                    <option key={language} value={language}>{language}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Sắp xếp:</label>
                <select
                  value={sortBy || 'title'}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="title">Tên phim</option>
                  <option value="rating">Đánh giá</option>
                  <option value="release_date">Ngày phát hành</option>
                  <option value="duration">Thời lượng</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Thứ tự:</label>
                <select
                  value={sortOrder || 'asc'}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="filter-select"
                >
                  <option value="asc">Tăng dần</option>
                  <option value="desc">Giảm dần</option>
                </select>
              </div>
            </div>

            <div className="filter-row">
              <div className="view-toggle">
                <button
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  📱 Grid
                </button>
                <button
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  📋 List
                </button>
              </div>

              <div className="results-info">
                <span>Hiển thị {startIndex + 1}-{Math.min(endIndex, totalResults)} trong tổng số {totalResults} phim</span>
                {(selectedGenre || selectedStatus || selectedLanguage || searchTerm) && (
                  <button onClick={clearFilters} className="clear-filters-btn">
                    ✕ Xóa bộ lọc
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="movies-content">
        <div className="movies-container">
          {paginatedMovies.length === 0 ? (
            <div className="empty-movies">
              <div className="empty-icon">🎬</div>
              <h3>Không tìm thấy phim</h3>
              <p>
                Không có phim nào phù hợp với bộ lọc của bạn. 
                Hãy thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác.
              </p>
              <button onClick={clearFilters} className="btn btn-primary">
                Xem tất cả phim
              </button>
            </div>
          ) : (
            <>
              <div className={`movies-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
                {paginatedMovies.map((movie) => (
                  <div key={movie.id} className="movie-card">
                    <Link to={`/movies/${movie.id}`} className="movie-link">
                      <div className="movie-poster">
                        <img 
                          src={movie.poster_url || defaultPosterUrl} 
                          alt={movie.title}
                          onError={handleImageError}
                          loading="lazy"
                        />
                        
                        {/* Status Badge */}
                        <div className={`status-badge ${getStatusClass(movie.status)}`}>
                          {movie.status === 'now_showing' && '🎬 Đang chiếu'}
                          {movie.status === 'coming_soon' && '🔜 Sắp chiếu'}
                          {movie.status === 'ended' && '⏹️ Đã kết thúc'}
                        </div>
                        
                        {/* Rating Badge */}
                        <div className="movie-rating-badge">
                          <span className="rating-stars">⭐</span>
                          <span className="rating-number">
                            {Number(movie.average_rating || movie.rating || 0).toFixed(1)}
                          </span>
                        </div>
                        
                        {/* Age Rating Badge */}
                        {movie.age_rating && (
                          <div className="age-rating-badge">
                            {movie.age_rating}
                          </div>
                        )}
                        
                        <div className="movie-overlay">
                          <div className="overlay-content">
                            <button className="overlay-btn play-btn">
                              <span>▶️</span>
                              Xem trailer
                            </button>
                            <button className="overlay-btn book-btn">
                              <span>🎫</span>
                              Đặt vé ngay
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="movie-content">
                        <h3 className="movie-title">{movie.title}</h3>
                        <div className="movie-meta">
                          <div className="movie-genres">
                            <span className="genre-tag">{movie.genre}</span>
                          </div>
                          <span className="movie-duration">
                            ⏱️ {formatDuration(movie.duration)}
                          </span>
                          <span className="movie-language">
                            🌍 {movie.language}
                          </span>
                        </div>
                        
                        {movie.director && (
                          <div className="movie-director">
                            🎥 {movie.director}
                          </div>
                        )}
                        
                        {movie.synopsis && (
                          <p className="movie-synopsis">
                            {viewMode === 'list' 
                              ? (movie.synopsis.length > 120 ? `${movie.synopsis.substring(0, 120)}...` : movie.synopsis)
                              : (movie.synopsis.length > 80 ? `${movie.synopsis.substring(0, 80)}...` : movie.synopsis)
                            }
                          </p>
                        )}
                        
                        {movie.status === 'coming_soon' && movie.release_date && (
                          <div className="release-date">
                            📅 Khởi chiếu: {formatDate(movie.release_date)}
                          </div>
                        )}
                        
                        <div className="movie-actions">
                          <button className="action-btn primary">
                            <span>🎫</span>
                            Đặt vé
                          </button>
                          <button className="action-btn secondary">
                            <span>📝</span>
                            Chi tiết
                          </button>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    ← Trước
                  </button>
                  
                  <div className="pagination-pages">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    Sau →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
} 