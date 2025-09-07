import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="main-footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-content">
          {/* Company Info */}
          <div className="footer-section">
            <div className="footer-logo">
              <span className="logo-icon">🎬</span>
              <span className="logo-text">CineBook</span>
            </div>
            <p className="footer-description">
              Nền tảng đặt vé xem phim trực tuyến hàng đầu Việt Nam. 
              Trải nghiệm điện ảnh tuyệt vời với công nghệ hiện đại.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Facebook">
                📘
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                📸
              </a>
              <a href="#" className="social-link" aria-label="YouTube">
                📺
              </a>
              <a href="#" className="social-link" aria-label="TikTok">
                🎵
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="footer-title">Liên kết nhanh</h3>
            <ul className="footer-links">
              <li><Link to="/">🏠 Trang chủ</Link></li>
              <li><Link to="/movies">🎬 Phim</Link></li>
              <li><Link to="/showtimes">📅 Lịch chiếu</Link></li>
              <li><Link to="/theaters">🏢 Rạp chiếu</Link></li>
              <li><Link to="/about">ℹ️ Về chúng tôi</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div className="footer-section">
            <h3 className="footer-title">Tài khoản</h3>
            <ul className="footer-links">
              <li><Link to="/auth/login">🔐 Đăng nhập</Link></li>
              <li><Link to="/auth/register">📝 Đăng ký</Link></li>
              <li><Link to="/profile">👤 Hồ sơ</Link></li>
              <li><Link to="/my-bookings">🎫 Vé của tôi</Link></li>
              <li><Link to="/help">❓ Trợ giúp</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="footer-section">
            <h3 className="footer-title">Hỗ trợ</h3>
            <ul className="footer-links">
              <li><Link to="/contact">📞 Liên hệ</Link></li>
              <li><Link to="/help">🆘 Trung tâm trợ giúp</Link></li>
              <li><Link to="/terms">📜 Điều khoản</Link></li>
              <li><Link to="/privacy">🔒 Bảo mật</Link></li>
              <li><Link to="/sitemap">🗺️ Sơ đồ trang</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h3 className="footer-title">Thông tin liên hệ</h3>
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <span>support@cinebook.vn</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <span>1900-123-456</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <span>123 Đường ABC, Quận 1, TP.HCM</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">🕒</span>
                <span>24/7 Hỗ trợ khách hàng</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="payment-methods">
          <h4>Phương thức thanh toán</h4>
          <div className="payment-icons">
            <span className="payment-icon">💳</span>
            <span className="payment-icon">🏧</span>
            <span className="payment-icon">📱</span>
            <span className="payment-icon">💰</span>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              © {currentYear} CineBook. Tất cả quyền được bảo lưu.
            </p>
            <div className="footer-bottom-links">
              <Link to="/terms">Điều khoản</Link>
              <span className="separator">•</span>
              <Link to="/privacy">Bảo mật</Link>
              <span className="separator">•</span>
              <Link to="/sitemap">Sơ đồ trang</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button 
        className="scroll-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
      >
        ⬆️
      </button>
    </footer>
  )
}