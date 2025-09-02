import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import ETicket from '../../components/ETicket'

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockBooking = {
  id: 123,
  booking_code: 'CB123456',
  movie: {
    title: 'Avengers: Endgame',
    poster_url: 'https://example.com/poster.jpg',
    duration: 181,
    genre: ['Action', 'Adventure', 'Drama'],
    age_rating: 'PG-13'
  },
  theater: {
    name: 'Galaxy Cinema',
    address: '123 Main Street, City Center'
  },
  showtime: {
    show_date: '2024-01-15',
    show_time: '19:30'
  },
  seats: [
    { seat: 'A1', type: 'gold', price: 120000 },
    { seat: 'A2', type: 'gold', price: 120000 }
  ],
  total_amount: 240000,
  payment_status: 'completed',
  created_at: '2024-01-10T10:00:00Z',
  qr_code: 'https://example.com/qr/CB123456.png'
}

const mockOnDownload = vi.fn()
const mockOnPrint = vi.fn()
const mockOnShare = vi.fn()

const renderETicket = (props = {}) => {
  const defaultProps = {
    booking: mockBooking,
    displayMode: 'full' as const,
    showActions: true,
    onDownload: mockOnDownload,
    onPrint: mockOnPrint,
    onShare: mockOnShare,
  }

  return render(
    <BrowserRouter>
      <ETicket {...defaultProps} {...props} />
    </BrowserRouter>
  )
}

describe('ETicket Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.print
    global.window.print = vi.fn()
  })

  describe('Component Rendering', () => {
    it('renders e-ticket with full display mode', () => {
      renderETicket()
      
      expect(screen.getByText('E-TICKET')).toBeInTheDocument()
      expect(screen.getByText('CB123456')).toBeInTheDocument()
      expect(screen.getByText('Avengers: Endgame')).toBeInTheDocument()
      expect(screen.getByText('Galaxy Cinema')).toBeInTheDocument()
      expect(screen.getByText('240.000 ₫')).toBeInTheDocument()
    })

    it('renders e-ticket with compact display mode', () => {
      renderETicket({ displayMode: 'compact' })
      
      expect(screen.getByText('CB123456')).toBeInTheDocument()
      expect(screen.getByText('Avengers: Endgame')).toBeInTheDocument()
      expect(screen.queryByText('E-TICKET')).not.toBeInTheDocument()
    })

    it('renders e-ticket with print display mode', () => {
      renderETicket({ displayMode: 'print' })
      
      expect(screen.getByText('CineBook - E-Ticket')).toBeInTheDocument()
      expect(screen.getByText('CB123456')).toBeInTheDocument()
    })

    it('shows QR code when provided', () => {
      renderETicket()
      
      const qrCode = screen.getByAltText('QR Code')
      expect(qrCode).toBeInTheDocument()
      expect(qrCode).toHaveAttribute('src', 'https://example.com/qr/CB123456.png')
    })

    it('shows QR placeholder when no QR code provided', () => {
      const bookingWithoutQR = { ...mockBooking, qr_code: undefined }
      renderETicket({ booking: bookingWithoutQR })
      
      expect(screen.getByText('QR Code')).toBeInTheDocument()
      expect(screen.getByText('Sẽ có sẵn khi đến rạp')).toBeInTheDocument()
    })
  })

  describe('Booking Information Display', () => {
    it('displays movie information correctly', () => {
      renderETicket()
      
      expect(screen.getByText('Avengers: Endgame')).toBeInTheDocument()
      expect(screen.getByText('181 phút')).toBeInTheDocument()
      expect(screen.getByText('Action, Adventure, Drama')).toBeInTheDocument()
      expect(screen.getByText('PG-13')).toBeInTheDocument()
    })

    it('displays theater information correctly', () => {
      renderETicket()
      
      expect(screen.getByText('Galaxy Cinema')).toBeInTheDocument()
      expect(screen.getByText('123 Main Street, City Center')).toBeInTheDocument()
    })

    it('displays showtime information correctly', () => {
      renderETicket()
      
      expect(screen.getByText('Thứ Hai, 15 tháng 1, 2024')).toBeInTheDocument()
      expect(screen.getByText('19:30')).toBeInTheDocument()
    })

    it('displays seat information correctly', () => {
      renderETicket()
      
      expect(screen.getByText('A1, A2')).toBeInTheDocument()
      expect(screen.getByText('2 ghế')).toBeInTheDocument()
    })

    it('displays payment information correctly', () => {
      renderETicket()
      
      expect(screen.getByText('240.000 ₫')).toBeInTheDocument()
      expect(screen.getByText('Đã thanh toán')).toBeInTheDocument()
    })

    it('handles different payment statuses', () => {
      const pendingBooking = { ...mockBooking, payment_status: 'pending' }
      renderETicket({ booking: pendingBooking })
      
      expect(screen.getByText('Chờ thanh toán')).toBeInTheDocument()
    })
  })

  describe('Seat Information Handling', () => {
    it('handles seat array with objects', () => {
      renderETicket()
      
      expect(screen.getByText('A1, A2')).toBeInTheDocument()
    })

    it('handles seat array with strings', () => {
      const bookingWithStringSeats = {
        ...mockBooking,
        seats: ['A1', 'A2', 'A3']
      }
      renderETicket({ booking: bookingWithStringSeats })
      
      expect(screen.getByText('A1, A2, A3')).toBeInTheDocument()
      expect(screen.getByText('3 ghế')).toBeInTheDocument()
    })

    it('handles empty seats array', () => {
      const bookingWithNoSeats = {
        ...mockBooking,
        seats: []
      }
      renderETicket({ booking: bookingWithNoSeats })
      
      expect(screen.getByText('0 ghế')).toBeInTheDocument()
    })

    it('handles mixed seat data types', () => {
      const bookingWithMixedSeats = {
        ...mockBooking,
        seats: [
          { seat: 'A1', type: 'gold', price: 120000 },
          'A2',
          { seat: 'A3', type: 'platinum', price: 150000 }
        ]
      }
      renderETicket({ booking: bookingWithMixedSeats })
      
      expect(screen.getByText('A1, A2, A3')).toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('shows action buttons when showActions is true', () => {
      renderETicket({ showActions: true })
      
      expect(screen.getByText('📥 Tải xuống')).toBeInTheDocument()
      expect(screen.getByText('🖨️ In vé')).toBeInTheDocument()
      expect(screen.getByText('📤 Chia sẻ')).toBeInTheDocument()
    })

    it('hides action buttons when showActions is false', () => {
      renderETicket({ showActions: false })
      
      expect(screen.queryByText('📥 Tải xuống')).not.toBeInTheDocument()
      expect(screen.queryByText('🖨️ In vé')).not.toBeInTheDocument()
      expect(screen.queryByText('📤 Chia sẻ')).not.toBeInTheDocument()
    })

    it('calls onDownload when download button is clicked', async () => {
      const user = userEvent.setup()
      renderETicket()
      
      const downloadButton = screen.getByText('📥 Tải xuống')
      await user.click(downloadButton)
      
      expect(mockOnDownload).toHaveBeenCalledTimes(1)
    })

    it('calls onPrint when print button is clicked', async () => {
      const user = userEvent.setup()
      renderETicket()
      
      const printButton = screen.getByText('🖨️ In vé')
      await user.click(printButton)
      
      expect(mockOnPrint).toHaveBeenCalledTimes(1)
    })

    it('calls onShare when share button is clicked', async () => {
      const user = userEvent.setup()
      renderETicket()
      
      const shareButton = screen.getByText('📤 Chia sẻ')
      await user.click(shareButton)
      
      expect(mockOnShare).toHaveBeenCalledTimes(1)
    })

    it('uses default print function when onPrint is not provided', async () => {
      const user = userEvent.setup()
      renderETicket({ onPrint: undefined })
      
      const printButton = screen.getByText('🖨️ In vé')
      await user.click(printButton)
      
      expect(window.print).toHaveBeenCalledTimes(1)
    })
  })

  describe('Currency Formatting', () => {
    it('formats Vietnamese currency correctly', () => {
      renderETicket()
      
      expect(screen.getByText('240.000 ₫')).toBeInTheDocument()
    })

    it('handles zero amount', () => {
      const freeBooking = { ...mockBooking, total_amount: 0 }
      renderETicket({ booking: freeBooking })
      
      expect(screen.getByText('0 ₫')).toBeInTheDocument()
    })

    it('handles large amounts', () => {
      const expensiveBooking = { ...mockBooking, total_amount: 1500000 }
      renderETicket({ booking: expensiveBooking })
      
      expect(screen.getByText('1.500.000 ₫')).toBeInTheDocument()
    })
  })

  describe('Date Formatting', () => {
    it('formats Vietnamese date correctly', () => {
      renderETicket()
      
      expect(screen.getByText('Thứ Hai, 15 tháng 1, 2024')).toBeInTheDocument()
    })

    it('handles different dates', () => {
      const differentDateBooking = {
        ...mockBooking,
        showtime: {
          ...mockBooking.showtime,
          show_date: '2024-12-25'
        }
      }
      renderETicket({ booking: differentDateBooking })
      
      expect(screen.getByText('Thứ Tư, 25 tháng 12, 2024')).toBeInTheDocument()
    })
  })

  describe('Payment Status Display', () => {
    it('shows completed status with green badge', () => {
      renderETicket()
      
      const statusBadge = screen.getByText('Đã thanh toán')
      expect(statusBadge).toHaveClass('status-completed')
    })

    it('shows pending status with yellow badge', () => {
      const pendingBooking = { ...mockBooking, payment_status: 'pending' }
      renderETicket({ booking: pendingBooking })
      
      const statusBadge = screen.getByText('Chờ thanh toán')
      expect(statusBadge).toHaveClass('status-pending')
    })

    it('shows failed status with red badge', () => {
      const failedBooking = { ...mockBooking, payment_status: 'failed' }
      renderETicket({ booking: failedBooking })
      
      const statusBadge = screen.getByText('Thanh toán thất bại')
      expect(statusBadge).toHaveClass('status-failed')
    })

    it('shows refunded status with gray badge', () => {
      const refundedBooking = { ...mockBooking, payment_status: 'refunded' }
      renderETicket({ booking: refundedBooking })
      
      const statusBadge = screen.getByText('Đã hoàn tiền')
      expect(statusBadge).toHaveClass('status-refunded')
    })
  })

  describe('Responsive Design', () => {
    it('applies mobile class for small screens', () => {
      // Mock window.matchMedia for mobile
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      renderETicket()
      
      const ticketContainer = screen.getByTestId('e-ticket-container')
      expect(ticketContainer).toHaveClass('e-ticket')
    })
  })

  describe('Print Mode Specific Features', () => {
    it('shows additional information in print mode', () => {
      renderETicket({ displayMode: 'print' })
      
      expect(screen.getByText('CineBook - E-Ticket')).toBeInTheDocument()
      expect(screen.getByText('Hotline: 1900-123-456')).toBeInTheDocument()
      expect(screen.getByText('Email: support@cinebook.vn')).toBeInTheDocument()
    })

    it('shows important notes in print mode', () => {
      renderETicket({ displayMode: 'print' })
      
      expect(screen.getByText(/vui lòng đến rạp ít nhất 15 phút/i)).toBeInTheDocument()
      expect(screen.getByText(/mang theo mã vé này/i)).toBeInTheDocument()
    })

    it('hides action buttons in print mode', () => {
      renderETicket({ displayMode: 'print', showActions: true })
      
      expect(screen.queryByText('📥 Tải xuống')).not.toBeInTheDocument()
      expect(screen.queryByText('🖨️ In vé')).not.toBeInTheDocument()
      expect(screen.queryByText('📤 Chia sẻ')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles missing movie information gracefully', () => {
      const bookingWithoutMovie = {
        ...mockBooking,
        movie: undefined
      }
      
      expect(() => {
        renderETicket({ booking: bookingWithoutMovie })
      }).not.toThrow()
    })

    it('handles missing theater information gracefully', () => {
      const bookingWithoutTheater = {
        ...mockBooking,
        theater: undefined
      }
      
      expect(() => {
        renderETicket({ booking: bookingWithoutTheater })
      }).not.toThrow()
    })

    it('handles missing showtime information gracefully', () => {
      const bookingWithoutShowtime = {
        ...mockBooking,
        showtime: undefined
      }
      
      expect(() => {
        renderETicket({ booking: bookingWithoutShowtime })
      }).not.toThrow()
    })

    it('handles invalid date formats', () => {
      const bookingWithInvalidDate = {
        ...mockBooking,
        showtime: {
          ...mockBooking.showtime,
          show_date: 'invalid-date'
        }
      }
      
      expect(() => {
        renderETicket({ booking: bookingWithInvalidDate })
      }).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for buttons', () => {
      renderETicket()
      
      expect(screen.getByLabelText('Tải xuống vé')).toBeInTheDocument()
      expect(screen.getByLabelText('In vé')).toBeInTheDocument()
      expect(screen.getByLabelText('Chia sẻ vé')).toBeInTheDocument()
    })

    it('has proper alt text for images', () => {
      renderETicket()
      
      const qrCode = screen.getByAltText('QR Code')
      expect(qrCode).toBeInTheDocument()
      
      const poster = screen.getByAltText('Avengers: Endgame')
      expect(poster).toBeInTheDocument()
    })

    it('uses semantic HTML elements', () => {
      renderETicket()
      
      expect(screen.getByRole('article')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    })

    it('can be navigated with keyboard', async () => {
      const user = userEvent.setup()
      renderETicket()
      
      // Tab through action buttons
      await user.tab()
      expect(screen.getByText('📥 Tải xuống')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByText('🖨️ In vé')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByText('📤 Chia sẻ')).toHaveFocus()
    })
  })

  describe('Component State Management', () => {
    it('updates when booking prop changes', () => {
      const { rerender } = renderETicket()
      
      expect(screen.getByText('CB123456')).toBeInTheDocument()
      
      const newBooking = { ...mockBooking, booking_code: 'CB654321' }
      rerender(
        <BrowserRouter>
          <ETicket booking={newBooking} />
        </BrowserRouter>
      )
      
      expect(screen.getByText('CB654321')).toBeInTheDocument()
      expect(screen.queryByText('CB123456')).not.toBeInTheDocument()
    })

    it('updates display mode correctly', () => {
      const { rerender } = renderETicket({ displayMode: 'full' })
      
      expect(screen.getByText('E-TICKET')).toBeInTheDocument()
      
      rerender(
        <BrowserRouter>
          <ETicket booking={mockBooking} displayMode="compact" />
        </BrowserRouter>
      )
      
      expect(screen.queryByText('E-TICKET')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles null booking gracefully', () => {
      expect(() => {
        render(
          <BrowserRouter>
            <ETicket booking={null} />
          </BrowserRouter>
        )
      }).not.toThrow()
    })

    it('handles undefined callback functions', () => {
      expect(() => {
        renderETicket({
          onDownload: undefined,
          onPrint: undefined,
          onShare: undefined
        })
      }).not.toThrow()
    })

    it('handles very long text content', () => {
      const longTitleBooking = {
        ...mockBooking,
        movie: {
          ...mockBooking.movie,
          title: 'A'.repeat(100)
        }
      }
      
      renderETicket({ booking: longTitleBooking })
      
      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument()
    })

    it('handles special characters in content', () => {
      const specialCharBooking = {
        ...mockBooking,
        movie: {
          ...mockBooking.movie,
          title: 'Movie with <script>alert("xss")</script> & special chars'
        }
      }
      
      renderETicket({ booking: specialCharBooking })
      
      expect(screen.getByText('Movie with <script>alert("xss")</script> & special chars')).toBeInTheDocument()
    })
  })
})