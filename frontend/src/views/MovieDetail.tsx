import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { TrailerModal, ConfirmationModal } from '../components/Modal'
import { MovieCardSkeleton } from '../components/Skeleton'
import api from '../services/api'
import './MovieDetail.css'

interface Movie {
  id: number
  title: string
  synopsis?: string
  poster_url?: string
  background_url?: string
  average_rating?: number
  total_reviews?: number
  duration?: number
  genre?: string
  language?: string
  release_date?: string
  director?: string
  cast?: string
  trailer_url?: string
  status?: string
}

interface Showtime {
  id: number
  show_date: string
  show_time: string
  price?: number
  theater?: { 
    id: number
    name: string
    address?: string
  }
}

interface Review {
  id: number
  user_id: number
  user_name?: string
  rating: number
  comment?: string
  created_at?: string
}

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [showtimes, setShowtimes] = useState<Showtime[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Review form state
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)

  // Modal states
  const [showTrailer, setShowTrailer] = useState(false)
  const [showBookingConfirm, setShowBookingConfirm] = useState(false)
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null)

  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'showtimes' | 'reviews'>('overview')

  useEffect(() => {
    if (!id) return
    fetchMovieData()
  }, [id])

  const fetchMovieData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [movieRes, showtimesRes, reviewsRes] = await Promise.all([
        api.get(`/movies/${id}`),
        api.get(`/movies/${id}/showtimes`),
        api.get(`/movies/${id}/reviews`)
      ])
      
      setMovie(movieRes.data.data)
      
      // Ensure showtimes is always an array
      const showtimesData = showtimesRes.data.data
      if (Array.isArray(showtimesData)) {
        setShowtimes(showtimesData)
      } else {
        console.warn('API returned non-array showtimes data:', showtimesData)
        setShowtimes([])
      }
      
      // Ensure reviews is always an array
      const reviewsData = reviewsRes.data.data?.data ?? reviewsRes.data.data
      if (Array.isArray(reviewsData)) {
        setReviews(reviewsData)
      } else {
        console.warn('API returned non-array reviews data:', reviewsData)
        setReviews([])
      }
    } catch (err: any) {
      console.error('Error fetching movie data:', err)
      setError(err.response?.data?.message || 'Không thể tải thông tin phim')
      setShowtimes([]) // Ensure showtimes is an empty array on error
      setReviews([]) // Ensure reviews is an empty array on error
    } finally {
      setLoading(false)
    }
  }

  const submitReview = async () => {
    if (!id || !comment.trim()) return
    
    setSubmitting(true)
    try {
      await api.post(`/movies/${id}/reviews`, { 
        rating, 
        comment: comment.trim() 
      })
      
      // Refresh reviews
      const reviewsRes = await api.get(`/movies/${id}/reviews`)
      setReviews(reviewsRes.data.data?.data ?? reviewsRes.data.data)
      
      // Reset form
      setComment('')
      setRating(5)
      setShowReviewForm(false)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi đánh giá')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBookNow = (showtime: Showtime) => {
    setSelectedShowtime(showtime)
    setShowBookingConfirm(true)
  }

  const confirmBooking = () => {
    if (selectedShowtime) {
      window.location.href = `/booking/showtimes/${id}`
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  // Default fallback poster URL
  const defaultPosterUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgdmlld0JveD0iMCAwIDUwMCA3NTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNzUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNTAgMzAwQzI3NS4yMjkgMzAwIDI5NSAyODAuMjI5IDI5NSAyNTVDMjk1IDIyOS43NzEgMjc1LjIyOSAyMTAgMjUwIDIxMEMyMjQuNzcxIDIxMCAyMDUgMjI5Ljc3MSAyMDUgMjU1QzIwNSAyODAuMjI5IDIyNC43NzEgMzAwIDI1MCAzMDBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0yNTAgMzUwQzI3NS4yMjkgMzUwIDI5NSAzMzAuMjI5IDI5NSAzMDVDMjk1IDI3OS43NzEgMjc1LjIyOSAyNjAgMjUwIDI2MEMyMjQuNzcxIDI2MCAyMDUgMjc5Ljc3MSAyMDUgMzA1QzIwNSAzMzAuMjI5IDIyNC43NzEgMzUwIDI1MCAzNTBaIiBmaWxsPSIjOUI5QkEwIi8+Cjx0ZXh0IHg9IjI1MCIgeT0iNDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QkEwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K'

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = event.target as HTMLImageElement
    target.src = defaultPosterUrl
  }

  const handleBackgroundImageError = (event: React.SyntheticEvent<HTMLDivElement, Event>) => {
    const target = event.target as HTMLDivElement
    target.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${defaultPosterUrl})`
  }

  if (loading) {
    return (
      <div className="movie-detail-loading">
        <MovieCardSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="movie-detail-error">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h2>Đã xảy ra lỗi</h2>
          <p>{error}</p>
          <button onClick={fetchMovieData} className="btn btn-primary">
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="movie-detail-not-found">
        <div className="not-found-content">
          <div className="not-found-icon">🎬</div>
          <h2>Không tìm thấy phim</h2>
          <p>Phim bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <Link to="/movies" className="btn btn-primary">
            Xem phim khác
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="movie-detail-page">
      {/* Hero Section */}
      <div 
        className="movie-hero"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${movie.background_url || movie.poster_url || defaultPosterUrl})`
        }}
        onError={handleBackgroundImageError}
      >
        <div className="hero-content">
          <div className="movie-poster">
            <img src={movie.poster_url || defaultPosterUrl} alt={movie.title} onError={handleImageError} />
            <button 
              className="trailer-btn"
              onClick={() => setShowTrailer(true)}
              disabled={!movie.trailer_url}
            >
              ▶️ Xem trailer
            </button>
          </div>
          
          <div className="movie-info">
            <h1 className="movie-title">{movie.title}</h1>
            
            <div className="movie-meta">
              <div className="rating-section">
                <div className="rating-stars">
                  {renderStars(Math.round(movie.average_rating || 0))}
                </div>
                <span className="rating-text">
                  {Number(movie.average_rating || 0).toFixed(1)}/5
                </span>
                <span className="review-count">
                  ({movie.total_reviews || 0} đánh giá)
                </span>
              </div>
              
              <div className="movie-details">
                {movie.duration && (
                  <span className="detail-item">⏱️ {movie.duration} phút</span>
                )}
                {movie.genre && (
                  <span className="detail-item">🎭 {movie.genre}</span>
                )}
                {movie.language && (
                  <span className="detail-item">🌍 {movie.language}</span>
                )}
                {movie.release_date && (
                  <span className="detail-item">📅 {formatDate(movie.release_date)}</span>
                )}
              </div>
            </div>

            <p className="movie-synopsis">{movie.synopsis}</p>

            <div className="movie-actions">
              <button 
                className="btn btn-primary btn-large"
                onClick={() => setActiveTab('showtimes')}
              >
                🎫 Đặt vé ngay
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowReviewForm(true)}
              >
                ✍️ Viết đánh giá
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="movie-content">
        <div className="content-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Tổng quan
          </button>
          <button 
            className={`tab-btn ${activeTab === 'showtimes' ? 'active' : ''}`}
            onClick={() => setActiveTab('showtimes')}
          >
            Lịch chiếu ({showtimes.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Đánh giá ({reviews.length})
          </button>
        </div>

        <div className="tab-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="overview-grid">
                <div className="overview-section">
                  <h3>📖 Tóm tắt</h3>
                  <p>{movie.synopsis}</p>
                </div>
                
                <div className="overview-section">
                  <h3>🎬 Thông tin phim</h3>
                  <div className="info-list">
                    {movie.director && (
                      <div className="info-item">
                        <span className="label">Đạo diễn:</span>
                        <span className="value">{movie.director}</span>
                      </div>
                    )}
                    {movie.cast && (
                      <div className="info-item">
                        <span className="label">Diễn viên:</span>
                        <span className="value">{movie.cast}</span>
                      </div>
                    )}
                    {movie.genre && (
                      <div className="info-item">
                        <span className="label">Thể loại:</span>
                        <span className="value">{movie.genre}</span>
                      </div>
                    )}
                    {movie.duration && (
                      <div className="info-item">
                        <span className="label">Thời lượng:</span>
                        <span className="value">{movie.duration} phút</span>
                      </div>
                    )}
                    {movie.language && (
                      <div className="info-item">
                        <span className="label">Ngôn ngữ:</span>
                        <span className="value">{movie.language}</span>
                      </div>
                    )}
                    {movie.release_date && (
                      <div className="info-item">
                        <span className="label">Ngày khởi chiếu:</span>
                        <span className="value">{formatDate(movie.release_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Showtimes Tab */}
          {activeTab === 'showtimes' && (
            <div className="showtimes-tab">
              {showtimes.length === 0 ? (
                <div className="empty-showtimes">
                  <div className="empty-icon">🎬</div>
                  <h3>Chưa có lịch chiếu</h3>
                  <p>Phim này chưa có lịch chiếu. Vui lòng quay lại sau.</p>
                </div>
              ) : (
                <div className="showtimes-list">
                  {Array.isArray(showtimes) && showtimes.map((showtime) => (
                    <div key={showtime.id} className="showtime-card">
                      <div className="showtime-info">
                        <div className="showtime-date">
                          <div className="date-day">
                            {new Date(showtime.show_date).getDate()}
                          </div>
                          <div className="date-month">
                            {new Date(showtime.show_date).toLocaleDateString('vi-VN', { month: 'short' })}
                          </div>
                        </div>
                        <div className="showtime-details">
                          <div className="showtime-time">{formatTime(showtime.show_time)}</div>
                          <div className="showtime-theater">{showtime.theater?.name}</div>
                          {showtime.theater?.address && (
                            <div className="showtime-address">{showtime.theater.address}</div>
                          )}
                        </div>
                        {showtime.price && (
                          <div className="showtime-price">
                            {formatCurrency(showtime.price)}
                          </div>
                        )}
                      </div>
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleBookNow(showtime)}
                      >
                        Đặt vé
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="reviews-tab">
              <div className="reviews-header">
                <h3>Đánh giá từ khán giả</h3>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowReviewForm(true)}
                >
                  ✍️ Viết đánh giá
                </button>
              </div>

              {!Array.isArray(reviews) || reviews.length === 0 ? (
                <div className="empty-reviews">
                  <div className="empty-icon">⭐</div>
                  <h3>Chưa có đánh giá</h3>
                  <p>Hãy là người đầu tiên đánh giá phim này!</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowReviewForm(true)}
                  >
                    Viết đánh giá đầu tiên
                  </button>
                </div>
              ) : (
                <div className="reviews-list">
                  {reviews.map((review) => (
                    <div key={review.id} className="review-card">
                      <div className="review-header">
                        <div className="review-rating">
                          {renderStars(review.rating)}
                        </div>
                        <div className="review-meta">
                          <span className="reviewer-name">
                            {review.user_name || `Người dùng ${review.user_id}`}
                          </span>
                          {review.created_at && (
                            <span className="review-date">
                              {formatDate(review.created_at)}
                            </span>
                          )}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="review-comment">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="review-form-modal">
          <div className="modal-overlay" onClick={() => setShowReviewForm(false)}>
            <div className="modal-content modal-medium" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Viết đánh giá</h2>
                <button className="modal-close" onClick={() => setShowReviewForm(false)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="review-form-content">
                  <div className="rating-input">
                    <label>Đánh giá của bạn:</label>
                    <div className="star-rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          className={`star-btn ${star <= rating ? 'active' : ''}`}
                          onClick={() => setRating(star)}
                        >
                          ⭐
                        </button>
                      ))}
                      <span className="rating-text">{rating}/5</span>
                    </div>
                  </div>
                  <div className="comment-input">
                    <label>Nhận xét:</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Chia sẻ cảm nhận của bạn về phim..."
                      rows={4}
                    />
                  </div>
                  <div className="form-actions">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setShowReviewForm(false)}
                    >
                      Hủy
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={submitReview}
                      disabled={submitting || !comment.trim()}
                    >
                      {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={showTrailer}
        onClose={() => setShowTrailer(false)}
        videoUrl={movie.trailer_url}
        title={movie.title}
      />

      {/* Booking Confirmation Modal */}
      <ConfirmationModal
        isOpen={showBookingConfirm}
        onClose={() => setShowBookingConfirm(false)}
        onConfirm={confirmBooking}
        title="Xác nhận đặt vé"
        message={`Bạn có muốn đặt vé cho suất chiếu ${selectedShowtime?.show_time} ngày ${selectedShowtime?.show_date} tại ${selectedShowtime?.theater?.name} không?`}
        confirmText="Đặt vé"
        cancelText="Hủy"
        type="info"
      />
    </div>
  )
} 