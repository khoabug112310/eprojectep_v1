import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './Admin.css'

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Demo admin login (without API call)
      if (formData.email === 'admin@cinebook.com' && formData.password === 'admin123') {
        // Create demo admin user
        const demoAdmin = {
          id: 1,
          name: 'CineBook Admin',
          email: 'admin@cinebook.com',
          role: 'admin',
          status: 'active'
        }

        // Store demo admin token and user
        localStorage.setItem('adminToken', 'demo-admin-token-' + Date.now())
        localStorage.setItem('adminUser', JSON.stringify(demoAdmin))

        // Redirect to admin dashboard
        navigate('/admin')
        return
      }

      // Try API login for real authentication
      const response = await api.post('/auth/login', formData)
      const { token, user } = response.data.data

      // Check if user is admin
      if (user.role !== 'admin') {
        setError('Bạn không có quyền truy cập vào trang admin')
        return
      }

      // Store admin token
      localStorage.setItem('adminToken', token)
      localStorage.setItem('adminUser', JSON.stringify(user))

      // Redirect to admin dashboard
      navigate('/admin')
    } catch (error: any) {
      // If API fails and using demo credentials, show helpful error
      if (formData.email === 'admin@cinebook.com' && formData.password === 'admin123') {
        setError('API không khả dụng, nhưng đang sử dụng tài khoản demo')
      } else {
        setError(error.response?.data?.message || 'Đăng nhập thất bại. Thử sử dụng: admin@cinebook.com / admin123')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login">
      <div className="login-container">
        <div className="login-header">
          <h1>CineBook Admin</h1>
          <p>Đăng nhập vào hệ thống quản trị</p>
          
          <div className="demo-credentials">
            <h3>🔑 Demo Admin Account</h3>
            <p><strong>Email:</strong> admin@cinebook.com</p>
            <p><strong>Password:</strong> admin123</p>
            <small>Sử dụng thông tin này để truy cập demo admin dashboard</small>
            <div className="quick-fill">
              <button 
                type="button" 
                className="quick-fill-btn"
                onClick={() => setFormData({email: 'admin@cinebook.com', password: 'admin123'})}
              >
                📝 Tự động điền
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@cinebook.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <a href="#" className="forgot-password">
              Quên mật khẩu?
            </a>
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="login-footer">
          <p>Bạn không phải admin? <a href="/">Quay lại trang chủ</a></p>
          <div className="demo-info">
            <small>💡 <strong>Demo Mode:</strong> Không cần database. Sử dụng tài khoản demo để truy cập ngay.</small>
          </div>
        </div>
      </div>
    </div>
  )
} 