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
  recentActivities: any[]
  systemStatus: {
    isHealthy: boolean
    uptime: string
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardData>({
    totalMovies: 0,
    totalTheaters: 0,
    totalBookings: 0,
    totalRevenue: 0,
    recentBookings: [],
    todayBookings: 0,
    pendingReviews: 0,
    recentActivities: [],
    systemStatus: {
      isHealthy: true,
      uptime: '100%'
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  
  const { addToast } = useOutletContext<{ addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void }>()

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000) // Auto refresh
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)
    
    // Sample data as fallback
    const sampleData: DashboardData = {
      totalMovies: 25,
      totalTheaters: 8,
      totalBookings: 1250,
      totalRevenue: 125000000,
      recentBookings: [],
      todayBookings: 45,
      pendingReviews: 12,
      recentActivities: [
        {
          id: 1,
          type: 'booking',
          icon: '🎫',
          title: 'Đặt vé mới',
          description: 'Nguyễn Văn A đã đặt vé cho phim "Avengers: Endgame"',
          time: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
        },
        {
          id: 2,
          type: 'review',
          icon: '⭐',
          title: 'Đánh giá mới',
          description: 'Trần Thị B đã đánh giá phim "Spider-Man: No Way Home"',
          time: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
        },
        {
          id: 3,
          type: 'movie',
          icon: '🎬',
          title: 'Phim mới được thêm',
          description: 'Phim "The Batman" đã được thêm vào hệ thống',
          time: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
        }
      ],
      systemStatus: {
        isHealthy: true,
        uptime: '99.9%'
      }
    }
    
    try {
      // Try multiple endpoints to get comprehensive dashboard data
      const [dashboardResponse, moviesResponse, theatersResponse, bookingsResponse] = await Promise.allSettled([
        api.get('/admin/dashboard/stats'),
        api.get('/movies'),
        api.get('/theaters'),
        api.get('/admin/bookings')
      ])
      
      let dashboardData = { ...sampleData }
      
      // Process dashboard stats if available
      if (dashboardResponse.status === 'fulfilled' && dashboardResponse.value.data?.success) {
        dashboardData = {
          ...dashboardData,
          ...dashboardResponse.value.data.data
        }
        console.log('Admin Dashboard: Successfully loaded dashboard stats', dashboardResponse.value.data.data)
      } else if (dashboardResponse.status === 'rejected') {
        console.warn('Admin Dashboard: Failed to load dashboard stats:', dashboardResponse.reason?.response?.status, dashboardResponse.reason?.response?.data)
      }
      
      // Get movies count
      if (moviesResponse.status === 'fulfilled' && moviesResponse.value.data?.success) {
        const moviesData = moviesResponse.value.data.data
        // Handle paginated response structure
        if (moviesData && typeof moviesData === 'object' && moviesData.data) {
          // Paginated response
          dashboardData.totalMovies = moviesData.total || (Array.isArray(moviesData.data) ? moviesData.data.length : 0)
          console.log('Admin Dashboard: Loaded movies data (paginated)', { total: moviesData.total, count: moviesData.data?.length })
        } else if (Array.isArray(moviesData)) {
          // Direct array response
          dashboardData.totalMovies = moviesData.length
          console.log('Admin Dashboard: Loaded movies data (array)', { count: moviesData.length })
        }
      } else if (moviesResponse.status === 'rejected') {
        console.warn('Admin Dashboard: Failed to load movies:', moviesResponse.reason?.response?.status)
      }
      
      // Get theaters count
      if (theatersResponse.status === 'fulfilled' && theatersResponse.value.data?.success) {
        const theatersData = theatersResponse.value.data.data
        // Handle paginated response structure
        if (theatersData && typeof theatersData === 'object' && theatersData.data) {
          // Paginated response
          dashboardData.totalTheaters = theatersData.total || (Array.isArray(theatersData.data) ? theatersData.data.length : 0)
        } else if (Array.isArray(theatersData)) {
          // Direct array response
          dashboardData.totalTheaters = theatersData.length
        }
      }
      
      // Get bookings data
      if (bookingsResponse.status === 'fulfilled' && bookingsResponse.value.data?.success) {
        const bookingsResponseData = bookingsResponse.value.data.data
        let bookingsData: any[] = []
        
        // Handle paginated response structure
        if (bookingsResponseData && typeof bookingsResponseData === 'object' && bookingsResponseData.data) {
          // Paginated response
          bookingsData = Array.isArray(bookingsResponseData.data) ? bookingsResponseData.data : []
          dashboardData.totalBookings = bookingsResponseData.total || bookingsData.length
        } else if (Array.isArray(bookingsResponseData)) {
          // Direct array response
          bookingsData = bookingsResponseData
          dashboardData.totalBookings = bookingsData.length
        }
        
        if (bookingsData.length > 0) {
          dashboardData.todayBookings = bookingsData.filter((booking: any) => {
            const bookingDate = new Date(booking.created_at || booking.booked_at)
            const today = new Date()
            return bookingDate.toDateString() === today.toDateString()
          }).length
          
          // Calculate total revenue
          dashboardData.totalRevenue = bookingsData.reduce((total: number, booking: any) => {
            return total + (parseFloat(booking.total_amount) || 0)
          }, 0)
        }
      }
      
      setStats(dashboardData)
      setLastUpdated(new Date())
      
      if (addToast) {
        addToast('Dữ liệu dashboard đã được cập nhật', 'success')
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err)
      setError(err.response?.data?.message || 'Không thể tải dữ liệu dashboard từ server')
      
      // Use sample data as fallback
      setStats(sampleData)
      
      if (addToast) {
        addToast('Sử dụng dữ liệu mẫu do không thể kết nối server', 'warning')
      }
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

  const getRelativeTime = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Vừa xong'
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`
  }

  if (loading) return (
    <div className="admin-dashboard">
      <div className="loading">Đang tải dashboard...</div>
    </div>
  )

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <div className="header-content">
            <div>
              <h1>Admin Dashboard</h1>
              <p>Quản lý hệ thống CineBook</p>
            </div>
            <div className="header-actions">
              <button onClick={fetchDashboardData} className="btn btn-primary">
                🔄 Thử lại
              </button>
            </div>
          </div>
        </div>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Không thể tải dữ liệu dashboard</h2>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="btn btn-primary">
            Thử lại
          </button>
        </div>
      </div>
    )
  }

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
          <div className="stat-icon">🏥</div>
          <div className="stat-content">
            <h3>{stats.systemStatus.uptime}</h3>
            <p>Hệ thống hoạt động</p>
            <small className="stat-subtitle">
              {stats.systemStatus.isHealthy ? 'Hoạt động tốt' : 'Có vấn đề'}
            </small>
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
          {stats.recentActivities.length > 0 ? (
            stats.recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">{activity.icon}</div>
                <div className="activity-content">
                  <h4>{activity.title}</h4>
                  <p>{activity.description}</p>
                  <span className="activity-time">{getRelativeTime(new Date(activity.time))}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-activity">
              <p>Chưa có hoạt động nào gần đây</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 