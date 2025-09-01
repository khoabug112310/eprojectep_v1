import { render, type RenderOptions } from '@testing-library/react'
import { type ReactElement } from 'react'
import { BrowserRouter } from 'react-router-dom'

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock API responses
export const mockApiResponse = {
  success: true,
  data: {},
  message: 'Success'
}

// Common test data
export const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  phone: '0123456789',
  role: 'user',
  created_at: '2024-01-01T00:00:00Z'
}

export const mockMovie = {
  id: 1,
  title: 'Test Movie',
  synopsis: 'Test movie synopsis',
  duration: 120,
  genre: 'Action, Drama',
  language: 'Vietnamese',
  age_rating: 'PG-13',
  release_date: '2024-01-01',
  poster_url: 'https://via.placeholder.com/300x450',
  trailer_url: 'https://www.youtube.com/watch?v=test',
  cast: [{ name: 'Test Actor', role: 'Main Character' }],
  director: 'Test Director',
  rating: 4.5,
  total_reviews: 100,
  status: 'now_showing'
}

export const mockTheater = {
  id: 1,
  name: 'Test Theater',
  address: '123 Test Street',
  city: 'Ho Chi Minh City',
  total_seats: 200,
  seat_configuration: {
    gold: 100,
    platinum: 80,
    box: 20
  },
  facilities: ['3D', 'Dolby Atmos'],
  status: 'active'
}

export const mockShowtime = {
  id: 1,
  movie_id: 1,
  theater_id: 1,
  show_date: '2024-01-15',
  show_time: '19:00',
  prices: {
    gold: 120000,
    platinum: 150000,
    box: 200000
  },
  available_seats: ['A1', 'A2', 'A3'],
  status: 'active',
  movie: mockMovie,
  theater: mockTheater
}

export const mockBooking = {
  id: 1,
  booking_code: 'CB20240101001',
  user_id: 1,
  showtime_id: 1,
  seats: [
    { seat: 'A1', type: 'gold', price: 120000 }
  ],
  total_amount: 120000,
  payment_method: 'credit_card',
  payment_status: 'completed',
  booking_status: 'confirmed',
  booked_at: '2024-01-01T10:00:00Z',
  user: mockUser,
  showtime: mockShowtime
}

// Utility functions for tests
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const createMockFile = (name: string, size: number, type: string) => {
  const file = new File([''], name, { type })
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false,
  })
  return file
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

// Export custom render as the default render
export { customRender as render }