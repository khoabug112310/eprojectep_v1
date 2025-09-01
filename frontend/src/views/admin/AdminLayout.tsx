import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { ToastContainer } from '../../components/Toast'
import './Admin.css'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toasts, setToasts] = useState<Array<{
    id: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    duration?: number
  }>>([])
  const location = useLocation()

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/movies', label: 'Quản lý phim', icon: '🎬' },
    { path: '/admin/theaters', label: 'Quản lý rạp', icon: '🏢' },
    { path: '/admin/showtimes', label: 'Lịch chiếu', icon: '📅' },
    { path: '/admin/bookings', label: 'Đặt vé', icon: '🎫' },
    { path: '/admin/reviews', label: 'Đánh giá', icon: '⭐' },
    { path: '/admin/users', label: 'Người dùng', icon: '👥' },
    { path: '/admin/reports', label: 'Báo cáo', icon: '📈' },
  ]

  const getBreadcrumb = () => {
    const currentPath = location.pathname
    const currentItem = menuItems.find(item => item.path === currentPath)
    return currentItem ? currentItem.label : 'Admin'
  }

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration?: number) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type, duration }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    addToast('Đăng xuất thành công', 'success')
    // Redirect to admin login
    window.location.href = '/admin/login'
  }

  return (
    <div className="admin-layout">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>CineBook Admin</h2>
          <button 
            className="close-sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <div className="user-name">Admin User</div>
              <div className="user-role">Administrator</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Top Navigation */}
        <header className="admin-header">
          <div className="header-left">
            <button 
              className="menu-toggle"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <div className="breadcrumb">
              <span className="breadcrumb-item">Admin</span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-item">{getBreadcrumb()}</span>
            </div>
          </div>

          <div className="header-right">
            <div className="header-actions">
              <button className="notification-btn" onClick={() => addToast('Bạn có 3 thông báo mới', 'info')}>
                🔔
                <span className="notification-badge">3</span>
              </button>
              <div className="user-menu">
                <button className="user-menu-btn">
                  <span className="user-avatar-small">👤</span>
                  <span>Admin</span>
                  <span className="dropdown-arrow">▼</span>
                </button>
                <div className="user-dropdown">
                  <Link to="/admin/profile" className="dropdown-item">
                    <span>👤</span>
                    <span>Hồ sơ</span>
                  </Link>
                  <Link to="/admin/settings" className="dropdown-item">
                    <span>⚙️</span>
                    <span>Cài đặt</span>
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <span>🚪</span>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="admin-content">
          <Outlet context={{ addToast }} />
        </div>
      </main>
    </div>
  )
} 