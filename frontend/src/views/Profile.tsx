import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import './Profile.css'

interface User {
  id: number
  name: string
  email: string
  phone?: string
  city?: string
  date_of_birth?: string
  preferred_language?: string
  created_at: string
}

interface Booking {
  id: number
  booking_code: string
  movie: {
    title: string
    poster_url?: string
    duration: number
    genre: string[]
  }
  theater: {
    name: string
    address: string
  }
  showtime: {
    show_date: string
    show_time: string
  }
  seats: Array<{
    seat: string
    type: string
    price: number
  }>
  total_amount: number
  status: string
  created_at: string
}

interface UserStats {
  total_bookings: number
  total_spent: number
  favorite_genre: string
  membership_level: string
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'bookings' | 'stats' | 'preferences'>('info')

  // Form states
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    date_of_birth: '',
    preferred_language: 'vi'
  })

  // Sample data for demonstration
  const sampleUser: User = {
    id: 1,
    name: 'Nguyễn Văn An',
    email: 'nguyenvanan@gmail.com',
    phone: '0901234567',
    city: 'TP.HCM',
    date_of_birth: '1990-05-15',
    preferred_language: 'vi',
    created_at: '2023-01-15T10:30:00Z'
  }

  const sampleBookings: Booking[] = [
    {
      id: 1,
      booking_code: 'CB2024001',
      movie: {
        title: 'Avengers: Endgame',
        poster_url: 'https://picsum.photos/300/450?random=1',
        duration: 181,
        genre: ['Hành động', 'Khoa học viễn tưởng']
      },
      theater: {
        name: 'Galaxy Nguyễn Du',
        address: '116 Nguyễn Du, Quận 1, TP.HCM'
      },
      showtime: {
        show_date: '2024-08-15',
        show_time: '19:30'
      },
      seats: [
        { seat: 'G5', type: 'Gold', price: 115000 },
        { seat: 'G6', type: 'Gold', price: 115000 }
      ],
      total_amount: 230000,
      status: 'confirmed',
      created_at: '2024-08-10T14:30:00Z'
    },
    {
      id: 2,
      booking_code: 'CB2024002',
      movie: {
        title: 'Mai',
        poster_url: 'https://picsum.photos/300/450?random=2',
        duration: 131,
        genre: ['Tâm lý', 'Tình cảm']
      },
      theater: {
        name: 'CGV Landmark 81',
        address: 'Vincom Center Landmark 81, Bình Thạnh, TP.HCM'
      },
      showtime: {
        show_date: '2024-07-28',
        show_time: '20:45'
      },
      seats: [
        { seat: 'F8', type: 'Platinum', price: 160000 }
      ],
      total_amount: 160000,
      status: 'completed',
      created_at: '2024-07-25T16:20:00Z'
    },
    {
      id: 3,
      booking_code: 'CB2024003',
      movie: {
        title: 'Spider-Man: No Way Home',
        poster_url: 'https://picsum.photos/300/450?random=3',
        duration: 148,
        genre: ['Hành động', 'Khoa học viễn tưởng']
      },
      theater: {
        name: 'Lotte Cinema Diamond Plaza',
        address: 'Diamond Plaza, Quận 1, TP.HCM'
      },
      showtime: {
        show_date: '2024-06-12',
        show_time: '18:00'
      },
      seats: [
        { seat: 'H10', type: 'Box', price: 195000 },
        { seat: 'H11', type: 'Box', price: 195000 }
      ],
      total_amount: 390000,
      status: 'completed',
      created_at: '2024-06-08T11:15:00Z'
    }
  ]

  const sampleUserStats: UserStats = {
    total_bookings: 15,
    total_spent: 2450000,
    favorite_genre: 'Hành động',
    membership_level: 'Gold'
  }

  useEffect(() => {
    void fetchUserData()
  }, [])

  const fetchUserData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Simulate API call with sample data
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setUser(sampleUser)
      setFormData({
        name: sampleUser.name || '',
        email: sampleUser.email || '',
        phone: sampleUser.phone || '',
        city: sampleUser.city || '',
        date_of_birth: sampleUser.date_of_birth || '',
        preferred_language: sampleUser.preferred_language || 'vi'
      })
      
      setBookings(sampleBookings)
      setUserStats(sampleUserStats)
    } catch (err: unknown) {
      setError('Không thể tải thông tin người dùng')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      await api.put('/auth/profile', formData)
      setUser(prev => prev ? { ...prev, ...formData } : null)
      setEditing(false)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Không thể cập nhật thông tin'
      setError(errorMessage)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5) // Remove seconds
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận'
      case 'cancelled':
        return 'Đã hủy'
      case 'completed':
        return 'Đã hoàn thành'
      case 'used':
        return 'Đã sử dụng'
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
      case 'used':
        return 'status-completed'
      default:
        return 'status-default'
    }
  }

  const getMembershipColor = (level: string) => {
    switch (level) {
      case 'Gold':
        return '#FFD700'
      case 'Silver':
        return '#C0C0C0'
      case 'Platinum':
        return '#E5E4E2'
      default:
        return '#CD7F32' // Bronze
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-header">
          <h1>👤 Hồ sơ cá nhân</h1>
        </div>
        <div className="profile-loading">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-header">
          <h1>👤 Hồ sơ cá nhân</h1>
        </div>
        <div className="profile-error">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h2>Đã xảy ra lỗi</h2>
            <p>{error}</p>
            <button onClick={fetchUserData} className="btn btn-primary" type="button">
              Thử lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-header">
          <h1>👤 Hồ sơ cá nhân</h1>
        </div>
        <div className="profile-not-found">
          <div className="not-found-content">
            <div className="not-found-icon">❌</div>
            <h2>Không tìm thấy thông tin người dùng</h2>
            <p>Vui lòng đăng nhập lại để xem thông tin hồ sơ</p>
            <Link to="/login" className="btn btn-primary">
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="header-content">
          <h1>👤 Hồ sơ cá nhân</h1>
          <p>Quản lý thông tin cá nhân và lịch sử đặt vé</p>
        </div>
      </div>

      {/* Profile Content */}
      <div className="profile-content">
        <div className="profile-container">
          {/* Sidebar */}
          <div className="profile-sidebar">
            <div className="user-info">
              <div className="user-avatar">
                <span>{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <h3 className="user-name">{user.name}</h3>
              <p className="user-email">{user.email}</p>
            </div>

            <nav className="profile-nav">
              <button 
                className={`nav-item ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
                type="button"
              >
                📋 Thông tin cá nhân
              </button>
              <button 
                className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
                onClick={() => setActiveTab('bookings')}
                type="button"
              >
                🎫 Lịch sử đặt vé ({bookings.length})
              </button>
              <button 
                className={`nav-item ${activeTab === 'preferences' ? 'active' : ''}`}
                onClick={() => setActiveTab('preferences')}
              >
                ⚙️ Cài đặt
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="profile-main">
            {/* Personal Information Tab */}
            {activeTab === 'info' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h2>📋 Thông tin cá nhân</h2>
                  <button 
                    onClick={() => setEditing(!editing)}
                    className="btn btn-secondary"
                  >
                    {editing ? 'Hủy' : 'Chỉnh sửa'}
                  </button>
                </div>

                <div className="info-form">
                  <div className="form-group">
                    <label>Họ và tên</label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="form-input"
                      />
                    ) : (
                      <div className="info-value">{user.name}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <div className="info-value">{user.email}</div>
                  </div>

                  <div className="form-group">
                    <label>Số điện thoại</label>
                    {editing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="form-input"
                        placeholder="Nhập số điện thoại"
                      />
                    ) : (
                      <div className="info-value">{user.phone || 'Chưa cập nhật'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Thành phố</label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        className="form-input"
                        placeholder="Nhập thành phố"
                      />
                    ) : (
                      <div className="info-value">{user.city || 'Chưa cập nhật'}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Ngày tham gia</label>
                    <div className="info-value">{formatDate(user.created_at)}</div>
                  </div>

                  {editing && (
                    <div className="form-actions">
                      <button 
                        onClick={handleUpdateProfile}
                        className="btn btn-primary"
                        type="button"
                      >
                        Lưu thay đổi
                      </button>
                      <button 
                        onClick={() => {
                          setEditing(false)
                          setFormData({
                            name: user.name || '',
                            email: user.email || '',
                            phone: user.phone || '',
                            city: user.city || '',
                            date_of_birth: user.date_of_birth || '',
                            preferred_language: user.preferred_language || 'vi'
                          })
                        }}
                        className="btn btn-secondary"
                      >
                        Hủy
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bookings History Tab */}
            {activeTab === 'bookings' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h2>🎫 Lịch sử đặt vé</h2>
                  <Link to="/my-bookings" className="btn btn-primary">
                    Xem tất cả vé
                  </Link>
                </div>

                {bookings.length === 0 ? (
                  <div className="empty-bookings">
                    <div className="empty-icon">🎬</div>
                    <h3>Chưa có vé nào</h3>
                    <p>Bạn chưa đặt vé nào. Hãy khám phá phim và đặt vé ngay!</p>
                    <Link to="/movies" className="btn btn-primary">
                      Xem phim
                    </Link>
                  </div>
                ) : (
                  <div className="bookings-preview">
                    <div className="bookings-list">
                      {bookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="booking-item">
                          <div className="booking-movie">
                            <div className="movie-poster">
                              <img src={booking.movie.poster_url || ''} alt={booking.movie.title} />
                            </div>
                            <div className="booking-details">
                              <h4 className="movie-title">{booking.movie.title}</h4>
                              <div className="booking-info">
                                <span>🎭 {booking.theater.name}</span>
                                <span>📅 {formatDate(booking.showtime.show_date)}</span>
                                <span>⏰ {booking.showtime.show_time}</span>
                              </div>
                            </div>
                          </div>
                          <div className="booking-status">
                            <span className={`status-badge ${getStatusClass(booking.status)}`}>
                              {getStatusText(booking.status)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {bookings.length > 5 && (
                      <div className="view-more">
                        <Link to="/my-bookings" className="btn btn-secondary">
                          Xem tất cả {bookings.length} vé
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h2>⚙️ Cài đặt</h2>
                </div>

                <div className="preferences-content">
                  <div className="preference-section">
                    <h3>🔔 Thông báo</h3>
                    <div className="preference-item">
                      <div className="preference-info">
                        <label>Thông báo email</label>
                        <p>Nhận thông báo về vé và khuyến mãi qua email</p>
                      </div>
                      <label className="toggle">
                        <input type="checkbox" defaultChecked />
                        <span className="slider"></span>
                      </label>
                    </div>
                    
                    <div className="preference-item">
                      <div className="preference-info">
                        <label>Nhắc lịch xem phim</label>
                        <p>Nhận nhắc nhở trước khi xem phim</p>
                      </div>
                      <label className="toggle">
                        <input type="checkbox" defaultChecked />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="preference-section">
                    <h3>🌍 Ngôn ngữ</h3>
                    <div className="preference-item">
                      <div className="preference-info">
                        <label>Ngôn ngữ hiển thị</label>
                        <p>Chọn ngôn ngữ cho giao diện</p>
                      </div>
                      <select className="form-select">
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>

                  <div className="preference-section">
                    <h3>🔒 Bảo mật</h3>
                    <div className="preference-item">
                      <div className="preference-info">
                        <label>Đổi mật khẩu</label>
                        <p>Cập nhật mật khẩu tài khoản</p>
                      </div>
                      <button className="btn btn-secondary">
                        Đổi mật khẩu
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 