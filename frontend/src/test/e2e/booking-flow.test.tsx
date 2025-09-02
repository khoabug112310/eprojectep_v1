import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import App from '../../App'
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

// Mock console methods
vi.spyOn(console, 'error').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})

// Mock data
const mockMovies = [
  {
    id: 1,
    title: 'Avengers: Endgame',
    poster_url: 'https://example.com/avengers.jpg',
    genre: ['Action', 'Adventure'],
    duration: 181,
    age_rating: 'PG-13',
    average_rating: 4.8,
    status: 'active'
  },
  {
    id: 2,
    title: 'Parasite',
    poster_url: 'https://example.com/parasite.jpg',
    genre: ['Thriller', 'Drama'],
    duration: 132,
    age_rating: 'R',
    average_rating: 4.9,
    status: 'active'
  }
]

const mockShowtimes = [
  {
    id: 1,
    movie_id: 1,
    theater: {
      id: 1,
      name: 'Galaxy Cinema',
      address: '123 Main Street'
    },
    show_date: '2024-01-15',
    show_time: '19:30',
    prices: {
      gold: 120000,
      platinum: 150000,
      box: 200000
    }
  },
  {
    id: 2,
    movie_id: 1,
    theater: {
      id: 1,
      name: 'Galaxy Cinema',
      address: '123 Main Street'
    },
    show_date: '2024-01-15',
    show_time: '22:00',
    prices: {
      gold: 120000,
      platinum: 150000,
      box: 200000
    }
  }
]

const mockSeatMap = {
  showtime: {
    id: 1,
    movie: { title: 'Avengers: Endgame' },
    theater: { name: 'Galaxy Cinema' },
    show_date: '2024-01-15',
    show_time: '19:30'
  },
  seat_map: {
    gold: {
      available: ['A1', 'A2', 'A3', 'A4', 'A5'],
      occupied: ['A6', 'A7'],
      selected: [],
      locked: [],
      price: 120000
    },
    platinum: {
      available: ['B1', 'B2', 'B3', 'B4'],
      occupied: ['B5'],
      selected: [],
      locked: [],
      price: 150000
    },
    box: {
      available: ['C1', 'C2'],
      occupied: [],
      selected: [],
      locked: [],
      price: 200000
    }
  }
}

const mockBookingResponse = {
  success: true,
  data: {
    booking: {
      id: 123,
      booking_code: 'CB123456',
      movie: {
        title: 'Avengers: Endgame',
        poster_url: 'https://example.com/avengers.jpg',
        duration: 181,
        genre: ['Action', 'Adventure'],
        age_rating: 'PG-13'
      },
      theater: {
        name: 'Galaxy Cinema',
        address: '123 Main Street'
      },
      showtime: {
        show_date: '2024-01-15',
        show_time: '19:30'
      },
      seats: ['A1', 'A2'],
      total_amount: 240000,
      payment_status: 'completed',
      booking_status: 'confirmed',
      created_at: '2024-01-15T10:00:00Z',
      qr_code: 'https://example.com/qr/CB123456.png'
    }
  }
}

describe('End-to-End Booking Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default API mocks
    mockedApi.get.mockImplementation((url) => {
      if (url === '/movies') {
        return Promise.resolve({ data: { success: true, data: { movies: mockMovies } } })
      }
      if (url === '/movies/1') {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              movie: mockMovies[0],
              showtimes: mockShowtimes
            }
          }
        })
      }
      if (url === '/showtimes/1/seats') {
        return Promise.resolve({ data: { success: true, data: mockSeatMap } })
      }
      if (url === '/bookings/123') {
        return Promise.resolve({ data: mockBookingResponse })
      }
      return Promise.reject(new Error('Not found'))
    })
    
    mockedApi.post.mockImplementation((url) => {
      if (url === '/bookings') {
        return Promise.resolve({ data: mockBookingResponse })
      }
      return Promise.reject(new Error('Not found'))
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Complete Booking Flow - Happy Path', () => {
    it('completes full booking flow from movie selection to confirmation', async () => {
      const user = userEvent.setup()
      
      render(
        <MemoryRouter initialEntries={['/movies']}>
          <App />
        </MemoryRouter>
      )

      // Step 1: Movie Selection
      await waitFor(() => {
        expect(screen.getByText('Avengers: Endgame')).toBeInTheDocument()
      })

      // Click on movie to view details
      const movieCard = screen.getByText('Avengers: Endgame').closest('.movie-card') || 
                       screen.getByText('Avengers: Endgame')
      await user.click(movieCard)

      // Step 2: Showtime Selection
      await waitFor(() => {
        expect(screen.getByText('19:30')).toBeInTheDocument()
        expect(screen.getByText('22:00')).toBeInTheDocument()
      })

      // Select the first showtime
      const showtimeButton = screen.getByText('19:30')
      await user.click(showtimeButton)

      // Step 3: Seat Selection
      await waitFor(() => {
        expect(screen.getByText('Chọn ghế')).toBeInTheDocument()
      })

      // Select seats A1 and A2
      const seatA1 = screen.getByTestId('seat-A1') || screen.getByText('A1')
      const seatA2 = screen.getByTestId('seat-A2') || screen.getByText('A2')
      
      await user.click(seatA1)
      await user.click(seatA2)

      // Proceed to checkout
      const continueButton = screen.getByText('Tiếp tục') || screen.getByText('Đặt vé')
      await user.click(continueButton)

      // Step 4: Payment Information
      await waitFor(() => {
        expect(screen.getByText('Xác nhận đặt vé')).toBeInTheDocument()
        expect(screen.getByText('Thông Tin Khách Hàng')).toBeInTheDocument()
      })

      // Fill customer information
      await user.type(screen.getByLabelText('Họ tên *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Số điện thoại *'), '0987654321')

      // Select payment method (bank transfer is default)
      const bankTransferRadio = screen.getByLabelText('Chuyển khoản ngân hàng')
      await user.click(bankTransferRadio)

      // Accept terms and conditions
      const termsCheckbox = screen.getByLabelText(/tôi đồng ý với/i)
      await user.click(termsCheckbox)

      // Submit payment
      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(submitButton)

      // Step 5: Payment Processing
      await waitFor(() => {
        expect(screen.getByText('Đang xử lý thanh toán...')).toBeInTheDocument()
      })

      // Step 6: Payment Success and Confirmation
      await waitFor(() => {
        expect(screen.getByText('Thanh toán thành công!')).toBeInTheDocument()
        expect(screen.getByText('Mã đặt vé: #123')).toBeInTheDocument()
      })

      // Navigate to ticket view
      const viewTicketButton = screen.getByText('🎫 Xem vé của tôi')
      await user.click(viewTicketButton)

      // Step 7: E-Ticket Display
      await waitFor(() => {
        expect(screen.getByText('CB123456')).toBeInTheDocument()
        expect(screen.getByText('Avengers: Endgame')).toBeInTheDocument()
        expect(screen.getByText('Galaxy Cinema')).toBeInTheDocument()
      })

      // Verify all API calls were made correctly
      expect(mockedApi.get).toHaveBeenCalledWith('/movies')
      expect(mockedApi.get).toHaveBeenCalledWith('/movies/1')
      expect(mockedApi.get).toHaveBeenCalledWith('/showtimes/1/seats')
      expect(mockedApi.post).toHaveBeenCalledWith('/bookings', expect.objectContaining({
        showtime_id: 1,
        payment_method: 'bank_transfer',
        customer_info: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '0987654321'
        }
      }))
      expect(mockedApi.get).toHaveBeenCalledWith('/bookings/123')
    }, 15000) // Increase timeout for long test
  })

  describe('Credit Card Payment Flow', () => {
    it('completes booking with credit card payment', async () => {
      const user = userEvent.setup()
      
      // Start directly at checkout for faster testing
      render(
        <MemoryRouter 
          initialEntries={[{
            pathname: '/checkout',
            state: {
              showtimeId: 1,
              seats: [
                { seat: 'A1', type: 'gold', price: 120000 },
                { seat: 'A2', type: 'gold', price: 120000 }
              ],
              subtotal: 240000
            }
          }]}
        >
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Xác nhận đặt vé')).toBeInTheDocument()
      })

      // Fill customer information
      await user.type(screen.getByLabelText('Họ tên *'), 'Jane Smith')
      await user.type(screen.getByLabelText('Email *'), 'jane@example.com')
      await user.type(screen.getByLabelText('Số điện thoại *'), '0123456789')

      // Select credit card payment
      const creditCardRadio = screen.getByLabelText('Thẻ tín dụng')
      await user.click(creditCardRadio)

      // Fill credit card information
      await user.type(screen.getByLabelText('Số thẻ *'), '4111111111111111')
      await user.type(screen.getByLabelText('Tên chủ thẻ *'), 'JANE SMITH')
      await user.type(screen.getByLabelText('Ngày hết hạn *'), '12/25')
      await user.type(screen.getByLabelText('CVV *'), '123')

      // Accept terms
      const termsCheckbox = screen.getByLabelText(/tôi đồng ý với/i)
      await user.click(termsCheckbox)

      // Submit payment
      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(submitButton)

      // Verify processing and success
      await waitFor(() => {
        expect(screen.getByText('Đang xử lý thanh toán...')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('Thanh toán thành công!')).toBeInTheDocument()
      })

      // Verify API call includes credit card details
      expect(mockedApi.post).toHaveBeenCalledWith('/bookings', expect.objectContaining({
        payment_method: 'credit_card',
        card_details: {
          card_number: '4111111111111111',
          card_holder: 'JANE SMITH',
          expiry_month: 12,
          expiry_year: 2025,
          cvv: '123'
        }
      }))
    })
  })

  describe('Error Scenarios', () => {
    it('handles seat no longer available error', async () => {
      const user = userEvent.setup()
      
      // Mock seat conflict error
      mockedApi.post.mockRejectedValue({
        response: {
          status: 409,
          data: {
            success: false,
            message: 'Ghế đã được đặt bởi người khác',
            error: 'SEATS_NO_LONGER_AVAILABLE',
            unavailable_seats: ['A1', 'A2']
          }
        }
      })

      render(
        <MemoryRouter 
          initialEntries={[{
            pathname: '/checkout',
            state: {
              showtimeId: 1,
              seats: [
                { seat: 'A1', type: 'gold', price: 120000 },
                { seat: 'A2', type: 'gold', price: 120000 }
              ],
              subtotal: 240000
            }
          }]}
        >
          <App />
        </MemoryRouter>
      )

      // Fill form and submit
      await user.type(screen.getByLabelText('Họ tên *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Số điện thoại *'), '0987654321')

      const termsCheckbox = screen.getByLabelText(/tôi đồng ý với/i)
      await user.click(termsCheckbox)

      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(submitButton)

      // Check error handling
      await waitFor(() => {
        expect(screen.getByText('Thanh toán thất bại')).toBeInTheDocument()
        expect(screen.getByText('Ghế đã được đặt bởi người khác')).toBeInTheDocument()
      })

      // Should show retry option
      expect(screen.getByText('🔄 Thử lại')).toBeInTheDocument()
    })

    it('handles payment processing failure', async () => {
      const user = userEvent.setup()
      
      // Mock payment failure
      mockedApi.post.mockRejectedValue({
        response: {
          status: 400,
          data: {
            success: false,
            message: 'Thanh toán thất bại',
            error: 'PAYMENT_FAILED',
            payment_error: {
              code: 'INSUFFICIENT_FUNDS',
              message: 'Tài khoản không đủ số dư'
            }
          }
        }
      })

      render(
        <MemoryRouter 
          initialEntries={[{
            pathname: '/checkout',
            state: {
              showtimeId: 1,
              seats: [{ seat: 'A1', type: 'gold', price: 120000 }],
              subtotal: 120000
            }
          }]}
        >
          <App />
        </MemoryRouter>
      )

      // Complete payment form
      await user.type(screen.getByLabelText('Họ tên *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Số điện thoại *'), '0987654321')

      // Use credit card with insufficient funds
      const creditCardRadio = screen.getByLabelText('Thẻ tín dụng')
      await user.click(creditCardRadio)

      await user.type(screen.getByLabelText('Số thẻ *'), '4000000000000002')
      await user.type(screen.getByLabelText('Tên chủ thẻ *'), 'JOHN DOE')
      await user.type(screen.getByLabelText('Ngày hết hạn *'), '12/25')
      await user.type(screen.getByLabelText('CVV *'), '123')

      const termsCheckbox = screen.getByLabelText(/tôi đồng ý với/i)
      await user.click(termsCheckbox)

      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(submitButton)

      // Check error handling
      await waitFor(() => {
        expect(screen.getByText('Thanh toán thất bại')).toBeInTheDocument()
        expect(screen.getByText('Thanh toán thất bại')).toBeInTheDocument()
      })
    })

    it('handles network errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock network error
      mockedApi.post.mockRejectedValue(new Error('Network Error'))

      render(
        <MemoryRouter 
          initialEntries={[{
            pathname: '/checkout',
            state: {
              showtimeId: 1,
              seats: [{ seat: 'A1', type: 'gold', price: 120000 }],
              subtotal: 120000
            }
          }]}
        >
          <App />
        </MemoryRouter>
      )

      // Fill form and submit
      await user.type(screen.getByLabelText('Họ tên *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Số điện thoại *'), '0987654321')

      const termsCheckbox = screen.getByLabelText(/tôi đồng ý với/i)
      await user.click(termsCheckbox)

      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(submitButton)

      // Check network error handling
      await waitFor(() => {
        expect(screen.getByText('Thanh toán thất bại')).toBeInTheDocument()
        expect(screen.getByText('Có lỗi xảy ra khi xử lý thanh toán')).toBeInTheDocument()
      })

      // Should provide retry and support options
      expect(screen.getByText('🔄 Thử lại')).toBeInTheDocument()
      expect(screen.getByText('📞 Liên hệ hỗ trợ')).toBeInTheDocument()
    })
  })

  describe('User Journey Validation', () => {
    it('prevents checkout without required booking data', async () => {
      render(
        <MemoryRouter initialEntries={['/checkout']}>
          <App />
        </MemoryRouter>
      )

      // Should show error for missing booking data
      await waitFor(() => {
        expect(screen.getByText('Thiếu thông tin đặt vé')).toBeInTheDocument()
      })
    })

    it('validates form inputs before submission', async () => {
      const user = userEvent.setup()
      
      render(
        <MemoryRouter 
          initialEntries={[{
            pathname: '/checkout',
            state: {
              showtimeId: 1,
              seats: [{ seat: 'A1', type: 'gold', price: 120000 }],
              subtotal: 120000
            }
          }]}
        >
          <App />
        </MemoryRouter>
      )

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(submitButton)

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Họ tên là bắt buộc')).toBeInTheDocument()
        expect(screen.getByText('Email là bắt buộc')).toBeInTheDocument()
        expect(screen.getByText('Số điện thoại là bắt buộc')).toBeInTheDocument()
      })

      // Should not make API call
      expect(mockedApi.post).not.toHaveBeenCalled()
    })

    it('maintains booking data throughout the flow', async () => {
      const user = userEvent.setup()
      
      render(
        <MemoryRouter 
          initialEntries={[{
            pathname: '/checkout',
            state: {
              showtimeId: 1,
              seats: [
                { seat: 'A1', type: 'gold', price: 120000 },
                { seat: 'A2', type: 'platinum', price: 150000 }
              ],
              subtotal: 270000
            }
          }]}
        >
          <App />
        </MemoryRouter>
      )

      // Verify booking summary displays correct information
      await waitFor(() => {
        expect(screen.getByText('270.000 ₫')).toBeInTheDocument()
        expect(screen.getByText('A1, A2')).toBeInTheDocument()
      })

      // Complete booking flow
      await user.type(screen.getByLabelText('Họ tên *'), 'John Doe')
      await user.type(screen.getByLabelText('Email *'), 'john@example.com')
      await user.type(screen.getByLabelText('Số điện thoại *'), '0987654321')

      const termsCheckbox = screen.getByLabelText(/tôi đồng ý với/i)
      await user.click(termsCheckbox)

      const submitButton = screen.getByRole('button', { name: /xác nhận thanh toán/i })
      await user.click(submitButton)

      // Verify API call includes correct seat data
      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith('/bookings', expect.objectContaining({
          showtime_id: 1,
          seats: [
            { seat: 'A1', type: 'gold', price: 120000 },
            { seat: 'A2', type: 'platinum', price: 150000 }
          ]
        }))
      })
    })
  })

  describe('Accessibility and UX', () => {
    it('provides proper focus management', async () => {
      const user = userEvent.setup()
      
      render(
        <MemoryRouter 
          initialEntries={[{
            pathname: '/checkout',
            state: {
              showtimeId: 1,
              seats: [{ seat: 'A1', type: 'gold', price: 120000 }],
              subtotal: 120000
            }
          }]}
        >
          <App />
        </MemoryRouter>
      )

      // Tab through form elements
      await user.tab()
      expect(screen.getByLabelText('Họ tên *')).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText('Email *')).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText('Số điện thoại *')).toHaveFocus()
    })

    it('provides proper ARIA labels and roles', async () => {
      render(
        <MemoryRouter 
          initialEntries={[{
            pathname: '/checkout',
            state: {
              showtimeId: 1,
              seats: [{ seat: 'A1', type: 'gold', price: 120000 }],
              subtotal: 120000
            }
          }]}
        >
          <App />
        </MemoryRouter>
      )

      // Check for proper form labels
      expect(screen.getByLabelText('Họ tên *')).toBeInTheDocument()
      expect(screen.getByLabelText('Email *')).toBeInTheDocument()
      expect(screen.getByLabelText('Số điện thoại *')).toBeInTheDocument()

      // Check for proper button roles
      expect(screen.getByRole('button', { name: /xác nhận thanh toán/i })).toBeInTheDocument()
    })
  })
})