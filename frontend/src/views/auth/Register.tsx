import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../services/api'
import './Auth.css'

export default function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name) {
      newErrors.name = 'Họ tên là bắt buộc'
    }

    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ'
    }

    if (!formData.phone) {
      newErrors.phone = 'Số điện thoại là bắt buộc'
    } else if (!/^[0-9]{10,11}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ'
    }

    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự'
    }

    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'Xác nhận mật khẩu là bắt buộc'
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Mật khẩu không khớp'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await api.post('/auth/register', formData)
      const { token, user } = response.data.data
      
      // Save token to localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      // Update API client with token
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      navigate('/')
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const apiErrors = error.response.data.errors
        const newErrors: Record<string, string> = {}
        
        Object.keys(apiErrors).forEach(key => {
          newErrors[key] = apiErrors[key][0]
        })
        
        setErrors(newErrors)
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message })
      } else {
        setErrors({ general: 'Đăng ký thất bại' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">📝</div>
            <h1 className="auth-title">Đăng ký</h1>
            <p className="auth-subtitle">Tạo tài khoản mới</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {errors.general && (
              <div className="error-message">
                <div className="error-icon">⚠️</div>
                <p>{errors.general}</p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name" className="form-label">Họ tên</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="Nhập họ tên của bạn"
              />
              {errors.name && <span className="form-error"><span className="error-icon">⚠️</span>{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="Nhập email của bạn"
              />
              {errors.email && <span className="form-error"><span className="error-icon">⚠️</span>{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">Số điện thoại</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`form-input ${errors.phone ? 'error' : ''}`}
                placeholder="Nhập số điện thoại"
              />
              {errors.phone && <span className="form-error"><span className="error-icon">⚠️</span>{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Mật khẩu</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Nhập mật khẩu (ít nhất 8 ký tự)"
              />
              {errors.password && <span className="form-error"><span className="error-icon">⚠️</span>{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password_confirmation" className="form-label">Xác nhận mật khẩu</label>
              <input
                type="password"
                id="password_confirmation"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                className={`form-input ${errors.password_confirmation ? 'error' : ''}`}
                placeholder="Nhập lại mật khẩu"
              />
              {errors.password_confirmation && (
                <span className="form-error"><span className="error-icon">⚠️</span>{errors.password_confirmation}</span>
              )}
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading && <div className="loading-spinner"></div>}
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Đã có tài khoản? <Link to="/auth/login" className="auth-link">Đăng nhập</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 