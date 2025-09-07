import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import './PaymentReturn.css'

interface PaymentReturn {
  success: boolean
  booking_id?: string
  transaction_id?: string
  amount: number
  bank_code?: string
  payment_date?: string
  transactionStatus?: string
  message?: string
}

interface PaymentInfo {
  bookingId: string
  transactionId: string
  amount: number
  timestamp: number
}

// Extended PaymentReturn type to include local storage data
interface ExtendedPaymentReturn extends PaymentReturn {
  storedInfo?: PaymentInfo
}

export default function PaymentReturn() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'processing' | 'success' | 'failed' | 'error'>('processing')
  const [paymentData, setPaymentData] = useState<ExtendedPaymentReturn | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [redirectCountdown, setRedirectCountdown] = useState(5)

  useEffect(() => {
    void processPaymentReturn()
  }, [])

  useEffect(() => {
    if (status === 'success' && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1)
      }, 1000)

      return () => clearTimeout(timer)
    } else if (status === 'success' && redirectCountdown === 0) {
      // Auto redirect to booking confirmation
      if (paymentData?.booking_id) {
        navigate(`/booking/confirmation?bookingId=${paymentData.booking_id}`)
      } else {
        navigate('/my-bookings')
      }
    }
  }, [status, redirectCountdown, paymentData, navigate])

  const isValidVNPayReturn = (params: URLSearchParams): boolean => {
    // Basic validation - check for required VNPay parameters
    return !!(params.get('vnp_ResponseCode') && params.get('vnp_TxnRef'))
  }

  const getResponseMessage = (responseCode: string): string => {
    const messages: Record<string, string> = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày',
      '75': 'Ngân hàng thanh toán đang bảo trì',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
      '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)'
    }
    return messages[responseCode] || 'Lỗi không xác định'
  }

  const processPaymentReturn = async () => {
    try {
      // Check if this is a valid VNPay return
      if (!isValidVNPayReturn(searchParams)) {
        setStatus('error')
        setError('Invalid payment return URL')
        return
      }

      // Get stored payment info
      const storedInfo = localStorage.getItem('vnpay_payment_info')
      let paymentInfo: PaymentInfo | null = null
      
      if (storedInfo) {
        try {
          paymentInfo = JSON.parse(storedInfo) as PaymentInfo
          // Check if payment info is not too old (30 minutes)
          const now = Date.now()
          if (paymentInfo && now - paymentInfo.timestamp > 30 * 60 * 1000) {
            localStorage.removeItem('vnpay_payment_info')
            paymentInfo = null
          }
        } catch {
          localStorage.removeItem('vnpay_payment_info')
          paymentInfo = null
        }
      }

      // Get response code from URL params
      const responseCode = searchParams.get('vnp_ResponseCode') || '99'
      const txnRef = searchParams.get('vnp_TxnRef') || ''
      const amount = parseInt(searchParams.get('vnp_Amount') || '0') / 100 // VNPay amount is in cents
      const bankCode = searchParams.get('vnp_BankCode') || ''
      const payDate = searchParams.get('vnp_PayDate') || ''

      // Mock verify payment with backend (for now just check response code)
      const result: PaymentReturn = {
        success: responseCode === '00',
        booking_id: txnRef,
        transaction_id: txnRef,
        amount: amount,
        bank_code: bankCode,
        payment_date: payDate,
        transactionStatus: responseCode === '00' ? 'SUCCESS' : 'FAILED',
        message: getResponseMessage(responseCode)
      }
      
      setPaymentData({
        ...result,
        storedInfo: paymentInfo
      })

      if (result.transactionStatus === 'SUCCESS') {
        setStatus('success')
        // Clean up stored payment info
        localStorage.removeItem('vnpay_payment_info')
      } else {
        setStatus('failed')
        setError(result.message || getResponseMessage(responseCode))
      }
    } catch (error: unknown) {
      console.error('Payment return processing error:', error)
      setStatus('error')
      setError('Unable to process payment return')
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDateTime = (dateString: string): string => {
    if (!dateString) return ''
    
    try {
      // VNPay date format: yyyyMMddHHmmss
      const year = dateString.substring(0, 4)
      const month = dateString.substring(4, 6)
      const day = dateString.substring(6, 8)
      const hour = dateString.substring(8, 10)
      const minute = dateString.substring(10, 12)
      const second = dateString.substring(12, 14)
      
      const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`)
      return date.toLocaleString('vi-VN')
    } catch {
      return dateString
    }
  }

  const handleRetry = () => {
    if (paymentData?.storedInfo?.bookingId) {
      navigate(`/booking/checkout?bookingId=${paymentData.storedInfo.bookingId}`)
    } else {
      navigate('/movies')
    }
  }

  const handleBackToHome = () => {
    navigate('/')
  }

  const handleViewETicket = () => {
    if (paymentData?.booking_id) {
      navigate(`/booking/confirmation?bookingId=${paymentData.booking_id}`)
    } else {
      navigate('/my-bookings')
    }
  }

  const handleViewBookings = () => {
    navigate('/my-bookings')
  }

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="payment-result processing">
            <div className="result-icon">
              <div className="loading-spinner large"></div>
            </div>
            <h1>Đang xử lý thanh toán...</h1>
            <p>Vui lòng chờ trong giây lát</p>
          </div>
        )

      case 'success':
        return (
          <div className="payment-result success">
            <div className="result-icon">✅</div>
            <h1>Thanh toán thành công!</h1>
            <p>Cảm ơn bạn đã đặt vé tại CineBook</p>
            
            <div className="payment-details">
              <h3>Chi tiết giao dịch</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Mã đặt vé:</span>
                  <span className="value">{paymentData?.booking_id}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Mã giao dịch:</span>
                  <span className="value">{paymentData?.transaction_id}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Số tiền:</span>
                  <span className="value amount">{paymentData ? formatCurrency(paymentData.amount) : ''}</span>
                </div>
                {paymentData?.bank_code && (
                  <div className="detail-item">
                    <span className="label">Ngân hàng:</span>
                    <span className="value">{paymentData?.bank_code}</span>
                  </div>
                )}
                {paymentData?.payment_date && (
                  <div className="detail-item">
                    <span className="label">Thời gian:</span>
                    <span className="value">{paymentData?.payment_date ? formatDateTime(paymentData.payment_date) : ''}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="next-steps">
              <h3>Tiếp theo</h3>
              <p>• Vé điện tử đã được gửi về email của bạn</p>
              <p>• Vui lòng mang CCCD/CMND và mã đặt vé khi đến rạp</p>
              <p>• Có mặt tại rạp trước giờ chiếu 15 phút</p>
            </div>

            <div className="redirect-notice">
              Tự động chuyển trang sau {redirectCountdown} giây...
            </div>

            <div className="action-buttons">
              <button 
                onClick={handleViewETicket}
                className="btn btn-primary"
                type="button"
              >
                Xem vé điện tử
              </button>
              <button 
                onClick={handleViewBookings}
                className="btn btn-secondary"
                type="button"
              >
                Lịch sử đặt vé
              </button>
            </div>
          </div>
        )

      case 'failed':
        return (
          <div className="payment-result failed">
            <div className="result-icon">❌</div>
            <h1>Thanh toán thất bại</h1>
            <p>Giao dịch của bạn không thể hoàn tất</p>
            
            <div className="error-details">
              <h3>Chi tiết lỗi</h3>
              <p>{error || 'Không xác định được lỗi'}</p>
              
              {paymentData && (
                <div className="detail-grid">
                  {paymentData.transaction_id && (
                    <div className="detail-item">
                      <span className="label">Mã giao dịch:</span>
                      <span className="value">{paymentData.transaction_id}</span>
                    </div>
                  )}
                  {paymentData.amount > 0 && (
                    <div className="detail-item">
                      <span className="label">Số tiền:</span>
                      <span className="value">{formatCurrency(paymentData.amount)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="support-info">
              <h3>Cần hỗ trợ?</h3>
              <p>Liên hệ hotline: <strong>1900 xxxx</strong></p>
              <p>Email: <strong>support@cinebook.com</strong></p>
            </div>

            <div className="action-buttons">
              <button 
                onClick={handleRetry}
                className="btn btn-primary"
                type="button"
              >
                Thử lại thanh toán
              </button>
              <button 
                onClick={handleBackToHome}
                className="btn btn-secondary"
                type="button"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        )

      case 'error':
        return (
          <div className="payment-result error">
            <div className="result-icon">⚠️</div>
            <h1>Có lỗi xảy ra</h1>
            <p>Không thể xử lý thông tin thanh toán</p>
            
            <div className="error-details">
              <p>{error}</p>
            </div>

            <div className="action-buttons">
              <button 
                onClick={handleBackToHome}
                className="btn btn-primary"
                type="button"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="payment-return-page">
      <div className="payment-return-container">
        {renderContent()}
      </div>
    </div>
  )
}