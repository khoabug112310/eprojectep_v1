import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../../services/api'
import './Confirmation.css'

interface Booking {
  id: number
  booking_code: string
  movie: {
    title: string
    poster_url?: string
  }
  theater: {
    name: string
    address?: string
  }
  showtime: {
    show_date: string
    show_time: string
  }
  seats: string[]
  total_amount: number
  created_at: string
}

export default function Confirmation() {
  const [searchParams] = useSearchParams()
  const bookingId = searchParams.get('booking_id')
  
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (bookingId) {
      fetchBooking()
    } else {
      setError('Không tìm thấy thông tin đặt vé')
      setLoading(false)
    }
  }, [bookingId])

  const fetchBooking = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.get(`/bookings/${bookingId}`)
      setBooking(response.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải thông tin đặt vé')
    } finally {
      setLoading(false)
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

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // Create a simple text file with booking details
    const content = `
CineBook - E-Ticket
===================

Mã vé: ${booking?.booking_code}
Phim: ${booking?.movie.title}
Rạp: ${booking?.theater.name}
Ngày: ${booking?.showtime.show_date}
Giờ: ${booking?.showtime.show_time}
Ghế: ${booking?.seats.join(', ')}
Tổng tiền: ${formatCurrency(booking?.total_amount || 0)}

Cảm ơn bạn đã sử dụng dịch vụ của CineBook!
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ticket-${booking?.booking_code}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-container">
          <div className="confirmation-loading">
            <div className="loading-spinner"></div>
            <h2>Đang xử lý đặt vé...</h2>
            <p>Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-container">
          <div className="confirmation-error">
            <h2>Không thể tải thông tin đặt vé</h2>
            <p>{error || 'Không tìm thấy thông tin đặt vé'}</p>
            <Link to="/movies" className="btn btn-primary">
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="confirmation-page">
      <div className="confirmation-container">
        {/* Success Header */}
        <div className="success-header">
          <div className="success-icon">✅</div>
          <h1>Đặt vé thành công!</h1>
          <p>Cảm ơn bạn đã sử dụng dịch vụ của CineBook</p>
        </div>

        {/* E-Ticket */}
        <div className="e-ticket">
          <div className="ticket-header">
            <div className="ticket-info">
              <h2>E-Ticket</h2>
              <p className="booking-code">Mã vé: {booking.booking_code}</p>
            </div>
            <div className="ticket-actions">
              <button onClick={handlePrint} className="btn btn-secondary">
                🖨️ In vé
              </button>
              <button onClick={handleDownload} className="btn btn-secondary">
                📥 Tải xuống
              </button>
            </div>
          </div>

          <div className="ticket-content">
            <div className="movie-info">
              <div className="movie-poster">
                <img 
                  src={booking.movie.poster_url || '/placeholder-movie.jpg'} 
                  alt={booking.movie.title}
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-movie.jpg'
                  }}
                />
              </div>
              <div className="movie-details">
                <h3>{booking.movie.title}</h3>
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
              </div>
            </div>

            <div className="seats-info">
              <h4>Ghế đã chọn:</h4>
              <div className="seats-list">
                {booking.seats.map((seat, index) => (
                  <span key={index} className="seat-tag">
                    {seat}
                  </span>
                ))}
              </div>
            </div>

            <div className="payment-info">
              <div className="payment-row">
                <span>Giá vé:</span>
                <span>{formatCurrency(booking.total_amount)}</span>
              </div>
              <div className="payment-row total">
                <span>Tổng cộng:</span>
                <span>{formatCurrency(booking.total_amount)}</span>
              </div>
            </div>

            <div className="ticket-footer">
              <div className="qr-code">
                <div className="qr-placeholder">
                  QR Code
                </div>
                <p>Quét mã để vào rạp</p>
              </div>
              <div className="ticket-note">
                <p>⚠️ Vui lòng đến rạp ít nhất 15 phút trước giờ chiếu</p>
                <p>📱 Mang theo mã vé này hoặc điện thoại để vào rạp</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="confirmation-actions">
          <Link to="/movies" className="btn btn-primary">
            🎬 Đặt vé khác
          </Link>
          <Link to="/my-bookings" className="btn btn-secondary">
            🎫 Xem vé của tôi
          </Link>
        </div>
      </div>
    </div>
  )
} 