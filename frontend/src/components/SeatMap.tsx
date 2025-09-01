import { useState } from 'react'
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
  seats: Seat[]
  onSeatSelect: (seatId: string) => void
  onSeatDeselect: (seatId: string) => void
  selectedSeats: string[]
}

export default function SeatMap({ seats, onSeatSelect, onSeatDeselect, selectedSeats }: SeatMapProps) {
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null)

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'occupied') return

    if (selectedSeats.includes(seat.id)) {
      onSeatDeselect(seat.id)
    } else {
      onSeatSelect(seat.id)
    }
  }

  const getSeatClass = (seat: Seat) => {
    const baseClass = 'seat'
    const statusClass = seat.status
    const categoryClass = seat.category
    const hoverClass = hoveredSeat === seat.id ? 'hovered' : ''
    return `${baseClass} ${statusClass} ${categoryClass} ${hoverClass}`.trim()
  }

  const getSeatColor = (seat: Seat) => {
    if (seat.status === 'occupied') return '#6c757d'
    if (seat.status === 'selected') return '#7C4DFF'
    
    switch (seat.category) {
      case 'gold':
        return '#FFD700'
      case 'platinum':
        return '#E5E4E2'
      case 'box':
        return '#FF6B6B'
      default:
        return '#28a745'
    }
  }

  const getSeatPrice = (seat: Seat) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(seat.price)
  }

  // Group seats by row
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) {
      acc[seat.row] = []
    }
    acc[seat.row].push(seat)
    return acc
  }, {} as Record<string, Seat[]>)

  // Sort rows alphabetically
  const sortedRows = Object.keys(seatsByRow).sort()

  return (
    <div className="seat-map-container">
      <svg className="seat-map" width="800" height="600" viewBox="0 0 800 600">
        {/* Screen */}
        <rect x="50" y="50" width="700" height="20" fill="#333" className="screen" />
        <text x="400" y="65" textAnchor="middle" fill="white" className="screen-text">
          MÀN HÌNH
        </text>

        {/* Seats */}
        {sortedRows.map((row, rowIndex) => {
          const rowSeats = seatsByRow[row]
          const y = 120 + rowIndex * 40
          
          return (
            <g key={row}>
              {/* Row Label */}
              <text x="20" y={y + 15} fill="#333" fontSize="14" fontWeight="600">
                {row}
              </text>
              
              {/* Seats in this row */}
              {rowSeats.map((seat, idx) => {
                const x = 80 + idx * 35
                const isSelected = selectedSeats.includes(seat.id)
                const isHovered = hoveredSeat === seat.id
                
                return (
                  <g
                    key={seat.id}
                    className={getSeatClass(seat)}
                    onClick={() => handleSeatClick(seat)}
                    onMouseEnter={() => setHoveredSeat(seat.id)}
                    onMouseLeave={() => setHoveredSeat(null)}
                    style={{ cursor: seat.status === 'occupied' ? 'not-allowed' : 'pointer' }}
                  >
                    {/* Seat Rectangle */}
                    <rect
                      x={x}
                      y={y}
                      width="30"
                      height="25"
                      fill={getSeatColor(seat)}
                      stroke="#333"
                      strokeWidth={isSelected || isHovered ? 2 : 1}
                      className="seat-rect"
                      rx="4"
                    />
                    
                    {/* Seat Number */}
                    <text
                      x={x + 15}
                      y={y + 17}
                      textAnchor="middle"
                      fill={seat.status === 'occupied' ? '#fff' : '#333'}
                      fontSize="10"
                      fontWeight="600"
                      className="seat-text"
                    >
                      {seat.number}
                    </text>
                    
                    {/* Tooltip */}
                    {isHovered && seat.status !== 'occupied' && (
                      <g>
                        <rect
                          x={x - 50}
                          y={y - 40}
                          width="130"
                          height="30"
                          fill="#333"
                          rx="4"
                        />
                        <text
                          x={x + 15}
                          y={y - 20}
                          textAnchor="middle"
                          fill="white"
                          fontSize="10"
                        >
                          {seat.row}{seat.number} - {getSeatPrice(seat)}
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}
            </g>
          )
        })}

        {/* Category Labels */}
        <g>
          <text x="400" y="580" textAnchor="middle" fill="#333" fontSize="14" fontWeight="600">
            Chú thích:
          </text>
          
          {/* Gold */}
          <rect x="300" y="590" width="20" height="15" fill="#FFD700" stroke="#333" />
          <text x="330" y="602" fill="#333" fontSize="12">Gold - 120k</text>
          
          {/* Platinum */}
          <rect x="400" y="590" width="20" height="15" fill="#E5E4E2" stroke="#333" />
          <text x="430" y="602" fill="#333" fontSize="12">Platinum - 150k</text>
          
          {/* Box */}
          <rect x="500" y="590" width="20" height="15" fill="#FF6B6B" stroke="#333" />
          <text x="530" y="602" fill="#333" fontSize="12">Box - 200k</text>
        </g>
      </svg>
    </div>
  )
} 