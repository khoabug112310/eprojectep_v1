import { useEffect, useState } from 'react'
import api from '../../services/api'
import './Admin.css'

interface Review {
  id: number
  user: { id: number; name: string; email: string }
  movie: { id: number; title: string }
  rating: number
  comment: string
  status: string
  created_at: string
  helpful_count?: number
  reported?: boolean
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedRating, setSelectedRating] = useState('')
  const [selectedMovie, setSelectedMovie] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await api.get('/reviews')
      const data = response.data.data || []
      // Add dummy data for demonstration
      const enhancedData = data.map((review: Review) => ({
        ...review,
        helpful_count: Math.floor(Math.random() * 10),
        reported: Math.random() > 0.8 // 20% chance of being reported
      }))
      setReviews(enhancedData)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.user?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !selectedStatus || review.status === selectedStatus
    const matchesRating = !selectedRating || review.rating === parseInt(selectedRating)
    const matchesMovie = !selectedMovie || review.movie?.title.includes(selectedMovie)
    return matchesSearch && matchesStatus && matchesRating && matchesMovie
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN')
  }

  const handleStatusChange = async (reviewId: number, newStatus: string) => {
    try {
      setReviews(prev => prev.map(r => 
        r.id === reviewId ? { ...r, status: newStatus } : r
      ))
    } catch (error) {
      console.error('Error updating review status:', error)
    }
  }

  const handleBulkAction = (action: string) => {
    const selectedReviews = filteredReviews.filter(r => r.status === 'pending')
    if (action === 'approve') {
      setReviews(prev => prev.map(r => 
        selectedReviews.some(sr => sr.id === r.id) ? { ...r, status: 'approved' } : r
      ))
    } else if (action === 'reject') {
      setReviews(prev => prev.map(r => 
        selectedReviews.some(sr => sr.id === r.id) ? { ...r, status: 'rejected' } : r
      ))
    }
  }

  const exportReviews = () => {
    const csvContent = [
      ['ID', 'Người dùng', 'Phim', 'Đánh giá', 'Bình luận', 'Trạng thái', 'Ngày tạo', 'Hữu ích', 'Báo cáo'],
      ...filteredReviews.map(r => [
        r.id,
        r.user?.name || '',
        r.movie?.title || '',
        r.rating,
        r.comment,
        r.status,
        formatDate(r.created_at),
        r.helpful_count || 0,
        r.reported ? 'Có' : 'Không'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'reviews_export.csv'
    link.click()
  }

  const getMovies = () => {
    return [...new Set(reviews.map(r => r.movie?.title).filter(Boolean))]
  }

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  if (loading) return <div className="loading">Đang tải danh sách đánh giá...</div>

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Quản lý đánh giá</h1>
        <div className="header-actions">
          <button onClick={exportReviews} className="btn btn-secondary">
            📊 Xuất CSV
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bulk-actions">
        <div className="bulk-info">
          <span>Quản lý đánh giá chờ duyệt</span>
        </div>
        <div className="bulk-buttons">
          <button 
            onClick={() => handleBulkAction('approve')}
            className="btn btn-small btn-success"
          >
            ✅ Duyệt tất cả
          </button>
          <button 
            onClick={() => handleBulkAction('reject')}
            className="btn btn-small btn-danger"
          >
            ❌ Từ chối tất cả
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>Tìm kiếm:</label>
            <input
              type="text"
              placeholder="Tìm trong bình luận hoặc tên người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Trạng thái:</label>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Đã từ chối</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Đánh giá:</label>
            <select 
              value={selectedRating} 
              onChange={(e) => setSelectedRating(e.target.value)}
            >
              <option value="">Tất cả đánh giá</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Phim:</label>
            <select 
              value={selectedMovie} 
              onChange={(e) => setSelectedMovie(e.target.value)}
            >
              <option value="">Tất cả phim</option>
              {getMovies().map(movie => (
                <option key={movie} value={movie}>{movie}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="filter-actions">
          <button 
            onClick={() => {
              setSearchTerm('')
              setSelectedStatus('')
              setSelectedRating('')
              setSelectedMovie('')
            }}
            className="btn btn-small btn-secondary"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Phim</th>
              <th>Đánh giá</th>
              <th>Bình luận</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Hữu ích</th>
              <th>Báo cáo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.map((review) => (
              <tr key={review.id} className={review.reported ? 'reported-row' : ''}>
                <td>
                  <div className="user-info">
                    <h4>{review.user?.name}</h4>
                    <p>{review.user?.email}</p>
                  </div>
                </td>
                <td>{review.movie?.title}</td>
                <td>
                  <div className="rating-display">
                    <span className="stars">{renderStars(review.rating)}</span>
                    <span className="rating-number">({review.rating}/5)</span>
                  </div>
                </td>
                <td>
                  <div className="comment-content">
                    <p>{review.comment}</p>
                  </div>
                </td>
                <td>
                  <select
                    value={review.status}
                    onChange={(e) => handleStatusChange(review.id, e.target.value)}
                    className={`status-select ${review.status}`}
                  >
                    <option value="pending">Chờ duyệt</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="rejected">Đã từ chối</option>
                  </select>
                </td>
                <td>{formatDate(review.created_at)}</td>
                <td>
                  <span className="helpful-count">{review.helpful_count} 👍</span>
                </td>
                <td>
                  {review.reported && (
                    <span className="reported-badge">🚨 Báo cáo</span>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-small btn-secondary">Xem chi tiết</button>
                    <button className="btn btn-small btn-danger">Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="summary-section">
        <div className="summary-card">
          <h3>Tổng số đánh giá</h3>
          <p>{reviews.length}</p>
        </div>
        <div className="summary-card">
          <h3>Chờ duyệt</h3>
          <p>{reviews.filter(r => r.status === 'pending').length}</p>
        </div>
        <div className="summary-card">
          <h3>Đã duyệt</h3>
          <p>{reviews.filter(r => r.status === 'approved').length}</p>
        </div>
        <div className="summary-card">
          <h3>Bị báo cáo</h3>
          <p>{reviews.filter(r => r.reported).length}</p>
        </div>
      </div>
    </div>
  )
} 