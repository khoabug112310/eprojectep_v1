import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../services/api'
import ETicket from '../../components/ETicket'
import './TicketPage.css'

interface Booking {
  id: number
  booking_code: string
  movie: {
    title: string
    poster_url?: string
    duration?: number
    genre?: string[]
    age_rating?: string
  }
  theater: {
    name: string
    address?: string
  }
  showtime: {
    show_date: string
    show_time: string
  }
  seats: Array<{ seat: string; type: string; price: number }> | string[]
  total_amount: number
  payment_status: string
  booking_status: string
  created_at: string
  qr_code?: string
}

export default function TicketPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [displayMode, setDisplayMode] = useState<'full' | 'compact'>('full')

  useEffect(() => {
    if (bookingId) {
      fetchBooking()
    } else {
      setError('Không tìm thấy ID vé')
      setLoading(false)
    }
  }, [bookingId])

  const fetchBooking = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.get(`/bookings/${bookingId}`)
      if (response.data.success) {
        setBooking(response.data.data)
      } else {
        throw new Error(response.data.message || 'Không thể tải thông tin vé')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Không thể tải thông tin vé'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchBooking()
  }

  const handleGoBack = () => {
    navigate(-1)
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

  const isShowCompleted = (booking: Booking) => {
    const showDateTime = new Date(`${booking.showtime.show_date} ${booking.showtime.show_time}`)
    return showDateTime < new Date()
  }

  const isShowSoon = (booking: Booking) => {
    const showDateTime = new Date(`${booking.showtime.show_date} ${booking.showtime.show_time}`)
    const now = new Date()
    const timeDiff = showDateTime.getTime() - now.getTime()
    const hoursDiff = timeDiff / (1000 * 60 * 60)
    return hoursDiff <= 2 && hoursDiff > 0
  }

  const getBookingStatusBadge = (booking: Booking) => {
    if (booking.booking_status === 'cancelled') {
      return <span className="status-badge cancelled">❌ Đã hủy</span>
    }
    
    if (booking.payment_status !== 'completed') {
      return <span className="status-badge pending">⏳ Chờ thanh toán</span>
    }

    if (isShowCompleted(booking)) {
      return <span className="status-badge completed">✅ Đã xem</span>
    }

    if (isShowSoon(booking)) {
      return <span className="status-badge soon">🚨 Sắp chiếu</span>
    }

    return <span className="status-badge active">🎫 Có hiệu lực</span>
  }

  if (loading) {
    return (
      <div className="ticket-page">
        <div className="ticket-container">
          <div className="ticket-loading">
            <div className="loading-spinner"></div>
            <h2>Đang tải thông tin vé...</h2>
            <p>Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="ticket-page">
        <div className="ticket-container">
          <div className="ticket-error">
            <div className="error-icon">❌</div>
            <h2>Không thể tải thông tin vé</h2>
            <p>{error || 'Không tìm thấy thông tin vé hoặc bạn không có quyền truy cập'}</p>
            <div className="error-actions">
              <button onClick={handleRefresh} className="btn btn-primary">
                🔄 Thử lại
              </button>
              <button onClick={handleGoBack} className="btn btn-secondary">
                ← Quay lại
              </button>
              <Link to="/my-bookings" className="btn btn-outline">
                🎫 Danh sách vé
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ticket-page">
      <div className="ticket-container">
        
        {/* Page Header */}
        <div className="page-header">
          <button onClick={handleGoBack} className="back-btn">
            ← Quay lại
          </button>
          
          <div className="page-title">
            <h1>Chi tiết vé điện tử</h1>
            <div className="page-subtitle">
              <span>Mã vé: #{booking.booking_code}</span>
              {getBookingStatusBadge(booking)}
            </div>
          </div>

          <div className="page-actions">
            <button 
              onClick={() => setDisplayMode(displayMode === 'full' ? 'compact' : 'full')}
              className="view-toggle-btn"
            >
              {displayMode === 'full' ? '📱 Thu gọn' : '📄 Mở rộng'}
            </button>
          </div>
        </div>

        {/* Show Status Alert */}
        {isShowSoon(booking) && booking.booking_status === 'confirmed' && (
          <div className="show-alert show-soon">
            <div className="alert-icon">🚨</div>
            <div className="alert-content">
              <h3>Phim sắp chiếu!</h3>
              <p>
                Suất chiếu sẽ bắt đầu vào {formatTime(booking.showtime.show_time)} ngày {formatDate(booking.showtime.show_date)}.
                Vui lòng đến rạp ít nhất 15 phút trước giờ chiếu.
              </p>
            </div>
          </div>
        )}

        {booking.booking_status === 'cancelled' && (
          <div className="show-alert cancelled">
            <div className="alert-icon">❌</div>
            <div className="alert-content">
              <h3>Vé đã được hủy</h3>
              <p>Vé này đã được hủy và không thể sử dụng để vào rạp.</p>
            </div>
          </div>
        )}

        {booking.payment_status !== 'completed' && (
          <div className="show-alert pending-payment">
            <div className="alert-icon">⏳</div>
            <div className="alert-content">
              <h3>Chưa hoàn tất thanh toán</h3>
              <p>Vé này chưa được thanh toán hoàn tất. Vui lòng hoàn tất thanh toán để có thể sử dụng vé.</p>
              <button className="complete-payment-btn">
                💳 Hoàn tất thanh toán
              </button>
            </div>
          </div>
        )}

        {/* E-Ticket Display */}
        <div className="ticket-display">
          <ETicket 
            booking={booking}
            displayMode={displayMode}
            showActions={true}
          />
        </div>

        {/* Additional Information */}
        <div className="ticket-info-panel">
          <div className="info-section">
            <h3>📋 Thông tin bổ sung</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Thời gian đặt:</span>
                <span className="info-value">
                  {new Date(booking.created_at).toLocaleString('vi-VN')}
                </span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Trạng thái đặt vé:</span>
                <span className={`info-value status-${booking.booking_status}`}>
                  {booking.booking_status === 'confirmed' ? 'Đã xác nhận' : 
                   booking.booking_status === 'cancelled' ? 'Đã hủy' : 
                   booking.booking_status}
                </span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Trạng thái thanh toán:</span>
                <span className={`info-value status-${booking.payment_status}`}>
                  {booking.payment_status === 'completed' ? 'Đã thanh toán' :
                   booking.payment_status === 'pending' ? 'Chờ thanh toán' :
                   booking.payment_status === 'failed' ? 'Thanh toán thất bại' :
                   booking.payment_status}
                </span>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3>🆘 Hỗ trợ khách hàng</h3>
            <div className="support-info">
              <p>Nếu bạn gặp vấn đề với vé hoặc cần hỗ trợ, vui lòng liên hệ:</p>
              <div className="support-contacts">
                <a href="tel:1900123456" className="support-contact">
                  📞 Hotline: 1900-123-456
                </a>
                <a href="mailto:support@cinebook.vn" className="support-contact">
                  ✉️ Email: support@cinebook.vn
                </a>
                <div className="support-contact">
                  💬 Chat trực tuyến: Từ 8:00 - 22:00 hàng ngày
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <Link to="/movies" className="action-link">
            🎬 Đặt vé mới
          </Link>
          <Link to="/my-bookings" className="action-link">
            🎫 Tất cả vé của tôi
          </Link>
          <button onClick={() => window.location.reload()} className="action-link">
            🔄 Làm mới
          </button>
        </div>

      </div>
    </div>
  )
}