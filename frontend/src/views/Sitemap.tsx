import { Link } from 'react-router-dom'
import './Sitemap.css'

export default function Sitemap() {
  return (
    <div className="sitemap-page">
      {/* Header */}
      <div className="sitemap-header">
        <div className="header-content">
          <h1>🗺️ Sơ đồ website</h1>
          <p>Khám phá tất cả các trang và tính năng của CineBook</p>
        </div>
      </div>

      {/* Content */}
      <div className="sitemap-content">
        <div className="sitemap-container">
          {/* Main Pages */}
          <div className="sitemap-section">
            <h2>🏠 Trang chính</h2>
            <div className="sitemap-links">
              <Link to="/" className="sitemap-link">
                <span className="link-icon">🏠</span>
                <div className="link-content">
                  <span className="link-title">Trang chủ</span>
                  <span className="link-desc">Khám phá phim mới và đặt vé nhanh chóng</span>
                </div>
              </Link>
              
              <Link to="/movies" className="sitemap-link">
                <span className="link-icon">🎬</span>
                <div className="link-content">
                  <span className="link-title">Danh sách phim</span>
                  <span className="link-desc">Xem tất cả phim đang chiếu và sắp chiếu</span>
                </div>
              </Link>
              
              <Link to="/about" className="sitemap-link">
                <span className="link-icon">ℹ️</span>
                <div className="link-content">
                  <span className="link-title">Về chúng tôi</span>
                  <span className="link-desc">Tìm hiểu về CineBook và đội ngũ của chúng tôi</span>
                </div>
              </Link>
              
              <Link to="/contact" className="sitemap-link">
                <span className="link-icon">📞</span>
                <div className="link-content">
                  <span className="link-title">Liên hệ</span>
                  <span className="link-desc">Liên hệ với chúng tôi để được hỗ trợ</span>
                </div>
              </Link>
            </div>
          </div>

          {/* User Account */}
          <div className="sitemap-section">
            <h2>👤 Tài khoản người dùng</h2>
            <div className="sitemap-links">
              <Link to="/login" className="sitemap-link">
                <span className="link-icon">🔐</span>
                <div className="link-content">
                  <span className="link-title">Đăng nhập</span>
                  <span className="link-desc">Đăng nhập vào tài khoản của bạn</span>
                </div>
              </Link>
              
              <Link to="/register" className="sitemap-link">
                <span className="link-icon">📝</span>
                <div className="link-content">
                  <span className="link-title">Đăng ký</span>
                  <span className="link-desc">Tạo tài khoản mới để sử dụng dịch vụ</span>
                </div>
              </Link>
              
              <Link to="/forgot-password" className="sitemap-link">
                <span className="link-icon">🔑</span>
                <div className="link-content">
                  <span className="link-title">Quên mật khẩu</span>
                  <span className="link-desc">Khôi phục mật khẩu qua email</span>
                </div>
              </Link>
              
              <Link to="/profile" className="sitemap-link">
                <span className="link-icon">👤</span>
                <div className="link-content">
                  <span className="link-title">Hồ sơ cá nhân</span>
                  <span className="link-desc">Quản lý thông tin cá nhân và cài đặt</span>
                </div>
              </Link>
              
              <Link to="/my-bookings" className="sitemap-link">
                <span className="link-icon">🎫</span>
                <div className="link-content">
                  <span className="link-title">Vé của tôi</span>
                  <span className="link-desc">Xem lịch sử đặt vé và quản lý vé</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Booking System */}
          <div className="sitemap-section">
            <h2>🎫 Hệ thống đặt vé</h2>
            <div className="sitemap-links">
              <div className="sitemap-link disabled">
                <span className="link-icon">🎬</span>
                <div className="link-content">
                  <span className="link-title">Chọn suất chiếu</span>
                  <span className="link-desc">Chọn phim và suất chiếu phù hợp</span>
                </div>
              </div>
              
              <div className="sitemap-link disabled">
                <span className="link-icon">🪑</span>
                <div className="link-content">
                  <span className="link-title">Chọn ghế</span>
                  <span className="link-desc">Chọn ghế ngồi theo sở thích</span>
                </div>
              </div>
              
              <div className="sitemap-link disabled">
                <span className="link-icon">💳</span>
                <div className="link-content">
                  <span className="link-title">Thanh toán</span>
                  <span className="link-desc">Hoàn tất thanh toán và xác nhận</span>
                </div>
              </div>
              
              <div className="sitemap-link disabled">
                <span className="link-icon">✅</span>
                <div className="link-content">
                  <span className="link-title">Xác nhận đặt vé</span>
                  <span className="link-desc">Nhận vé điện tử và thông tin chi tiết</span>
                </div>
              </div>
            </div>
          </div>

          {/* Support & Help */}
          <div className="sitemap-section">
            <h2>🆘 Hỗ trợ & Trợ giúp</h2>
            <div className="sitemap-links">
              <Link to="/help" className="sitemap-link">
                <span className="link-icon">❓</span>
                <div className="link-content">
                  <span className="link-title">Trung tâm trợ giúp</span>
                  <span className="link-desc">Tìm câu trả lời cho các câu hỏi thường gặp</span>
                </div>
              </Link>
              
              <Link to="/contact" className="sitemap-link">
                <span className="link-icon">📧</span>
                <div className="link-content">
                  <span className="link-title">Liên hệ hỗ trợ</span>
                  <span className="link-desc">Gửi tin nhắn cho đội ngũ hỗ trợ</span>
                </div>
              </Link>
              
              <Link to="/terms" className="sitemap-link">
                <span className="link-icon">📜</span>
                <div className="link-content">
                  <span className="link-title">Điều khoản sử dụng</span>
                  <span className="link-desc">Điều khoản và điều kiện sử dụng dịch vụ</span>
                </div>
              </Link>
              
              <Link to="/privacy" className="sitemap-link">
                <span className="link-icon">🔒</span>
                <div className="link-content">
                  <span className="link-title">Chính sách bảo mật</span>
                  <span className="link-desc">Thông tin về bảo mật và quyền riêng tư</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Admin Section */}
          <div className="sitemap-section">
            <h2>⚙️ Quản trị hệ thống</h2>
            <div className="sitemap-links">
              <Link to="/admin/login" className="sitemap-link">
                <span className="link-icon">🔐</span>
                <div className="link-content">
                  <span className="link-title">Đăng nhập Admin</span>
                  <span className="link-desc">Truy cập hệ thống quản trị</span>
                </div>
              </Link>
              
              <div className="sitemap-link disabled">
                <span className="link-icon">📊</span>
                <div className="link-content">
                  <span className="link-title">Bảng điều khiển</span>
                  <span className="link-desc">Thống kê và báo cáo tổng quan</span>
                </div>
              </div>
              
              <div className="sitemap-link disabled">
                <span className="link-icon">🎬</span>
                <div className="link-content">
                  <span className="link-title">Quản lý phim</span>
                  <span className="link-desc">Thêm, sửa, xóa thông tin phim</span>
                </div>
              </div>
              
              <div className="sitemap-link disabled">
                <span className="link-icon">🏢</span>
                <div className="link-content">
                  <span className="link-title">Quản lý rạp</span>
                  <span className="link-desc">Quản lý thông tin rạp chiếu phim</span>
                </div>
              </div>
              
              <div className="sitemap-link disabled">
                <span className="link-icon">🎫</span>
                <div className="link-content">
                  <span className="link-title">Quản lý suất chiếu</span>
                  <span className="link-desc">Lập lịch và quản lý suất chiếu</span>
                </div>
              </div>
              
              <div className="sitemap-link disabled">
                <span className="link-icon">📈</span>
                <div className="link-content">
                  <span className="link-title">Báo cáo & Thống kê</span>
                  <span className="link-desc">Xem báo cáo doanh thu và thống kê</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="sitemap-section">
            <h2>⚡ Thao tác nhanh</h2>
            <div className="quick-actions">
              <Link to="/movies" className="quick-action">
                <span className="action-icon">🎬</span>
                <span className="action-text">Xem phim</span>
              </Link>
              
              <Link to="/login" className="quick-action">
                <span className="action-icon">🔐</span>
                <span className="action-text">Đăng nhập</span>
              </Link>
              
              <Link to="/register" className="quick-action">
                <span className="action-icon">📝</span>
                <span className="action-text">Đăng ký</span>
              </Link>
              
              <Link to="/help" className="quick-action">
                <span className="action-icon">❓</span>
                <span className="action-text">Trợ giúp</span>
              </Link>
              
              <Link to="/contact" className="quick-action">
                <span className="action-icon">📞</span>
                <span className="action-text">Liên hệ</span>
              </Link>
              
              <Link to="/about" className="quick-action">
                <span className="action-icon">ℹ️</span>
                <span className="action-text">Về chúng tôi</span>
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="sitemap-section">
            <h2>🔍 Tìm kiếm</h2>
            <div className="search-info">
              <p>Bạn có thể tìm kiếm:</p>
              <ul>
                <li>Phim theo tên, diễn viên, đạo diễn</li>
                <li>Rạp chiếu phim theo địa điểm</li>
                <li>Suất chiếu theo ngày và giờ</li>
                <li>Thông tin khuyến mãi và ưu đãi</li>
              </ul>
              <Link to="/movies" className="btn btn-primary">
                Tìm kiếm phim ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 