import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import SeatMap from '../../components/SeatMap'
import './Seats.css'

type SeatCategory = 'gold' | 'platinum' | 'box'

interface SeatMapApi {
  [category: string]: {
    available?: string[]
    occupied?: string[]
    selected?: string[]
    price?: number
  } | any
}

interface Seat {
  id: string
  row: string
  number: number
  category: 'gold' | 'platinum' | 'box'
  price: number
  status: 'available' | 'occupied' | 'selected'
}

interface MovieInfo {
  id: number
  title: string
  poster_url?: string
  duration: number
  genre: string
  age_rating?: string
}

interface TheaterInfo {
  id: number
  name: string
  address: string
  city: string
}

interface ShowtimeInfo {
  id: number
  show_date: string
  show_time: string
  movie: MovieInfo
  theater: TheaterInfo
}

export default function Seats() {
  const { showtimeId } = useParams<{ showtimeId: string }>()
  const navigate = useNavigate()
  const [seatMap, setSeatMap] = useState<SeatMapApi>({})
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showtimeInfo, setShowtimeInfo] = useState<ShowtimeInfo | null>(null)

  // Sample movie and theater data for better UI demonstration
  const sampleShowtimeInfo: ShowtimeInfo = {
    id: 1,
    show_date: '2024-01-15',
    show_time: '19:30',
    movie: {
      id: 1,
      title: 'Avengers: Endgame',
      poster_url: 'https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_UX182_CR0,0,182,268_AL_.jpg',
      duration: 181,
      genre: 'Hành Động, Khoa Học Viễn Tưởng',
      age_rating: 'T13'
    },
    theater: {
      id: 1,
      name: 'Galaxy Nguyễn Du',
      address: '116 Nguyễn Du, Bến Thành, Quận 1',
      city: 'TP.HCM'
    }
  }

  useEffect(() => {
    if (!showtimeId) return
    setLoading(true)
    
    // Set sample data for better UI demonstration
    setShowtimeInfo(sampleShowtimeInfo)
    
    // Simulate API call with sample seat map
    setTimeout(() => {
      const sampleSeatMap = {
        box: {
          available: ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4'],
          occupied: [],
          price: 200000
        },
        platinum: {
          available: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'],
          occupied: ['C5', 'D6'],
          price: 150000
        },
        gold: {
          available: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8'],
          occupied: ['E4', 'E5', 'F3', 'F4', 'F5', 'F6'],
          price: 120000
        }
      }
      setSeatMap(sampleSeatMap)
      setLoading(false)
    }, 800)

    // Keep original API call as backup
    // api
    //   .get(`/showtimes/${showtimeId}/seats`)
    //   .then((res) => {
    //     setSeatMap(res.data.data?.seat_map ?? {})
    //     setShowtimeInfo(res.data.data?.showtime ?? sampleShowtimeInfo)
    //   })
    //   .catch((e) => setError(e.message || 'Error'))
    //   .finally(() => setLoading(false))
  }, [showtimeId])

  const seats = useMemo(() => buildSeatsFromMap(seatMap), [seatMap])
  const prices = useMemo(() => extractPrices(seatMap), [seatMap])

  const enrichedSelected = useMemo(() => {
    return selectedSeats.map((seatId) => {
      const seat = seats.find(s => s.id === seatId)
      return { 
        seat: seatId, 
        type: seat?.category || 'gold', 
        price: seat?.price || 0 
      }
    })
  }, [selectedSeats, seats])

  const subtotal = useMemo(() => {
    return enrichedSelected.reduce((sum, x) => sum + Number(x.price || 0), 0)
  }, [enrichedSelected])

  const handleSeatSelect = (seatId: string) => {
    setSelectedSeats((prev) => 
      prev.includes(seatId) 
        ? prev.filter((s) => s !== seatId) 
        : [...prev, seatId]
    )
  }

  const handleSeatDeselect = (seatId: string) => {
    setSelectedSeats((prev) => prev.filter((s) => s !== seatId))
  }

  const lockAndNext = () => {
    if (!showtimeId || enrichedSelected.length === 0) return
    api
      .post(`/showtimes/${showtimeId}/seats/lock`, { seats: enrichedSelected })
      .then(() => navigate('/booking/checkout', { state: { showtimeId, seats: enrichedSelected, subtotal } }))
      .catch((e) => setError(e.message || 'Error'))
  }

  if (loading) return (
    <div className="seats-page">
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h3>Đang tải bản đồ ghế...</h3>
        <p>Vui lòng chờ trong giây lát</p>
      </div>
    </div>
  )
  
  if (error) return (
    <div className="seats-page">
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Có lỗi xảy ra</h3>
        <p>{error}</p>
        <button onClick={() => window.history.back()} className="back-btn">
          Quay lại
        </button>
      </div>
    </div>
  )

  return (
    <div className="seats-page">
      {/* Movie Information Header */}
      {showtimeInfo && (
        <div className="movie-info-header">
          <div className="movie-poster-small">
            <img 
              src={showtimeInfo.movie.poster_url} 
              alt={showtimeInfo.movie.title}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgdmlld0JveD0iMCAwIDUwMCA3NTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNzUwIiBmaWxsPSIjRjNGNEY2Ii8+PHRleHQgeD0iMjUwIiB5PSI0MDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5QjlCQTAiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPgo=';
              }}
            />
          </div>
          <div className="movie-details">
            <h2 className="movie-title">{showtimeInfo.movie.title}</h2>
            <div className="movie-meta">
              <span className="genre">🎬 {showtimeInfo.movie.genre}</span>
              <span className="duration">⏱️ {Math.floor(showtimeInfo.movie.duration / 60)}h {showtimeInfo.movie.duration % 60}m</span>
              {showtimeInfo.movie.age_rating && (
                <span className="age-rating">📋 {showtimeInfo.movie.age_rating}</span>
              )}
            </div>
            <div className="showtime-info">
              <h3>🏪 {showtimeInfo.theater.name}</h3>
              <p className="theater-address">📍 {showtimeInfo.theater.address}</p>
              <div className="session-time">
                <span className="date">📅 {new Date(showtimeInfo.show_date).toLocaleDateString('vi-VN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
                <span className="time">🕕 {showtimeInfo.show_time}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="seats-header">
        <h2>Chọn ghế ngồi</h2>
        <p className="subtitle">Chọn ghế bạn muốn đặt</p>
      </div>

      <div className="seats-content">
        {/* Screen Indicator */}
        <div className="screen-section">
          <div className="screen">
            <div className="screen-label">MÀN HÌNH</div>
            <div className="screen-curve"></div>
          </div>
        </div>

        <div className="seat-map-section">
          <SeatMap 
            seats={seats} 
            selectedSeats={selectedSeats}
            onSeatSelect={handleSeatSelect}
            onSeatDeselect={handleSeatDeselect}
          />
        </div>

        <div className="seats-sidebar">
          <div className="legend-section">
            <h4>🎨 Chú thích</h4>
            <div className="legend-grid">
              <Legend color="#8B4513" label={`BOX (${formatVND(prices.box)})`} />
              <Legend color="#E5E4E2" label={`PLATINUM (${formatVND(prices.platinum)})`} />
              <Legend color="#FFD700" label={`GOLD (${formatVND(prices.gold)})`} />
              <Legend color="#6c757d" label="Đã bán" />
              <Legend color="#FF6B35" label="Đang chọn" />
            </div>
          </div>

          <div className="selection-summary">
            <h4>🎫 Ghế đã chọn</h4>
            {selectedSeats.length > 0 ? (
              <div className="selected-seats">
                {selectedSeats.map(seatId => {
                  const seat = seats.find(s => s.id === seatId)
                  return (
                    <div key={seatId} className="selected-seat-item">
                      <span className="seat-label">
                        {seat ? `${seat.row}${seat.number}` : seatId}
                      </span>
                      <span className="seat-category">{seat?.category?.toUpperCase()}</span>
                      <span className="seat-price">{formatVND(seat?.price || 0)}</span>
                      <button 
                        className="remove-seat"
                        onClick={() => handleSeatDeselect(seatId)}
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="no-selection">
                <div className="no-selection-icon">🎦</div>
                <p>Chưa chọn ghế nào</p>
                <p className="hint">Nhấn vào ghế trên sơ đồ để chọn</p>
              </div>
            )}
          </div>

          <div className="price-summary">
            <div className="price-breakdown">
              <div className="price-row">
                <span>Số lượng ghế:</span>
                <span className="count">{selectedSeats.length} ghế</span>
              </div>
              <div className="price-row subtotal">
                <span>Tạm tính:</span>
                <span className="price">{formatVND(subtotal)}</span>
              </div>
            </div>
          </div>

          <button 
            className="continue-btn"
            disabled={selectedSeats.length === 0} 
            onClick={lockAndNext}
          >
            <span>💳</span>
            Tiếp tục thanh toán ({selectedSeats.length} ghế)
          </button>
          
          <button 
            className="back-btn-secondary"
            onClick={() => navigate(-1)}
          >
            ← Quay lại chọn suất chiếu
          </button>
        </div>
      </div>
    </div>
  )
}

function buildSeatsFromMap(map: SeatMapApi): Seat[] {
  const categories: SeatCategory[] = ['box', 'platinum', 'gold']
  const out: Seat[] = []

  const hasApiShape = (cat: any) => cat && (Array.isArray(cat.available) || Array.isArray(cat.occupied))

  categories.forEach((cat) => {
    const cfg = map[cat]
    if (hasApiShape(cfg)) {
      const occupied = new Set<string>(cfg.occupied || [])
      const allCodes: string[] = [...(cfg.available || []), ...(cfg.occupied || [])]
      allCodes.forEach((code) => {
        const row = code.charAt(0)
        const number = parseInt(code.slice(1))
        const price = cfg.price || getDefaultPrice(cat)
        const status = occupied.has(code) ? 'occupied' : 'available'
        
        out.push({ 
          id: code,
          row,
          number,
          category: cat, 
          price,
          status
        })
      })
    } else {
      const layout: Record<SeatCategory, { rows: number; cols: number; startRow: string }> = {
        box: { rows: 2, cols: 4, startRow: 'A' },
        platinum: { rows: 2, cols: 8, startRow: 'C' },
        gold: { rows: 3, cols: 8, startRow: 'E' },
      }
      const l = layout[cat]
      let rowChar = l.startRow.charCodeAt(0)
      for (let r = 0; r < l.rows; r++) {
        for (let c = 1; c <= l.cols; c++) {
          const code = String.fromCharCode(rowChar) + String(c)
          const price = getDefaultPrice(cat)
          out.push({ 
            id: code,
            row: String.fromCharCode(rowChar),
            number: c,
            category: cat,
            price,
            status: 'available'
          })
        }
        rowChar++
      }
    }
  })

  return out
}

function getDefaultPrice(category: SeatCategory): number {
  switch (category) {
    case 'box':
      return 200000
    case 'platinum':
      return 150000
    case 'gold':
      return 120000
    default:
      return 120000
  }
}

function extractPrices(map: SeatMapApi): Record<SeatCategory, number> {
  return {
    box: Number(map?.box?.price || 200000),
    platinum: Number(map?.platinum?.price || 150000),
    gold: Number(map?.gold?.price || 120000),
  }
}

function formatVND(n: number) {
  return n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="legend-item">
      <span className="legend-color" style={{ background: color }} />
      <span className="legend-label">{label}</span>
    </div>
  )
} 