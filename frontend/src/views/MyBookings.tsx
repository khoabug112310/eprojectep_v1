import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookingCardSkeleton } from '../components/Skeleton'
import api from '../services/api'
import './MyBookings.css'

interface Booking {
  id: number
  booking_code: string
  movie: {
    id: number
    title: string
    poster_url?: string
  }
  theater: {
    id: number
    name: string
    address?: string
  }
  showtime: {
    id: number
    show_date: string
    show_time: string
  }
  seats: string[]
  total_amount: number
  status: 'confirmed' | 'cancelled' | 'completed'
  created_at: string
}

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.get('/bookings/my-bookings')
      setBookings(response.data.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách đặt vé')
    } finally {
      setLoading(false)
    }
  }

  const cancelBooking = async (bookingId: number) => {
    if (!confirm('Bạn có chắc chắn muốn hủy vé này không?')) {
      return
    }

    try {
      await api.post(`/bookings/${bookingId}/cancel`)
      // Refresh bookings
      fetchBookings()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể hủy vé. Vui lòng thử lại.')
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận'
      case 'cancelled':
        return 'Đã hủy'
      case 'completed':
        return 'Đã hoàn thành'
      default:
        return status
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed'
      case 'cancelled':
        return 'status-cancelled'
      case 'completed':
        return 'status-completed'
      default:
        return 'status-default'
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

  const isUpcoming = (booking: Booking) => {
    const showDate = new Date(`${booking.showtime.show_date} ${booking.showtime.show_time}`)
    return showDate > new Date()
  }

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'upcoming') return isUpcoming(booking)
    if (filter === 'past') return !isUpcoming(booking)
    return true
  })

  if (loading) {
    return (
      <div className="my-bookings-page">
        <div className="bookings-header">
          <h1>🎫 Vé của tôi</h1>
        </div>
        <div className="bookings-container">
          <BookingCardSkeleton />
          <BookingCardSkeleton />
          <BookingCardSkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="my-bookings-page">
        <div className="bookings-header">
          <h1>🎫 Vé của tôi</h1>
        </div>
        <div className="bookings-error">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h2>Đã xảy ra lỗi</h2>
            <p>{error}</p>
            <button onClick={fetchBookings} className="btn btn-primary">
              Thử lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="my-bookings-page">
      {/* Header */}
      <div className="bookings-header">
        <div className="header-content">
          <h1>🎫 Vé của tôi</h1>
          <p>Quản lý tất cả vé đã đặt và lịch sử đặt vé</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bookings-filters">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả ({bookings.length})
          </button>
          <button 
            className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setFilter('upcoming')}
          >
            Sắp tới ({bookings.filter(b => isUpcoming(b)).length})
          </button>
          <button 
            className={`filter-tab ${filter === 'past' ? 'active' : ''}`}
            onClick={() => setFilter('past')}
          >
            Đã xem ({bookings.filter(b => !isUpcoming(b)).length})
          </button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bookings-container">
        {filteredBookings.length === 0 ? (
          <div className="empty-bookings">
            <div className="empty-icon">🎬</div>
            <h3>Chưa có vé nào</h3>
            <p>
              {filter === 'all' && 'Bạn chưa đặt vé nào. Hãy khám phá phim và đặt vé ngay!'}
              {filter === 'upcoming' && 'Không có vé sắp tới. Hãy đặt vé mới!'}
              {filter === 'past' && 'Bạn chưa xem phim nào. Hãy đặt vé và thưởng thức!'}
            </p>
            <Link to="/movies" className="btn btn-primary">
              Xem phim
            </Link>
          </div>
        ) : (
          <div className="bookings-list">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="booking-card">
                <div className="booking-header">
                  <div className="booking-code">
                    <span className="code-label">Mã vé:</span>
                    <span className="code-value">{booking.booking_code}</span>
                  </div>
                  <div className={`booking-status ${getStatusClass(booking.status)}`}>
                    {getStatusText(booking.status)}
                  </div>
                </div>

                <div className="booking-content">
                  <div className="movie-info">
                    <div className="movie-poster">
                      <img src={booking.movie.poster_url || ''} alt={booking.movie.title} />
                    </div>
                    <div className="movie-details">
                      <h3 className="movie-title">{booking.movie.title}</h3>
                      <div className="showtime-info">
                        <div className="showtime-date">
                          📅 {formatDate(booking.showtime.show_date)}
                        </div>
                        <div className="showtime-time">
                          ⏰ {formatTime(booking.showtime.show_time)}
                        </div>
                      </div>
                      <div className="theater-info">
                        🎭 {booking.theater.name}
                        {booking.theater.address && (
                          <span className="theater-address">
                            - {booking.theater.address}
                          </span>
                        )}
                      </div>
                      <div className="seats-info">
                        🪑 Ghế: {booking.seats.join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="booking-actions">
                    <div className="booking-price">
                      <span className="price-label">Tổng tiền:</span>
                      <span className="price-value">{formatCurrency(booking.total_amount)}</span>
                    </div>
                    
                    <div className="action-buttons">
                      <Link 
                        to={`/booking/confirmation?booking_id=${booking.id}`}
                        className="btn btn-secondary"
                      >
                        Xem vé
                      </Link>
                      
                      {booking.status === 'confirmed' && isUpcoming(booking) && (
                        <button 
                          onClick={() => cancelBooking(booking.id)}
                          className="btn btn-danger"
                        >
                          Hủy vé
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="booking-footer">
                  <div className="booking-date">
                    Đặt vé lúc: {formatDate(booking.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 