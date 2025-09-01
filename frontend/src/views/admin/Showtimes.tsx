import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import api from '../../services/api'
import './Admin.css'

interface Showtime {
  id: number
  movie: { id: number; title: string }
  theater: { id: number; name: string }
  date: string
  time: string
  price: number
  status: string
}

export default function AdminShowtimes() {
  const [showtimes, setShowtimes] = useState<Showtime[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTheater, setSelectedTheater] = useState('')
  const [selectedMovie, setSelectedMovie] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  
  const { addToast } = useOutletContext<{ addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void }>()

  useEffect(() => {
    fetchShowtimes()
  }, [])

  const fetchShowtimes = async () => {
    try {
      const response = await api.get('/showtimes')
      setShowtimes(response.data.data || [])
    } catch (error) {
      console.error('Error fetching showtimes:', error)
      addToast('Không thể tải danh sách suất chiếu', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredShowtimes = showtimes.filter(showtime => {
    const matchesDate = !selectedDate || showtime.date === selectedDate
    const matchesTheater = !selectedTheater || showtime.theater.name === selectedTheater
    const matchesMovie = !selectedMovie || showtime.movie.title.includes(selectedMovie)
    return matchesDate && matchesTheater && matchesMovie
  })

  const getTheaters = () => {
    return [...new Set(showtimes.map(s => s.theater.name))]
  }

  const getMovies = () => {
    return [...new Set(showtimes.map(s => s.movie.title))]
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN')
  }

  const formatTime = (timeStr: string) => {
    return timeStr
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const detectConflicts = (showtime: Showtime) => {
    // Simple conflict detection: same theater, same date, overlapping times
    const sameTheaterSameDate = showtimes.filter(s => 
      s.theater.id === showtime.theater.id && 
      s.date === showtime.date && 
      s.id !== showtime.id
    )
    
    if (sameTheaterSameDate.length > 0) {
      // Check for time conflicts (simplified)
      const currentTime = showtime.time
      const conflicting = sameTheaterSameDate.some(s => {
        const timeDiff = Math.abs(parseInt(currentTime.split(':')[0]) - parseInt(s.time.split(':')[0]))
        return timeDiff < 3 // Less than 3 hours apart
      })
      return conflicting
    }
    return false
  }

  const exportShowtimes = () => {
    const csvContent = [
      ['ID', 'Phim', 'Rạp', 'Ngày', 'Giờ', 'Giá vé', 'Trạng thái'],
      ...filteredShowtimes.map(s => [
        s.id,
        s.movie.title,
        s.theater.name,
        formatDate(s.date),
        s.time,
        s.price,
        s.status
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'showtimes_export.csv'
    link.click()
    addToast('Đã xuất danh sách suất chiếu thành CSV', 'success')
  }

  if (loading) return <div className="loading">Đang tải danh sách suất chiếu...</div>

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Quản lý lịch chiếu</h1>
        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={`btn btn-small ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('list')}
            >
              📋 Danh sách
            </button>
            <button 
              className={`btn btn-small ${viewMode === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('calendar')}
            >
              📅 Lịch
            </button>
          </div>
          <button onClick={exportShowtimes} className="btn btn-secondary">
            📊 Xuất CSV
          </button>
          <Link to="/admin/showtimes/create" className="btn btn-primary">
            ➕ Thêm suất chiếu
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>Ngày chiếu:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Rạp chiếu:</label>
            <select
              value={selectedTheater}
              onChange={(e) => setSelectedTheater(e.target.value)}
            >
              <option value="">Tất cả rạp</option>
              {getTheaters().map(theater => (
                <option key={theater} value={theater}>{theater}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Phim:</label>
            <select
              value={selectedMovie}
              onChange={(e) => setSelectedMovie(e.target.value)}
            >
              <option value="">Tất cả phim</option>
              {getMovies().map(movie => (
                <option key={movie} value={movie}>{movie}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="filter-actions">
          <button 
            onClick={() => {
              setSelectedDate('')
              setSelectedTheater('')
              setSelectedMovie('')
            }}
            className="btn btn-small btn-secondary"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="calendar-view">
          <div className="calendar-header">
            <h3>Lịch chiếu theo ngày</h3>
            <p>Chọn ngày để xem chi tiết suất chiếu</p>
          </div>
          <div className="calendar-grid">
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date()
              date.setDate(date.getDate() + i)
              const dateStr = date.toISOString().split('T')[0]
              const dayShowtimes = showtimes.filter(s => s.date === dateStr)
              
              return (
                <div key={i} className="calendar-day">
                  <div className="day-header">
                    <h4>{date.toLocaleDateString('vi-VN', { weekday: 'short' })}</h4>
                    <span>{date.getDate()}/{date.getMonth() + 1}</span>
                  </div>
                  <div className="showtime-count">
                    {dayShowtimes.length} suất
                  </div>
                  <div className="day-showtimes">
                    {dayShowtimes.slice(0, 3).map(showtime => (
                      <div key={showtime.id} className="calendar-showtime">
                        <span className="time">{showtime.time}</span>
                        <span className="movie">{showtime.movie.title}</span>
                      </div>
                    ))}
                    {dayShowtimes.length > 3 && (
                      <div className="more-showtimes">
                        +{dayShowtimes.length - 3} suất nữa
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Phim</th>
                <th>Rạp</th>
                <th>Ngày</th>
                <th>Giờ</th>
                <th>Giá vé</th>
                <th>Trạng thái</th>
                <th>Xung đột</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredShowtimes.map((showtime) => (
                <tr key={showtime.id} className={detectConflicts(showtime) ? 'conflict-row' : ''}>
                  <td>
                    <div className="movie-info">
                      <h4>{showtime.movie.title}</h4>
                      <p>ID: {showtime.movie.id}</p>
                    </div>
                  </td>
                  <td>
                    <div className="theater-info">
                      <h4>{showtime.theater.name}</h4>
                      <p>ID: {showtime.theater.id}</p>
                    </div>
                  </td>
                  <td>{formatDate(showtime.date)}</td>
                  <td>{formatTime(showtime.time)}</td>
                  <td>{formatCurrency(showtime.price)}</td>
                  <td>
                    <span className={`status-badge ${showtime.status}`}>
                      {showtime.status === 'active' ? 'Hoạt động' : 
                       showtime.status === 'inactive' ? 'Không hoạt động' : 'Đã hủy'}
                    </span>
                  </td>
                  <td>
                    {detectConflicts(showtime) && (
                      <span className="conflict-warning">⚠️ Xung đột</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/admin/showtimes/${showtime.id}/edit`} className="btn btn-small btn-primary">
                        Sửa
                      </Link>
                      <button className="btn btn-small btn-danger">
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div className="summary-section">
        <div className="summary-card">
          <h3>Tổng số suất chiếu</h3>
          <p>{showtimes.length}</p>
        </div>
        <div className="summary-card">
          <h3>Đang hoạt động</h3>
          <p>{showtimes.filter(s => s.status === 'active').length}</p>
        </div>
        <div className="summary-card">
          <h3>Đã hủy</h3>
          <p>{showtimes.filter(s => s.status === 'cancelled').length}</p>
        </div>
        <div className="summary-card">
          <h3>Xung đột</h3>
          <p>{showtimes.filter(s => detectConflicts(s)).length}</p>
        </div>
      </div>
    </div>
  )
} 