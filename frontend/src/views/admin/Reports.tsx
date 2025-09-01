import { useEffect, useState } from 'react'
import api from '../../services/api'
import './Admin.css'

interface DashboardData {
  overview: {
    total_movies: number
    total_theaters: number
    total_bookings: number
    total_users: number
  }
  revenue: {
    total: number
    today: number
    this_week: number
    this_month: number
  }
  popular_movies: Array<{
    title: string
    bookings: number
    revenue: number
  }>
  busy_theaters: Array<{
    name: string
    bookings: number
    revenue: number
  }>
  monthly_bookings: Array<{
    month: number
    bookings: number
    revenue: number
  }>
}

export default function AdminReports() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('7d') // 7d, 30d, 90d, 1y

  useEffect(() => {
    fetchDashboardData()
  }, [dateRange])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get(`/admin/reports/dashboard?range=${dateRange}`)
      setDashboardData(response.data.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Fallback to dummy data
      setDashboardData({
        overview: {
          total_movies: 25,
          total_theaters: 8,
          total_bookings: 1247,
          total_users: 892
        },
        revenue: {
          total: 187500000,
          today: 12500000,
          this_week: 45000000,
          this_month: 187500000
        },
        popular_movies: [
          { title: 'Avengers: Endgame', bookings: 156, revenue: 23400000 },
          { title: 'Spider-Man: No Way Home', bookings: 142, revenue: 21300000 },
          { title: 'The Batman', bookings: 128, revenue: 19200000 },
          { title: 'Black Panther: Wakanda Forever', bookings: 115, revenue: 17250000 },
          { title: 'Doctor Strange 2', bookings: 98, revenue: 14700000 }
        ],
        busy_theaters: [
          { name: 'CGV Landmark 81', bookings: 234, revenue: 35100000 },
          { name: 'CGV Crescent Mall', bookings: 198, revenue: 29700000 },
          { name: 'Lotte Cinema Diamond', bookings: 167, revenue: 25050000 },
          { name: 'Galaxy Cinema', bookings: 145, revenue: 21750000 },
          { name: 'BHD Star Bitexco', bookings: 123, revenue: 18450000 }
        ],
        monthly_bookings: [
          { month: 1, bookings: 89, revenue: 13350000 },
          { month: 2, bookings: 156, revenue: 23400000 },
          { month: 3, bookings: 234, revenue: 35100000 },
          { month: 4, bookings: 198, revenue: 29700000 },
          { month: 5, bookings: 267, revenue: 40050000 },
          { month: 6, bookings: 345, revenue: 51750000 },
          { month: 7, bookings: 298, revenue: 44700000 },
          { month: 8, bookings: 234, revenue: 35100000 },
          { month: 9, bookings: 189, revenue: 28350000 },
          { month: 10, bookings: 156, revenue: 23400000 },
          { month: 11, bookings: 123, revenue: 18450000 },
          { month: 12, bookings: 98, revenue: 14700000 }
        ]
      })
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

  const getMonthName = (month: number) => {
    const months = [
      'T1', 'T2', 'T3', 'T4', 'T5', 'T6',
      'T7', 'T8', 'T9', 'T10', 'T11', 'T12'
    ]
    return months[month - 1]
  }

  const exportReport = () => {
    if (!dashboardData) return

    const csvContent = [
      ['Báo cáo tổng hợp', ''],
      ['Thời gian', new Date().toLocaleDateString('vi-VN')],
      ['', ''],
      ['Tổng quan', ''],
      ['Tổng số phim', dashboardData.overview.total_movies],
      ['Tổng số rạp', dashboardData.overview.total_theaters],
      ['Tổng số đặt vé', dashboardData.overview.total_bookings],
      ['Tổng số người dùng', dashboardData.overview.total_users],
      ['', ''],
      ['Doanh thu', ''],
      ['Tổng doanh thu', formatCurrency(dashboardData.revenue.total)],
      ['Hôm nay', formatCurrency(dashboardData.revenue.today)],
      ['Tuần này', formatCurrency(dashboardData.revenue.this_week)],
      ['Tháng này', formatCurrency(dashboardData.revenue.this_month)],
      ['', ''],
      ['Phim phổ biến', 'Đặt vé', 'Doanh thu'],
      ...dashboardData.popular_movies.map(m => [
        m.title, m.bookings, formatCurrency(m.revenue)
      ]),
      ['', ''],
      ['Rạp bận rộn', 'Đặt vé', 'Doanh thu'],
      ...dashboardData.busy_theaters.map(t => [
        t.name, t.bookings, formatCurrency(t.revenue)
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `report_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) return <div className="loading">Đang tải báo cáo...</div>
  if (!dashboardData) return <div className="error">Không thể tải dữ liệu báo cáo</div>

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Báo cáo & Thống kê</h1>
        <div className="header-actions">
          <div className="date-range-selector">
            <label>Thời gian:</label>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="7d">7 ngày qua</option>
              <option value="30d">30 ngày qua</option>
              <option value="90d">90 ngày qua</option>
              <option value="1y">1 năm qua</option>
            </select>
          </div>
          <button onClick={exportReport} className="btn btn-secondary">
            📊 Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Tổng quan
        </button>
        <button 
          className={`tab ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
        >
          Doanh thu
        </button>
        <button 
          className={`tab ${activeTab === 'movies' ? 'active' : ''}`}
          onClick={() => setActiveTab('movies')}
        >
          Phim phổ biến
        </button>
        <button 
          className={`tab ${activeTab === 'theaters' ? 'active' : ''}`}
          onClick={() => setActiveTab('theaters')}
        >
          Rạp bận rộn
        </button>
      </div>

      {/* Reports Content */}
      <div className="reports-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-section">
            {/* Key Metrics */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon">🎬</div>
                <div className="metric-content">
                  <h3>{dashboardData.overview.total_movies}</h3>
                  <p>Tổng số phim</p>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">🏢</div>
                <div className="metric-content">
                  <h3>{dashboardData.overview.total_theaters}</h3>
                  <p>Rạp chiếu phim</p>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">🎫</div>
                <div className="metric-content">
                  <h3>{dashboardData.overview.total_bookings}</h3>
                  <p>Đơn đặt vé</p>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon">👥</div>
                <div className="metric-content">
                  <h3>{dashboardData.overview.total_users}</h3>
                  <p>Người dùng</p>
                </div>
              </div>
            </div>

            {/* Revenue Summary */}
            <div className="revenue-summary">
              <h2>Tổng quan doanh thu</h2>
              <div className="revenue-cards">
                <div className="revenue-card">
                  <h4>Hôm nay</h4>
                  <p className="revenue-amount">{formatCurrency(dashboardData.revenue.today)}</p>
                </div>
                <div className="revenue-card">
                  <h4>Tuần này</h4>
                  <p className="revenue-amount">{formatCurrency(dashboardData.revenue.this_week)}</p>
                </div>
                <div className="revenue-card">
                  <h4>Tháng này</h4>
                  <p className="revenue-amount">{formatCurrency(dashboardData.revenue.this_month)}</p>
                </div>
                <div className="revenue-card total">
                  <h4>Tổng cộng</h4>
                  <p className="revenue-amount">{formatCurrency(dashboardData.revenue.total)}</p>
                </div>
              </div>
            </div>

            {/* Monthly Bookings Chart */}
            <div className="chart-section">
              <h2>Đặt vé theo tháng</h2>
              <div className="bar-chart">
                {dashboardData.monthly_bookings.map((item) => (
                  <div key={item.month} className="bar-item">
                    <div className="bar-label">{getMonthName(item.month)}</div>
                    <div className="bar-container">
                      <div 
                        className="bar" 
                        style={{ 
                          height: `${(item.bookings / Math.max(...dashboardData.monthly_bookings.map(b => b.bookings))) * 200}px` 
                        }}
                      />
                    </div>
                    <div className="bar-value">{item.bookings}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="revenue-section">
            <div className="revenue-details">
              <h2>Chi tiết doanh thu</h2>
              <div className="revenue-breakdown">
                <div className="breakdown-item">
                  <span className="label">Doanh thu hôm nay:</span>
                  <span className="value">{formatCurrency(dashboardData.revenue.today)}</span>
                </div>
                <div className="breakdown-item">
                  <span className="label">Doanh thu tuần này:</span>
                  <span className="value">{formatCurrency(dashboardData.revenue.this_week)}</span>
                </div>
                <div className="breakdown-item">
                  <span className="label">Doanh thu tháng này:</span>
                  <span className="value">{formatCurrency(dashboardData.revenue.this_month)}</span>
                </div>
                <div className="breakdown-item total">
                  <span className="label">Tổng doanh thu:</span>
                  <span className="value">{formatCurrency(dashboardData.revenue.total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Movies Tab */}
        {activeTab === 'movies' && (
          <div className="movies-section">
            <h2>Phim phổ biến nhất</h2>
            <div className="ranking-list">
              {dashboardData.popular_movies.map((movie, index) => (
                <div key={movie.title} className="ranking-item">
                  <div className="ranking-number">#{index + 1}</div>
                  <div className="ranking-content">
                    <h4>{movie.title}</h4>
                    <div className="ranking-stats">
                      <span>{movie.bookings} đặt vé</span>
                      <span className="revenue">{formatCurrency(movie.revenue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Theaters Tab */}
        {activeTab === 'theaters' && (
          <div className="theaters-section">
            <h2>Rạp bận rộn nhất</h2>
            <div className="ranking-list">
              {dashboardData.busy_theaters.map((theater, index) => (
                <div key={theater.name} className="ranking-item">
                  <div className="ranking-number">#{index + 1}</div>
                  <div className="ranking-content">
                    <h4>{theater.name}</h4>
                    <div className="ranking-stats">
                      <span>{theater.bookings} đặt vé</span>
                      <span className="revenue">{formatCurrency(theater.revenue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 