import { useState, useEffect, useRef } from 'react'
import vnpayService from '../services/vnpayService'
import websocketService from '../services/websocketService'
import './PaymentStatusMonitor.css'

interface PaymentStatusMonitorProps {
  bookingId: string
  transactionId?: string
  expectedAmount: number
  onPaymentConfirmed: (paymentData: PaymentStatusData) => void
  onPaymentFailed: (error: string) => void
  onTimeout: () => void
  timeout?: number // in milliseconds, default 10 minutes
}

interface PaymentStatusData {
  transactionId: string
  transactionStatus: 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED'
  amount: number
  bookingId: string
  paymentDate?: string
  bankCode?: string
  message?: string
}

export default function PaymentStatusMonitor({
  bookingId,
  transactionId,
  expectedAmount,
  onPaymentConfirmed,
  onPaymentFailed,
  onTimeout,
  timeout = 10 * 60 * 1000 // 10 minutes default
}: PaymentStatusMonitorProps) {
  const [status, setStatus] = useState<'waiting' | 'processing' | 'success' | 'failed' | 'timeout'>('waiting')
  const [paymentData, setPaymentData] = useState<PaymentStatusData | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(timeout / 1000)
  const [retryCount, setRetryCount] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxRetries = 3

  useEffect(() => {
    startMonitoring()
    return () => {
      cleanup()
    }
  }, [])

  useEffect(() => {
    // Listen for WebSocket payment updates
    const handlePaymentUpdate = (data: any) => {
      if (data.bookingId === bookingId) {
        handlePaymentStatusUpdate(data)
      }
    }

    // Connect to WebSocket for real-time updates
    websocketService.connect()
    websocketService.subscribeToPaymentUpdates(bookingId, handlePaymentUpdate)
    setConnectionStatus('connected')

    return () => {
      websocketService.unsubscribeFromPaymentUpdates(bookingId)
    }
  }, [bookingId])

  const startMonitoring = () => {
    // Start countdown timer
    const countdownInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Start periodic polling
    startPolling()

    // Set overall timeout
    timeoutRef.current = setTimeout(() => {
      handleTimeout()
    }, timeout)
  }

  const startPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Poll every 5 seconds for payment status
    intervalRef.current = setInterval(async () => {
      if (transactionId && status === 'waiting') {
        await checkPaymentStatus()
      }
    }, 5000)
  }

  const checkPaymentStatus = async () => {
    if (!transactionId) return

    try {
      setStatus('processing')
      const result = await vnpayService.queryTransactionStatus(transactionId)
      
      if (result.success) {
        handlePaymentStatusUpdate(result)
      } else {
        // Retry logic
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1)
          setStatus('waiting')
        } else {
          onPaymentFailed('Không thể kiểm tra trạng thái thanh toán sau nhiều lần thử')
          setStatus('failed')
        }
      }
    } catch (error) {
      console.error('Payment status check error:', error)
      setConnectionStatus('error')
      setStatus('waiting')
    }
  }

  const handlePaymentStatusUpdate = (data: PaymentStatusData) => {
    setPaymentData(data)
    
    switch (data.transactionStatus) {
      case 'SUCCESS':
        if (data.amount === expectedAmount) {
          setStatus('success')
          onPaymentConfirmed(data)
          cleanup()
        } else {
          onPaymentFailed(`Số tiền thanh toán không khớp: ${data.amount} !== ${expectedAmount}`)
          setStatus('failed')
        }
        break
        
      case 'FAILED':
      case 'CANCELLED':
        setStatus('failed')
        onPaymentFailed(data.message || 'Thanh toán thất bại')
        cleanup()
        break
        
      case 'PENDING':
        setStatus('waiting')
        break
        
      default:
        setStatus('waiting')
    }
  }

  const handleTimeout = () => {
    setStatus('timeout')
    onTimeout()
    cleanup()
  }

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'waiting':
        return '⏳'
      case 'processing':
        return '🔄'
      case 'success':
        return '✅'
      case 'failed':
        return '❌'
      case 'timeout':
        return '⏰'
      default:
        return '❓'
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'waiting':
        return 'Đang chờ xác nhận thanh toán...'
      case 'processing':
        return 'Đang xử lý giao dịch...'
      case 'success':
        return 'Thanh toán thành công!'
      case 'failed':
        return 'Thanh toán thất bại'
      case 'timeout':
        return 'Hết thời gian chờ thanh toán'
      default:
        return 'Không xác định'
    }
  }

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return '🟢'
      case 'disconnected':
        return '🟡'
      case 'error':
        return '🔴'
      default:
        return '🟡'
    }
  }

  return (
    <div className={`payment-status-monitor ${status}`}>
      <div className=\"monitor-header\">
        <div className=\"status-icon\">{getStatusIcon()}</div>
        <h3>{getStatusMessage()}</h3>
      </div>

      <div className=\"monitor-content\">
        <div className=\"payment-info\">
          <div className=\"info-item\">
            <span className=\"label\">Mã đặt vé:</span>
            <span className=\"value\">{bookingId}</span>
          </div>
          
          {transactionId && (
            <div className=\"info-item\">
              <span className=\"label\">Mã giao dịch:</span>
              <span className=\"value\">{transactionId}</span>
            </div>
          )}
          
          <div className=\"info-item\">
            <span className=\"label\">Số tiền:</span>
            <span className=\"value amount\">{formatCurrency(expectedAmount)}</span>
          </div>
        </div>

        {status === 'waiting' && (
          <div className=\"waiting-info\">
            <div className=\"timer\">
              <span className=\"timer-label\">Thời gian còn lại:</span>
              <span className=\"timer-value\">{formatTime(timeRemaining)}</span>
            </div>
            
            <div className=\"progress-bar\">
              <div 
                className=\"progress-fill\"
                style={{ 
                  width: `${((timeout / 1000 - timeRemaining) / (timeout / 1000)) * 100}%` 
                }}
              />
            </div>

            <div className=\"waiting-tips\">
              <h4>💡 Hướng dẫn:</h4>
              <ul>
                <li>Vui lòng hoàn tất thanh toán trên trang ngân hàng</li>
                <li>Không đóng trang này cho đến khi nhận được xác nhận</li>
                <li>Nếu có vấn đề, vui lòng liên hệ hotline hỗ trợ</li>
              </ul>
            </div>
          </div>
        )}

        {status === 'processing' && (
          <div className=\"processing-info\">
            <div className=\"loading-spinner\"></div>
            <p>Đang xác thực giao dịch với ngân hàng...</p>
          </div>
        )}

        {status === 'success' && paymentData && (
          <div className=\"success-info\">
            <div className=\"success-details\">
              {paymentData.paymentDate && (
                <div className=\"info-item\">
                  <span className=\"label\">Thời gian thanh toán:</span>
                  <span className=\"value\">{new Date(paymentData.paymentDate).toLocaleString('vi-VN')}</span>
                </div>
              )}
              
              {paymentData.bankCode && (
                <div className=\"info-item\">
                  <span className=\"label\">Ngân hàng:</span>
                  <span className=\"value\">{paymentData.bankCode}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {(status === 'failed' || status === 'timeout') && (
          <div className=\"error-info\">
            <p>{paymentData?.message || 'Có lỗi xảy ra trong quá trình thanh toán'}</p>
            <div className=\"retry-info\">
              <p>Số lần thử lại: {retryCount}/{maxRetries}</p>
            </div>
          </div>
        )}
      </div>

      <div className=\"monitor-footer\">
        <div className=\"connection-status\">
          <span className=\"connection-icon\">{getConnectionStatusIcon()}</span>
          <span className=\"connection-text\">
            {connectionStatus === 'connected' ? 'Đã kết nối' : 
             connectionStatus === 'disconnected' ? 'Mất kết nối' : 'Lỗi kết nối'}
          </span>
        </div>
        
        <div className=\"support-contact\">
          <small>Cần hỗ trợ? Gọi: <strong>1900 xxxx</strong></small>
        </div>
      </div>
    </div>
  )
}"