import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import './PaymentForm.css'

interface PaymentFormProps {
  bookingData: {
    showtimeId: number
    seats: Array<{ seat: string; type: string; price: number }>
    subtotal: number
  }
  onPaymentSuccess: (booking: any) => void
  onPaymentError: (error: string) => void
}

interface PaymentMethod {
  id: string
  name: string
  icon: string
  description: string
  available: boolean
}

interface CustomerInfo {
  name: string
  email: string
  phone: string
}

interface CreditCardInfo {
  cardNumber: string
  expiryDate: string
  cvv: string
  cardholderName: string
}

export default function PaymentForm({ bookingData, onPaymentSuccess, onPaymentError }: PaymentFormProps) {
  const navigate = useNavigate()
  
  // Form states
  const [selectedMethod, setSelectedMethod] = useState<string>('credit_card')
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: ''
  })
  const [creditCardInfo, setCreditCardInfo] = useState<CreditCardInfo>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  })
  
  // UI states
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [agreesToTerms, setAgreesToTerms] = useState(false)

  // Available payment methods
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'credit_card',
      name: 'Thẻ tín dụng',
      icon: '💳',
      description: 'Visa, Mastercard, JCB, American Express',
      available: true
    },
    {
      id: 'debit_card',
      name: 'Thẻ ghi nợ',
      icon: '💳',
      description: 'Thẻ ATM các ngân hàng',
      available: true
    },
    {
      id: 'bank_transfer',
      name: 'Chuyển khoản ngân hàng',
      icon: '🏦',
      description: 'Internet Banking, ATM',
      available: true
    },
    {
      id: 'digital_wallet',
      name: 'Ví điện tử',
      icon: '📱',
      description: 'MoMo, ZaloPay, VNPay',
      available: false
    }
  ]

  // Load user info on mount
  useEffect(() => {
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    try {
      const response = await api.get('/auth/me')
      const user = response.data.data
      setCustomerInfo({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      })
    } catch (error) {
      console.log('User not logged in or error loading info')
    }
  }

  // Validation functions
  const validateCustomerInfo = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!customerInfo.name.trim()) {
      newErrors.name = 'Vui lòng nhập họ tên'
    }

    if (!customerInfo.email.trim()) {
      newErrors.email = 'Vui lòng nhập email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      newErrors.email = 'Email không đúng định dạng'
    }

    if (!customerInfo.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại'
    } else if (!/^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/.test(customerInfo.phone)) {
      newErrors.phone = 'Số điện thoại không đúng định dạng'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateCreditCard = (): boolean => {
    if (selectedMethod !== 'credit_card' && selectedMethod !== 'debit_card') return true

    const newErrors: Record<string, string> = {}

    if (!creditCardInfo.cardNumber.replace(/\s/g, '')) {
      newErrors.cardNumber = 'Vui lòng nhập số thẻ'
    } else if (!/^[0-9]{13,19}$/.test(creditCardInfo.cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Số thẻ không đúng định dạng'
    }

    if (!creditCardInfo.expiryDate) {
      newErrors.expiryDate = 'Vui lòng nhập ngày hết hạn'
    } else if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(creditCardInfo.expiryDate)) {
      newErrors.expiryDate = 'Định dạng: MM/YY'
    }

    if (!creditCardInfo.cvv) {
      newErrors.cvv = 'Vui lòng nhập mã CVV'
    } else if (!/^[0-9]{3,4}$/.test(creditCardInfo.cvv)) {
      newErrors.cvv = 'CVV phải là 3-4 số'
    }

    if (!creditCardInfo.cardholderName.trim()) {
      newErrors.cardholderName = 'Vui lòng nhập tên chủ thẻ'
    }

    setErrors(prev => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const validateTerms = (): boolean => {
    if (!agreesToTerms) {
      setErrors(prev => ({ ...prev, terms: 'Vui lòng đồng ý với điều khoản sử dụng' }))
      return false
    }
    return true
  }

  // Format card number with spaces
  const formatCardNumber = (value: string): string => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  // Format expiry date MM/YY
  const formatExpiryDate = (value: string): string => {
    const v = value.replace(/\D/g, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous errors
    setErrors({})

    // Validate all sections
    const isCustomerValid = validateCustomerInfo()
    const isCreditCardValid = validateCreditCard()
    const isTermsValid = validateTerms()

    if (!isCustomerValid || !isCreditCardValid || !isTermsValid) {
      return
    }

    setProcessing(true)

    try {
      // Create booking first
      const bookingResponse = await api.post('/bookings', {
        showtime_id: bookingData.showtimeId,
        seats: bookingData.seats.map(seat => ({
          seat: seat.seat,
          type: seat.type
        })),
        payment_method: selectedMethod,
        customer_info: customerInfo
      })

      const booking = bookingResponse.data.data

      // Process payment with updated format
      const paymentData = {
        payment_method: selectedMethod,
        customer_info: customerInfo,
        ...((selectedMethod === 'credit_card' || selectedMethod === 'debit_card') && { 
          card_details: {
            card_number: creditCardInfo.cardNumber.replace(/\s/g, ''),
            card_holder: creditCardInfo.cardholderName,
            expiry_month: parseInt(creditCardInfo.expiryDate.split('/')[0]),
            expiry_year: parseInt('20' + creditCardInfo.expiryDate.split('/')[1]),
            cvv: creditCardInfo.cvv
          }
        })
      }

      const paymentResponse = await api.post(`/bookings/${booking.id}/payment`, paymentData)

      if (paymentResponse.data.success) {
        onPaymentSuccess(paymentResponse.data.data.booking || booking)
      } else {
        throw new Error(paymentResponse.data.message || 'Thanh toán thất bại')
      }

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra trong quá trình thanh toán'
      onPaymentError(errorMessage)
      setErrors({ payment: errorMessage })
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  return (
    <div className="payment-form">
      <form onSubmit={handleSubmit} className="payment-form-content">
        
        {/* Customer Information Section */}
        <div className="form-section">
          <div className="section-header">
            <div className="section-icon">👤</div>
            <h3 className="section-title">Thông tin khách hàng</h3>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="customer-name" className="form-label">Họ tên *</label>
              <input
                id="customer-name"
                type="text"
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="Nhập họ và tên đầy đủ"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="customer-email" className="form-label">Email *</label>
              <input
                id="customer-email"
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="example@email.com"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="customer-phone" className="form-label">Số điện thoại *</label>
              <input
                id="customer-phone"
                type="tel"
                className={`form-input ${errors.phone ? 'error' : ''}`}
                placeholder="0xxx xxx xxx"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
              />
              {errors.phone && <span className="form-error">{errors.phone}</span>}
            </div>
          </div>
        </div>

        {/* Payment Method Section */}
        <div className="form-section">
          <div className="section-header">
            <div className="section-icon">💳</div>
            <h3 className="section-title">Phương thức thanh toán</h3>
          </div>

          <div className="payment-methods">
            {paymentMethods.map((method) => (
              <label
                key={method.id}
                className={`payment-method ${selectedMethod === method.id ? 'selected' : ''} ${!method.available ? 'disabled' : ''}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={selectedMethod === method.id}
                  disabled={!method.available}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="payment-radio"
                />
                <div className="payment-icon">{method.icon}</div>
                <div className="payment-info">
                  <div className="payment-name">{method.name}</div>
                  <div className="payment-description">{method.description}</div>
                </div>
                {!method.available && <div className="payment-status">Sắp có</div>}
              </label>
            ))}
          </div>
        </div>

        {/* Credit Card Details Section */}
        {(selectedMethod === 'credit_card' || selectedMethod === 'debit_card') && (
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon">💳</div>
              <h3 className="section-title">Thông tin thẻ thanh toán</h3>
            </div>

            <div className="form-grid">
              <div className="form-field form-field-full">
                <label htmlFor="card-number" className="form-label">Số thẻ *</label>
                <input
                  id="card-number"
                  type="text"
                  className={`form-input ${errors.cardNumber ? 'error' : ''}`}
                  placeholder="1234 5678 9012 3456"
                  value={creditCardInfo.cardNumber}
                  onChange={(e) => setCreditCardInfo(prev => ({ 
                    ...prev, 
                    cardNumber: formatCardNumber(e.target.value)
                  }))}
                  maxLength={19}
                />
                {errors.cardNumber && <span className="form-error">{errors.cardNumber}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="card-expiry" className="form-label">Ngày hết hạn *</label>
                <input
                  id="card-expiry"
                  type="text"
                  className={`form-input ${errors.expiryDate ? 'error' : ''}`}
                  placeholder="MM/YY"
                  value={creditCardInfo.expiryDate}
                  onChange={(e) => setCreditCardInfo(prev => ({ 
                    ...prev, 
                    expiryDate: formatExpiryDate(e.target.value)
                  }))}
                  maxLength={5}
                />
                {errors.expiryDate && <span className="form-error">{errors.expiryDate}</span>}
              </div>

              <div className="form-field">
                <label htmlFor="card-cvv" className="form-label">CVV *</label>
                <input
                  id="card-cvv"
                  type="text"
                  className={`form-input ${errors.cvv ? 'error' : ''}`}
                  placeholder="123"
                  value={creditCardInfo.cvv}
                  onChange={(e) => setCreditCardInfo(prev => ({ 
                    ...prev, 
                    cvv: e.target.value.replace(/\D/g, '')
                  }))}
                  maxLength={4}
                />
                {errors.cvv && <span className="form-error">{errors.cvv}</span>}
              </div>

              <div className="form-field form-field-full">
                <label htmlFor="card-holder" className="form-label">Tên chủ thẻ *</label>
                <input
                  id="card-holder"
                  type="text"
                  className={`form-input ${errors.cardholderName ? 'error' : ''}`}
                  placeholder="NGUYEN VAN A"
                  value={creditCardInfo.cardholderName}
                  onChange={(e) => setCreditCardInfo(prev => ({ 
                    ...prev, 
                    cardholderName: e.target.value.toUpperCase()
                  }))}
                />
                {errors.cardholderName && <span className="form-error">{errors.cardholderName}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="form-section">
          <div className="section-header">
            <div className="section-icon">📋</div>
            <h3 className="section-title">Tóm tắt đơn hàng</h3>
          </div>

          <div className="order-summary">
            <div className="summary-row">
              <span>Số ghế:</span>
              <span>{bookingData.seats.length} ghế</span>
            </div>
            <div className="summary-row">
              <span>Ghế đã chọn:</span>
              <span>{bookingData.seats.map(seat => seat.seat).join(', ')}</span>
            </div>
            <div className="summary-row">
              <span>Tạm tính:</span>
              <span>{formatCurrency(bookingData.subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Phí dịch vụ:</span>
              <span>{formatCurrency(0)}</span>
            </div>
            <div className="summary-row total">
              <span>Tổng thanh toán:</span>
              <span>{formatCurrency(bookingData.subtotal)}</span>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="form-section">
          <div className="terms-section">
            <label className="terms-checkbox">
              <input
                type="checkbox"
                checked={agreesToTerms}
                onChange={(e) => setAgreesToTerms(e.target.checked)}
              />
              <span className="checkmark"></span>
              <span className="terms-text">
                Tôi đã đọc và đồng ý với{' '}
                <a href="/terms" target="_blank" className="terms-link">
                  điều khoản sử dụng
                </a>{' '}
                và{' '}
                <a href="/privacy" target="_blank" className="terms-link">
                  chính sách bảo mật
                </a>{' '}
                của CineBook
              </span>
            </label>
            {errors.terms && <span className="form-error">{errors.terms}</span>}
          </div>
        </div>

        {/* Payment Error */}
        {errors.payment && (
          <div className="payment-error">
            <div className="error-icon">⚠️</div>
            <div className="error-message">{errors.payment}</div>
          </div>
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={processing}
            className={`payment-submit-btn ${processing ? 'processing' : ''}`}
          >
            {processing ? (
              <>
                <div className="spinner"></div>
                Đang xử lý thanh toán...
              </>
            ) : (
              <>
                <span className="btn-icon">💳</span>
                Thanh toán {formatCurrency(bookingData.subtotal)}
              </>
            )}
          </button>
        </div>

        {/* Security Notice */}
        <div className="security-notice">
          <div className="security-icon">🔒</div>
          <div className="security-text">
            Thông tin thanh toán của bạn được bảo mật bằng mã hóa SSL 256-bit.
            Chúng tôi không lưu trữ thông tin thẻ thanh toán.
          </div>
        </div>

      </form>
    </div>
  )
}