import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import Checkout from '../../views/booking/Checkout'
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
    dismiss: vi.fn(),
  },
}))

// Mock react-router-dom useNavigate and useLocation
const mockNavigate = vi.fn()
const mockLocation = {
  state: {
    showtimeId: 1,
    seats: [
      { seat: 'A1', type: 'gold', price: 120000 },
      { seat: 'A2', type: 'gold', price: 120000 }
    ],
    subtotal: 240000
  }
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  }
})

// Mock console.error to avoid noise in tests
vi.spyOn(console, 'error').mockImplementation(() => {})

const renderCheckout = (locationState = mockLocation.state) => {
  // Update mock location
  mockLocation.state = locationState
  
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/checkout', state: locationState }]}>
      <Checkout />
    </MemoryRouter>
  )
}

describe('Checkout Integration Tests', () => {
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
            payment_status: 'completed',
            movie: {
              title: 'Test Movie',
              poster_url: 'test-poster.jpg'
            },
            theater: {
              name: 'Test Theater'
            },
            showtime: {
              show_date: '2024-01-15',
              show_time: '19:30'
            }
          }
        }
      }
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Checkout Page Rendering', () => {
    it('renders checkout page with booking summary', () => {
      renderCheckout()
      
      expect(screen.getByText('Xác nhận đặt vé')).toBeInTheDocument()
      expect(screen.getByText('Kiểm tra thông tin trước khi thanh toán')).toBeInTheDocument()
    })

    it('shows payment form initially', () => {
      renderCheckout()
      
      expect(screen.getByText('Thông Tin Thanh Toán')).toBeInTheDocument()
      expect(screen.getByText('Thông Tin Khách Hàng')).toBeInTheDocument()
      expect(screen.getByText('Phương Thức Thanh Toán')).toBeInTheDocument()
    })

    it('displays error when booking data is missing', () => {
      renderCheckout(null)
      
      expect(screen.getByText('Thiếu thông tin đặt vé')).toBeInTheDocument()
    })

    it('displays error when showtimeId is missing', () => {
      renderCheckout({ seats: [], subtotal: 0 })
      
      expect(screen.getByText('Thiếu thông tin đặt vé')).toBeInTheDocument()
    })
  })

  describe('Full Payment Flow Integration', () => {
    it('completes full payment flow with bank transfer', async () => {
      const user = userEvent.setup()
      renderCheckout()
      
      // Fill customer information
      await user.type(screen.getByLabelText('Họ tên *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Số điện thoại *'), '0987654321')
      
      // Select bank transfer payment method
      const bankTransferRadio = screen.getByLabelText('Chuyển khoản ngân hàng')
      await user.click(bankTransferRadio)
      
      // Accept terms and conditions
      const termsCheckbox = screen.getByLabelText(/tôi đồng ý với/i)
      await user.click(termsCheckbox)
      
      // Submit payment
      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(submitButton)
      
      // Check API call
      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith('/bookings', {
          showtime_id: 1,
          seats: [
            { seat: 'A1', type: 'gold', price: 120000 },
            { seat: 'A2', type: 'gold', price: 120000 }
          ],
          payment_method: 'bank_transfer',
          customer_info: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '0987654321'
          }
        })
      })
      
      // Check success state
      await waitFor(() => {
        expect(screen.getByText('Thanh toán thành công!')).toBeInTheDocument()
        expect(screen.getByText('Mã đặt vé: #123')).toBeInTheDocument()
      })
    })

    it('completes full payment flow with credit card', async () => {
      const user = userEvent.setup()
      renderCheckout()
      
      // Fill customer information
      await user.type(screen.getByLabelText('Họ tên *'), 'Jane Smith')
      await user.type(screen.getByLabelText('Email *'), 'jane@example.com')
      await user.type(screen.getByLabelText('Số điện thoại *'), '0123456789')
      
      // Select credit card payment method
      const creditCardRadio = screen.getByLabelText('Thẻ tín dụng')
      await user.click(creditCardRadio)
      
      // Fill credit card information
      await user.type(screen.getByLabelText('Số thẻ *'), '4111111111111111')
      await user.type(screen.getByLabelText('Tên chủ thẻ *'), 'JANE SMITH')
      await user.type(screen.getByLabelText('Ngày hết hạn *'), '12/25')
      await user.type(screen.getByLabelText('CVV *'), '123')
      
      // Accept terms and conditions
      const termsCheckbox = screen.getByLabelText(/tôi đồng ý với/i)
      await user.click(termsCheckbox)
      
      // Submit payment
      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(submitButton)
      
      // Check API call with credit card details
      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith('/bookings', {
          showtime_id: 1,
          seats: [
            { seat: 'A1', type: 'gold', price: 120000 },
            { seat: 'A2', type: 'gold', price: 120000 }
          ],
          payment_method: 'credit_card',
          customer_info: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '0123456789'
          },
          card_details: {
            card_number: '4111111111111111',
            card_holder: 'JANE SMITH',
            expiry_month: 12,
            expiry_year: 2025,
            cvv: '123'
          }
        })
      })
      
      // Check success state
      await waitFor(() => {
        expect(screen.getByText('Thanh toán thành công!')).toBeInTheDocument()
      })
    })

    it('handles payment processing states correctly', async () => {
      const user = userEvent.setup()
      
      // Mock slow API response
      let resolvePromise: (value: any) => void
      const slowPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      mockedApi.post.mockReturnValue(slowPromise)
      
      renderCheckout()
      
      // Fill form and submit
      await user.type(screen.getByLabelText('Họ tên *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Số điện thoại *'), '0987654321')
      
      const termsCheckbox = screen.getByLabelText(/tôi đồng ý với/i)
      await user.click(termsCheckbox)
      
      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(submitButton)
      
      // Check processing state
      await waitFor(() => {
        expect(screen.getByText('Đang xử lý thanh toán...')).toBeInTheDocument()
      })
      
      // Resolve the promise to simulate successful payment
      resolvePromise!({
        data: {
          success: true,
          data: {
            booking: {
              id: 123,
              booking_code: 'CB123456',
              payment_status: 'completed'
            }
          }
        }
      })
      
      // Check success state
      await waitFor(() => {
        expect(screen.getByText('Thanh toán thành công!')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling Integration', () => {
    it('handles API validation errors', async () => {
      const user = userEvent.setup()
      
      // Mock API validation error
      mockedApi.post.mockRejectedValue({
        response: {
          status: 422,
          data: {
            success: false,
            message: 'Validation failed',
            errors: {
              showtime_id: ['Suất chiếu không tồn tại'],
              seats: ['Ghế đã được đặt']
            }
          }
        }
      })
      
      renderCheckout()
      
      // Fill form and submit
      await user.type(screen.getByLabelText('Họ tên *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Số điện thoại *'), '0987654321')
      
      const termsCheckbox = screen.getByLabelText(/tôi đồng ý với/i)
      await user.click(termsCheckbox)
      
      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(submitButton)
      
      // Check error state
      await waitFor(() => {
        expect(screen.getByText('Thanh toán thất bại')).toBeInTheDocument()
        expect(screen.getByText('Validation failed')).toBeInTheDocument()
      })
    })

    it('handles network errors', async () => {
      const user = userEvent.setup()
      
      // Mock network error
      mockedApi.post.mockRejectedValue(new Error('Network Error'))
      
      renderCheckout()
      
      // Fill form and submit
      await user.type(screen.getByLabelText('Họ tên *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Số điện thoại *'), '0987654321')
      
      const termsCheckbox = screen.getByLabelText(/tôi đồng ý với/i)
      await user.click(termsCheckbox)
      
      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(submitButton)
      
      // Check error state
      await waitFor(() => {
        expect(screen.getByText('Thanh toán thất bại')).toBeInTheDocument()
        expect(screen.getByText('Có lỗi xảy ra khi xử lý thanh toán')).toBeInTheDocument()
      })
    })

    it('handles server errors (500)', async () => {
      const user = userEvent.setup()
      
      // Mock server error
      mockedApi.post.mockRejectedValue({
        response: {
          status: 500,
          data: {
            message: 'Internal server error'
          }
        }
      })
      
      renderCheckout()
      
      // Fill form and submit
      await user.type(screen.getByLabelText('Họ tên *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Số điện thoại *'), '0987654321')
      
      const termsCheckbox = screen.getByLabelText(/tôi đồng ý với/i)
      await user.click(termsCheckbox)
      
      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(submitButton)
      
      // Check error state
      await waitFor(() => {
        expect(screen.getByText('Thanh toán thất bại')).toBeInTheDocument()
        expect(screen.getByText('Internal server error')).toBeInTheDocument()
      })
    })

    it('allows retry after payment failure', async () => {
      const user = userEvent.setup()
      
      // Mock initial failure then success
      mockedApi.post
        .mockRejectedValueOnce({
          response: {
            data: { message: 'Payment failed' }
          }
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: {
              booking: {
                id: 456,
                booking_code: 'CB456789',
                payment_status: 'completed'
              }
            }
          }
        })
      
      renderCheckout()
      
      // Fill form and submit (first attempt)
      await user.type(screen.getByLabelText('Họ tên *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Số điện thoại *'), '0987654321')
      
      const termsCheckbox = screen.getByLabelText(/tôi đồng ý với/i)
      await user.click(termsCheckbox)
      
      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(submitButton)
      
      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Thanh toán thất bại')).toBeInTheDocument()
      })
      
      // Click retry button
      const retryButton = screen.getByText('🔄 Thử lại')
      await user.click(retryButton)
      
      // Should return to payment form
      await waitFor(() => {
        expect(screen.getByText('Thông Tin Thanh Toán')).toBeInTheDocument()
      })
      
      // Submit again (second attempt)
      const newSubmitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(newSubmitButton)
      
      // Should succeed this time
      await waitFor(() => {
        expect(screen.getByText('Thanh toán thành công!')).toBeInTheDocument()
        expect(screen.getByText('Mã đặt vé: #456')).toBeInTheDocument()
      })
    })
  })

  describe('Payment Status Navigation', () => {
    it('navigates to confirmation page after successful payment', async () => {
      const user = userEvent.setup()
      renderCheckout()
      
      // Complete payment flow
      await user.type(screen.getByLabelText('Họ tên *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Số điện thoại *'), '0987654321')
      
      const termsCheckbox = screen.getByLabelText(/tôi đồng ý với/i)
      await user.click(termsCheckbox)
      
      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(submitButton)
      
      // Wait for success and click view ticket
      await waitFor(() => {
        expect(screen.getByText('Thanh toán thành công!')).toBeInTheDocument()
      })
      
      const viewTicketButton = screen.getByText('🎫 Xem vé của tôi')
      await user.click(viewTicketButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/booking/confirmation?booking_id=123')
    })

    it('navigates to movies page when booking another movie', async () => {
      const user = userEvent.setup()
      renderCheckout()
      
      // Complete payment flow
      await user.type(screen.getByLabelText('Họ tên *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Số điện thoại *'), '0987654321')
      
      const termsCheckbox = screen.getByLabelText(/tôi đồng ý với/i)
      await user.click(termsCheckbox)
      
      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(submitButton)
      
      // Wait for success and click book another
      await waitFor(() => {
        expect(screen.getByText('Thanh toán thành công!')).toBeInTheDocument()
      })
      
      const bookAnotherButton = screen.getByText('🎬 Đặt vé khác')
      await user.click(bookAnotherButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/movies')
    })

    it('navigates to home page after error', async () => {
      const user = userEvent.setup()
      
      // Mock payment failure
      mockedApi.post.mockRejectedValue({
        response: {
          data: { message: 'Payment failed' }
        }
      })
      
      renderCheckout()
      
      // Complete payment flow
      await user.type(screen.getByLabelText('Họ tên *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Số điện thoại *'), '0987654321')
      
      const termsCheckbox = screen.getByLabelText(/tôi đồng ý với/i)
      await user.click(termsCheckbox)
      
      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(submitButton)
      
      // Wait for error and click home
      await waitFor(() => {
        expect(screen.getByText('Thanh toán thất bại')).toBeInTheDocument()
      })
      
      const homeButton = screen.getByText('🏠 Về trang chủ')
      await user.click(homeButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/movies')
    })
  })

  describe('Booking Data Validation', () => {
    it('validates showtime ID format', () => {
      const invalidBookingData = {
        showtimeId: 'invalid',
        seats: [],
        subtotal: 0
      }
      
      renderCheckout(invalidBookingData)
      
      expect(screen.getByText('Thiếu thông tin đặt vé')).toBeInTheDocument()
    })

    it('handles empty seats array', () => {
      const emptySeatsData = {
        showtimeId: 1,
        seats: [],
        subtotal: 0
      }
      
      renderCheckout(emptySeatsData)
      
      // Should still render the form
      expect(screen.getByText('Xác nhận đặt vé')).toBeInTheDocument()
    })

    it('calculates total with fees correctly', () => {
      const bookingData = {
        showtimeId: 1,
        seats: [
          { seat: 'A1', type: 'gold', price: 120000 },
          { seat: 'A2', type: 'platinum', price: 150000 }
        ],
        subtotal: 270000
      }
      
      renderCheckout(bookingData)
      
      // The component should display the correct total
      expect(screen.getByText('270.000 ₫')).toBeInTheDocument()
    })
  })

  describe('Concurrent User Scenarios', () => {
    it('handles seat no longer available error', async () => {
      const user = userEvent.setup()
      
      // Mock seat unavailable error
      mockedApi.post.mockRejectedValue({
        response: {
          status: 409,
          data: {
            message: 'Ghế đã được đặt bởi người khác',
            error: 'SEATS_NO_LONGER_AVAILABLE'
          }
        }
      })
      
      renderCheckout()
      
      // Complete payment flow
      await user.type(screen.getByLabelText('Họ tên *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Số điện thoại *'), '0987654321')
      
      const termsCheckbox = screen.getByLabelText(/tôi đồng ý với/i)
      await user.click(termsCheckbox)
      
      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(submitButton)
      
      // Check specific error message
      await waitFor(() => {
        expect(screen.getByText('Thanh toán thất bại')).toBeInTheDocument()
        expect(screen.getByText('Ghế đã được đặt bởi người khác')).toBeInTheDocument()
      })
    })

    it('handles session timeout during payment', async () => {
      const user = userEvent.setup()
      
      // Mock session timeout error
      mockedApi.post.mockRejectedValue({
        response: {
          status: 401,
          data: {
            message: 'Phiên đăng nhập đã hết hạn'
          }
        }
      })
      
      renderCheckout()
      
      // Complete payment flow
      await user.type(screen.getByLabelText('Họ tên *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Số điện thoại *'), '0987654321')
      
      const termsCheckbox = screen.getByLabelText(/tôi đồng ý với/i)
      await user.click(termsCheckbox)
      
      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(submitButton)
      
      // Check error state
      await waitFor(() => {
        expect(screen.getByText('Thanh toán thất bại')).toBeInTheDocument()
        expect(screen.getByText('Phiên đăng nhập đã hết hạn')).toBeInTheDocument()
      })
    })
  })

  describe('Performance and UX', () => {
    it('prevents multiple simultaneous submissions', async () => {
      const user = userEvent.setup()
      renderCheckout()
      
      // Fill form
      await user.type(screen.getByLabelText('Họ tên *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Số điện thoại *'), '0987654321')
      
      const termsCheckbox = screen.getByLabelText(/tôi đồng ý với/i)
      await user.click(termsCheckbox)
      
      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      
      // Click multiple times rapidly
      await user.click(submitButton)
      await user.click(submitButton)
      await user.click(submitButton)
      
      // API should only be called once
      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledTimes(1)
      })
    })

    it('shows loading state during API calls', async () => {
      const user = userEvent.setup()
      
      // Mock slow API response
      let resolvePromise: (value: any) => void
      const slowPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      mockedApi.post.mockReturnValue(slowPromise)
      
      renderCheckout()
      
      // Fill form and submit
      await user.type(screen.getByLabelText('Họ tên *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Số điện thoại *'), '0987654321')
      
      const termsCheckbox = screen.getByLabelText(/tôi đồng ý với/i)
      await user.click(termsCheckbox)
      
      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(submitButton)
      
      // Check loading state
      expect(screen.getByText('Đang xử lý thanh toán...')).toBeInTheDocument()
      
      // Button should be disabled
      expect(screen.queryByRole('button', { name: /xác nhận thanh toán/i })).not.toBeInTheDocument()
      
      // Resolve the promise
      resolvePromise!({
        data: {
          success: true,
          data: { booking: { id: 123 } }
        }
      })
    })

    it('maintains form state during validation errors', async () => {
      const user = userEvent.setup()
      renderCheckout()
      
      // Fill form partially
      await user.type(screen.getByLabelText('Họ tên *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'invalid-email')
      
      // Trigger validation
      await user.tab()
      
      // Form values should be preserved
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('invalid-email')).toBeInTheDocument()
    })
  })
})