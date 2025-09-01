import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useOutletContext } from 'react-router-dom'
import api from '../../services/api'
import './Admin.css'

interface TheaterFormData {
  name: string
  address: string
  city: string
  total_seats: number
  facilities: string[]
  status: string
  description: string
  phone: string
  email: string
}

const availableFacilities = [
  '3D Projection',
  'Dolby Atmos',
  'Recliner Seats',
  'Food Service',
  'Wheelchair Access',
  'Parking',
  'VIP Lounge',
  'IMAX',
  '4DX',
  'Premium Sound'
]

export default function TheaterForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id
  
  const { addToast } = useOutletContext<{ addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void }>()

  const [formData, setFormData] = useState<TheaterFormData>({
    name: '',
    address: '',
    city: '',
    total_seats: 0,
    facilities: [],
    status: 'active',
    description: '',
    phone: '',
    email: ''
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEditing) {
      fetchTheater()
    }
  }, [id])

  const fetchTheater = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/theaters/${id}`)
      const theater = response.data.data
      setFormData({
        name: theater.name || '',
        address: theater.address || '',
        city: theater.city || '',
        total_seats: theater.total_seats || 0,
        facilities: theater.facilities || [],
        status: theater.status || 'active',
        description: theater.description || '',
        phone: theater.phone || '',
        email: theater.email || ''
      })
    } catch (error) {
      addToast('Không thể tải thông tin rạp', 'error')
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

  const handleFacilityToggle = (facility: string) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (isEditing) {
        await api.put(`/theaters/${id}`, formData)
        addToast('Rạp đã được cập nhật thành công', 'success')
      } else {
        await api.post('/theaters', formData)
        addToast('Rạp đã được tạo thành công', 'success')
      }
      navigate('/admin/theaters')
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Có lỗi xảy ra', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading">Đang tải thông tin rạp...</div>

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>{isEditing ? 'Chỉnh sửa rạp' : 'Thêm rạp mới'}</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/admin/theaters')} className="btn btn-secondary">
            ← Quay lại
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="theater-form">
        <div className="form-grid">
          {/* Basic Information */}
          <div className="form-section">
            <h3>Thông tin cơ bản</h3>
            
            <div className="form-group">
              <label htmlFor="name">Tên rạp *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Nhập tên rạp"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Địa chỉ *</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                rows={3}
                placeholder="Nhập địa chỉ chi tiết"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">Thành phố *</label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                >
                  <option value="">Chọn thành phố</option>
                  <option value="Ho Chi Minh City">TP. Hồ Chí Minh</option>
                  <option value="Hanoi">Hà Nội</option>
                  <option value="Da Nang">Đà Nẵng</option>
                  <option value="Can Tho">Cần Thơ</option>
                  <option value="Hai Phong">Hải Phòng</option>
                  <option value="Nha Trang">Nha Trang</option>
                  <option value="Vung Tau">Vũng Tàu</option>
                  <option value="Bien Hoa">Biên Hòa</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="total_seats">Tổng số ghế *</label>
                <input
                  type="number"
                  id="total_seats"
                  name="total_seats"
                  value={formData.total_seats}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="200"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="form-section">
            <h3>Thông tin liên hệ</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Số điện thoại</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0123456789"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="theater@example.com"
                />
              </div>
            </div>
          </div>

          {/* Facilities */}
          <div className="form-section">
            <h3>Tiện ích</h3>
            <div className="facilities-grid">
              {availableFacilities.map(facility => (
                <label key={facility} className="facility-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.facilities.includes(facility)}
                    onChange={() => handleFacilityToggle(facility)}
                  />
                  <span className="facility-label">{facility}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="form-section">
            <h3>Mô tả</h3>
            <div className="form-group">
              <label htmlFor="description">Mô tả rạp</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Mô tả chi tiết về rạp..."
              />
            </div>
          </div>

          {/* Status */}
          <div className="form-section">
            <h3>Trạng thái</h3>
            <div className="form-group">
              <label htmlFor="status">Trạng thái rạp</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
                <option value="maintenance">Bảo trì</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Đang lưu...' : (isEditing ? 'Cập nhật rạp' : 'Tạo rạp')}
          </button>
        </div>
      </form>
    </div>
  )
} 