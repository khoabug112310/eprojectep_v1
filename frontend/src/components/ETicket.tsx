import { useState } from 'react'
import './ETicket.css'

interface ETicketProps {
  booking: {
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
    created_at: string
    qr_code?: string
  }
  displayMode?: 'full' | 'compact' | 'print'
  showActions?: boolean
  onDownload?: () => void
  onPrint?: () => void
  onShare?: () => void
}

export default function ETicket({ 
  booking, 
  displayMode = 'full', 
  showActions = true,
  onDownload,
  onPrint,
  onShare
}: ETicketProps) {

  const [imageError, setImageError] = useState(false)

  // Early return if booking is null or undefined
  if (!booking) {
    return (
      <div className="e-ticket error">
        <div className="error-message">
          <h3>Không có thông tin vé</h3>
          <p>Vui lòng thử lại sau.</p>
        </div>
      </div>
    )
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

  const formatSeats = () => {
    if (!booking?.seats || !Array.isArray(booking.seats)) {
      return ''
    }
    
    if (booking.seats.length === 0) {
      return ''
    }
    
    if (typeof booking.seats[0] === 'string') {
      return (booking.seats as string[]).join(', ')
    } else {
      return (booking.seats as Array<{ seat: string; type: string; price: number }>)
        .map(s => s.seat).join(', ')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅'
      case 'pending': return '⏳'
      case 'failed': return '❌'
      case 'refunded': return '💸'
      default: return '🎫'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Đã thanh toán'
      case 'pending': return 'Chờ thanh toán'
      case 'failed': return 'Thanh toán thất bại'
      case 'refunded': return 'Đã hoàn tiền'
      default: return 'Chưa xác định'
    }
  }

  const handleDefaultDownload = () => {
    const content = `
CineBook - E-Ticket
===================

Mã vé: ${booking.booking_code}
Phim: ${booking.movie.title}
Rạp: ${booking.theater.name}
Địa chỉ: ${booking.theater.address || 'N/A'}
Ngày: ${formatDate(booking.showtime.show_date)}
Giờ: ${formatTime(booking.showtime.show_time)}
Ghế: ${formatSeats()}
Tổng tiền: ${formatCurrency(booking.total_amount)}
Trạng thái: ${getStatusText(booking.payment_status)}

⚠️ Lưu ý quan trọng:
• Vui lòng đến rạp ít nhất 15 phút trước giờ chiếu
• Mang theo mã vé này hoặc điện thoại để vào rạp
• Không được mang thức ăn từ bên ngoài vào rạp
• Tắt tiếng điện thoại trong suốt thời gian xem phim

Cảm ơn bạn đã sử dụng dịch vụ của CineBook!
Hotline: 1900-123-456 | Email: support@cinebook.vn
    `.trim()

    const blob = new Blob([content], { type: 'text/plain; charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cinebook-ticket-${booking.booking_code}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDefaultPrint = () => {
    window.print()
  }

  const handleDefaultShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Vé xem phim: ${booking.movie.title}`,
        text: `Tôi đã đặt vé xem phim "${booking.movie.title}" tại ${booking.theater.name} vào ${formatDate(booking.showtime.show_date)} lúc ${formatTime(booking.showtime.show_time)}. Mã vé: ${booking.booking_code}`,
        url: window.location.href
      })
    } else {
      // Fallback to copy to clipboard
      const shareText = `Tôi đã đặt vé xem phim "${booking.movie.title}" tại ${booking.theater.name} vào ${formatDate(booking.showtime.show_date)} lúc ${formatTime(booking.showtime.show_time)}. Mã vé: ${booking.booking_code}`
      navigator.clipboard.writeText(shareText)
      alert('Đã sao chép thông tin vé vào clipboard!')
    }
  }

  return (
    <div className={`e-ticket ${displayMode}`} data-testid="e-ticket-container" role="article">
      
      {/* Ticket Header */}
      {displayMode !== 'compact' && (
        <div className="ticket-header">
          <div className="ticket-info">
            <div className="ticket-logo">
              🎬 <span>CineBook</span>
            </div>
            <div className="ticket-title">
              <h2 role="heading" aria-level="2">E-Ticket</h2>
              <p className="booking-code">#{booking.booking_code}</p>
            </div>
          </div>
          
          <div className="ticket-status">
            <span className={`status-badge status-${booking.payment_status}`}>
              {getStatusIcon(booking.payment_status)} {getStatusText(booking.payment_status)}
            </span>
          </div>
        </div>
      )}

      {/* Ticket Body */}
      <div className="ticket-body">
        
        {/* Movie Information */}
        <div className="movie-section">
          <div className="movie-poster">
            {!imageError && booking.movie?.poster_url ? (
              <img 
                src={booking.movie.poster_url} 
                alt={booking.movie?.title || 'Movie poster'}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="poster-placeholder">
                🎬
                <span>Poster</span>
              </div>
            )}
          </div>
          
          <div className="movie-details">
            <h3 className="movie-title">{booking.movie?.title || 'Phim không xác định'}</h3>
            
            {booking.movie?.duration && (
              <div className="movie-meta">
                <span className="duration">⏱️ {booking.movie.duration} phút</span>
                {booking.movie.age_rating && (
                  <span className="age-rating">{booking.movie.age_rating}</span>
                )}
              </div>
            )}
            
            {booking.movie?.genre && booking.movie.genre.length > 0 && (
              <div className="genre-tags">
                {booking.movie.genre.slice(0, 3).map((genre, index) => (
                  <span key={index} className="genre-tag">{genre}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Showtime Information */}
        <div className="showtime-section">
          <div className="showtime-item">
            <div className="showtime-icon">📅</div>
            <div className="showtime-details">
              <span className="showtime-label">Ngày chiếu</span>
              <span className="showtime-value">{booking.showtime?.show_date ? formatDate(booking.showtime.show_date) : 'Chưa xác định'}</span>
            </div>
          </div>
          
          <div className="showtime-item">
            <div className="showtime-icon">⏰</div>
            <div className="showtime-details">
              <span className="showtime-label">Giờ chiếu</span>
              <span className="showtime-value">{booking.showtime?.show_time ? formatTime(booking.showtime.show_time) : 'Chưa xác định'}</span>
            </div>
          </div>
          
          <div className="showtime-item">
            <div className="showtime-icon">🎭</div>
            <div className="showtime-details">
              <span className="showtime-label">Rạp chiếu</span>
              <span className="showtime-value">{booking.theater?.name || 'Rạp không xác định'}</span>
              {booking.theater?.address && (
                <span className="theater-address">{booking.theater.address}</span>
              )}
            </div>
          </div>
        </div>

        {/* Seat Information */}
        <div className="seats-section">
          <h4>Thông tin ghế</h4>
          <div className="seats-info">
            <div className="seats-list">
              <span className="seats-label">Ghế đã chọn:</span>
              <div className="seats-tags">
                {formatSeats().split(', ').map((seat, index) => (
                  <span key={index} className="seat-tag">{seat}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="payment-section">
          <div className="payment-row">
            <span>Tổng số ghế:</span>
            <span>{Array.isArray(booking.seats) ? booking.seats.length : 0} ghế</span>
          </div>
          <div className="payment-row total">
            <span>Tổng thanh toán:</span>
            <span className="total-amount">{formatCurrency(booking.total_amount)}</span>
          </div>
        </div>

        {/* QR Code Section */}
        {displayMode !== 'compact' && (
          <div className="qr-section">
            <div className="qr-code">
              {booking.qr_code ? (
                <img src={booking.qr_code} alt="QR Code" className="qr-image" />
              ) : (
                <div className="qr-placeholder">
                  <div className="qr-pattern">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div key={i} className={`qr-dot ${Math.random() > 0.5 ? 'filled' : ''}`}></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="qr-instruction">Quét mã QR để vào rạp</p>
          </div>
        )}

        {/* Important Notes */}
        {displayMode === 'full' && (
          <div className="notes-section">
            <h5>📋 Lưu ý quan trọng</h5>
            <ul className="notes-list">
              <li>⚠️ Vui lòng đến rạp ít nhất 15 phút trước giờ chiếu</li>
              <li>📱 Mang theo mã vé này hoặc điện thoại để vào rạp</li>
              <li>🚫 Không được mang thức ăn từ bên ngoài vào rạp</li>
              <li>🔇 Tắt tiếng điện thoại trong suốt thời gian xem phim</li>
              <li>🎫 Vé không được hoàn lại sau khi đã xuất</li>
            </ul>
          </div>
        )}

      </div>

      {/* Ticket Actions */}
      {showActions && displayMode !== 'print' && (
        <div className="ticket-actions">
          <button 
            onClick={onDownload || handleDefaultDownload} 
            className="action-btn download-btn"
            aria-label="Tải xuống vé"
          >
            <span className="btn-icon">📥</span>
            Tải xuống
          </button>
          
          <button 
            onClick={onPrint || handleDefaultPrint} 
            className="action-btn print-btn"
            aria-label="In vé"
          >
            <span className="btn-icon">🖨️</span>
            In vé
          </button>
          
          <button 
            onClick={onShare || handleDefaultShare} 
            className="action-btn share-btn"
            aria-label="Chia sẻ vé"
          >
            <span className="btn-icon">📤</span>
            Chia sẻ
          </button>
        </div>
      )}

      {/* Ticket Footer */}
      <div className="ticket-footer">
        <div className="footer-info">
          <span>🎬 CineBook</span>
          <span>•</span>
          <span>📞 1900-123-456</span>
          <span>•</span>
          <span>✉️ support@cinebook.vn</span>
        </div>
        
        {displayMode !== 'compact' && (
          <div className="booking-time">
            Đặt vé lúc: {new Date(booking.created_at).toLocaleString('vi-VN')}
          </div>
        )}
      </div>

    </div>
  )
}