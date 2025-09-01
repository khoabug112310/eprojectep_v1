import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import './Auth.css'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Link đặt lại mật khẩu không hợp lệ')
      setTokenValid(false)
      return
    }

    // Validate token
    validateToken()
  }, [token])

  const validateToken = async () => {
    try {
      await api.post('/auth/validate-reset-token', { token })
      setTokenValid(true)
    } catch (err: any) {
      setError('Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ')
      setTokenValid(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await api.post('/auth/reset-password', {
        token,
        password,
        password_confirmation: confirmPassword
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  if (tokenValid === false) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>⚠️ Link không hợp lệ</h1>
            <p>Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ</p>
          </div>
          
          <div className="error-message">
            <div className="error-icon">❌</div>
            <p>{error}</p>
          </div>

          <div className="auth-actions">
            <Link to="/forgot-password" className="btn btn-primary">
              Yêu cầu link mới
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>✅ Đặt lại mật khẩu thành công</h1>
            <p>Mật khẩu của bạn đã được cập nhật</p>
          </div>
          
          <div className="success-message">
            <div className="success-icon">🎉</div>
            <p>Bạn có thể sử dụng mật khẩu mới để đăng nhập vào tài khoản</p>
          </div>

          <div className="auth-actions">
            <Link to="/login" className="btn btn-primary">
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (tokenValid === null) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>⏳ Đang xác thực...</h1>
            <p>Vui lòng chờ trong giây lát</p>
          </div>
          
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🔐 Đặt lại mật khẩu</h1>
          <p>Nhập mật khẩu mới cho tài khoản của bạn</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="password">Mật khẩu mới</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
              required
              minLength={6}
              className="form-input"
            />
            <small className="form-hint">Mật khẩu phải có ít nhất 6 ký tự</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
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
            disabled={loading || !password || !confirmPassword}
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Nhớ mật khẩu? <Link to="/login">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  )
} 