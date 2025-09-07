import { useState, useEffect } from 'react'
import seatService from '../services/seatService'
import './SeatMap.css'

interface Seat {
  id: string
  row: string
  number: number
  category: 'gold' | 'platinum' | 'box'
  price: number
  status: 'available' | 'occupied' | 'selected'
}

interface SeatMapProps {
  showtimeId: number
  seats: Seat[]
  onSeatSelect: (seatId: string) => void
  onSeatDeselect: (seatId: string) => void
  selectedSeats: string[]
}

export default function SeatMap({ 
  showtimeId, 
  seats, 
  onSeatSelect, 
  onSeatDeselect, 
  selectedSeats
}: SeatMapProps) {
  const [seatData, setSeatData] = useState<Seat[]>(seats)
  const [loading, setLoading] = useState(false)

  // Load seat data on mount
  useEffect(() => {
    const loadSeats = async () => {
      setLoading(true)
      try {
        const response = await seatService.getSeatAvailability(showtimeId)
        if (response.success) {
          setSeatData(response.data.seats || seats)
        }
      } catch (error) {
        console.error('Failed to load seats:', error)
        setSeatData(seats)
      }
      setLoading(false)
    }

    loadSeats()
  }, [showtimeId, seats])

  // Handle seat click
  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'occupied') return
    
    if (selectedSeats.includes(seat.id)) {
      onSeatDeselect(seat.id)
    } else {
      onSeatSelect(seat.id)
    }
  }

  // Group seats by row
  const seatsByRow = seatData.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = []
    acc[seat.row].push(seat)
    return acc
  }, {} as Record<string, Seat[]>)

  if (loading) {
    return <div className="seat-map-loading">Loading seats...</div>
  }

  return (
    <div className="seat-map">
      <div className="screen">
        <div className="screen-text">SCREEN</div>
      </div>
      
      <div className="seats-container">
        {Object.entries(seatsByRow).map(([row, rowSeats]) => (
          <div key={row} className="seat-row">
            <div className="row-label">{row}</div>
            <div className="seats">
              {rowSeats.map((seat) => {
                const isSelected = selectedSeats.includes(seat.id)
                const seatClass = `seat seat-${seat.category} seat-${seat.status} ${
                  isSelected ? 'seat-selected' : ''
                }`
                
                return (
                  <button
                    key={seat.id}
                    className={seatClass}
                    onClick={() => handleSeatClick(seat)}
                    disabled={seat.status === 'occupied'}
                    title={`Seat ${seat.id} - ${seat.category} - ${seat.price.toLocaleString('vi-VN')}₫`}
                  >
                    {seat.number}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="seat-legend">
        <div className="legend-item">
          <div className="legend-seat seat-available"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-seat seat-selected"></div>
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <div className="legend-seat seat-occupied"></div>
          <span>Occupied</span>
        </div>
      </div>
    </div>
  )
}