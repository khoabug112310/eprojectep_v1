import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import api from '../../services/api'
import './Admin.css'

interface DashboardData {
  totalMovies: number
  totalTheaters: number
  totalBookings: number
  totalRevenue: number
  recentBookings: any[]
  todayBookings: number
  pendingReviews: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardData>({
    totalMovies: 0,
    totalTheaters: 0,
    totalBookings: 0,
    totalRevenue: 0,
    recentBookings: [],
    todayBookings: 0,
    pendingReviews: 0
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  
  const { addToast } = useOutletContext<{ addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void }>()

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000) // Auto refresh
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/admin/reports/dashboard')
      setStats(response.data.data)
      setLastUpdated(new Date())
      addToast('Dữ liệu dashboard đã được cập nhật', 'success')
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      addToast('Không thể tải dữ liệu dashboard', 'error')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) return <div className="loading">Đang tải dashboard...</div>

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Quản lý hệ thống CineBook</p>
          </div>
          <div className="header-actions">
            <button onClick={fetchDashboardData} className="btn btn-secondary">
              🔄 Làm mới
            </button>
            <span className="last-updated">Cập nhật lúc: {formatTime(lastUpdated)}</span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎬</div>
          <div className="stat-content">
            <h3>{stats.totalMovies}</h3>
            <p>Phim</p>
          </div>
          <Link to="/admin/movies" className="stat-link">Xem chi tiết</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>{stats.totalTheaters}</h3>
            <p>Rạp chiếu</p>
          </div>
          <Link to="/admin/theaters" className="stat-link">Xem chi tiết</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎫</div>
          <div className="stat-content">
            <h3>{stats.totalBookings}</h3>
            <p>Đơn đặt vé</p>
            <small className="stat-subtitle">Hôm nay: {stats.todayBookings}</small>
          </div>
          <Link to="/admin/bookings" className="stat-link">Xem chi tiết</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.totalRevenue)}</h3>
            <p>Doanh thu</p>
          </div>
          <Link to="/admin/reports" className="stat-link">Xem chi tiết</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>{stats.pendingReviews}</h3>
            <p>Đánh giá chờ duyệt</p>
          </div>
          <Link to="/admin/reviews" className="stat-link">Xem chi tiết</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>100%</h3>
            <p>Hệ thống hoạt động</p>
          </div>
          <Link to="/admin/users" className="stat-link">Xem chi tiết</Link>
        </div>
      </div>

      <div className="quick-actions">
        <Link to="/admin/movies" className="action-card">
          <div className="action-icon">🎬</div>
          <h3>Quản lý phim</h3>
          <p>Thêm, sửa, xóa phim</p>
        </Link>

        <Link to="/admin/showtimes" className="action-card">
          <div className="action-icon">📅</div>
          <h3>Lịch chiếu</h3>
          <p>Quản lý lịch chiếu phim</p>
        </Link>

        <Link to="/admin/reports" className="action-card">
          <div className="action-icon">📊</div>
          <h3>Báo cáo & Thống kê</h3>
          <p>Xem báo cáo doanh thu và analytics</p>
        </Link>

        <Link to="/admin/bookings" className="action-card">
          <div className="action-icon">📋</div>
          <h3>Quản lý đặt vé</h3>
          <p>Xem và xử lý đơn đặt vé</p>
        </Link>

        <Link to="/admin/users" className="action-card">
          <div className="action-icon">👥</div>
          <h3>Quản lý người dùng</h3>
          <p>Xem và quản lý tài khoản người dùng</p>
        </Link>

        <Link to="/admin/reviews" className="action-card">
          <div className="action-icon">⭐</div>
          <h3>Quản lý đánh giá</h3>
          <p>Duyệt và quản lý đánh giá phim</p>
        </Link>
      </div>

      <div className="recent-activity">
        <div className="activity-header">
          <h2>Hoạt động gần đây</h2>
          <button className="btn btn-small btn-secondary">Xem tất cả</button>
        </div>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">🎫</div>
            <div className="activity-content">
              <h4>Đặt vé mới</h4>
              <p>Nguyễn Văn A đã đặt vé cho phim "Avengers: Endgame"</p>
              <span className="activity-time">5 phút trước</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">⭐</div>
            <div className="activity-content">
              <h4>Đánh giá mới</h4>
              <p>Trần Thị B đã đánh giá phim "Spider-Man: No Way Home"</p>
              <span className="activity-time">15 phút trước</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">🎬</div>
            <div className="activity-content">
              <h4>Phim mới được thêm</h4>
              <p>Phim "The Batman" đã được thêm vào hệ thống</p>
              <span className="activity-time">1 giờ trước</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">🏢</div>
            <div className="activity-content">
              <h4>Rạp mới được thêm</h4>
              <p>Rạp CGV Landmark 81 đã được thêm vào hệ thống</p>
              <span className="activity-time">1 ngày trước</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">👥</div>
            <div className="activity-content">
              <h4>Người dùng mới đăng ký</h4>
              <p>Nguyễn Văn C đã đăng ký tài khoản mới</p>
              <span className="activity-time">1 ngày trước</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 