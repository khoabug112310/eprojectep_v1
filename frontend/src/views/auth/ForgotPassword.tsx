import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import './Auth.css'

interface ForgotPasswordState {
  email: string
  loading: boolean
  success: boolean
  error: string | null
  resendCooldown: number
}

export default function ForgotPassword() {
  const [state, setState] = useState<ForgotPasswordState>({
    email: '',
    loading: false,
    success: false,
    error: null,
    resendCooldown: 0
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({
      ...prev,
      email: e.target.value,
      error: null
    }))
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!state.email.trim()) {
      setState(prev => ({ ...prev, error: 'Email là bắt buộc' }))
      return
    }

    if (!validateEmail(state.email)) {
      setState(prev => ({ ...prev, error: 'Email không đúng định dạng' }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await api.post('/auth/forgot-password', { 
        email: state.email.trim() 
      })

      if (response.data.success) {
        setState(prev => ({ 
          ...prev, 
          success: true, 
          loading: false,
          resendCooldown: 60
        }))
        
        // Start cooldown timer
        startCooldownTimer()
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error ||
                          'Có lỗi xảy ra khi gửi email. Vui lòng thử lại.'
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        loading: false 
      }))
    }
  }

  const startCooldownTimer = () => {
    const timer = setInterval(() => {
      setState(prev => {
        if (prev.resendCooldown <= 1) {
          clearInterval(timer)
          return { ...prev, resendCooldown: 0 }
        }
        return { ...prev, resendCooldown: prev.resendCooldown - 1 }
      })
    }, 1000)
  }

  const handleResend = () => {
    setState(prev => ({ 
      ...prev, 
      success: false, 
      error: null 
    }))
  }

  if (state.success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="verification-icon success">📧</div>
              <h1 className="auth-title">Email đã được gửi</h1>
              <p className="auth-subtitle">Vui lòng kiểm tra hộp thư của bạn để đặt lại mật khẩu</p>
            </div>
            
            <div className="success-message">
              <div className="success-content">
                <p>
                  Chúng tôi đã gửi email hướng dẫn đặt lại mật khẩu đến <strong>{state.email}</strong>
                </p>
                <p>
                  Email sẽ có hiệu lực trong vòng 24 giờ. Nếu bạn không nhận được email trong vòng 5 phút, vui lòng kiểm tra thư mục spam.
                </p>
                
                <div className="email-note">
                  <p>💡 <strong>Lưu ý:</strong></p>
                  <ul>
                    <li>Kiểm tra cả thư mục spam/junk mail</li>
                    <li>Email có thể mất vài phút để được gửi đến</li>
                    <li>Link đặt lại mật khẩu có hiệu lực trong 24 giờ</li>
                    <li>Chỉ sử dụng link mới nhất nếu bạn gửi lại nhiều lần</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="auth-actions">
              <Link to="/login" className="btn btn-primary btn-full">
                Quay lại đăng nhập
              </Link>
              
              <button 
                onClick={handleResend}
                className="btn btn-secondary btn-full"
                disabled={state.resendCooldown > 0}
              >
                {state.resendCooldown > 0 
                  ? `Gửi lại sau ${state.resendCooldown}s`
                  : 'Gửi lại email'
                }
              </button>
            </div>
            
            <div className="auth-footer">
              <p>
                Chưa có tài khoản? <Link to="/register" className="auth-link">Đăng ký</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">🔐</div>
            <h1 className="auth-title">Quên mật khẩu</h1>
            <p className="auth-subtitle">Nhập email của bạn để nhận link đặt lại mật khẩu</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                value={state.email}
                onChange={handleInputChange}
                placeholder="Nhập email của bạn"
                required
                className={`form-input ${state.error ? 'error' : ''}`}
                disabled={state.loading}
              />
            </div>

            {state.error && (
              <div className="error-message">
                <div className="error-icon">⚠️</div>
                <p>{state.error}</p>
              </div>
            )}

            <button 
              type="submit" 
              className={`submit-btn ${state.loading ? 'loading' : ''}`}
              disabled={state.loading || !state.email.trim()}
            >
              {state.loading && <div className="loading-spinner"></div>}
              {state.loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Nhớ mật khẩu? <Link to="/login" className="auth-link">Đăng nhập</Link>
            </p>
            <p>
              Chưa có tài khoản? <Link to="/register" className="auth-link">Đăng ký</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 