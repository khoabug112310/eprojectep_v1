import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import './Showtimes.css'

interface Showtime {
  id: number
  show_date: string
  show_time: string
  theater?: { id: number; name: string }
}

interface Movie {
  id: number
  title: string
  poster_url?: string
}

export default function Showtimes() {
  const { movieId } = useParams<{ movieId: string }>()
  const navigate = useNavigate()
  const [showtimes, setShowtimes] = useState<Showtime[]>([])
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!movieId) return
    setLoading(true)
    
    const fetchData = async () => {
      try {
        const [movieRes, showtimesRes] = await Promise.all([
          api.get(`/movies/${movieId}`),
          api.get(`/showtimes`, { params: { movie_id: movieId } })
        ])
        
        setMovie(movieRes.data.data)
        setShowtimes(showtimesRes.data.data?.data ?? showtimesRes.data.data)
      } catch (error: unknown) {
        const errorMessage = error instanceof Error
          ? error.message
          : 'Error loading data'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }
    
    void fetchData()
  }, [movieId])

  const onSelect = (showtimeId: number) => {
    navigate(`/booking/seats/${showtimeId}`)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5)
  }

  if (loading) return <div className="loading">Đang tải suất chiếu...</div>
  if (error) return <div className="error">Lỗi: {error}</div>

  return (
    <div className="showtimes-page">
      <div className="container">
        {/* Movie Info */}
        {movie && (
          <div className="movie-info">
            <div className="movie-poster" style={{ backgroundImage: `url(${movie.poster_url || ''})` }} />
            <div className="movie-details">
              <h1>{movie.title}</h1>
              <Link to={`/movies/${movieId}`} className="back-link">
                ← Quay lại chi tiết phim
              </Link>
            </div>
          </div>
        )}

        {/* Showtimes */}
        <div className="showtimes-section">
          <h2>Chọn suất chiếu</h2>
          
          {showtimes.length === 0 ? (
            <div className="no-showtimes">
              <p>Chưa có suất chiếu nào cho phim này</p>
            </div>
          ) : (
            <div className="showtimes-grid">
              {showtimes.map((showtime) => (
                <div key={showtime.id} className="showtime-card">
                  <div className="showtime-info">
                    <div className="date-time">
                      <div className="date">{formatDate(showtime.show_date)}</div>
                      <div className="time">{formatTime(showtime.show_time)}</div>
                    </div>
                    <div className="theater">
                      <span className="theater-name">{showtime.theater?.name}</span>
                    </div>
                  </div>
                  <button 
                    className="select-btn"
                    onClick={() => onSelect(showtime.id)}
                  >
                    Chọn suất
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Booking Info */}
        <div className="booking-info">
          <h3>Thông tin đặt vé</h3>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-icon">🎬</div>
              <div className="info-text">
                <h4>Chọn phim</h4>
                <p>Bạn đã chọn phim {movie?.title}</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">📅</div>
              <div className="info-text">
                <h4>Chọn suất chiếu</h4>
                <p>Chọn thời gian và rạp phù hợp</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">💺</div>
              <div className="info-text">
                <h4>Chọn ghế</h4>
                <p>Chọn ghế ngồi theo ý thích</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">💳</div>
              <div className="info-text">
                <h4>Thanh toán</h4>
                <p>Hoàn tất đặt vé và thanh toán</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 