import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import PaymentForm from '../../components/PaymentForm'
import PaymentStatus from '../../components/PaymentStatus'
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
  const [completedBooking, setCompletedBooking] = useState<any>(null)

  const fees = 0
  const total = useMemo(() => Number(subtotal || 0) + fees, [subtotal, fees])

  // Handle payment success
  const handlePaymentSuccess = (booking: any) => {
    setCompletedBooking(booking)
    setPaymentStatus('success')
    setPaymentError(null)
  }

  // Handle payment error
  const handlePaymentError = (error: string) => {
    setPaymentError(error)
    setPaymentStatus('error')
  }

  // Handle retry payment
  const handleRetryPayment = () => {
    setPaymentStatus('idle')
    setPaymentError(null)
  }

  if (!showtimeId) return <div className="error">Thiếu thông tin đặt vé</div>

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h2>Xác nhận đặt vé</h2>
        <p className="subtitle">Kiểm tra thông tin trước khi thanh toán</p>
      </div>

      <div className="checkout-content">
        {/* Payment Status or Payment Form */}
        {paymentStatus === 'idle' ? (
          <PaymentForm
            bookingData={{
              showtimeId: Number(showtimeId),
              seats: (seats || []).map((s: any) => ({
                seat: s.seat,
                type: s.type,
                price: s.price || 0
              })),
              subtotal: total
            }}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        ) : (
          <PaymentStatus
            bookingId={completedBooking?.id}
            status={paymentStatus}
            message={paymentError || undefined}
            onRetry={paymentStatus === 'error' ? handleRetryPayment : undefined}
          />
        )}
      </div>
    </div>
  )
} 