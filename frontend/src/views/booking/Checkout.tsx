import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../services/api'
import './Checkout.css'

function formatVND(n: number) {
  return n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
}

export default function Checkout() {
  const navigate = useNavigate()
  const location = useLocation() as any
  const { showtimeId, seats, subtotal } = location.state || { seats: [] }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fees = 0
  const total = useMemo(() => Number(subtotal || 0) + fees, [subtotal, fees])

  const confirm = () => {
    setLoading(true)
    api
      .post('/bookings', {
        showtime_id: Number(showtimeId),
        seats: (seats || []).map((s: any) => ({ seat: s.seat, type: s.type })),
        payment_method: 'credit_card',
      })
      .then((res) => navigate('/booking/confirmation', { state: { booking: res.data.data } }))
      .catch((e) => setError(e.message || 'Error'))
      .finally(() => setLoading(false))
  }

  if (!showtimeId) return <div className="error">Thiếu thông tin đặt vé</div>

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h2>Xác nhận đặt vé</h2>
        <p className="subtitle">Kiểm tra thông tin trước khi thanh toán</p>
      </div>

      <div className="checkout-content">
        <div className="checkout-main">
          <div className="seats-section">
            <h3>Ghế đã chọn</h3>
            <div className="seats-list">
              {(seats || []).map((s: any) => (
                <div key={s.seat} className="seat-item">
                  <div className="seat-info">
                    <span className="seat-code">{s.seat}</span>
                    <span className="seat-type">{s.type?.toUpperCase()}</span>
                  </div>
                  <span className="seat-price">{formatVND(s.price)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="checkout-sidebar">
          <div className="price-breakdown">
            <h3>Tổng thanh toán</h3>
            
            <div className="price-row">
              <span>Tạm tính:</span>
              <span>{formatVND(subtotal)}</span>
            </div>
            
            <div className="price-row">
              <span>Phí dịch vụ:</span>
              <span>{formatVND(fees)}</span>
            </div>
            
            <div className="price-row total">
              <span>Tổng cộng:</span>
              <span>{formatVND(total)}</span>
            </div>
          </div>

          {error && (
            <div className="error-message">
              Lỗi: {error}
            </div>
          )}

          <button 
            className="confirm-btn"
            disabled={loading || seats?.length === 0} 
            onClick={confirm}
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
          </button>
        </div>
      </div>
    </div>
  )
} 