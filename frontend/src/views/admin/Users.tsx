import { useEffect, useState } from 'react'
import api from '../../services/api'
import './Admin.css'

interface User {
  id: number
  name: string
  email: string
  phone: string
  created_at: string
  bookings_count: number
  total_spent: number
  status: string
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/reports/users')
      setUsers(response.data.data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      // Fallback to dummy data
      setUsers([
        {
          id: 1,
          name: 'Nguyễn Văn A',
          email: 'nguyenvana@example.com',
          phone: '0123456789',
          created_at: '2025-01-15T10:00:00Z',
          bookings_count: 5,
          total_spent: 750000,
          status: 'active'
        },
        {
          id: 2,
          name: 'Trần Thị B',
          email: 'tranthib@example.com',
          phone: '0987654321',
          created_at: '2025-01-20T14:30:00Z',
          bookings_count: 3,
          total_spent: 450000,
          status: 'active'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !selectedStatus || user.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id))
    }
  }

  const handleBulkStatusChange = (newStatus: string) => {
    setUsers(prev => prev.map(u => 
      selectedUsers.includes(u.id) ? { ...u, status: newStatus } : u
    ))
    setSelectedUsers([])
  }

  const exportUsers = () => {
    const csvContent = [
      ['ID', 'Tên', 'Email', 'Số điện thoại', 'Ngày tạo', 'Số đặt vé', 'Tổng chi tiêu', 'Trạng thái'],
      ...filteredUsers.map(u => [
        u.id,
        u.name,
        u.email,
        u.phone,
        formatDate(u.created_at),
        u.bookings_count,
        u.total_spent,
        u.status
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'users_export.csv'
    link.click()
  }

  if (loading) return <div className="loading">Đang tải danh sách người dùng...</div>

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Quản lý người dùng</h1>
        <div className="header-actions">
          <button onClick={exportUsers} className="btn btn-secondary">
            📊 Xuất CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-controls">
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bulk-actions">
          <div className="bulk-info">
            <span>Đã chọn {selectedUsers.length} người dùng</span>
            <button 
              onClick={() => setSelectedUsers([])} 
              className="btn btn-small btn-secondary"
            >
              Bỏ chọn
            </button>
          </div>
          <div className="bulk-buttons">
            <button 
              onClick={() => handleBulkStatusChange('active')}
              className="btn btn-small btn-success"
            >
              Kích hoạt
            </button>
            <button 
              onClick={() => handleBulkStatusChange('inactive')}
              className="btn btn-small btn-warning"
            >
              Vô hiệu hóa
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Thông tin</th>
              <th>Liên hệ</th>
              <th>Ngày tạo</th>
              <th>Hoạt động</th>
              <th>Chi tiêu</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                  />
                </td>
                <td>
                  <div className="user-info">
                    <h4>{user.name}</h4>
                    <p>ID: {user.id}</p>
                  </div>
                </td>
                <td>
                  <div className="contact-info">
                    <div>{user.email}</div>
                    <div className="phone">{user.phone}</div>
                  </div>
                </td>
                <td>{formatDate(user.created_at)}</td>
                <td>
                  <div className="activity-info">
                    <span className="bookings-count">{user.bookings_count} đặt vé</span>
                  </div>
                </td>
                <td>
                  <div className="spending-info">
                    <span className="total-spent">{formatCurrency(user.total_spent)}</span>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${user.status}`}>
                    {user.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-small btn-secondary">Xem chi tiết</button>
                    <button className="btn btn-small btn-danger">Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="summary-section">
        <div className="summary-card">
          <h3>Tổng số người dùng</h3>
          <p>{users.length}</p>
        </div>
        <div className="summary-card">
          <h3>Hoạt động</h3>
          <p>{users.filter(u => u.status === 'active').length}</p>
        </div>
        <div className="summary-card">
          <h3>Tổng đặt vé</h3>
          <p>{users.reduce((sum, u) => sum + u.bookings_count, 0)}</p>
        </div>
        <div className="summary-card">
          <h3>Tổng doanh thu</h3>
          <p>{formatCurrency(users.reduce((sum, u) => sum + u.total_spent, 0))}</p>
        </div>
      </div>
    </div>
  )
} 