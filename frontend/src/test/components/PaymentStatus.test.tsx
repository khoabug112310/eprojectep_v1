import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import PaymentStatus from '../../components/PaymentStatus'

// Mock react-router-dom useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockOnRetry = vi.fn()
const mockOnClose = vi.fn()

const renderPaymentStatus = (props = {}) => {
  const defaultProps = {
    status: 'idle' as const,
    onRetry: mockOnRetry,
    onClose: mockOnClose,
  }

  return render(
    <BrowserRouter>
      <PaymentStatus {...defaultProps} {...props} />
    </BrowserRouter>
  )
}

describe('PaymentStatus Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Idle State', () => {
    it('renders nothing when status is idle', () => {
      renderPaymentStatus({ status: 'idle' })
      
      expect(screen.queryByText('Đang xử lý thanh toán...')).not.toBeInTheDocument()
      expect(screen.queryByText('Thanh toán thành công!')).not.toBeInTheDocument()
      expect(screen.queryByText('Thanh toán thất bại')).not.toBeInTheDocument()
    })
  })

  describe('Processing State', () => {
    it('renders processing state correctly', () => {
      renderPaymentStatus({ status: 'processing' })
      
      expect(screen.getByText('Đang xử lý thanh toán...')).toBeInTheDocument()
      expect(screen.getByText('Vui lòng chờ trong giây lát')).toBeInTheDocument()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('shows processing steps', () => {
      renderPaymentStatus({ status: 'processing' })
      
      expect(screen.getByText('Xác thực thông tin thanh toán')).toBeInTheDocument()
      expect(screen.getByText('Xử lý giao dịch')).toBeInTheDocument()
      expect(screen.getByText('Tạo vé điện tử')).toBeInTheDocument()
    })

    it('does not show action buttons during processing', () => {
      renderPaymentStatus({ status: 'processing' })
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('Success State', () => {
    it('renders success state correctly', () => {
      renderPaymentStatus({ 
        status: 'success',
        bookingId: 123
      })
      
      expect(screen.getByText('Thanh toán thành công!')).toBeInTheDocument()
      expect(screen.getByText('Chúc mừng! Vé của bạn đã được đặt thành công.')).toBeInTheDocument()
      expect(screen.getByTestId('success-icon')).toBeInTheDocument()
    })

    it('shows booking ID when provided', () => {
      renderPaymentStatus({ 
        status: 'success',
        bookingId: 123
      })
      
      expect(screen.getByText('Mã đặt vé: #123')).toBeInTheDocument()
    })

    it('shows action buttons for success state', () => {
      renderPaymentStatus({ 
        status: 'success',
        bookingId: 123
      })
      
      expect(screen.getByText('🎫 Xem vé của tôi')).toBeInTheDocument()
      expect(screen.getByText('🎬 Đặt vé khác')).toBeInTheDocument()
    })

    it('navigates to booking confirmation when view ticket is clicked', async () => {
      const user = userEvent.setup()
      renderPaymentStatus({ 
        status: 'success',
        bookingId: 123
      })
      
      const viewTicketButton = screen.getByText('🎫 Xem vé của tôi')
      await user.click(viewTicketButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/booking/confirmation?booking_id=123')
    })

    it('navigates to movies page when book another is clicked', async () => {
      const user = userEvent.setup()
      renderPaymentStatus({ 
        status: 'success',
        bookingId: 123
      })
      
      const bookAnotherButton = screen.getByText('🎬 Đặt vé khác')
      await user.click(bookAnotherButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/movies')
    })

    it('renders success state without booking ID', () => {
      renderPaymentStatus({ status: 'success' })
      
      expect(screen.getByText('Thanh toán thành công!')).toBeInTheDocument()
      expect(screen.queryByText(/mã đặt vé/i)).not.toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('renders error state correctly', () => {
      renderPaymentStatus({ 
        status: 'error',
        message: 'Payment failed due to insufficient funds'
      })
      
      expect(screen.getByText('Thanh toán thất bại')).toBeInTheDocument()
      expect(screen.getByText('Payment failed due to insufficient funds')).toBeInTheDocument()
      expect(screen.getByTestId('error-icon')).toBeInTheDocument()
    })

    it('shows default error message when no message provided', () => {
      renderPaymentStatus({ status: 'error' })
      
      expect(screen.getByText('Có lỗi xảy ra trong quá trình thanh toán')).toBeInTheDocument()
    })

    it('shows retry button when onRetry is provided', () => {
      renderPaymentStatus({ 
        status: 'error',
        onRetry: mockOnRetry
      })
      
      expect(screen.getByText('🔄 Thử lại')).toBeInTheDocument()
    })

    it('does not show retry button when onRetry is not provided', () => {
      renderPaymentStatus({ 
        status: 'error',
        onRetry: undefined
      })
      
      expect(screen.queryByText('🔄 Thử lại')).not.toBeInTheDocument()
    })

    it('calls onRetry when retry button is clicked', async () => {
      const user = userEvent.setup()
      renderPaymentStatus({ 
        status: 'error',
        onRetry: mockOnRetry
      })
      
      const retryButton = screen.getByText('🔄 Thử lại')
      await user.click(retryButton)
      
      expect(mockOnRetry).toHaveBeenCalledTimes(1)
    })

    it('shows contact support button', () => {
      renderPaymentStatus({ status: 'error' })
      
      expect(screen.getByText('📞 Liên hệ hỗ trợ')).toBeInTheDocument()
    })

    it('shows back to movies button', () => {
      renderPaymentStatus({ status: 'error' })
      
      expect(screen.getByText('🏠 Về trang chủ')).toBeInTheDocument()
    })

    it('navigates to movies page when back to home is clicked', async () => {
      const user = userEvent.setup()
      renderPaymentStatus({ status: 'error' })
      
      const backButton = screen.getByText('🏠 Về trang chủ')
      await user.click(backButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/movies')
    })
  })

  describe('Pending State', () => {
    it('renders pending state correctly', () => {
      renderPaymentStatus({ 
        status: 'pending',
        message: 'Waiting for bank confirmation'
      })
      
      expect(screen.getByText('Chờ xác nhận thanh toán')).toBeInTheDocument()
      expect(screen.getByText('Waiting for bank confirmation')).toBeInTheDocument()
      expect(screen.getByTestId('pending-icon')).toBeInTheDocument()
    })

    it('shows default pending message when no message provided', () => {
      renderPaymentStatus({ status: 'pending' })
      
      expect(screen.getByText('Giao dịch đang được xử lý, vui lòng đợi xác nhận từ ngân hàng')).toBeInTheDocument()
    })

    it('shows check status button when booking ID is provided', () => {
      renderPaymentStatus({ 
        status: 'pending',
        bookingId: 123
      })
      
      expect(screen.getByText('🔍 Kiểm tra trạng thái')).toBeInTheDocument()
    })

    it('navigates to booking confirmation when check status is clicked', async () => {
      const user = userEvent.setup()
      renderPaymentStatus({ 
        status: 'pending',
        bookingId: 123
      })
      
      const checkStatusButton = screen.getByText('🔍 Kiểm tra trạng thái')
      await user.click(checkStatusButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/booking/confirmation?booking_id=123')
    })
  })

  describe('Close Functionality', () => {
    it('shows close button when onClose is provided', () => {
      renderPaymentStatus({ 
        status: 'success',
        onClose: mockOnClose
      })
      
      expect(screen.getByLabelText('Đóng')).toBeInTheDocument()
    })

    it('does not show close button when onClose is not provided', () => {
      renderPaymentStatus({ 
        status: 'success',
        onClose: undefined
      })
      
      expect(screen.queryByLabelText('Đóng')).not.toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      renderPaymentStatus({ 
        status: 'success',
        onClose: mockOnClose
      })
      
      const closeButton = screen.getByLabelText('Đóng')
      await user.click(closeButton)
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when Escape key is pressed', async () => {
      const user = userEvent.setup()
      renderPaymentStatus({ 
        status: 'success',
        onClose: mockOnClose
      })
      
      await user.keyboard('[Escape]')
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Animation and Transitions', () => {
    it('has proper CSS classes for animations', () => {
      renderPaymentStatus({ status: 'processing' })
      
      const statusContainer = screen.getByTestId('payment-status-container')
      expect(statusContainer).toHaveClass('payment-status')
    })

    it('shows progress animation for processing state', () => {
      renderPaymentStatus({ status: 'processing' })
      
      const progressSteps = screen.getAllByTestId(/progress-step-/)
      expect(progressSteps).toHaveLength(3)
      
      // First step should be active
      expect(progressSteps[0]).toHaveClass('active')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for buttons', () => {
      renderPaymentStatus({ 
        status: 'success',
        bookingId: 123,
        onClose: mockOnClose
      })
      
      expect(screen.getByLabelText('Đóng')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /xem vé của tôi/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /đặt vé khác/i })).toBeInTheDocument()
    })

    it('has proper heading structure', () => {
      renderPaymentStatus({ status: 'success' })
      
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Thanh toán thành công!')
    })

    it('uses proper semantic elements', () => {
      renderPaymentStatus({ status: 'error', message: 'Test error' })
      
      const errorContainer = screen.getByRole('alert')
      expect(errorContainer).toBeInTheDocument()
    })

    it('can be navigated with keyboard', async () => {
      const user = userEvent.setup()
      renderPaymentStatus({ 
        status: 'error',
        onRetry: mockOnRetry
      })
      
      // Tab to retry button
      await user.tab()
      expect(screen.getByText('🔄 Thử lại')).toHaveFocus()
      
      // Tab to support button
      await user.tab()
      expect(screen.getByText('📞 Liên hệ hỗ trợ')).toHaveFocus()
      
      // Tab to home button
      await user.tab()
      expect(screen.getByText('🏠 Về trang chủ')).toHaveFocus()
    })
  })

  describe('Edge Cases', () => {
    it('handles unknown status gracefully', () => {
      // @ts-ignore - testing invalid status
      renderPaymentStatus({ status: 'unknown' })
      
      // Should render nothing for unknown status
      expect(screen.queryByText(/thanh toán/i)).not.toBeInTheDocument()
    })

    it('handles missing props gracefully', () => {
      expect(() => {
        render(
          <BrowserRouter>
            <PaymentStatus />
          </BrowserRouter>
        )
      }).not.toThrow()
    })

    it('handles very long error messages', () => {
      const longMessage = 'A'.repeat(500)
      renderPaymentStatus({ 
        status: 'error',
        message: longMessage
      })
      
      expect(screen.getByText(longMessage)).toBeInTheDocument()
    })

    it('handles special characters in messages', () => {
      const specialMessage = 'Error: 特殊字符 & <script>alert("xss")</script>'
      renderPaymentStatus({ 
        status: 'error',
        message: specialMessage
      })
      
      expect(screen.getByText(specialMessage)).toBeInTheDocument()
    })
  })

  describe('Component State Management', () => {
    it('updates UI when status prop changes', () => {
      const { rerender } = renderPaymentStatus({ status: 'processing' })
      
      expect(screen.getByText('Đang xử lý thanh toán...')).toBeInTheDocument()
      
      rerender(
        <BrowserRouter>
          <PaymentStatus status="success" bookingId={123} />
        </BrowserRouter>
      )
      
      expect(screen.getByText('Thanh toán thành công!')).toBeInTheDocument()
      expect(screen.queryByText('Đang xử lý thanh toán...')).not.toBeInTheDocument()
    })

    it('updates message when message prop changes', () => {
      const { rerender } = renderPaymentStatus({ 
        status: 'error',
        message: 'First error'
      })
      
      expect(screen.getByText('First error')).toBeInTheDocument()
      
      rerender(
        <BrowserRouter>
          <PaymentStatus status="error" message="Second error" />
        </BrowserRouter>
      )
      
      expect(screen.getByText('Second error')).toBeInTheDocument()
      expect(screen.queryByText('First error')).not.toBeInTheDocument()
    })
  })
})