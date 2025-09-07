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
  
  // Payment states
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const fees = 0
  const total = useMemo(() => Number(subtotal || 0) + fees, [subtotal, fees])

  // Simple payment processing
  const handlePayment = async () => {
    setPaymentStatus('processing')
    try {
      const response = await api.post('/bookings', {
        showtime_id: showtimeId,
        seats: seats.map((s: any) => s.seat),
        payment_method: 'dummy'
      })
      
      setPaymentStatus('success')
      // Navigate to ticket page
      navigate(`/booking/ticket/${response.data.booking.id}`, {
        state: { booking: response.data.booking }
      })
    } catch (error: any) {
      setPaymentError(error.message || 'Đã có lỗi xảy ra')
      setPaymentStatus('error')
    }
  }

  if (!showtimeId) return <div className="error">Thiếu thông tin đặt vé</div>

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h2>Xác nhận đặt vé</h2>
        <p className="subtitle">Kiểm tra thông tin trước khi thanh toán</p>
      </div>

      <div className="checkout-content">
        {/* Booking Summary */}
        <div className="booking-summary">
          <h3>Thông tin đặt vé</h3>
          <div className="seats-info">
            <p>Ghế đã chọn: {seats?.map((s: any) => s.seat).join(', ')}</p>
            <p>Tổng tiền: {formatVND(total)}</p>
          </div>
        </div>

        {/* Simple Payment Form */}
        {paymentStatus === 'idle' && (
          <div className="payment-form">
            <h3>Thanh toán</h3>
            <p>Phương thức thanh toán: Dummy Payment</p>
            <button 
              className="payment-button"
              onClick={handlePayment}
            >
              Xác nhận thanh toán
            </button>
          </div>
        )}

        {/* Processing Status */}
        {paymentStatus === 'processing' && (
          <div className="payment-processing">
            <p>Đang xử lý thanh toán...</p>
          </div>
        )}

        {/* Error Status */}
        {paymentStatus === 'error' && (
          <div className="payment-error">
            <p>Lỗi: {paymentError}</p>
            <button onClick={() => setPaymentStatus('idle')}>Thử lại</button>
          </div>
        )}
      </div>
    </div>
  )
} 