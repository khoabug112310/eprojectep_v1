import React, { useState, useEffect, useMemo } from 'react'
import './AdminAnalytics.css'

interface AnalyticsData {
  revenue: {
    daily: number[]
    weekly: number[]
    monthly: number[]
    yearly: number[]
    total: number
    growth: number
  }
  bookings: {
    total: number
    confirmed: number
    cancelled: number
    pending: number
    refunded: number
    growth: number
  }
  movies: {
    total: number
    active: number
    comingSoon: number
    mostPopular: Array<{
      id: string
      title: string
      bookings: number
      revenue: number
      rating: number
    }>
  }
  users: {
    total: number
    active: number
    newUsers: number
    returningUsers: number
    growth: number
  }
  theaters: {
    total: number
    occupancyRate: number
    performance: Array<{
      id: string
      name: string
      revenue: number
      bookings: number
      occupancy: number
    }>
  }
}

interface DateRange {
  start: Date
  end: Date
  period: 'day' | 'week' | 'month' | 'year'
}

interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf'
  includeCharts: boolean
  sections: string[]
}

export default function AdminAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
    period: 'day'
  })
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'bookings' | 'users'>('revenue')
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'excel',
    includeCharts: true,
    sections: ['revenue', 'bookings', 'movies', 'users', 'theaters']
  })
  const [isExporting, setIsExporting] = useState(false)

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData()
  }, [dateRange])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString(),
          period: dateRange.period
        })
      })

      if (!response.ok) {
        throw new Error('Failed to load analytics data')
      }

      const data = await response.json()
      setAnalyticsData(data.data)
    } catch (error) {
      console.error('Error loading analytics:', error)
      setError(error instanceof Error ? error.message : 'Failed to load analytics')
      
      // Mock data for development
      setAnalyticsData({
        revenue: {
          daily: Array.from({ length: 30 }, (_, i) => Math.random() * 1000000 + 500000),
          weekly: Array.from({ length: 12 }, (_, i) => Math.random() * 5000000 + 2000000),
          monthly: Array.from({ length: 12 }, (_, i) => Math.random() * 20000000 + 10000000),
          yearly: Array.from({ length: 5 }, (_, i) => Math.random() * 200000000 + 100000000),
          total: 15650000,
          growth: 12.5
        },
        bookings: {
          total: 2457,
          confirmed: 2234,
          cancelled: 156,
          pending: 45,
          refunded: 22,
          growth: 8.3
        },
        movies: {
          total: 24,
          active: 18,
          comingSoon: 6,
          mostPopular: [
            { id: '1', title: 'Avengers: Endgame', bookings: 1234, revenue: 12340000, rating: 4.8 },
            { id: '2', title: 'Spider-Man: No Way Home', bookings: 987, revenue: 9870000, rating: 4.7 },
            { id: '3', title: 'Avatar: The Way of Water', bookings: 856, revenue: 8560000, rating: 4.6 }
          ]
        },
        users: {
          total: 15674,
          active: 12456,
          newUsers: 234,
          returningUsers: 1456,
          growth: 15.2
        },
        theaters: {
          total: 8,
          occupancyRate: 76.5,
          performance: [
            { id: '1', name: 'Galaxy Nguyen Trai', revenue: 5600000, bookings: 856, occupancy: 82.3 },
            { id: '2', name: 'CGV Vincom', revenue: 4200000, bookings: 723, occupancy: 78.1 },
            { id: '3', name: 'Lotte Cinema', revenue: 3800000, bookings: 645, occupancy: 71.2 }
          ]
        }
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate chart data
  const chartData = useMemo(() => {
    if (!analyticsData) return null

    const getDataByPeriod = () => {
      switch (dateRange.period) {
        case 'day':
          return analyticsData.revenue.daily
        case 'week':
          return analyticsData.revenue.weekly
        case 'month':
          return analyticsData.revenue.monthly
        case 'year':
          return analyticsData.revenue.yearly
        default:
          return analyticsData.revenue.daily
      }
    }

    return {
      revenue: getDataByPeriod(),
      bookings: selectedMetric === 'bookings' ? analyticsData.revenue.daily.map((_, i) => 
        Math.floor(Math.random() * 100) + 50
      ) : [],
      users: selectedMetric === 'users' ? analyticsData.revenue.daily.map((_, i) => 
        Math.floor(Math.random() * 50) + 20
      ) : []
    }
  }, [analyticsData, dateRange.period, selectedMetric])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  // Export data
  const handleExport = async () => {
    try {
      setIsExporting(true)

      const response = await fetch('/api/admin/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          dateRange,
          exportOptions,
          analyticsData
        })
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Simulate export for demo
      const blob = new Blob(['Analytics Report Data'], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      console.log('Export completed successfully')
    } catch (error) {
      console.error('Export error:', error)
      setError('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics data...</p>
      </div>
    )
  }

  if (error && !analyticsData) {
    return (
      <div className="analytics-error">
        <div className="error-icon">⚠️</div>
        <h3>Failed to Load Analytics</h3>
        <p>{error}</p>
        <button onClick={loadAnalyticsData} className="retry-btn">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="admin-analytics">
      <div className="analytics-header">
        <div className="header-content">
          <h1>Analytics Dashboard</h1>
          <p>Comprehensive insights and performance metrics</p>
        </div>
        
        <div className="header-controls">
          <div className="date-range-selector">
            <label>Date Range:</label>
            <input
              type="date"
              value={dateRange.start.toISOString().split('T')[0]}
              onChange={(e) => setDateRange(prev => ({
                ...prev,
                start: new Date(e.target.value)
              }))}
            />
            <span>to</span>
            <input
              type="date"
              value={dateRange.end.toISOString().split('T')[0]}
              onChange={(e) => setDateRange(prev => ({
                ...prev,
                end: new Date(e.target.value)
              }))}
            />
          </div>

          <div className="period-selector">
            <label>Period:</label>
            <select
              value={dateRange.period}
              onChange={(e) => setDateRange(prev => ({
                ...prev,
                period: e.target.value as DateRange['period']
              }))}
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="export-btn"
          >
            {isExporting ? (
              <>
                <div className="btn-spinner"></div>
                Exporting...
              </>
            ) : (
              <>
                📊 Export Report
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="analytics-warning">
          <span className="warning-icon">⚠️</span>
          {error}
        </div>
      )}

      {analyticsData && (
        <>
          {/* Key Metrics Cards */}
          <div className="metrics-grid">
            <div className="metric-card revenue-card">
              <div className="metric-header">
                <h3>Total Revenue</h3>
                <span className="metric-icon">💰</span>
              </div>
              <div className="metric-value">
                {formatCurrency(analyticsData.revenue.total)}
              </div>
              <div className={`metric-change ${analyticsData.revenue.growth >= 0 ? 'positive' : 'negative'}`}>
                {formatPercentage(analyticsData.revenue.growth)} from last period
              </div>
            </div>

            <div className="metric-card bookings-card">
              <div className="metric-header">
                <h3>Total Bookings</h3>
                <span className="metric-icon">🎫</span>
              </div>
              <div className="metric-value">
                {analyticsData.bookings.total.toLocaleString()}
              </div>
              <div className={`metric-change ${analyticsData.bookings.growth >= 0 ? 'positive' : 'negative'}`}>
                {formatPercentage(analyticsData.bookings.growth)} from last period
              </div>
            </div>

            <div className="metric-card users-card">
              <div className="metric-header">
                <h3>Active Users</h3>
                <span className="metric-icon">👥</span>
              </div>
              <div className="metric-value">
                {analyticsData.users.active.toLocaleString()}
              </div>
              <div className={`metric-change ${analyticsData.users.growth >= 0 ? 'positive' : 'negative'}`}>
                {formatPercentage(analyticsData.users.growth)} from last period
              </div>
            </div>

            <div className="metric-card occupancy-card">
              <div className="metric-header">
                <h3>Occupancy Rate</h3>
                <span className="metric-icon">🏛️</span>
              </div>
              <div className="metric-value">
                {analyticsData.theaters.occupancyRate.toFixed(1)}%
              </div>
              <div className="metric-change positive">
                Industry Average: 65%
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-section">
            <div className="chart-card main-chart">
              <div className="chart-header">
                <h3>Trends Overview</h3>
                <div className="chart-controls">
                  <select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value as typeof selectedMetric)}
                  >
                    <option value="revenue">Revenue</option>
                    <option value="bookings">Bookings</option>
                    <option value="users">Users</option>
                  </select>
                </div>
              </div>
              <div className="chart-container">
                <SimpleLineChart
                  data={chartData?.[selectedMetric] || []}
                  color={selectedMetric === 'revenue' ? '#10b981' : selectedMetric === 'bookings' ? '#3b82f6' : '#f59e0b'}
                  period={dateRange.period}
                />
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3>Booking Status Distribution</h3>
              </div>
              <div className="chart-container">
                <PieChart data={[
                  { label: 'Confirmed', value: analyticsData.bookings.confirmed, color: '#10b981' },
                  { label: 'Pending', value: analyticsData.bookings.pending, color: '#f59e0b' },
                  { label: 'Cancelled', value: analyticsData.bookings.cancelled, color: '#ef4444' },
                  { label: 'Refunded', value: analyticsData.bookings.refunded, color: '#6b7280' }
                ]} />
              </div>
            </div>
          </div>

          {/* Detailed Tables */}
          <div className="tables-section">
            <div className="table-card">
              <div className="table-header">
                <h3>Most Popular Movies</h3>
                <button className="table-action">View All</button>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Movie Title</th>
                      <th>Bookings</th>
                      <th>Revenue</th>
                      <th>Rating</th>
                      <th>Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.movies.mostPopular.map((movie) => (
                      <tr key={movie.id}>
                        <td className="movie-title">{movie.title}</td>
                        <td>{movie.bookings.toLocaleString()}</td>
                        <td>{formatCurrency(movie.revenue)}</td>
                        <td>
                          <div className="rating">
                            <span className="stars">⭐</span>
                            {movie.rating.toFixed(1)}
                          </div>
                        </td>
                        <td>
                          <div className="performance-bar">
                            <div 
                              className="performance-fill"
                              style={{ width: `${(movie.bookings / 1500) * 100}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="table-card">
              <div className="table-header">
                <h3>Theater Performance</h3>
                <button className="table-action">View Details</button>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Theater Name</th>
                      <th>Revenue</th>
                      <th>Bookings</th>
                      <th>Occupancy</th>
                      <th>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.theaters.performance.map((theater) => (
                      <tr key={theater.id}>
                        <td className="theater-name">{theater.name}</td>
                        <td>{formatCurrency(theater.revenue)}</td>
                        <td>{theater.bookings.toLocaleString()}</td>
                        <td>
                          <div className="occupancy">
                            <span className={theater.occupancy >= 80 ? 'high' : theater.occupancy >= 60 ? 'medium' : 'low'}>
                              {theater.occupancy.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="trend-indicator">
                            <span className="trend-up">📈</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Export Options Modal */}
          {/* This would be implemented as a separate modal component */}
        </>
      )}
    </div>
  )
}

// Simple Line Chart Component
function SimpleLineChart({ data, color, period }: { data: number[], color: string, period: string }) {
  const maxValue = Math.max(...data)
  const minValue = Math.min(...data)
  const range = maxValue - minValue

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((value - minValue) / range) * 100
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="simple-chart">
      <svg viewBox="0 0 100 100" className="chart-svg">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((value, index) => {
          const x = (index / (data.length - 1)) * 100
          const y = 100 - ((value - minValue) / range) * 100
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={color}
            />
          )
        })}
      </svg>
      <div className="chart-labels">
        <span className="chart-min">{minValue.toLocaleString()}</span>
        <span className="chart-max">{maxValue.toLocaleString()}</span>
      </div>
    </div>
  )
}

// Simple Pie Chart Component
function PieChart({ data }: { data: Array<{ label: string, value: number, color: string }> }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let cumulativePercentage = 0

  return (
    <div className="pie-chart">
      <svg viewBox="0 0 100 100" className="pie-svg">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100
          const startAngle = (cumulativePercentage / 100) * 360
          const endAngle = ((cumulativePercentage + percentage) / 100) * 360
          
          cumulativePercentage += percentage

          const startX = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180)
          const startY = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180)
          const endX = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180)
          const endY = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180)
          
          const largeArcFlag = percentage > 50 ? 1 : 0

          return (
            <path
              key={index}
              d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
              fill={item.color}
            />
          )
        })}
      </svg>
      <div className="pie-legend">
        {data.map((item, index) => (
          <div key={index} className="legend-item">
            <div className="legend-color" style={{ backgroundColor: item.color }}></div>
            <span className="legend-label">{item.label}</span>
            <span className="legend-value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}