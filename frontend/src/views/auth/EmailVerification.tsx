import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import './Auth.css'

interface EmailVerificationState {
  status: 'loading' | 'success' | 'error' | 'resent'
  message: string
  token?: string
  email?: string
}

export default function EmailVerification() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [state, setState] = useState<EmailVerificationState>({
    status: 'loading',
    message: ''
  })
  const [resending, setResending] = useState(false)

  const token = searchParams.get('token')
  const email = searchParams.get('email')

  useEffect(() => {
    if (token && email) {
      verifyEmail(token, email)
    } else {
      setState({
        status: 'error',
        message: 'Link xác thực không hợp lệ hoặc đã hết hạn'
      })
    }
  }, [token, email])

  const verifyEmail = async (verificationToken: string, userEmail: string) => {
    try {
      const response = await api.post('/auth/verify-email', {
        token: verificationToken,
        email: userEmail
      })

      if (response.data.success) {
        setState({
          status: 'success',
          message: response.data.message || 'Email đã được xác thực thành công',
          email: userEmail
        })

        // Auto redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Email đã được xác thực. Vui lòng đăng nhập.',
              type: 'success'
            }
          })
        }, 3000)
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi xác thực email'
      setState({
        status: 'error',
        message: errorMessage,
        email: userEmail
      })
    }
  }

  const resendVerificationEmail = async () => {
    if (!email) return

    setResending(true)
    
    try {
      const response = await api.post('/auth/resend-verification', {
        email: email
      })

      if (response.data.success) {
        setState({
          status: 'resent',
          message: 'Email xác thực mới đã được gửi. Vui lòng kiểm tra hộp thư của bạn.',
          email: email
        })
      }
    } catch (error: any) {
      setState({
        status: 'error',
        message: error.response?.data?.message || 'Không thể gửi lại email xác thực'
      })
    } finally {
      setResending(false)
    }
  }

  const renderContent = () => {
    switch (state.status) {
      case 'loading':
        return (
          <div className="auth-card">
            <div className="auth-header">
              <div className="verification-icon loading">🔄</div>
              <h1>Đang xác thực email...</h1>
              <p>Vui lòng chờ trong giây lát</p>
            </div>
            
            <div className="loading-spinner-container">
              <div className="loading-spinner large"></div>
            </div>
          </div>
        )

      case 'success':
        return (
          <div className="auth-card">
            <div className="auth-header">
              <div className="verification-icon success">✅</div>
              <h1>Xác thực thành công!</h1>
              <p>Email của bạn đã được xác thực thành công</p>
            </div>
            
            <div className="success-message">
              <div className="success-content">
                <p>
                  Chúc mừng! Email <strong>{state.email}</strong> đã được xác thực thành công.
                </p>
                <p>
                  Bạn có thể sử dụng tài khoản này để đăng nhập và đặt vé xem phim.
                </p>
              </div>
            </div>

            <div className="auth-actions">
              <Link to="/login" className="btn btn-primary btn-full">
                Đăng nhập ngay
              </Link>
              <div className="redirect-notice">
                Bạn sẽ được chuyển hướng tự động sau 3 giây...
              </div>
            </div>
          </div>
        )

      case 'error':
        return (
          <div className="auth-card">
            <div className="auth-header">
              <div className="verification-icon error">❌</div>
              <h1>Xác thực thất bại</h1>
              <p>Có lỗi xảy ra khi xác thực email</p>
            </div>
            
            <div className="error-message">
              <div className="error-icon">⚠️</div>
              <p>{state.message}</p>
            </div>

            <div className="auth-actions">
              {email && (
                <button 
                  onClick={resendVerificationEmail}
                  className="btn btn-primary btn-full"
                  disabled={resending}
                >
                  {resending ? 'Đang gửi...' : 'Gửi lại email xác thực'}
                </button>
              )}
              
              <div className="action-links">
                <Link to="/register" className="btn btn-secondary">
                  Đăng ký lại
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  Quay lại đăng nhập
                </Link>
              </div>
            </div>
          </div>
        )

      case 'resent':
        return (
          <div className="auth-card">
            <div className="auth-header">
              <div className="verification-icon resent">📧</div>
              <h1>Email đã được gửi lại</h1>
              <p>Vui lòng kiểm tra hộp thư của bạn</p>
            </div>
            
            <div className="success-message">
              <div className="success-content">
                <p>{state.message}</p>
                <p>
                  Email xác thực đã được gửi đến <strong>{state.email}</strong>
                </p>
                <div className="email-note">
                  <p>💡 <strong>Lưu ý:</strong></p>
                  <ul>
                    <li>Kiểm tra cả thư mục spam/junk mail</li>
                    <li>Email có thể mất vài phút để được gửi đến</li>
                    <li>Link xác thực có hiệu lực trong 24 giờ</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="auth-actions">
              <Link to="/login" className="btn btn-primary btn-full">
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {renderContent()}
      </div>
    </div>
  )
}