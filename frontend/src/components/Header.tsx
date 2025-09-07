import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './Header.css'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [user, setUser] = useState<any>(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Check for user authentication
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  }, [location])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/')
    setIsMenuOpen(false)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <header className={`main-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="header-logo" onClick={closeMenu}>
          <span className="logo-icon">🎬</span>
          <span className="logo-text">CineBook</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="header-nav desktop-nav">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            🏠 Trang chủ
          </Link>
          <Link 
            to="/movies" 
            className={`nav-link ${location.pathname === '/movies' ? 'active' : ''}`}
          >
            🎬 Phim
          </Link>
          <Link 
            to="/showtimes" 
            className={`nav-link ${location.pathname === '/showtimes' ? 'active' : ''}`}
          >
            📅 Lịch chiếu
          </Link>
          <Link 
            to="/theaters" 
            className={`nav-link ${location.pathname === '/theaters' ? 'active' : ''}`}
          >
            🏢 Rạp chiếu
          </Link>
          <Link 
            to="/about" 
            className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}
          >
            ℹ️ Về chúng tôi
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="header-actions">
          {user ? (
            <div className="user-menu">
              <div className="user-info">
                <span className="user-avatar">👤</span>
                <span className="user-name">{user.name}</span>
              </div>
              <div className="user-dropdown">
                <Link to="/profile" className="dropdown-item" onClick={closeMenu}>
                  👤 Hồ sơ
                </Link>
                <Link to="/my-bookings" className="dropdown-item" onClick={closeMenu}>
                  🎫 Vé của tôi
                </Link>
                <button onClick={handleLogout} className="dropdown-item logout-btn">
                  🚪 Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/auth/login" className="btn btn-outline" onClick={closeMenu}>
                Đăng nhập
              </Link>
              <Link to="/auth/register" className="btn btn-primary" onClick={closeMenu}>
                Đăng ký
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <span className={`hamburger ${isMenuOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className={`mobile-nav ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nav-content">
          <Link to="/" className="mobile-nav-link" onClick={closeMenu}>
            🏠 Trang chủ
          </Link>
          <Link to="/movies" className="mobile-nav-link" onClick={closeMenu}>
            🎬 Phim
          </Link>
          <Link to="/showtimes" className="mobile-nav-link" onClick={closeMenu}>
            📅 Lịch chiếu
          </Link>
          <Link to="/theaters" className="mobile-nav-link" onClick={closeMenu}>
            🏢 Rạp chiếu
          </Link>
          <Link to="/about" className="mobile-nav-link" onClick={closeMenu}>
            ℹ️ Về chúng tôi
          </Link>

          {user ? (
            <>
              <div className="mobile-user-info">
                <span className="mobile-user-name">👤 {user.name}</span>
              </div>
              <Link to="/profile" className="mobile-nav-link" onClick={closeMenu}>
                👤 Hồ sơ
              </Link>
              <Link to="/my-bookings" className="mobile-nav-link" onClick={closeMenu}>
                🎫 Vé của tôi
              </Link>
              <button onClick={handleLogout} className="mobile-nav-link logout">
                🚪 Đăng xuất
              </button>
            </>
          ) : (
            <div className="mobile-auth-buttons">
              <Link to="/auth/login" className="mobile-auth-btn" onClick={closeMenu}>
                Đăng nhập
              </Link>
              <Link to="/auth/register" className="mobile-auth-btn primary" onClick={closeMenu}>
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div 
          className="mobile-menu-overlay" 
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </header>
  )
}