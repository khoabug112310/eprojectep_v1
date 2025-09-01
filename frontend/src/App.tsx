import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import './App.css'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      setIsLoggedIn(true)
      setUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    // Handle scroll effect for header
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsScrolled(scrollPosition > 50)
    }

    // Handle click outside to close dropdowns
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.user-menu')) {
        setShowUserMenu(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    document.addEventListener('click', handleClickOutside)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    setUser(null)
    setShowUserMenu(false)
    setShowMobileNav(false)
  }

  const closeMobileNav = () => {
    setShowMobileNav(false)
  }

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <div className="App">
      {/* Header */}
      <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="header-container">
          <div className="header-left">
            <Link to="/" className="logo">
              🎬 CineBook
            </Link>
            
            <nav className="nav-menu">
              <Link 
                to="/" 
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
              >
                Trang chủ
              </Link>
              <Link 
                to="/movies" 
                className={`nav-link ${isActive('/movies') ? 'active' : ''}`}
              >
                Phim
              </Link>
              <Link 
                to="/theaters" 
                className={`nav-link ${isActive('/theaters') ? 'active' : ''}`}
              >
                Rạp chiếu
              </Link>
              <Link 
                to="/showtimes" 
                className={`nav-link ${isActive('/showtimes') ? 'active' : ''}`}
              >
                Lịch chiếu
              </Link>
              <Link 
                to="/about" 
                className={`nav-link ${isActive('/about') ? 'active' : ''}`}
              >
                Về chúng tôi
              </Link>
              <Link 
                to="/contact" 
                className={`nav-link ${isActive('/contact') ? 'active' : ''}`}
              >
                Liên hệ
              </Link>
            </nav>
            
            {/* Mobile Menu Toggle */}
            <button 
              className="mobile-menu-toggle"
              onClick={() => setShowMobileNav(true)}
            >
              ☰
            </button>
          </div>

          <div className="header-right">
            {/* Search Toggle */}
            <div className="header-search">
              <button className="search-toggle">
                🔍
              </button>
            </div>
            
            {isLoggedIn ? (
              <div className="user-menu">
                <button 
                  className="user-button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <span className="user-avatar">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                  <span className="user-name">{user?.name || 'User'}</span>
                  <span className="dropdown-arrow">▼</span>
                </button>
                
                {showUserMenu && (
                  <div className="user-dropdown">
                    <Link to="/profile" className="dropdown-item">
                      👤 Hồ sơ cá nhân
                    </Link>
                    <Link to="/my-bookings" className="dropdown-item">
                      🎫 Vé của tôi
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button onClick={handleLogout} className="dropdown-item">
                      🚪 Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-secondary">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {showMobileNav && (
        <>
          <div className="mobile-nav-overlay" onClick={closeMobileNav}></div>
          <nav className={`mobile-nav ${showMobileNav ? 'open' : ''}`}>
            <div className="mobile-nav-header">
              <Link to="/" className="logo" onClick={closeMobileNav}>
                🎬 CineBook
              </Link>
              <button className="mobile-nav-close" onClick={closeMobileNav}>
                ✕
              </button>
            </div>
            
            <div className="mobile-nav-links">
              <Link 
                to="/" 
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
                onClick={closeMobileNav}
              >
                🏠 Trang chủ
              </Link>
              <Link 
                to="/movies" 
                className={`nav-link ${isActive('/movies') ? 'active' : ''}`}
                onClick={closeMobileNav}
              >
                🎬 Phim
              </Link>
              <Link 
                to="/theaters" 
                className={`nav-link ${isActive('/theaters') ? 'active' : ''}`}
                onClick={closeMobileNav}
              >
                🏢 Rạp chiếu
              </Link>
              <Link 
                to="/showtimes" 
                className={`nav-link ${isActive('/showtimes') ? 'active' : ''}`}
                onClick={closeMobileNav}
              >
                🗺️ Lịch chiếu
              </Link>
              <Link 
                to="/about" 
                className={`nav-link ${isActive('/about') ? 'active' : ''}`}
                onClick={closeMobileNav}
              >
                ℹ️ Về chúng tôi
              </Link>
              <Link 
                to="/contact" 
                className={`nav-link ${isActive('/contact') ? 'active' : ''}`}
                onClick={closeMobileNav}
              >
                📞 Liên hệ
              </Link>
              
              {isLoggedIn ? (
                <>
                  <div className="dropdown-divider"></div>
                  <Link to="/profile" className="nav-link" onClick={closeMobileNav}>
                    👤 Hồ sơ cá nhân
                  </Link>
                  <Link to="/my-bookings" className="nav-link" onClick={closeMobileNav}>
                    🎫 Vé của tôi
                  </Link>
                  <button onClick={handleLogout} className="nav-link">
                    🚪 Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <div className="dropdown-divider"></div>
                  <Link to="/login" className="nav-link" onClick={closeMobileNav}>
                    🔐 Đăng nhập
                  </Link>
                  <Link to="/register" className="nav-link" onClick={closeMobileNav}>
                    📝 Đăng ký
                  </Link>
                </>
              )}
            </div>
          </nav>
        </>
      )}

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <h3>🎬 CineBook</h3>
            <p>Nền tảng đặt vé xem phim trực tuyến hàng đầu Việt Nam. Khám phá phim mới, đặt vé nhanh chóng và trải nghiệm điện ảnh tuyệt vời.</p>
            <div className="social-links">
              <a href="#" className="social-link">📘 Facebook</a>
              <a href="#" className="social-link">📷 Instagram</a>
              <a href="#" className="social-link">🐦 Twitter</a>
              <a href="#" className="social-link">📺 YouTube</a>
            </div>
          </div>

          <div className="footer-section">
            <h4>🔗 Liên kết nhanh</h4>
            <ul className="footer-links">
              <li><Link to="/movies">🎬 Xem phim</Link></li>
              <li><Link to="/about">ℹ️ Về chúng tôi</Link></li>
              <li><Link to="/contact">📞 Liên hệ</Link></li>
              <li><Link to="/help">❓ Trợ giúp</Link></li>
              <li><Link to="/sitemap">🗺️ Sơ đồ website</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>👤 Tài khoản</h4>
            <ul className="footer-links">
              <li><Link to="/login">🔐 Đăng nhập</Link></li>
              <li><Link to="/register">📝 Đăng ký</Link></li>
              <li><Link to="/profile">👤 Hồ sơ</Link></li>
              <li><Link to="/my-bookings">🎫 Vé của tôi</Link></li>
              <li><Link to="/forgot-password">🔑 Quên mật khẩu</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>📋 Pháp lý</h4>
            <ul className="footer-links">
              <li><Link to="/terms">📜 Điều khoản sử dụng</Link></li>
              <li><Link to="/privacy">🔒 Chính sách bảo mật</Link></li>
              <li><Link to="/help">❓ Câu hỏi thường gặp</Link></li>
              <li><Link to="/contact">📞 Hỗ trợ khách hàng</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>📞 Liên hệ</h4>
            <div className="contact-info">
              <p>📧 Email: info@cinebook.com</p>
              <p>📞 Hotline: 1900-xxxx</p>
              <p>🏢 Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM</p>
              <p>⏰ Giờ làm việc: 8:00 - 22:00 (Thứ 2 - Chủ nhật)</p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>&copy; 2024 CineBook. Tất cả quyền được bảo lưu.</p>
            <div className="footer-bottom-links">
              <Link to="/terms">Điều khoản</Link>
              <Link to="/privacy">Bảo mật</Link>
              <Link to="/sitemap">Sơ đồ</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
