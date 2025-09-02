import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../../services/api'
import ETicket from '../../components/ETicket'
import './Confirmation.css'

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
  created_at: string
  qr_code?: string
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
    // Enhanced download with more details
    const seatsText = Array.isArray(booking?.seats) 
      ? (typeof booking.seats[0] === 'string' 
          ? booking.seats.join(', ') 
          : booking.seats.map(s => (s as any).seat || s).join(', '))
      : ''

    const content = `
CineBook - E-Ticket
===================

Mã vé: ${booking?.booking_code}
Phim: ${booking?.movie.title}
${ booking?.movie.duration ? `Thời lượng: ${booking.movie.duration} phút\n` : '' }${ booking?.movie.genre ? `Thể loại: ${booking.movie.genre.join(', ')}\n` : '' }Rạp: ${booking?.theater.name}
${ booking?.theater.address ? `Địa chỉ: ${booking.theater.address}\n` : '' }Ngày: ${formatDate(booking?.showtime.show_date || '')}
Giờ: ${formatTime(booking?.showtime.show_time || '')}
Ghế: ${seatsText}
Tổng tiền: ${formatCurrency(booking?.total_amount || 0)}
Trạng thái: ${booking?.payment_status}

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
    a.download = `cinebook-ticket-${booking?.booking_code}.txt`
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
        <ETicket 
          booking={{
            ...booking,
            payment_status: booking.payment_status || 'completed'
          }}
          displayMode="full"
          showActions={true}
          onDownload={handleDownload}
          onPrint={handlePrint}
        />

        {/* Actions */}
        <div className="confirmation-actions">
          <Link to="/movies" className="btn btn-primary">
            🎬 Đặt vé khác
          </Link>
          <Link to="/my-bookings" className="btn btn-secondary">
            🎫 Xem vé của tôi
          </Link>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-outline"
          >
            🔄 Tải lại trang
          </button>
        </div>
      </div>
    </div>
  )
} 