import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import './Auth.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Dummy API call - replace with actual forgot password API
      await api.post('/auth/forgot-password', { email })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi email. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>📧 Email đã được gửi</h1>
            <p>Vui lòng kiểm tra hộp thư của bạn để đặt lại mật khẩu</p>
          </div>
          
          <div className="success-message">
            <div className="success-icon">✅</div>
            <p>
              Chúng tôi đã gửi email hướng dẫn đặt lại mật khẩu đến <strong>{email}</strong>
            </p>
            <p className="note">
              Nếu bạn không nhận được email trong vòng 5 phút, vui lòng kiểm tra thư mục spam.
            </p>
          </div>

          <div className="auth-actions">
            <Link to="/login" className="btn btn-primary">
              Quay lại đăng nhập
            </Link>
            <button 
              onClick={() => {
                setSuccess(false)
                setEmail('')
              }}
              className="btn btn-secondary"
            >
              Gửi lại email
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🔐 Quên mật khẩu</h1>
          <p>Nhập email của bạn để nhận link đặt lại mật khẩu</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
              required
              className="form-input"
            />
          </div>

          {error && (
            <div className="error-message">
              <div className="error-icon">⚠️</div>
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading || !email.trim()}
          >
            {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Nhớ mật khẩu? <Link to="/login">Đăng nhập</Link>
          </p>
          <p>
            Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
          </p>
        </div>
      </div>
    </div>
  )
} 