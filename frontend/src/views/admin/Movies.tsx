import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import './Admin.css'

interface Movie {
  id: number
  title: string
  genre: string
  duration: number
  rating: number
  status: 'active' | 'inactive'
  poster_url?: string
  created_at: string
}

export default function Movies() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedMovies, setSelectedMovies] = useState<number[]>([])

  useEffect(() => {
    fetchMovies()
  }, [])

  const fetchMovies = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.get('/movies')
      
      // Ensure movies is always an array
      const moviesData = response.data.data
      if (Array.isArray(moviesData)) {
        setMovies(moviesData)
      } else {
        console.warn('API returned non-array movies data:', moviesData)
        setMovies([])
      }
    } catch (err: any) {
      console.error('Error fetching movies:', err)
      setError(err.response?.data?.message || 'Không thể tải danh sách phim')
      setMovies([]) // Ensure movies is an empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phim này không?')) {
      return
    }

    try {
      await api.delete(`/movies/${id}`)
      setMovies(movies.filter(movie => movie.id !== id))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể xóa phim')
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedMovies.length} phim đã chọn không?`)) {
      return
    }

    try {
      await Promise.all(selectedMovies.map(id => api.delete(`/movies/${id}`)))
      setMovies(movies.filter(movie => !selectedMovies.includes(movie.id)))
      setSelectedMovies([])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể xóa phim')
    }
  }

  const handleSelectAll = () => {
    if (selectedMovies.length === filteredMovies.length) {
      setSelectedMovies([])
    } else {
      setSelectedMovies(filteredMovies.map(movie => movie.id))
    }
  }

  const handleSelectMovie = (id: number) => {
    if (selectedMovies.includes(id)) {
      setSelectedMovies(selectedMovies.filter(movieId => movieId !== id))
    } else {
      setSelectedMovies([...selectedMovies, id])
    }
  }

  // Ensure movies is an array before filtering
  const moviesArray = Array.isArray(movies) ? movies : []
  
  const filteredMovies = moviesArray.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movie.genre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || movie.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN')
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1>Quản lý phim</h1>
          <p>Đang tải...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1>Quản lý phim</h1>
          <p>Lỗi: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Quản lý phim</h1>
            <p>Quản lý tất cả phim trong hệ thống</p>
          </div>
          <div className="header-actions">
            <Link to="/admin/movies/create" className="btn btn-primary">
              + Thêm phim mới
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm phim..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-controls">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="filter-select"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>
        </div>

        {selectedMovies.length > 0 && (
          <div className="bulk-actions">
            <span>{selectedMovies.length} phim đã chọn</span>
            <button onClick={handleBulkDelete} className="btn btn-danger">
              Xóa đã chọn
            </button>
          </div>
        )}
      </div>

      {/* Movies Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedMovies.length === filteredMovies.length && filteredMovies.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Poster</th>
              <th>Tên phim</th>
              <th>Thể loại</th>
              <th>Thời lượng</th>
              <th>Đánh giá</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovies.map((movie) => (
              <tr key={movie.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedMovies.includes(movie.id)}
                    onChange={() => handleSelectMovie(movie.id)}
                  />
                </td>
                <td>
                  <div className="movie-poster">
                    <img 
                      src={movie.poster_url || '/placeholder-movie.jpg'} 
                      alt={movie.title}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-movie.jpg'
                      }}
                    />
                  </div>
                </td>
                <td>
                  <div className="movie-info">
                    <div className="movie-title">{movie.title}</div>
                  </div>
                </td>
                <td>{movie.genre}</td>
                <td>{formatDuration(movie.duration)}</td>
                <td>
                  <div className="rating">
                    <span className="stars">{'★'.repeat(Math.floor(movie.rating))}</span>
                    <span className="rating-text">{movie.rating}/5</span>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${movie.status}`}>
                    {movie.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </td>
                <td>{formatDate(movie.created_at)}</td>
                <td>
                  <div className="action-buttons">
                    <Link to={`/admin/movies/${movie.id}/edit`} className="btn btn-secondary btn-sm">
                      Sửa
                    </Link>
                    <button 
                      onClick={() => handleDelete(movie.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredMovies.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🎬</div>
            <h3>Không có phim nào</h3>
            <p>Chưa có phim nào được thêm vào hệ thống.</p>
            <Link to="/admin/movies/create" className="btn btn-primary">
              Thêm phim đầu tiên
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 