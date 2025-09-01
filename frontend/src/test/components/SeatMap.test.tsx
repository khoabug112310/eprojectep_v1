import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '../utils'
import SeatMap from '../../components/SeatMap'

const mockSeats = [
  { id: 'A1', row: 'A', number: 1, category: 'gold' as const, price: 120000, status: 'available' as const },
  { id: 'A2', row: 'A', number: 2, category: 'gold' as const, price: 120000, status: 'occupied' as const },
  { id: 'A3', row: 'A', number: 3, category: 'gold' as const, price: 120000, status: 'selected' as const },
  { id: 'B1', row: 'B', number: 1, category: 'platinum' as const, price: 150000, status: 'available' as const },
  { id: 'C1', row: 'C', number: 1, category: 'box' as const, price: 200000, status: 'available' as const },
]

describe('SeatMap Component', () => {
  const mockOnSeatSelect = vi.fn()
  const mockOnSeatDeselect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders seat map with seats', () => {
    render(
      <SeatMap 
        seats={mockSeats}
        selectedSeats={[]}
        onSeatSelect={mockOnSeatSelect}
        onSeatDeselect={mockOnSeatDeselect}
      />
    )

    // Check if screen is displayed
    expect(screen.getByText('MÀN HÌNH')).toBeInTheDocument()
    
    // Check if seat categories are displayed in legend
    expect(screen.getByText('Gold - 120k')).toBeInTheDocument()
    expect(screen.getByText('Platinum - 150k')).toBeInTheDocument()
    expect(screen.getByText('Box - 200k')).toBeInTheDocument()
  })

  it('displays seat legend', () => {
    render(
      <SeatMap 
        seats={mockSeats}
        selectedSeats={[]}
        onSeatSelect={mockOnSeatSelect}
        onSeatDeselect={mockOnSeatDeselect}
      />
    )

    expect(screen.getByText('Chú thích:')).toBeInTheDocument()
    expect(screen.getByText('Gold - 120k')).toBeInTheDocument()
    expect(screen.getByText('Platinum - 150k')).toBeInTheDocument()
    expect(screen.getByText('Box - 200k')).toBeInTheDocument()
  })

  it('handles seat selection', () => {
    render(
      <SeatMap 
        seats={mockSeats}
        selectedSeats={[]}
        onSeatSelect={mockOnSeatSelect}
        onSeatDeselect={mockOnSeatDeselect}
      />
    )

    // Find seat by its SVG structure - looking for seat with number 1 in row A
    const seatElements = screen.getAllByText('1') // Seat numbers
    const availableSeat = seatElements[0] // First seat with number 1 (A1)
    
    // Get the parent g element to click
    const seatGroup = availableSeat.closest('g')
    if (seatGroup) {
      fireEvent.click(seatGroup)
      expect(mockOnSeatSelect).toHaveBeenCalledWith('A1')
    }
  })

  it('prevents selection of occupied seats', () => {
    render(
      <SeatMap 
        seats={mockSeats}
        selectedSeats={[]}
        onSeatSelect={mockOnSeatSelect}
        onSeatDeselect={mockOnSeatDeselect}
      />
    )

    // Find occupied seat (A2) - seat with number 2
    const seatElements = screen.getAllByText('2')
    const occupiedSeat = seatElements[0]
    
    const seatGroup = occupiedSeat.closest('g')
    if (seatGroup) {
      fireEvent.click(seatGroup)
      expect(mockOnSeatSelect).not.toHaveBeenCalled()
    }
  })

  it('handles seat deselection', () => {
    render(
      <SeatMap 
        seats={mockSeats}
        selectedSeats={['A1']}
        onSeatSelect={mockOnSeatSelect}
        onSeatDeselect={mockOnSeatDeselect}
      />
    )

    // Find the selected seat A1
    const seatElements = screen.getAllByText('1')
    const selectedSeat = seatElements[0]
    
    const seatGroup = selectedSeat.closest('g')
    if (seatGroup) {
      fireEvent.click(seatGroup)
      expect(mockOnSeatDeselect).toHaveBeenCalledWith('A1')
    }
  })

  it('displays seat tooltips on hover', () => {
    render(
      <SeatMap 
        seats={mockSeats}
        selectedSeats={[]}
        onSeatSelect={mockOnSeatSelect}
        onSeatDeselect={mockOnSeatDeselect}
      />
    )

    // Find seat and hover
    const seatElements = screen.getAllByText('1')
    const seat = seatElements[0]
    const seatGroup = seat.closest('g')
    
    if (seatGroup) {
      fireEvent.mouseEnter(seatGroup)
      // Tooltip should appear with seat info and price
      expect(screen.getByText(/A1 - /)).toBeInTheDocument()
    }
  })

  it('handles empty seats array gracefully', () => {
    render(
      <SeatMap 
        seats={[]}
        selectedSeats={[]}
        onSeatSelect={mockOnSeatSelect}
        onSeatDeselect={mockOnSeatDeselect}
      />
    )

    // Should still show screen and legend
    expect(screen.getByText('MÀN HÌNH')).toBeInTheDocument()
    expect(screen.getByText('Chú thích:')).toBeInTheDocument()
  })

  it('organizes seats by rows correctly', () => {
    render(
      <SeatMap 
        seats={mockSeats}
        selectedSeats={[]}
        onSeatSelect={mockOnSeatSelect}
        onSeatDeselect={mockOnSeatDeselect}
      />
    )

    // Check row labels
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('C')).toBeInTheDocument()
  })
})