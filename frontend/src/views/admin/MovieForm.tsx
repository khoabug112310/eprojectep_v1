import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useOutletContext } from 'react-router-dom'
import api from '../../services/api'
import './Admin.css'

interface MovieFormData {
  title: string
  synopsis: string
  genre: string
  language: string
  duration: number
  release_date: string
  director: string
  cast: string
  rating: string
  poster_url: string
  trailer_url: string
  status: string
}

export default function MovieForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id
  
  const { addToast } = useOutletContext<{ addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void }>()

  const [formData, setFormData] = useState<MovieFormData>({
    title: '',
    synopsis: '',
    genre: '',
    language: '',
    duration: 0,
    release_date: '',
    director: '',
    cast: '',
    rating: 'PG',
    poster_url: '',
    trailer_url: '',
    status: 'active'
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEditing) {
      fetchMovie()
    }
  }, [id])

  const fetchMovie = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/movies/${id}`)
      
      if (response.data?.success) {
        const movie = response.data.data
        setFormData({
          title: movie.title || '',
          synopsis: movie.synopsis || '',
          genre: Array.isArray(movie.genre) ? movie.genre.join(', ') : (movie.genre || ''),
          language: movie.language || '',
          duration: movie.duration || 0,
          release_date: movie.release_date ? movie.release_date.split('T')[0] : '',
          director: movie.director || '',
          cast: Array.isArray(movie.cast) ? movie.cast.map((c: any) => typeof c === 'object' ? c.name : c).join(', ') : (movie.cast || ''),
          rating: movie.age_rating || movie.rating || 'PG',
          poster_url: movie.poster_url || '',
          trailer_url: movie.trailer_url || '',
          status: movie.status || 'active'
        })
      } else {
        addToast('Không thể tải thông tin phim - API response không hợp lệ', 'error')
      }
    } catch (error: any) {
      console.error('Error fetching movie:', error)
      addToast(error.response?.data?.message || 'Không thể tải thông tin phim', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Prepare data for submission - backend expects strings for genre/cast
      const submitData = {
        ...formData,
        // Convert genre array to comma-separated string if it's an array
        genre: Array.isArray(formData.genre) ? formData.genre.join(',') : formData.genre,
        // Convert cast array to comma-separated string if it's an array  
        cast: Array.isArray(formData.cast) ? formData.cast.join(',') : formData.cast,
        age_rating: formData.rating // Use age_rating field as expected by backend
      }
      
      console.log('Submitting movie data:', submitData)
      
      if (isEditing) {
        await api.put(`/admin/movies/${id}`, submitData)
        addToast('Phim đã được cập nhật thành công', 'success')
      } else {
        await api.post('/admin/movies', submitData)
        addToast('Phim đã được tạo thành công', 'success')
      }
      navigate('/admin/movies')
    } catch (error: any) {
      console.error('Error saving movie:', error)
      console.error('Error response:', error.response?.data)
      
      // Extract validation errors if available
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat().join(', ')
        addToast(`Validation errors: ${errorMessages}`, 'error')
      } else {
        addToast(error.response?.data?.message || 'Có lỗi xảy ra', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDraft = () => {
    setFormData(prev => ({ ...prev, status: 'draft' }))
    addToast('Đã lưu bản nháp', 'info')
  }

  if (loading) return <div className="loading">Đang tải thông tin phim...</div>

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>{isEditing ? 'Chỉnh sửa phim' : 'Thêm phim mới'}</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/admin/movies')} className="btn btn-secondary">
            ← Quay lại
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="movie-form">
        <div className="form-grid">
          {/* Basic Information */}
          <div className="form-section">
            <h3>Thông tin cơ bản</h3>
            
            <div className="form-group">
              <label htmlFor="title">Tên phim *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Nhập tên phim"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="genre">Thể loại *</label>
                <select
                  id="genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  required
                >
                  <option value="">Chọn thể loại</option>
                  <option value="action">Hành động</option>
                  <option value="comedy">Hài</option>
                  <option value="drama">Tâm lý</option>
                  <option value="horror">Kinh dị</option>
                  <option value="romance">Tình cảm</option>
                  <option value="sci-fi">Khoa học viễn tưởng</option>
                  <option value="thriller">Giật gân</option>
                  <option value="animation">Hoạt hình</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="language">Ngôn ngữ *</label>
                <select
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  required
                >
                  <option value="">Chọn ngôn ngữ</option>
                  <option value="Vietnamese">Tiếng Việt</option>
                  <option value="English">Tiếng Anh</option>
                  <option value="Korean">Tiếng Hàn</option>
                  <option value="Japanese">Tiếng Nhật</option>
                  <option value="Chinese">Tiếng Trung</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="duration">Thời lượng (phút) *</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="120"
                />
              </div>

              <div className="form-group">
                <label htmlFor="rating">Độ tuổi</label>
                <select
                  id="rating"
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                >
                  <option value="G">G - Mọi lứa tuổi</option>
                  <option value="PG">PG - Có sự hướng dẫn của phụ huynh</option>
                  <option value="PG-13">PG-13 - Trên 13 tuổi</option>
                  <option value="R">R - Trên 17 tuổi</option>
                  <option value="NC-17">NC-17 - Chỉ người lớn</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="release_date">Ngày phát hành</label>
              <input
                type="date"
                id="release_date"
                name="release_date"
                value={formData.release_date}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Synopsis */}
          <div className="form-section">
            <h3>Tóm tắt nội dung</h3>
            <div className="form-group">
              <label htmlFor="synopsis">Tóm tắt phim *</label>
              <textarea
                id="synopsis"
                name="synopsis"
                value={formData.synopsis}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Nhập tóm tắt nội dung phim..."
              />
            </div>
          </div>

          {/* Cast & Crew */}
          <div className="form-section">
            <h3>Diễn viên & Đạo diễn</h3>
            
            <div className="form-group">
              <label htmlFor="director">Đạo diễn</label>
              <input
                type="text"
                id="director"
                name="director"
                value={formData.director}
                onChange={handleChange}
                placeholder="Tên đạo diễn"
              />
            </div>

            <div className="form-group">
              <label htmlFor="cast">Diễn viên chính</label>
              <textarea
                id="cast"
                name="cast"
                value={formData.cast}
                onChange={handleChange}
                rows={3}
                placeholder="Danh sách diễn viên chính..."
              />
            </div>
          </div>

          {/* Media */}
          <div className="form-section">
            <h3>Hình ảnh & Video</h3>
            
            <div className="form-group">
              <label htmlFor="poster_url">URL Poster</label>
              <input
                type="url"
                id="poster_url"
                name="poster_url"
                value={formData.poster_url}
                onChange={handleChange}
                placeholder="https://example.com/poster.jpg"
              />
            </div>

            <div className="form-group">
              <label htmlFor="trailer_url">URL Trailer</label>
              <input
                type="url"
                id="trailer_url"
                name="trailer_url"
                value={formData.trailer_url}
                onChange={handleChange}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </div>

          {/* Status */}
          <div className="form-section">
            <h3>Trạng thái</h3>
            <div className="form-group">
              <label htmlFor="status">Trạng thái phim</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
                <option value="draft">Bản nháp</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" onClick={handleSaveDraft} className="btn btn-secondary">
            💾 Lưu bản nháp
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Đang lưu...' : (isEditing ? 'Cập nhật phim' : 'Tạo phim')}
          </button>
        </div>
      </form>
    </div>
  )
} 