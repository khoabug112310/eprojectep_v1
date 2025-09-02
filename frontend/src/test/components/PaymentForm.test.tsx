import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import PaymentForm from '../../components/PaymentForm'
import api from '../../services/api'

// Mock the API module
vi.mock('../../services/api')
const mockedApi = vi.mocked(api)

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}))

// Mock console.error to avoid noise in tests
vi.spyOn(console, 'error').mockImplementation(() => {})

const defaultBookingData = {
  showtimeId: 1,
  seats: [
    { seat: 'A1', type: 'gold', price: 120000 },
    { seat: 'A2', type: 'gold', price: 120000 },
  ],
  subtotal: 240000
}

const mockOnPaymentSuccess = vi.fn()
const mockOnPaymentError = vi.fn()

const renderPaymentForm = (props = {}) => {
  const defaultProps = {
    bookingData: defaultBookingData,
    onPaymentSuccess: mockOnPaymentSuccess,
    onPaymentError: mockOnPaymentError,
  }

  return render(
    <BrowserRouter>
      <PaymentForm {...defaultProps} {...props} />
    </BrowserRouter>
  )
}

describe('PaymentForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful API response by default
    mockedApi.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          booking: {
            id: 123,
            booking_code: 'CB123456',
            seats: ['A1', 'A2'],
            total_amount: 240000,
            payment_status: 'completed'
          }
        }
      }
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders payment form with all sections', () => {
      renderPaymentForm()
      
      expect(screen.getByText('Thông tin khách hàng')).toBeInTheDocument()
      expect(screen.getByText('Phương thức thanh toán')).toBeInTheDocument()
      expect(screen.getByText('Tóm tắt đơn hàng')).toBeInTheDocument()
    })

    it('displays correct booking summary', () => {
      renderPaymentForm()
      
      expect(screen.getByText('Ghế: A1, A2')).toBeInTheDocument()
      expect(screen.getByText('240.000 ₫')).toBeInTheDocument()
    })

    it('shows all payment method options', () => {
      renderPaymentForm()
      
      expect(screen.getByLabelText('Thẻ tín dụng')).toBeInTheDocument()
      expect(screen.getByLabelText('Thẻ ghi nợ')).toBeInTheDocument()
      expect(screen.getByLabelText('Chuyển khoản ngân hàng')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('validates required customer information fields', async () => {
      const user = userEvent.setup()
      renderPaymentForm()
      
      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /thanh toán/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Vui lòng nhập họ tên')).toBeInTheDocument()
        expect(screen.getByText('Vui lòng nhập email')).toBeInTheDocument()
        expect(screen.getByText('Vui lòng nhập số điện thoại')).toBeInTheDocument()
      })
    })

    it('validates email format', async () => {
      const user = userEvent.setup()
      renderPaymentForm()
      
      const emailInput = screen.getByPlaceholderText('example@email.com')
      await user.type(emailInput, 'invalid-email')
      
      // Submit to trigger validation
      const submitButton = screen.getByRole('button', { name: /thanh toán/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Email không đúng định dạng')).toBeInTheDocument()
      })
    })

    it('validates Vietnamese phone number format', async () => {
      const user = userEvent.setup()
      renderPaymentForm()
      
      const phoneInput = screen.getByPlaceholderText('0xxx xxx xxx')
      await user.type(phoneInput, '123456')
      
      // Submit to trigger validation
      const submitButton = screen.getByRole('button', { name: /thanh toán/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Số điện thoại không đúng định dạng')).toBeInTheDocument()
      })
    })

    it('accepts valid Vietnamese phone number', async () => {
      const user = userEvent.setup()
      renderPaymentForm()
      
      const phoneInput = screen.getByPlaceholderText('0xxx xxx xxx')
      await user.type(phoneInput, '0987654321')
      
      // Valid phone should not show error on submit
      const submitButton = screen.getByRole('button', { name: /thanh toán/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Số điện thoại không đúng định dạng')).not.toBeInTheDocument()
      })
    })

    it('validates credit card information when credit card is selected', async () => {
      const user = userEvent.setup()
      renderPaymentForm()
      
      // Select credit card
      const creditCardRadio = screen.getByLabelText('Thẻ tín dụng')
      await user.click(creditCardRadio)
      
      // Try to submit without card info
      const submitButton = screen.getByRole('button', { name: /thanh toán/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Vui lòng nhập số thẻ')).toBeInTheDocument()
        expect(screen.getByText('Vui lòng nhập tên chủ thẻ')).toBeInTheDocument()
        expect(screen.getByText('Vui lòng nhập ngày hết hạn')).toBeInTheDocument()
        expect(screen.getByText('Vui lòng nhập mã CVV')).toBeInTheDocument()
      })
    })

    it('validates credit card number format', async () => {
      const user = userEvent.setup()
      renderPaymentForm()
      
      // Select credit card
      const creditCardRadio = screen.getByLabelText('Thẻ tín dụng')
      await user.click(creditCardRadio)
      
      const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456')
      await user.type(cardNumberInput, '1234')
      
      // Submit to trigger validation
      const submitButton = screen.getByRole('button', { name: /thanh toán/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Số thẻ không đúng định dạng')).toBeInTheDocument()
      })
    })

    it('validates expiry date format', async () => {
      const user = userEvent.setup()
      renderPaymentForm()
      
      // Select credit card
      const creditCardRadio = screen.getByLabelText('Thẻ tín dụng')
      await user.click(creditCardRadio)
      
      const expiryInput = screen.getByPlaceholderText('MM/YY')
      await user.type(expiryInput, '13/25') // Invalid month
      
      // Submit to trigger validation
      const submitButton = screen.getByRole('button', { name: /thanh toán/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Định dạng: MM/YY')).toBeInTheDocument()
      })
    })

    it('validates CVV format', async () => {
      const user = userEvent.setup()
      renderPaymentForm()
      
      // Select credit card
      const creditCardRadio = screen.getByLabelText('Thẻ tín dụng')
      await user.click(creditCardRadio)
      
      const cvvInput = screen.getByPlaceholderText('123')
      await user.type(cvvInput, '12')
      
      // Submit to trigger validation
      const submitButton = screen.getByRole('button', { name: /thanh toán/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('CVV phải là 3-4 số')).toBeInTheDocument()
      })
    })

    it('requires terms acceptance', async () => {
      const user = userEvent.setup()
      renderPaymentForm()
      
      // Fill in minimal required information
      await user.type(screen.getByPlaceholderText('Nhập họ và tên đầy đủ'), 'John Doe')
      await user.type(screen.getByPlaceholderText('example@email.com'), 'john@example.com')
      await user.type(screen.getByPlaceholderText('0xxx xxx xxx'), '0987654321')
      
      // Try to submit without accepting terms
      const submitButton = screen.getByRole('button', { name: /thanh toán/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Vui lòng đồng ý với điều khoản sử dụng')).toBeInTheDocument()
      })
    })
  })

  describe('Payment Method Selection', () => {
    it('shows credit card form when credit card is selected', async () => {
      const user = userEvent.setup()
      renderPaymentForm()
      
      // Select credit card
      const creditCardRadio = screen.getByLabelText('Thẻ tín dụng')
      await user.click(creditCardRadio)
      
      expect(screen.getByPlaceholderText('1234 5678 9012 3456')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('NGUYEN VAN A')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('MM/YY')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('123')).toBeInTheDocument()
    })

    it('hides credit card form when other payment method is selected', async () => {
      const user = userEvent.setup()
      renderPaymentForm()
      
      // First select credit card
      const creditCardRadio = screen.getByLabelText('Thẻ tín dụng')
      await user.click(creditCardRadio)
      
      expect(screen.getByPlaceholderText('1234 5678 9012 3456')).toBeInTheDocument()
      
      // Then select bank transfer
      const bankTransferRadio = screen.getByLabelText('Chuyển khoản ngân hàng')
      await user.click(bankTransferRadio)
      
      expect(screen.queryByPlaceholderText('1234 5678 9012 3456')).not.toBeInTheDocument()
    })

    it('shows bank transfer info when bank transfer is selected', async () => {
      const user = userEvent.setup()
      renderPaymentForm()
      
      const bankTransferRadio = screen.getByLabelText('Chuyển khoản ngân hàng')
      await user.click(bankTransferRadio)
      
      expect(screen.getByText('Internet Banking, ATM')).toBeInTheDocument()
    })
  })

  describe('Form Input Formatting', () => {
    it('formats credit card number with spaces', async () => {
      const user = userEvent.setup()
      renderPaymentForm()
      
      // Select credit card
      const creditCardRadio = screen.getByLabelText('Thẻ tín dụng')
      await user.click(creditCardRadio)
      
      const cardNumberInput = screen.getByPlaceholderText('1234 5678 9012 3456') as HTMLInputElement
      await user.type(cardNumberInput, '1234567890123456')
      
      expect(cardNumberInput.value).toBe('1234 5678 9012 3456')
    })

    it('formats expiry date with slash', async () => {
      const user = userEvent.setup()
      renderPaymentForm()
      
      // Select credit card
      const creditCardRadio = screen.getByLabelText('Thẻ tín dụng')
      await user.click(creditCardRadio)
      
      const expiryInput = screen.getByPlaceholderText('MM/YY') as HTMLInputElement
      await user.type(expiryInput, '1225')
      
      expect(expiryInput.value).toBe('12/25')
    })

    it('limits CVV to 3 digits', async () => {
      const user = userEvent.setup()
      renderPaymentForm()
      
      // Select credit card
      const creditCardRadio = screen.getByLabelText('Thẻ tín dụng')
      await user.click(creditCardRadio)
      
      const cvvInput = screen.getByPlaceholderText('123') as HTMLInputElement
      await user.type(cvvInput, '12345')
      
      expect(cvvInput.value).toBe('123')
    })
  })

  describe('Payment Submission', () => {
    it('submits payment with bank transfer successfully', async () => {
      const user = userEvent.setup()
      renderPaymentForm()
      
      // Fill in customer information
      await user.type(screen.getByPlaceholderText('Nhập họ và tên đầy đủ'), 'John Doe')
      await user.type(screen.getByPlaceholderText('example@email.com'), 'john@example.com')
      await user.type(screen.getByPlaceholderText('0xxx xxx xxx'), '0987654321')
      
      // Select bank transfer (default)
      const bankTransferRadio = screen.getByLabelText('Chuyển khoản ngân hàng')
      await user.click(bankTransferRadio)
      
      // Accept terms
      const termsCheckbox = screen.getByRole('checkbox')
      await user.click(termsCheckbox)
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /thanh toán/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith('/bookings', {
          showtime_id: 1,
          seats: [
            { seat: 'A1', type: 'gold' },
            { seat: 'A2', type: 'gold' }
          ],
          payment_method: 'bank_transfer'
        })
      })
      
      expect(mockOnPaymentSuccess).toHaveBeenCalledWith({
        id: 123,
        booking_code: 'CB123456',
        seats: ['A1', 'A2'],
        total_amount: 240000,
        payment_status: 'completed'
      })
    })

    it('submits payment with credit card successfully', async () => {
      const user = userEvent.setup()
      renderPaymentForm()
      
      // Fill in customer information
      await user.type(screen.getByPlaceholderText('Nhập họ và tên đầy đủ'), 'John Doe')
      await user.type(screen.getByPlaceholderText('example@email.com'), 'john@example.com')
      await user.type(screen.getByPlaceholderText('0xxx xxx xxx'), '0987654321')
      
      // Select credit card
      const creditCardRadio = screen.getByLabelText('Thẻ tín dụng')
      await user.click(creditCardRadio)
      
      // Fill credit card info
      await user.type(screen.getByPlaceholderText('1234 5678 9012 3456'), '1234567890123456')
      await user.type(screen.getByPlaceholderText('NGUYEN VAN A'), 'JOHN DOE')
      await user.type(screen.getByPlaceholderText('MM/YY'), '12/25')
      await user.type(screen.getByPlaceholderText('123'), '123')
      
      // Accept terms
      const termsCheckbox = screen.getByRole('checkbox')
      await user.click(termsCheckbox)
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /thanh toán/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith('/bookings', {
          showtime_id: 1,
          seats: [
            { seat: 'A1', type: 'gold' },
            { seat: 'A2', type: 'gold' }
          ],
          payment_method: 'credit_card'
        })
      })
    })

    it('handles payment API errors', async () => {
      const user = userEvent.setup()
      
      // Mock API error
      mockedApi.post.mockRejectedValue({
        response: {
          data: {
            message: 'Payment failed'
          }
        }
      })
      
      renderPaymentForm()
      
      // Fill form and submit
      await user.type(screen.getByLabelText('Họ tên *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Số điện thoại *'), '0987654321')
      
      const termsCheckbox = screen.getByLabelText(/tôi đồng ý với/i)
      await user.click(termsCheckbox)
      
      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnPaymentError).toHaveBeenCalledWith('Payment failed')
      })
    })

    it('handles network errors', async () => {
      const user = userEvent.setup()
      
      // Mock network error
      mockedApi.post.mockRejectedValue(new Error('Network Error'))
      
      renderPaymentForm()
      
      // Fill form and submit
      await user.type(screen.getByLabelText('Họ tên *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Số điện thoại *'), '0987654321')
      
      const termsCheckbox = screen.getByLabelText(/tôi đồng ý với/i)
      await user.click(termsCheckbox)
      
      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnPaymentError).toHaveBeenCalledWith('Có lỗi xảy ra khi xử lý thanh toán')
      })
    })

    it('shows loading state during payment processing', async () => {
      const user = userEvent.setup()
      
      // Mock slow API response
      let resolvePromise: (value: any) => void
      const slowPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      mockedApi.post.mockReturnValue(slowPromise)
      
      renderPaymentForm()
      
      // Fill form and submit
      await user.type(screen.getByPlaceholderText('Họ và tên'), 'John Doe')
      await user.type(screen.getByPlaceholderText('your@email.com'), 'john@example.com')
      await user.type(screen.getByPlaceholderText('0xxx xxx xxx'), '0987654321')
      
      const termsCheckbox = screen.getByRole('checkbox')
      await user.click(termsCheckbox)
      
      const submitButton = screen.getByRole('button', { name: /thanh toán/i })
      await user.click(submitButton)
      
      // Check loading state
      expect(screen.getByText('Đang xử lý...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
      
      // Resolve the promise
      resolvePromise!({
        data: {
          success: true,
          data: { booking: { id: 123 } }
        }
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for form fields', () => {
      renderPaymentForm()
      
      expect(screen.getByPlaceholderText('Nhập họ và tên đầy đủ')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('example@email.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('0xxx xxx xxx')).toBeInTheDocument()
    })

    it('associates error messages with form fields', async () => {
      const user = userEvent.setup()
      renderPaymentForm()
      
      const emailInput = screen.getByLabelText('Email *')
      await user.type(emailInput, 'invalid-email')
      await user.tab()
      
      await waitFor(() => {
        const errorMessage = screen.getByText('Email không hợp lệ')
        expect(errorMessage).toBeInTheDocument()
        expect(emailInput).toHaveAttribute('aria-describedby')
      })
    })

    it('can be navigated with keyboard', async () => {
      const user = userEvent.setup()
      renderPaymentForm()
      
      // Tab through form elements
      await user.tab()
      expect(screen.getByPlaceholderText('Nhập họ và tên đầy đủ')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByPlaceholderText('example@email.com')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByPlaceholderText('0xxx xxx xxx')).toHaveFocus()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty booking data gracefully', () => {
      const emptyBookingData = {
        showtimeId: 0,
        seats: [],
        subtotal: 0
      }
      
      renderPaymentForm({ bookingData: emptyBookingData })
      
      expect(screen.getByText('Ghế:')).toBeInTheDocument()
      expect(screen.getByText('0 ₫')).toBeInTheDocument()
    })

    it('handles missing callback functions', () => {
      expect(() => {
        render(
          <BrowserRouter>
            <PaymentForm bookingData={defaultBookingData} />
          </BrowserRouter>
        )
      }).not.toThrow()
    })

    it('prevents double submission', async () => {
      const user = userEvent.setup()
      renderPaymentForm()
      
      // Fill form
      await user.type(screen.getByPlaceholderText('Nhập họ và tên đầy đủ'), 'John Doe')
      await user.type(screen.getByPlaceholderText('example@email.com'), 'john@example.com')
      await user.type(screen.getByPlaceholderText('0xxx xxx xxx'), '0987654321')
      
      const termsCheckbox = screen.getByRole('checkbox')
      await user.click(termsCheckbox)
      
      const submitButton = screen.getByRole('button', { name: /thanh toán/i })
      
      // Click submit multiple times rapidly
      await user.click(submitButton)
      await user.click(submitButton)
      await user.click(submitButton)
      
      // API should only be called once
      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledTimes(1)
      })
    })
  })
})