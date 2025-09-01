import { Link } from 'react-router-dom'
import './NotFound.css'

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-content">
          <div className="not-found-icon">🎬</div>
          <h1 className="not-found-title">404</h1>
          <h2 className="not-found-subtitle">Trang không tồn tại</h2>
          <p className="not-found-description">
            Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển đến địa chỉ khác.
          </p>
          
          <div className="not-found-suggestions">
            <h3>Có thể bạn đang tìm kiếm:</h3>
            <div className="suggestion-links">
              <Link to="/" className="suggestion-link">
                <span className="link-icon">🏠</span>
                <span>Trang chủ</span>
              </Link>
              <Link to="/movies" className="suggestion-link">
                <span className="link-icon">🎭</span>
                <span>Danh sách phim</span>
              </Link>
              <Link to="/help" className="suggestion-link">
                <span className="link-icon">❓</span>
                <span>Trung tâm hỗ trợ</span>
              </Link>
              <Link to="/contact" className="suggestion-link">
                <span className="link-icon">📞</span>
                <span>Liên hệ</span>
              </Link>
            </div>
          </div>

          <div className="not-found-actions">
            <button 
              onClick={() => window.history.back()} 
              className="btn btn-secondary"
            >
              ← Quay lại
            </button>
            <Link to="/" className="btn btn-primary">
              Về trang chủ
            </Link>
          </div>

          <div className="not-found-help">
            <p>Nếu bạn tin rằng đây là lỗi, vui lòng:</p>
            <ul>
              <li>Kiểm tra lại URL</li>
              <li>Làm mới trang web</li>
              <li>Liên hệ hỗ trợ: <a href="mailto:support@cinebook.vn">support@cinebook.vn</a></li>
            </ul>
          </div>
        </div>

        <div className="not-found-illustration">
          <div className="illustration-content">
            <div className="movie-reel">🎞️</div>
            <div className="search-icon">🔍</div>
            <div className="question-mark">❓</div>
          </div>
        </div>
      </div>
    </div>
  )
} 