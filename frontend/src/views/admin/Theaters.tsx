import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import api from '../../services/api'
import './Admin.css'

interface Theater {
  id: number
  name: string
  address: string
  city: string
  total_seats: number
  facilities: string[]
  status: string
  showtimes_count?: number
  revenue?: number
}

export default function AdminTheaters() {
  const [theaters, setTheaters] = useState<Theater[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  
  const { addToast } = useOutletContext<{ addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void }>()

  useEffect(() => {
    fetchTheaters()
  }, [])

  const fetchTheaters = async () => {
    try {
      const response = await api.get('/theaters')
      const data = response.data.data || []
      // Add dummy data for demonstration
      const enhancedData = data.map((theater: Theater) => ({
        ...theater,
        showtimes_count: Math.floor(Math.random() * 50) + 10,
        revenue: Math.floor(Math.random() * 100000000) + 10000000
      }))
      setTheaters(enhancedData)
    } catch (error) {
      console.error('Error fetching theaters:', error)
      addToast('Không thể tải danh sách rạp', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredTheaters = theaters.filter(theater => {
    const matchesSearch = theater.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         theater.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCity = !selectedCity || theater.city === selectedCity
    const matchesStatus = !selectedStatus || theater.status === selectedStatus
    return matchesSearch && matchesCity && matchesStatus
  })

  const getCities = () => {
    return [...new Set(theaters.map(t => t.city))]
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const handleStatusChange = async (theaterId: number, newStatus: string) => {
    try {
      setTheaters(prev => prev.map(t => 
        t.id === theaterId ? { ...t, status: newStatus } : t
      ))
      addToast('Trạng thái rạp đã được cập nhật', 'success')
    } catch (error) {
      addToast('Không thể cập nhật trạng thái rạp', 'error')
    }
  }

  const exportTheaters = () => {
    const csvContent = [
      ['ID', 'Tên rạp', 'Địa chỉ', 'Thành phố', 'Số ghế', 'Tiện ích', 'Trạng thái', 'Suất chiếu', 'Doanh thu'],
      ...filteredTheaters.map(t => [
        t.id,
        t.name,
        t.address,
        t.city,
        t.total_seats,
        t.facilities?.join('; ') || '',
        t.status,
        t.showtimes_count || 0,
        t.revenue || 0
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'theaters_export.csv'
    link.click()
    addToast('Đã xuất danh sách rạp thành CSV', 'success')
  }

  if (loading) return <div className="loading">Đang tải danh sách rạp...</div>

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Quản lý rạp chiếu phim</h1>
        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={`btn btn-small ${viewMode === 'cards' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('cards')}
            >
              🃏 Thẻ
            </button>
            <button 
              className={`btn btn-small ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('table')}
            >
              📋 Bảng
            </button>
          </div>
          <button onClick={exportTheaters} className="btn btn-secondary">
            📊 Xuất CSV
          </button>
          <Link to="/admin/theaters/create" className="btn btn-primary">
            ➕ Thêm rạp mới
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>Tìm kiếm:</label>
            <input
              type="text"
              placeholder="Tên rạp hoặc địa chỉ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Thành phố:</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              <option value="">Tất cả thành phố</option>
              {getCities().map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Trạng thái:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="maintenance">Bảo trì</option>
            </select>
          </div>
        </div>
        <div className="filter-actions">
          <button 
            onClick={() => {
              setSearchTerm('')
              setSelectedCity('')
              setSelectedStatus('')
            }}
            className="btn btn-small btn-secondary"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="theaters-grid">
          {filteredTheaters.map((theater) => (
            <div key={theater.id} className="theater-card">
              <div className="theater-header">
                <h3>{theater.name}</h3>
                <span className={`status-badge ${theater.status}`}>
                  {theater.status === 'active' ? 'Hoạt động' : 
                   theater.status === 'inactive' ? 'Không hoạt động' : 'Bảo trì'}
                </span>
              </div>
              <div className="theater-info">
                <div className="info-item">
                  <span className="label">📍 Địa chỉ:</span>
                  <span className="value">{theater.address}</span>
                </div>
                <div className="info-item">
                  <span className="label">🏙️ Thành phố:</span>
                  <span className="value">{theater.city}</span>
                </div>
                <div className="info-item">
                  <span className="label">💺 Số ghế:</span>
                  <span className="value">{theater.total_seats}</span>
                </div>
                <div className="info-item">
                  <span className="label">🎬 Suất chiếu:</span>
                  <span className="value">{theater.showtimes_count} suất</span>
                </div>
                <div className="info-item">
                  <span className="label">💰 Doanh thu:</span>
                  <span className="value revenue">{formatCurrency(theater.revenue || 0)}</span>
                </div>
              </div>
              <div className="theater-facilities">
                <h4>Tiện ích:</h4>
                <div className="facilities-list">
                  {theater.facilities?.map((facility, index) => (
                    <span key={index} className="facility-tag">{facility}</span>
                  ))}
                </div>
              </div>
              <div className="theater-actions">
                <Link to={`/admin/theaters/${theater.id}/edit`} className="btn btn-small btn-primary">
                  Sửa
                </Link>
                <button className="btn btn-small btn-danger">
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tên rạp</th>
                <th>Địa chỉ</th>
                <th>Thành phố</th>
                <th>Số ghế</th>
                <th>Suất chiếu</th>
                <th>Doanh thu</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredTheaters.map((theater) => (
                <tr key={theater.id}>
                  <td>
                    <div className="theater-name">
                      <h4>{theater.name}</h4>
                    </div>
                  </td>
                  <td>{theater.address}</td>
                  <td>{theater.city}</td>
                  <td>{theater.total_seats}</td>
                  <td>{theater.showtimes_count}</td>
                  <td>
                    <span className="revenue">{formatCurrency(theater.revenue || 0)}</span>
                  </td>
                  <td>
                    <select
                      value={theater.status}
                      onChange={(e) => handleStatusChange(theater.id, e.target.value)}
                      className={`status-select ${theater.status}`}
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Không hoạt động</option>
                      <option value="maintenance">Bảo trì</option>
                    </select>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/admin/theaters/${theater.id}/edit`} className="btn btn-small btn-primary">
                        Sửa
                      </Link>
                      <button className="btn btn-small btn-danger">
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div className="summary-section">
        <div className="summary-card">
          <h3>Tổng số rạp</h3>
          <p>{theaters.length}</p>
        </div>
        <div className="summary-card">
          <h3>Đang hoạt động</h3>
          <p>{theaters.filter(t => t.status === 'active').length}</p>
        </div>
        <div className="summary-card">
          <h3>Bảo trì</h3>
          <p>{theaters.filter(t => t.status === 'maintenance').length}</p>
        </div>
        <div className="summary-card">
          <h3>Tổng doanh thu</h3>
          <p>{formatCurrency(theaters.reduce((sum, t) => sum + (t.revenue || 0), 0))}</p>
        </div>
      </div>
    </div>
  )
} 