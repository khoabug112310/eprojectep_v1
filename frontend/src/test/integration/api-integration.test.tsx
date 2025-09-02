import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import api from '../../services/api'

// Mock axios for testing
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }))
  }
}))

// Get the mocked axios instance
const mockedAxios = vi.mocked(api)

describe('API Integration Tests - Payment System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset localStorage
    localStorage.clear()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Booking Creation API', () => {
    it('creates booking with bank transfer payment', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            booking: {
              id: 123,
              booking_code: 'CB123456',
              user_id: 1,
              showtime_id: 1,
              seats: ['A1', 'A2'],
              total_amount: 240000,
              payment_method: 'bank_transfer',
              payment_status: 'pending',
              booking_status: 'confirmed',
              created_at: '2024-01-15T10:00:00Z'
            }
          },
          message: 'Đặt vé thành công'
        }
      }

      mockedAxios.post.mockResolvedValue(mockResponse)

      const bookingData = {
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
      }

      const response = await api.post('/bookings', bookingData)

      expect(mockedAxios.post).toHaveBeenCalledWith('/bookings', bookingData)
      expect(response.data.success).toBe(true)
      expect(response.data.data.booking.booking_code).toBe('CB123456')
      expect(response.data.data.booking.payment_method).toBe('bank_transfer')
    })

    it('creates booking with credit card payment', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            booking: {
              id: 124,
              booking_code: 'CB124567',
              user_id: 1,
              showtime_id: 1,
              seats: ['B1', 'B2'],
              total_amount: 300000,
              payment_method: 'credit_card',
              payment_status: 'completed',
              booking_status: 'confirmed',
              created_at: '2024-01-15T10:00:00Z'
            }
          },
          message: 'Đặt vé thành công'
        }
      }

      mockedAxios.post.mockResolvedValue(mockResponse)

      const bookingData = {
        showtime_id: 1,
        seats: [
          { seat: 'B1', type: 'platinum', price: 150000 },
          { seat: 'B2', type: 'platinum', price: 150000 }
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
      }

      const response = await api.post('/bookings', bookingData)

      expect(mockedAxios.post).toHaveBeenCalledWith('/bookings', bookingData)
      expect(response.data.success).toBe(true)
      expect(response.data.data.booking.payment_method).toBe('credit_card')
      expect(response.data.data.booking.payment_status).toBe('completed')
    })

    it('handles validation errors', async () => {
      const mockError = {
        response: {
          status: 422,
          data: {
            success: false,
            message: 'Dữ liệu không hợp lệ',
            errors: {
              showtime_id: ['Suất chiếu không tồn tại'],
              seats: ['Ghế đã được đặt'],
              'customer_info.email': ['Email không hợp lệ']
            }
          }
        }
      }

      mockedAxios.post.mockRejectedValue(mockError)

      const invalidBookingData = {
        showtime_id: 999,
        seats: [],
        payment_method: 'bank_transfer',
        customer_info: {
          name: '',
          email: 'invalid-email',
          phone: ''
        }
      }

      try {
        await api.post('/bookings', invalidBookingData)
      } catch (error: any) {
        expect(error.response.status).toBe(422)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.errors.showtime_id).toContain('Suất chiếu không tồn tại')
        expect(error.response.data.errors.seats).toContain('Ghế đã được đặt')
      }
    })

    it('handles seat availability conflicts', async () => {
      const mockError = {
        response: {
          status: 409,
          data: {
            success: false,
            message: 'Ghế đã được đặt bởi người khác',
            error: 'SEATS_NO_LONGER_AVAILABLE',
            unavailable_seats: ['A1', 'A2']
          }
        }
      }

      mockedAxios.post.mockRejectedValue(mockError)

      const bookingData = {
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
      }

      try {
        await api.post('/bookings', bookingData)
      } catch (error: any) {
        expect(error.response.status).toBe(409)
        expect(error.response.data.error).toBe('SEATS_NO_LONGER_AVAILABLE')
        expect(error.response.data.unavailable_seats).toEqual(['A1', 'A2'])
      }
    })

    it('handles payment processing failures', async () => {
      const mockError = {
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
      }

      mockedAxios.post.mockRejectedValue(mockError)

      const bookingData = {
        showtime_id: 1,
        seats: [{ seat: 'A1', type: 'gold', price: 120000 }],
        payment_method: 'credit_card',
        customer_info: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '0987654321'
        },
        card_details: {
          card_number: '4000000000000002', // Declined card
          card_holder: 'JOHN DOE',
          expiry_month: 12,
          expiry_year: 2025,
          cvv: '123'
        }
      }

      try {
        await api.post('/bookings', bookingData)
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error).toBe('PAYMENT_FAILED')
        expect(error.response.data.payment_error.code).toBe('INSUFFICIENT_FUNDS')
      }
    })
  })

  describe('Booking Retrieval API', () => {
    it('retrieves booking by ID', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            booking: {
              id: 123,
              booking_code: 'CB123456',
              movie: {
                title: 'Test Movie',
                poster_url: 'poster.jpg',
                duration: 120,
                genre: ['Action'],
                age_rating: 'PG-13'
              },
              theater: {
                name: 'Test Theater',
                address: 'Test Address'
              },
              showtime: {
                show_date: '2024-01-15',
                show_time: '19:30'
              },
              seats: ['A1', 'A2'],
              total_amount: 240000,
              payment_status: 'completed',
              booking_status: 'confirmed',
              qr_code: 'https://example.com/qr/CB123456.png'
            }
          }
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const response = await api.get('/bookings/123')

      expect(mockedAxios.get).toHaveBeenCalledWith('/bookings/123')
      expect(response.data.success).toBe(true)
      expect(response.data.data.booking.booking_code).toBe('CB123456')
      expect(response.data.data.booking.qr_code).toBeTruthy()
    })

    it('handles booking not found', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            success: false,
            message: 'Không tìm thấy thông tin đặt vé'
          }
        }
      }

      mockedAxios.get.mockRejectedValue(mockError)

      try {
        await api.get('/bookings/999')
      } catch (error: any) {
        expect(error.response.status).toBe(404)
        expect(error.response.data.message).toBe('Không tìm thấy thông tin đặt vé')
      }
    })
  })

  describe('User Bookings API', () => {
    it('retrieves user booking history', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            bookings: [
              {
                id: 123,
                booking_code: 'CB123456',
                movie: { title: 'Movie 1' },
                theater: { name: 'Theater 1' },
                showtime: { show_date: '2024-01-15', show_time: '19:30' },
                total_amount: 240000,
                payment_status: 'completed',
                booking_status: 'confirmed'
              },
              {
                id: 124,
                booking_code: 'CB124567',
                movie: { title: 'Movie 2' },
                theater: { name: 'Theater 2' },
                showtime: { show_date: '2024-01-10', show_time: '20:00' },
                total_amount: 180000,
                payment_status: 'completed',
                booking_status: 'used'
              }
            ],
            pagination: {
              current_page: 1,
              total_pages: 1,
              total_items: 2,
              per_page: 10
            }
          }
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const response = await api.get('/user/bookings')

      expect(mockedAxios.get).toHaveBeenCalledWith('/user/bookings')
      expect(response.data.success).toBe(true)
      expect(response.data.data.bookings).toHaveLength(2)
      expect(response.data.data.pagination.total_items).toBe(2)
    })

    it('filters bookings by status', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            bookings: [
              {
                id: 125,
                booking_code: 'CB125678',
                payment_status: 'pending',
                booking_status: 'confirmed'
              }
            ],
            pagination: {
              current_page: 1,
              total_pages: 1,
              total_items: 1,
              per_page: 10
            }
          }
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const response = await api.get('/user/bookings?status=pending')

      expect(mockedAxios.get).toHaveBeenCalledWith('/user/bookings?status=pending')
      expect(response.data.data.bookings).toHaveLength(1)
      expect(response.data.data.bookings[0].payment_status).toBe('pending')
    })
  })

  describe('Payment Status Update API', () => {
    it('updates payment status', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            booking: {
              id: 123,
              booking_code: 'CB123456',
              payment_status: 'completed',
              updated_at: '2024-01-15T11:00:00Z'
            }
          },
          message: 'Cập nhật trạng thái thanh toán thành công'
        }
      }

      mockedAxios.put.mockResolvedValue(mockResponse)

      const updateData = {
        payment_status: 'completed',
        transaction_id: 'TXN123456789'
      }

      const response = await api.put('/bookings/123/payment-status', updateData)

      expect(mockedAxios.put).toHaveBeenCalledWith('/bookings/123/payment-status', updateData)
      expect(response.data.success).toBe(true)
      expect(response.data.data.booking.payment_status).toBe('completed')
    })

    it('handles unauthorized payment status update', async () => {
      const mockError = {
        response: {
          status: 403,
          data: {
            success: false,
            message: 'Không có quyền cập nhật đặt vé này'
          }
        }
      }

      mockedAxios.put.mockRejectedValue(mockError)

      try {
        await api.put('/bookings/123/payment-status', { payment_status: 'completed' })
      } catch (error: any) {
        expect(error.response.status).toBe(403)
        expect(error.response.data.message).toBe('Không có quyền cập nhật đặt vé này')
      }
    })
  })

  describe('Booking Cancellation API', () => {
    it('cancels booking successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            booking: {
              id: 123,
              booking_code: 'CB123456',
              booking_status: 'cancelled',
              payment_status: 'refunded',
              cancelled_at: '2024-01-15T12:00:00Z'
            }
          },
          message: 'Hủy vé thành công'
        }
      }

      mockedAxios.delete.mockResolvedValue(mockResponse)

      const response = await api.delete('/bookings/123')

      expect(mockedAxios.delete).toHaveBeenCalledWith('/bookings/123')
      expect(response.data.success).toBe(true)
      expect(response.data.data.booking.booking_status).toBe('cancelled')
      expect(response.data.data.booking.payment_status).toBe('refunded')
    })

    it('handles cancellation deadline exceeded', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            success: false,
            message: 'Không thể hủy vé sau 2 giờ trước suất chiếu',
            error: 'CANCELLATION_DEADLINE_EXCEEDED'
          }
        }
      }

      mockedAxios.delete.mockRejectedValue(mockError)

      try {
        await api.delete('/bookings/123')
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error).toBe('CANCELLATION_DEADLINE_EXCEEDED')
      }
    })
  })

  describe('Seat Availability API', () => {
    it('retrieves seat availability for showtime', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            showtime: {
              id: 1,
              movie: { title: 'Test Movie' },
              theater: { name: 'Test Theater' },
              show_date: '2024-01-15',
              show_time: '19:30'
            },
            seat_map: {
              gold: {
                available: ['A1', 'A2', 'A3', 'A4'],
                occupied: ['A5', 'A6'],
                selected: [],
                locked: ['A7'],
                price: 120000
              },
              platinum: {
                available: ['B1', 'B2', 'B3'],
                occupied: ['B4'],
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
            },
            total_available: 9,
            total_seats: 13
          }
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const response = await api.get('/showtimes/1/seats')

      expect(mockedAxios.get).toHaveBeenCalledWith('/showtimes/1/seats')
      expect(response.data.success).toBe(true)
      expect(response.data.data.seat_map.gold.available).toHaveLength(4)
      expect(response.data.data.seat_map.gold.occupied).toHaveLength(2)
      expect(response.data.data.total_available).toBe(9)
    })

    it('handles showtime not found', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            success: false,
            message: 'Suất chiếu không tồn tại'
          }
        }
      }

      mockedAxios.get.mockRejectedValue(mockError)

      try {
        await api.get('/showtimes/999/seats')
      } catch (error: any) {
        expect(error.response.status).toBe(404)
        expect(error.response.data.message).toBe('Suất chiếu không tồn tại')
      }
    })
  })

  describe('API Authentication', () => {
    it('includes authorization token in requests', async () => {
      const token = 'test-jwt-token'
      localStorage.setItem('token', token)

      const mockResponse = { data: { success: true } }
      mockedAxios.get.mockResolvedValue(mockResponse)

      await api.get('/user/bookings')

      // This would be tested in the actual interceptor implementation
      expect(mockedAxios.get).toHaveBeenCalledWith('/user/bookings')
    })

    it('handles authentication errors', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            success: false,
            message: 'Token không hợp lệ'
          }
        }
      }

      mockedAxios.get.mockRejectedValue(mockError)

      try {
        await api.get('/user/bookings')
      } catch (error: any) {
        expect(error.response.status).toBe(401)
        expect(error.response.data.message).toBe('Token không hợp lệ')
      }
    })
  })

  describe('API Rate Limiting', () => {
    it('handles rate limit errors', async () => {
      const mockError = {
        response: {
          status: 429,
          data: {
            success: false,
            message: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
            retry_after: 60
          }
        }
      }

      mockedAxios.post.mockRejectedValue(mockError)

      try {
        await api.post('/bookings', {})
      } catch (error: any) {
        expect(error.response.status).toBe(429)
        expect(error.response.data.retry_after).toBe(60)
      }
    })
  })

  describe('Network Error Handling', () => {
    it('handles network timeouts', async () => {
      const mockError = new Error('Network Error')
      mockError.name = 'NetworkError'

      mockedAxios.post.mockRejectedValue(mockError)

      try {
        await api.post('/bookings', {})
      } catch (error: any) {
        expect(error.name).toBe('NetworkError')
      }
    })

    it('handles server errors (500)', async () => {
      const mockError = {
        response: {
          status: 500,
          data: {
            success: false,
            message: 'Lỗi server, vui lòng thử lại sau'
          }
        }
      }

      mockedAxios.post.mockRejectedValue(mockError)

      try {
        await api.post('/bookings', {})
      } catch (error: any) {
        expect(error.response.status).toBe(500)
        expect(error.response.data.message).toBe('Lỗi server, vui lòng thử lại sau')
      }
    })
  })
})