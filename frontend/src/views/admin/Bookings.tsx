import { useEffect, useState } from 'react'
import api from '../../services/api'
import './Admin.css'

interface Booking {
  id: number
  booking_code: string
  user: { id: number; name: string; email: string }
  showtime: { 
    id: number
    movie: { title: string }
    theater: { name: string }
    show_date: string
    show_time: string
  }
  seats: string[]
  total_amount: number
  payment_status: string
  booking_status: string
  booked_at: string
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedMovie, setSelectedMovie] = useState('')
  const [selectedTheater, setSelectedTheater] = useState('')

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings')
      setBookings(response.data.data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = !selectedStatus || booking.booking_status === selectedStatus
    const matchesDate = !selectedDate || booking.showtime?.show_date === selectedDate
    const matchesMovie = !selectedMovie || booking.showtime?.movie?.title.includes(selectedMovie)
    const matchesTheater = !selectedTheater || booking.showtime?.theater?.name.includes(selectedTheater)
    return matchesStatus && matchesDate && matchesMovie && matchesTheater
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN')
  }

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success'
      case 'pending': return 'warning'
      case 'cancelled': return 'danger'
      default: return 'secondary'
    }
  }

  const exportBookings = () => {
    const csvContent = [
      ['Mã đặt vé', 'Khách hàng', 'Email', 'Phim', 'Rạp', 'Ngày', 'Giờ', 'Ghế', 'Tổng tiền', 'Trạng thái'],
      ...filteredBookings.map(b => [
        b.booking_code,
        b.user?.name || '',
        b.user?.email || '',
        b.showtime?.movie?.title || '',
        b.showtime?.theater?.name || '',
        formatDate(b.showtime?.show_date || ''),
        formatTime(b.showtime?.show_time || ''),
        b.seats?.join(', ') || '',
        b.total_amount || 0,
        b.booking_status
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'bookings_export.csv'
    link.click()
  }

  const getTotalRevenue = () => {
    return filteredBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)
  }

  if (loading) return <div className="loading">Đang tải danh sách đặt vé...</div>

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Quản lý đặt vé</h1>
        <div className="header-actions">
          <button onClick={exportBookings} className="btn btn-secondary">
            📊 Xuất CSV
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>Trạng thái:</label>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Ngày chiếu:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Tìm phim:</label>
            <input
              type="text"
              placeholder="Tên phim..."
              value={selectedMovie}
              onChange={(e) => setSelectedMovie(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Tìm rạp:</label>
            <input
              type="text"
              placeholder="Tên rạp..."
              value={selectedTheater}
              onChange={(e) => setSelectedTheater(e.target.value)}
            />
          </div>
        </div>
        
        <div className="filter-actions">
          <button 
            onClick={() => {
              setSelectedStatus('')
              setSelectedDate('')
              setSelectedMovie('')
              setSelectedTheater('')
            }}
            className="btn btn-small btn-secondary"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-section">
        <div className="summary-card">
          <h3>Tổng số đặt vé</h3>
          <p>{filteredBookings.length}</p>
        </div>
        <div className="summary-card">
          <h3>Đã xác nhận</h3>
          <p>{filteredBookings.filter(b => b.booking_status === 'confirmed').length}</p>
        </div>
        <div className="summary-card">
          <h3>Chờ xác nhận</h3>
          <p>{filteredBookings.filter(b => b.booking_status === 'pending').length}</p>
        </div>
        <div className="summary-card">
          <h3>Tổng doanh thu</h3>
          <p>{getTotalRevenue().toLocaleString('vi-VN')} VND</p>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã đặt vé</th>
              <th>Khách hàng</th>
              <th>Phim</th>
              <th>Rạp & Suất</th>
              <th>Ghế</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Ngày đặt</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((booking) => (
              <tr key={booking.id}>
                <td>
                  <div className="booking-code">
                    <strong>{booking.booking_code}</strong>
                  </div>
                </td>
                <td>
                  <div className="customer-info">
                    <h4>{booking.user?.name}</h4>
                    <p>{booking.user?.email}</p>
                  </div>
                </td>
                <td>{booking.showtime?.movie?.title}</td>
                <td>
                  <div className="showtime-info">
                    <div>{booking.showtime?.theater?.name}</div>
                    <div className="showtime-details">
                      {formatDate(booking.showtime?.show_date)} - {formatTime(booking.showtime?.show_time)}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="seats-info">
                    {booking.seats?.join(', ')}
                  </div>
                </td>
                <td>
                  <div className="amount">
                    {booking.total_amount?.toLocaleString('vi-VN')} VND
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${getStatusColor(booking.booking_status)}`}>
                    {booking.booking_status === 'confirmed' ? 'Đã xác nhận' :
                     booking.booking_status === 'pending' ? 'Chờ xác nhận' : 'Đã hủy'}
                  </span>
                </td>
                <td>{formatDate(booking.booked_at)}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-small btn-secondary">Chi tiết</button>
                    {booking.booking_status === 'pending' && (
                      <button className="btn btn-small btn-primary">Xác nhận</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 