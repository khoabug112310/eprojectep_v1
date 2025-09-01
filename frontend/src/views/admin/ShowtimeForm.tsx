import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useOutletContext } from 'react-router-dom'
import api from '../../services/api'
import './Admin.css'

interface ShowtimeFormData {
  movie_id: number
  theater_id: number
  date: string
  time: string
  price: number
  status: string
}

interface Movie {
  id: number
  title: string
}

interface Theater {
  id: number
  name: string
}

export default function ShowtimeForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id
  
  const { addToast } = useOutletContext<{ addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void }>()

  const [formData, setFormData] = useState<ShowtimeFormData>({
    movie_id: 0,
    theater_id: 0,
    date: '',
    time: '',
    price: 0,
    status: 'active'
  })

  const [movies, setMovies] = useState<Movie[]>([])
  const [theaters, setTheaters] = useState<Theater[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchMovies()
    fetchTheaters()
    if (isEditing) {
      fetchShowtime()
    }
  }, [id])

  const fetchMovies = async () => {
    try {
      const response = await api.get('/movies')
      setMovies(response.data.data?.data || [])
    } catch (error) {
      addToast('Không thể tải danh sách phim', 'error')
    }
  }

  const fetchTheaters = async () => {
    try {
      const response = await api.get('/theaters')
      setTheaters(response.data.data || [])
    } catch (error) {
      addToast('Không thể tải danh sách rạp', 'error')
    }
  }

  const fetchShowtime = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/showtimes/${id}`)
      const showtime = response.data.data
      setFormData({
        movie_id: showtime.movie_id || 0,
        theater_id: showtime.theater_id || 0,
        date: showtime.date ? showtime.date.split('T')[0] : '',
        time: showtime.time || '',
        price: showtime.price || 0,
        status: showtime.status || 'active'
      })
    } catch (error) {
      addToast('Không thể tải thông tin suất chiếu', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (isEditing) {
        await api.put(`/showtimes/${id}`, formData)
        addToast('Suất chiếu đã được cập nhật thành công', 'success')
      } else {
        await api.post('/showtimes', formData)
        addToast('Suất chiếu đã được tạo thành công', 'success')
      }
      navigate('/admin/showtimes')
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Có lỗi xảy ra', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleRecurringSetup = () => {
    addToast('Tính năng tạo suất chiếu định kỳ sẽ được phát triển', 'info')
  }

  if (loading) return <div className="loading">Đang tải thông tin suất chiếu...</div>

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>{isEditing ? 'Chỉnh sửa suất chiếu' : 'Thêm suất chiếu mới'}</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/admin/showtimes')} className="btn btn-secondary">
            ← Quay lại
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="showtime-form">
        <div className="form-grid">
          {/* Basic Information */}
          <div className="form-section">
            <h3>Thông tin suất chiếu</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="movie_id">Phim *</label>
                <select
                  id="movie_id"
                  name="movie_id"
                  value={formData.movie_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Chọn phim</option>
                  {movies.map(movie => (
                    <option key={movie.id} value={movie.id}>
                      {movie.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="theater_id">Rạp chiếu *</label>
                <select
                  id="theater_id"
                  name="theater_id"
                  value={formData.theater_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Chọn rạp</option>
                  {theaters.map(theater => (
                    <option key={theater.id} value={theater.id}>
                      {theater.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">Ngày chiếu *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label htmlFor="time">Giờ chiếu *</label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Giá vé (VND) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="1000"
                  placeholder="150000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Trạng thái</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing Configuration */}
          <div className="form-section">
            <h3>Cấu hình giá vé</h3>
            <div className="pricing-info">
              <div className="pricing-item">
                <span className="pricing-label">Ghế thường:</span>
                <span className="pricing-value">{formData.price?.toLocaleString('vi-VN')} VND</span>
              </div>
              <div className="pricing-item">
                <span className="pricing-label">Ghế VIP:</span>
                <span className="pricing-value">{(formData.price * 1.5)?.toLocaleString('vi-VN')} VND</span>
              </div>
              <div className="pricing-item">
                <span className="pricing-label">Ghế đôi:</span>
                <span className="pricing-value">{(formData.price * 2)?.toLocaleString('vi-VN')} VND</span>
              </div>
            </div>
          </div>

          {/* Recurring Setup */}
          <div className="form-section">
            <h3>Tạo suất chiếu định kỳ</h3>
            <div className="recurring-setup">
              <p>Tạo nhiều suất chiếu cùng lúc cho các ngày khác nhau</p>
              <button type="button" onClick={handleRecurringSetup} className="btn btn-secondary">
                ⚙️ Cấu hình định kỳ
              </button>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Đang lưu...' : (isEditing ? 'Cập nhật suất chiếu' : 'Tạo suất chiếu')}
          </button>
        </div>
      </form>
    </div>
  )
} 