import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import vnpayService, { VNPayPaymentRequest } from '../services/vnpayService'
import './Payment.css'

interface PaymentMethodProps {
  bookingData: {
    bookingId: string
    showtimeId: number
    movieTitle: string
    theaterName: string
    showDate: string
    showTime: string
    seats: Array<{
      seatId: string
      seatType: string
      price: number
    }>
    totalAmount: number
    userInfo: {
      name: string
      email: string
      phone: string
    }
  }
  onPaymentSuccess: (transactionId: string) => void
  onPaymentError: (error: string) => void
  onBack: () => void
}

interface BankOption {
  code: string
  name: string
  logo?: string
}

export default function PaymentMethods({
  bookingData,
  onPaymentSuccess,
  onPaymentError,
  onBack
}: PaymentMethodProps) {
  const navigate = useNavigate()
  const [selectedMethod, setSelectedMethod] = useState<'vnpay' | 'momo' | 'credit'>('vnpay')
  const [selectedBank, setSelectedBank] = useState<string>('')
  const [supportedBanks, setSupportedBanks] = useState<BankOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSupportedBanks()
  }, [])

  const loadSupportedBanks = async () => {
    try {
      const banks = await vnpayService.getSupportedBanks()
      setSupportedBanks(banks)
      if (banks.length > 0) {
        setSelectedBank(banks[0].code)
      }
    } catch (error) {
      console.error('Failed to load supported banks:', error)
      // Set default banks if service fails
      const defaultBanks: BankOption[] = [
        { code: 'VIETCOMBANK', name: 'Ngân hàng TMCP Ngoại Thương Việt Nam' },
        { code: 'VIETINBANK', name: 'Ngân hàng TMCP Công Thương Việt Nam' },
        { code: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
        { code: 'AGRIBANK', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam' },
        { code: 'TECHCOMBANK', name: 'Ngân hàng TMCP Kỹ Thương Việt Nam' },
        { code: 'ACB', name: 'Ngân hàng TMCP Á Châu' },
        { code: 'VPBANK', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng' }
      ]
      setSupportedBanks(defaultBanks)
      setSelectedBank(defaultBanks[0].code)
    }
  }

  const handleVNPayPayment = async () => {
    if (!selectedBank) {
      setError('Vui lòng chọn ngân hàng')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const paymentRequest: VNPayPaymentRequest = {
        amount: bookingData.totalAmount,
        orderInfo: `Thanh toan ve xem phim ${bookingData.movieTitle} - ${bookingData.bookingId}`,
        orderType: 'billpayment',
        locale: 'vn',
        bookingId: bookingData.bookingId,
        showtimeId: bookingData.showtimeId,
        seats: bookingData.seats,
        returnUrl: `${window.location.origin}/payment/return`,
        ipAddr: '127.0.0.1'
      }

      const response = await vnpayService.createPaymentUrl(paymentRequest)

      if (response.success && response.paymentUrl) {
        // Store payment info in localStorage for return handling
        localStorage.setItem('vnpay_payment_info', JSON.stringify({
          bookingId: bookingData.bookingId,
          transactionId: response.transactionId || `TXN_${Date.now()}`,
          amount: bookingData.totalAmount,
          timestamp: Date.now()
        }))

        // Redirect to VNPay
        window.location.href = response.paymentUrl
      } else {
        throw new Error(response.error || 'Không thể tạo giao dịch thanh toán')
      }
    } catch (error: any) {
      console.error('VNPay payment error:', error)
      setError(error.message || 'Có lỗi xảy ra khi xử lý thanh toán')
      onPaymentError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMoMoPayment = async () => {
    setError('Thanh toán MoMo đang được phát triển')
    // TODO: Implement MoMo payment integration
  }

  const handleCreditCardPayment = async () => {
    setError('Thanh toán thẻ tín dụng đang được phát triển')
    // TODO: Implement credit card payment
  }

  const handlePayment = () => {
    switch (selectedMethod) {
      case 'vnpay':
        handleVNPayPayment()
        break
      case 'momo':
        handleMoMoPayment()
        break
      case 'credit':
        handleCreditCardPayment()
        break
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  return (
    <div className="payment-methods">
      <div className="payment-header">
        <h2>Chọn phương thức thanh toán</h2>
        <p>Tổng tiền: <strong className="total-amount">{formatCurrency(bookingData.totalAmount)}</strong></p>
      </div>

      <div className="booking-summary">
        <h3>Thông tin đặt vé</h3>
        <div className="summary-content">
          <div className="summary-item">
            <span className="label">Phim:</span>
            <span className="value">{bookingData.movieTitle}</span>
          </div>
          <div className="summary-item">
            <span className="label">Rạp:</span>
            <span className="value">{bookingData.theaterName}</span>
          </div>
          <div className="summary-item">
            <span className="label">Suất chiếu:</span>
            <span className="value">{bookingData.showTime} - {bookingData.showDate}</span>
          </div>
          <div className="summary-item">
            <span className="label">Ghế:</span>
            <span className="value">
              {bookingData.seats.map(seat => seat.seatId).join(', ')}
            </span>
          </div>
          <div className="summary-item">
            <span className="label">Số lượng vé:</span>
            <span className="value">{bookingData.seats.length} vé</span>
          </div>
        </div>
      </div>

      <div className="payment-options">
        <div className="payment-option">
          <label className={`payment-method ${selectedMethod === 'vnpay' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="paymentMethod"
              value="vnpay"
              checked={selectedMethod === 'vnpay'}
              onChange={(e) => setSelectedMethod(e.target.value as 'vnpay')}
            />
            <div className="method-content">
              <div className="method-header">
                <div className="payment-logo-container">
                  <span className="payment-logo-text">VNPay</span>
                </div>
                <div className="method-info">
                  <h4>VNPay</h4>
                  <p>Thanh toán qua VNPay - An toàn, nhanh chóng</p>
                </div>
              </div>
              
              {selectedMethod === 'vnpay' && (
                <div className="bank-selection">
                  <label htmlFor="bankSelect">Chọn ngân hàng:</label>
                  <select
                    id="bankSelect"
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="bank-select"
                  >
                    {supportedBanks.map(bank => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </label>
        </div>

        <div className="payment-option">
          <label className={`payment-method ${selectedMethod === 'momo' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="paymentMethod"
              value="momo"
              checked={selectedMethod === 'momo'}
              onChange={(e) => setSelectedMethod(e.target.value as 'momo')}
              disabled
            />
            <div className="method-content">
              <div className="method-header">
                <div className="payment-logo-container">
                  <span className="payment-logo-text">MoMo</span>
                </div>
                <div className="method-info">
                  <h4>Ví MoMo</h4>
                  <p>Thanh toán qua ví điện tử MoMo (Sắp ra mắt)</p>
                </div>
              </div>
            </div>
          </label>
        </div>

        <div className="payment-option">
          <label className={`payment-method ${selectedMethod === 'credit' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="paymentMethod"
              value="credit"
              checked={selectedMethod === 'credit'}
              onChange={(e) => setSelectedMethod(e.target.value as 'credit')}
              disabled
            />
            <div className="method-content">
              <div className="method-header">
                <div className="credit-cards">
                  <span className="payment-logo-text">VISA</span>
                  <span className="payment-logo-text">MC</span>
                </div>
                <div className="method-info">
                  <h4>Thẻ tín dụng/ghi nợ</h4>
                  <p>Thanh toán bằng thẻ Visa, Mastercard (Sắp ra mắt)</p>
                </div>
              </div>
            </div>
          </label>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="payment-security">
        <div className="security-note">
          🔐 <strong>Bảo mật thông tin:</strong> Thông tin thanh toán của bạn được mã hóa và bảo vệ bởi các tiêu chuẩn bảo mật quốc tế.
        </div>
      </div>

      <div className="payment-actions">
        <button 
          type="button"
          onClick={onBack}
          className="btn btn-secondary"
          disabled={loading}
        >
          Quay lại
        </button>
        
        <button
          type="button"
          onClick={handlePayment}
          className={`btn btn-primary ${loading ? 'loading' : ''}`}
          disabled={loading || (selectedMethod === 'vnpay' && !selectedBank)}
        >
          {loading && <div className="loading-spinner"></div>}
          {loading ? 'Đang xử lý...' : 'Thanh toán ngay'}
        </button>
      </div>
    </div>
  )
}