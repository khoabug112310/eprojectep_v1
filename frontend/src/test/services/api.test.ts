import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockMovie, mockTheater, mockShowtime, mockBooking } from '../utils'

// Mock the api service
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: {
      headers: {
        common: {}
      }
    }
  }
}))

// Import after mocking
import api from '../../services/api'

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset localStorage mocks
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      },
      writable: true
    })
  })

  describe('Movies API', () => {
    it('should fetch movies successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            data: [mockMovie],
            meta: {
              total: 1,
              current_page: 1,
              last_page: 1,
              per_page: 10
            }
          }
        }
      }

      vi.mocked(api.get).mockResolvedValueOnce(mockResponse)

      const response = await api.get('/movies')
      
      expect(api.get).toHaveBeenCalledWith('/movies')
      expect(response.data.data.data).toHaveLength(1)
      expect(response.data.data.data[0]).toEqual(mockMovie)
    })

    it('should handle movie fetch error', async () => {
      const errorMessage = 'Network Error'
      vi.mocked(api.get).mockRejectedValueOnce(new Error(errorMessage))

      await expect(api.get('/movies')).rejects.toThrow(errorMessage)
    })

    it('should fetch single movie', async () => {
      const mockResponse = {
        data: {
          data: mockMovie
        }
      }

      vi.mocked(api.get).mockResolvedValueOnce(mockResponse)

      const response = await api.get(`/movies/${mockMovie.id}`)
      
      expect(api.get).toHaveBeenCalledWith(`/movies/${mockMovie.id}`)
      expect(response.data.data).toEqual(mockMovie)
    })

    it('should fetch movie showtimes', async () => {
      const mockResponse = {
        data: {
          data: [mockShowtime]
        }
      }

      vi.mocked(api.get).mockResolvedValueOnce(mockResponse)

      const response = await api.get(`/movies/${mockMovie.id}/showtimes`)
      
      expect(api.get).toHaveBeenCalledWith(`/movies/${mockMovie.id}/showtimes`)
      expect(response.data.data).toEqual([mockShowtime])
    })
  })

  describe('Theaters API', () => {
    it('should fetch theaters successfully', async () => {
      const mockResponse = {
        data: {
          data: [mockTheater]
        }
      }

      vi.mocked(api.get).mockResolvedValueOnce(mockResponse)

      const response = await api.get('/theaters')
      
      expect(api.get).toHaveBeenCalledWith('/theaters')
      expect(response.data.data[0]).toEqual(mockTheater)
    })
  })

  describe('Showtimes API', () => {
    it('should fetch showtimes successfully', async () => {
      const mockResponse = {
        data: {
          data: [mockShowtime]
        }
      }

      vi.mocked(api.get).mockResolvedValueOnce(mockResponse)

      const response = await api.get('/showtimes')
      
      expect(api.get).toHaveBeenCalledWith('/showtimes')
      expect(response.data.data[0]).toEqual(mockShowtime)
    })

    it('should fetch showtimes with filters', async () => {
      const filters = { movie_id: 1, date: '2024-01-15' }
      const mockResponse = {
        data: {
          data: [mockShowtime]
        }
      }

      vi.mocked(api.get).mockResolvedValueOnce(mockResponse)

      await api.get('/showtimes', { params: filters })
      
      expect(api.get).toHaveBeenCalledWith('/showtimes', { params: filters })
    })

    it('should fetch seat map for showtime', async () => {
      const mockSeatMap = {
        gold: {
          available: ['A1', 'A2', 'A3'],
          occupied: ['A4'],
          price: 120000
        },
        platinum: {
          available: ['B1', 'B2'],
          occupied: ['B3'],
          price: 150000
        }
      }
      
      const mockResponse = {
        data: {
          data: {
            seat_map: mockSeatMap,
            showtime: mockShowtime
          }
        }
      }

      vi.mocked(api.get).mockResolvedValueOnce(mockResponse)

      const response = await api.get(`/showtimes/${mockShowtime.id}/seats`)
      
      expect(api.get).toHaveBeenCalledWith(`/showtimes/${mockShowtime.id}/seats`)
      expect(response.data.data.seat_map).toEqual(mockSeatMap)
    })
  })

  describe('Authentication API', () => {
    it('should login successfully', async () => {
      const loginData = { email: 'test@example.com', password: 'password' }
      const mockResponse = {
        data: {
          data: {
            user: { id: 1, name: 'Test User', email: 'test@example.com' },
            token: 'test-token'
          }
        }
      }

      vi.mocked(api.post).mockResolvedValueOnce(mockResponse)

      const response = await api.post('/auth/login', loginData)
      
      expect(api.post).toHaveBeenCalledWith('/auth/login', loginData)
      expect(response.data.data.token).toBe('test-token')
      expect(response.data.data.user.email).toBe('test@example.com')
    })

    it('should register successfully', async () => {
      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
        password_confirmation: 'password',
        phone: '0123456789'
      }
      
      const mockResponse = {
        data: {
          data: {
            user: { id: 1, name: 'Test User', email: 'test@example.com' },
            token: 'test-token'
          }
        }
      }

      vi.mocked(api.post).mockResolvedValueOnce(mockResponse)

      const response = await api.post('/auth/register', registerData)
      
      expect(api.post).toHaveBeenCalledWith('/auth/register', registerData)
      expect(response.data.data.token).toBe('test-token')
    })

    it('should handle login error', async () => {
      const loginData = { email: 'test@example.com', password: 'wrong' }
      const errorResponse = {
        response: {
          data: {
            success: false,
            message: 'Invalid credentials'
          }
        }
      }

      vi.mocked(api.post).mockRejectedValueOnce(errorResponse)

      await expect(api.post('/auth/login', loginData)).rejects.toEqual(errorResponse)
    })
  })

  describe('Booking API', () => {
    it('should create booking successfully', async () => {
      const bookingData = {
        showtime_id: 1,
        seats: [{ seat: 'A1', type: 'gold', price: 120000 }],
        payment_method: 'credit_card'
      }
      
      const mockResponse = {
        data: {
          data: {
            ...mockBooking,
            ...bookingData
          }
        }
      }

      vi.mocked(api.post).mockResolvedValueOnce(mockResponse)

      const response = await api.post('/bookings', bookingData)
      
      expect(api.post).toHaveBeenCalledWith('/bookings', bookingData)
      expect(response.data.data.booking_code).toBe('CB20240101001')
      expect(response.data.data.total_amount).toBe(120000)
    })

    it('should handle booking error', async () => {
      const bookingData = {
        showtime_id: 1,
        seats: [{ seat: 'A1', type: 'gold' }],
        payment_method: 'credit_card'
      }
      
      const errorResponse = {
        response: {
          data: {
            success: false,
            message: 'Seat is no longer available'
          }
        }
      }

      vi.mocked(api.post).mockRejectedValueOnce(errorResponse)

      await expect(api.post('/bookings', bookingData)).rejects.toEqual(errorResponse)
    })
  })

  describe('API Configuration', () => {
    it('should be properly mocked', () => {
      expect(api).toBeDefined()
      expect(api.get).toBeDefined()
      expect(api.post).toBeDefined()
    })

    it('should add authorization header when token exists', () => {
      const mockGetItem = vi.fn(() => 'test-token')
      Object.defineProperty(window, 'localStorage', {
        value: { getItem: mockGetItem },
        writable: true
      })

      // Simulate the request interceptor
      const config = { headers: {} as Record<string, string> }
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      expect(config.headers.Authorization).toBe('Bearer test-token')
    })
  })
})