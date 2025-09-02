import { useState, useEffect } from 'react'
import './PaymentStatus.css'

interface PaymentStatusProps {
  bookingId?: number
  status?: 'idle' | 'processing' | 'success' | 'error' | 'pending'
  message?: string
  onRetry?: () => void
  onClose?: () => void
}

export default function PaymentStatus({ 
  bookingId, 
  status = 'idle', 
  message, 
  onRetry, 
  onClose 
}: PaymentStatusProps) {
  const [currentStatus, setCurrentStatus] = useState(status)
  const [dots, setDots] = useState('')

  // Animate loading dots
  useEffect(() => {
    if (currentStatus === 'processing' || currentStatus === 'pending') {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.')
      }, 500)
      return () => clearInterval(interval)
    }
  }, [currentStatus])

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    setCurrentStatus(status)
  }, [status])

  const getStatusConfig = () => {
    switch (currentStatus) {
      case 'processing':
        return {
          icon: '⏳',
          title: 'Đang xử lý thanh toán',
          description: `Vui lòng chờ trong giây lát${dots}`,
          className: 'processing',
          showSpinner: true
        }
      
      case 'pending':
        return {
          icon: '⏰',
          title: 'Đang chờ xác nhận',
          description: `Thanh toán đang được xử lý${dots}`,
          className: 'pending',
          showSpinner: true
        }
      
      case 'success':
        return {
          icon: '✅',
          title: 'Thanh toán thành công!',
          description: 'Vé của bạn đã được đặt thành công. Email xác nhận sẽ được gửi trong ít phút.',
          className: 'success',
          showSpinner: false
        }
      
      case 'error':
        return {
          icon: '❌',
          title: 'Thanh toán thất bại',
          description: message || 'Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.',
          className: 'error',
          showSpinner: false
        }
      
      default:
        return {
          icon: '💳',
          title: 'Sẵn sàng thanh toán',
          description: 'Hệ thống sẵn sàng xử lý thanh toán của bạn.',
          className: 'idle',
          showSpinner: false
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className={`payment-status ${config.className}`}>
      <div className="status-content">
        
        {/* Status Icon */}
        <div className="status-icon-container">
          <div className="status-icon">
            {config.showSpinner ? (
              <div className="payment-spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-center">{config.icon}</div>
              </div>
            ) : (
              config.icon
            )}
          </div>
        </div>

        {/* Status Text */}
        <div className="status-text">
          <h3 className="status-title">{config.title}</h3>
          <p className="status-description">{config.description}</p>
          
          {bookingId && currentStatus === 'success' && (
            <div className="booking-info">
              <span className="booking-id">Mã đặt vé: #{bookingId}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="status-actions">
          {currentStatus === 'error' && onRetry && (
            <button onClick={onRetry} className="retry-btn">
              <span className="btn-icon">🔄</span>
              Thử lại
            </button>
          )}
          
          {currentStatus === 'success' && (
            <div className="success-actions">
              <button 
                onClick={() => window.location.href = `/ticket/${bookingId}`}
                className="view-ticket-btn"
              >
                <span className="btn-icon">🎫</span>
                Xem vé
              </button>
              <button 
                onClick={() => window.location.href = '/movies'}
                className="continue-btn"
              >
                <span className="btn-icon">🎬</span>
                Đặt vé khác
              </button>
            </div>
          )}
          
          {onClose && (currentStatus === 'error' || currentStatus === 'idle') && (
            <button onClick={onClose} className="close-btn">
              Đóng
            </button>
          )}
        </div>

        {/* Progress Steps for Processing */}
        {(currentStatus === 'processing' || currentStatus === 'pending') && (
          <div className="payment-progress">
            <div className="progress-steps">
              <div className="progress-step active">
                <div className="step-icon">1</div>
                <div className="step-text">Xác thực thông tin</div>
              </div>
              <div className="progress-step active">
                <div className="step-icon">2</div>
                <div className="step-text">Xử lý thanh toán</div>
              </div>
              <div className="progress-step">
                <div className="step-icon">3</div>
                <div className="step-text">Tạo vé điện tử</div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Info */}
        {currentStatus === 'processing' && (
          <div className="processing-info">
            <div className="info-item">
              <span className="info-icon">🔒</span>
              <span className="info-text">Giao dịch được bảo mật SSL</span>
            </div>
            <div className="info-item">
              <span className="info-icon">⏱️</span>
              <span className="info-text">Thời gian xử lý: 30-60 giây</span>
            </div>
          </div>
        )}

        {currentStatus === 'error' && (
          <div className="error-info">
            <div className="error-details">
              <h4>Một số nguyên nhân có thể xảy ra:</h4>
              <ul>
                <li>Thông tin thẻ không chính xác</li>
                <li>Số dư tài khoản không đủ</li>
                <li>Thẻ đã hết hạn hoặc bị khóa</li>
                <li>Kết nối mạng không ổn định</li>
              </ul>
            </div>
            <div className="support-info">
              <p>Nếu vấn đề vẫn tiếp tục, vui lòng liên hệ:</p>
              <div className="support-contacts">
                <a href="tel:1900123456" className="support-link">
                  📞 1900-123-456
                </a>
                <a href="mailto:support@cinebook.vn" className="support-link">
                  ✉️ support@cinebook.vn
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// Export additional helper functions
export const PaymentStatusModal = ({ isOpen, onClose, ...props }: PaymentStatusProps & { isOpen: boolean }) => {
  if (!isOpen) return null

  return (
    <div className="payment-status-modal-overlay" onClick={onClose}>
      <div className="payment-status-modal" onClick={(e) => e.stopPropagation()}>
        <PaymentStatus {...props} onClose={onClose} />
      </div>
    </div>
  )
}