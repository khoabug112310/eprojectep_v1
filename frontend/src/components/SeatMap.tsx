import { useState, useEffect, useCallback } from 'react'
import seatService from '../services/seatService'
import { useRealtimeSeatSelection } from '../hooks/useWebSocket'
import ConnectionStatus from './ConnectionStatus'
import SeatLockTimer from './SeatLockTimer'
import toast from 'react-hot-toast'
import './SeatMap.css'

interface Seat {
  id: string
  row: string
  number: number
  category: 'gold' | 'platinum' | 'box'
  price: number
  status: 'available' | 'occupied' | 'selected' | 'locked'
  lockedBy?: number
  lockedAt?: string
  expiresAt?: string
}

interface SeatMapProps {
  showtimeId: number
  seats: Seat[]
  onSeatSelect: (seatId: string) => void
  onSeatDeselect: (seatId: string) => void
  selectedSeats: string[]
  userId?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

export default function SeatMap({ 
  showtimeId, 
  seats, 
  onSeatSelect, 
  onSeatDeselect, 
  selectedSeats, 
  userId, 
  autoRefresh = true, 
  refreshInterval = 5000 // Reduced from 30s to 5s for better responsiveness
}: SeatMapProps) {
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null)
  const [seatStatuses, setSeatStatuses] = useState<Record<string, Seat>>({})
  const [isLocking, setIsLocking] = useState<string[]>([])
  const [lockTimer, setLockTimer] = useState<NodeJS.Timeout | null>(null)
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null)
  const [conflictNotificationShown, setConflictNotificationShown] = useState<string[]>([])
  const [expiredSeats, setExpiredSeats] = useState<string[]>([])

  // Fetch real-time seat status from backend (declared early for hook dependency)
  const fetchSeatStatus = useCallback(async () => {
    try {
      const response = await seatService.getSeatStatus(showtimeId)
      if (response.success) {
        const { seat_status } = response.data
        
        // Update seat statuses based on Redis locks
        setSeatStatuses(prev => {
          const updated = { ...prev }
          
          // Reset all seats to available first
          Object.keys(updated).forEach(seatId => {
            if (updated[seatId].status === 'locked') {
              updated[seatId].status = 'available'
              delete updated[seatId].lockedBy
              delete updated[seatId].lockedAt
              delete updated[seatId].expiresAt
            }
          })
          
          // Apply locked seats
          seat_status.locked?.forEach((lockData: any) => {
            const seatId = `${lockData.seat}`
            if (updated[seatId]) {
              updated[seatId].status = lockData.user_id === userId ? 'selected' : 'locked'
              updated[seatId].lockedBy = lockData.user_id
              updated[seatId].lockedAt = lockData.locked_at
              updated[seatId].expiresAt = lockData.expires_at
            }
          })
          
          return updated
        })
      }
    } catch (error) {
      console.error('Failed to fetch seat status:', error)
    }
  }, [showtimeId, userId])

  // Handle seat lock expiry
  const handleSeatExpiry = useCallback((seatId: string) => {
    setExpiredSeats(prev => [...prev, seatId])
    
    // Update seat status to available
    setSeatStatuses(prev => {
      const updated = { ...prev }
      if (updated[seatId]) {
        updated[seatId].status = 'available'
        delete updated[seatId].lockedBy
        delete updated[seatId].lockedAt
        delete updated[seatId].expiresAt
      }
      return updated
    })
    
    // Deselect the expired seat
    if (selectedSeats.includes(seatId)) {
      onSeatDeselect(seatId)
      toast('Seat ' + seatId + ' lock expired - please select again', {
        icon: '⏰',
        duration: 4000,
        style: {
          background: '#FF6B6B',
          color: '#fff'
        }
      })
    }
  }, [selectedSeats, onSeatDeselect])

  // Get selected seats with lock times for timer display
  const getSelectedSeatsWithTimers = () => {
    return selectedSeats
      .map(seatId => {
        const seat = seatStatuses[seatId]
        return seat?.expiresAt ? { seatId, expiresAt: seat.expiresAt } : null
      })
      .filter(Boolean) as { seatId: string; expiresAt: string }[]
  }

  // WebSocket integration for real-time updates
  const {
    isConnected,
    connectionStatus,
    seatUpdates,
    conflictedSeats,
    lockSeat: lockSeatWS,
    releaseSeat: releaseSeatWS,
    clearConflicts
  } = useRealtimeSeatSelection(
    showtimeId, 
    userId,
    (conflictedSeats) => {
      // Handle seat conflicts
      const newConflicts = conflictedSeats.filter(seat => 
        !conflictNotificationShown.includes(seat)
      )
      
      if (newConflicts.length > 0) {
                toast('Seat conflict detected: ' + newConflicts.join(', ') + ' - Please select different seats', {
                  icon: '⚠️',
                  duration: 5000,
                  style: {
                    background: '#FF9500',
                    color: '#fff'
                  }
                })
        setConflictNotificationShown(prev => [...prev, ...newConflicts])
        
        // Clear notification tracking after 10 seconds
        setTimeout(() => {
          setConflictNotificationShown(prev => 
            prev.filter(seat => !newConflicts.includes(seat))
          )
        }, 10000)
      }
    },
    fetchSeatStatus // Enhanced polling fallback when WebSocket disconnects
  )

  // Initialize seat statuses from props
  useEffect(() => {
    const statusMap = seats.reduce((acc, seat) => {
      acc[seat.id] = seat
      return acc
    }, {} as Record<string, Seat>)
    setSeatStatuses(statusMap)
  }, [seats])

  // Apply real-time seat updates from WebSocket
  useEffect(() => {
    if (seatUpdates.length > 0) {
      setSeatStatuses(prev => {
        const updated = { ...prev }
        
        seatUpdates.forEach(seatUpdate => {
          const seatId = seatUpdate.seat
          if (updated[seatId]) {
            // Update seat status from WebSocket
            updated[seatId] = {
              ...updated[seatId],
              status: seatUpdate.status,
              lockedBy: seatUpdate.lockedBy,
              lockedAt: seatUpdate.lockedAt,
              expiresAt: seatUpdate.expiresAt
            }
            
            // Show notification for seats locked by others
            if (seatUpdate.status === 'locked' && 
                seatUpdate.lockedBy !== userId && 
                selectedSeats.includes(seatId)) {
              toast('Seat ' + seatId + ' was locked by another user', {
                icon: '⚠️',
                duration: 3000,
                style: {
                  background: '#FF9500',
                  color: '#fff'
                }
              })
              // Automatically deselect the conflicted seat
              onSeatDeselect(seatId)
            }
          }
        })
        
        return updated
      })
    }
  }, [seatUpdates, userId, selectedSeats, onSeatDeselect])

  // Lock seats via API with WebSocket integration
  const lockSeats = useCallback(async (seatIds: string[]) => {
    if (!userId) {
      toast.error('Please login to select seats')
      return false
    }

    setIsLocking(prev => [...prev, ...seatIds])

    try {
      // Send WebSocket request for immediate feedback
      if (isConnected) {
        seatIds.forEach(seatId => {
          lockSeatWS(showtimeId, seatId, userId)
        })
      }

      const response = await seatService.lockSeats(showtimeId, {
        seats: seatIds.map(id => ({ seat: id, type: seatStatuses[id]?.category || 'gold' })),
        user_id: userId
      })

      if (response.success) {
        // Update local state immediately for better UX
        setSeatStatuses(prev => {
          const updated = { ...prev }
          seatIds.forEach(seatId => {
            if (updated[seatId]) {
              updated[seatId].status = 'selected'
              updated[seatId].lockedBy = userId
              updated[seatId].lockedAt = new Date().toISOString()
              updated[seatId].expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
            }
          })
          return updated
        })
        
        // Start lock extension timer
        startLockExtensionTimer()
        
        // Show success feedback
        if (seatIds.length === 1) {
          toast.success(`Seat ${seatIds[0]} selected successfully`)
        } else {
          toast.success(`${seatIds.length} seats selected successfully`)
        }
        
        return true
      } else {
        toast.error(response.message || 'Failed to lock seats')
        return false
      }
    } catch (error: any) {
      console.error('Seat locking failed:', error)
      toast.error(error.response?.data?.message || 'Failed to lock seats')
      return false
    } finally {
      setIsLocking(prev => prev.filter(id => !seatIds.includes(id)))
    }
  }, [showtimeId, userId, seatStatuses, isConnected, lockSeatWS])

  // Unlock seats via API with WebSocket integration
  const unlockSeats = useCallback(async (seatIds: string[]) => {
    if (!userId) return false

    try {
      // Send WebSocket request for immediate feedback
      if (isConnected) {
        seatIds.forEach(seatId => {
          releaseSeatWS(showtimeId, seatId, userId)
        })
      }

      const response = await seatService.unlockSeats(showtimeId, {
        seats: seatIds,
        user_id: userId
      })

      if (response.success) {
        // Update local state
        setSeatStatuses(prev => {
          const updated = { ...prev }
          seatIds.forEach(seatId => {
            if (updated[seatId]) {
              updated[seatId].status = 'available'
              delete updated[seatId].lockedBy
              delete updated[seatId].lockedAt
              delete updated[seatId].expiresAt
            }
          })
          return updated
        })
        
        stopLockExtensionTimer()
        
        // Show success feedback
        if (seatIds.length === 1) {
          toast.success(`Seat ${seatIds[0]} released`)
        }
        
        return true
      }
    } catch (error) {
      console.error('Seat unlocking failed:', error)
      toast.error('Failed to release seat')
      return false
    }
    return false
  }, [showtimeId, userId, isConnected, releaseSeatWS])

  // Extend lock timer for selected seats
  const extendLock = useCallback(async () => {
    const userSelectedSeats = selectedSeats.filter(seatId => 
      seatStatuses[seatId]?.lockedBy === userId
    )

    if (userSelectedSeats.length === 0) return

    try {
      await seatService.extendLock(showtimeId, {
        seats: userSelectedSeats,
        user_id: userId || 0
      })
    } catch (error) {
      console.error('Failed to extend lock:', error)
    }
  }, [showtimeId, userId, selectedSeats, seatStatuses])

  // Start lock extension timer (extend every 10 minutes)
  const startLockExtensionTimer = useCallback(() => {
    if (lockTimer) clearInterval(lockTimer)
    
    const timer = setInterval(() => {
      extendLock()
    }, 10 * 60 * 1000) // 10 minutes
    
    setLockTimer(timer)
  }, [extendLock, lockTimer])

  // Stop lock extension timer
  const stopLockExtensionTimer = useCallback(() => {
    if (lockTimer) {
      clearInterval(lockTimer)
      setLockTimer(null)
    }
  }, [lockTimer])

  // Auto refresh seat status
  useEffect(() => {
    if (!autoRefresh) return

    fetchSeatStatus() // Initial fetch
    
    const timer = setInterval(fetchSeatStatus, refreshInterval)
    setRefreshTimer(timer)

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [autoRefresh, refreshInterval, fetchSeatStatus])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (lockTimer) clearInterval(lockTimer)
      if (refreshTimer) clearInterval(refreshTimer)
    }
  }, [lockTimer, refreshTimer])

  // Handle seat click with locking logic
  const handleSeatClick = async (seat: Seat) => {
    const currentSeat = seatStatuses[seat.id] || seat
    
    // Prevent clicking on occupied or locked seats (not by current user)
    if (currentSeat.status === 'occupied' || 
        (currentSeat.status === 'locked' && currentSeat.lockedBy !== userId)) {
      return
    }

    // If seat is already selected by current user, deselect it
    if (selectedSeats.includes(seat.id)) {
      const success = await unlockSeats([seat.id])
      if (success) {
        onSeatDeselect(seat.id)
      }
    } else {
      // Try to lock and select the seat
      const success = await lockSeats([seat.id])
      if (success) {
        onSeatSelect(seat.id)
      }
    }
  }

  const getSeatClass = (seat: Seat) => {
    const currentSeat = seatStatuses[seat.id] || seat
    const baseClass = 'seat'
    const statusClass = currentSeat.status
    const categoryClass = currentSeat.category
    const hoverClass = hoveredSeat === seat.id ? 'hovered' : ''
    const lockingClass = isLocking.includes(seat.id) ? 'locking' : ''
    return `${baseClass} ${statusClass} ${categoryClass} ${hoverClass} ${lockingClass}`.trim()
  }

  const getSeatColor = (seat: Seat) => {
    const currentSeat = seatStatuses[seat.id] || seat
    
    if (currentSeat.status === 'occupied') return '#6c757d'
    if (currentSeat.status === 'selected') return '#7C4DFF'
    if (currentSeat.status === 'locked') return '#FF9500' // Orange for locked seats
    
    switch (currentSeat.category) {
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

  // Get lock expiry time for tooltip
  const getLockExpiryTime = (seat: Seat) => {
    const currentSeat = seatStatuses[seat.id] || seat
    if (currentSeat.expiresAt) {
      const expiryTime = new Date(currentSeat.expiresAt)
      const now = new Date()
      const diffMinutes = Math.ceil((expiryTime.getTime() - now.getTime()) / (1000 * 60))
      return diffMinutes > 0 ? `${diffMinutes} phút` : 'Hết hạn'
    }
    return null
  }

  return (
    <div className="seat-map-container">
      <ConnectionStatus showDetails={true} />
      
      {/* Seat Lock Timers for Selected Seats */}
      {getSelectedSeatsWithTimers().length > 0 && (
        <div className="seat-lock-timers">
          <h4>Selected Seats Lock Status:</h4>
          {getSelectedSeatsWithTimers().map(({ seatId, expiresAt }) => (
            <SeatLockTimer
              key={seatId}
              seatId={seatId}
              expiresAt={expiresAt}
              onExpiry={handleSeatExpiry}
              className="seat-timer-item"
            />
          ))}
        </div>
      )}
      
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
                const currentSeat = seatStatuses[seat.id] || seat
                const x = 80 + idx * 35
                const isSelected = selectedSeats.includes(seat.id)
                const isHovered = hoveredSeat === seat.id
                const isSeatLocking = isLocking.includes(seat.id)
                const lockExpiryTime = getLockExpiryTime(currentSeat)
                
                return (
                  <g
                    key={seat.id}
                    className={getSeatClass(seat)}
                    onClick={() => handleSeatClick(seat)}
                    onMouseEnter={() => setHoveredSeat(seat.id)}
                    onMouseLeave={() => setHoveredSeat(null)}
                    style={{ 
                      cursor: currentSeat.status === 'occupied' || 
                             (currentSeat.status === 'locked' && currentSeat.lockedBy !== userId) 
                             ? 'not-allowed' : 'pointer' 
                    }}
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
                      opacity={isSeatLocking ? 0.6 : 1}
                    />
                    
                    {/* Loading indicator for locking seats */}
                    {isSeatLocking && (
                      <circle
                        cx={x + 15}
                        cy={y + 12}
                        r="8"
                        fill="none"
                        stroke="#7C4DFF"
                        strokeWidth="2"
                        strokeDasharray="12.56"
                        strokeLinecap="round"
                      >
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          values="0 {x + 15} {y + 12};360 {x + 15} {y + 12}"
                          dur="1s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                    
                    {/* Seat Number */}
                    <text
                      x={x + 15}
                      y={y + 17}
                      textAnchor="middle"
                      fill={currentSeat.status === 'occupied' || currentSeat.status === 'locked' ? '#fff' : '#333'}
                      fontSize="10"
                      fontWeight="600"
                      className="seat-text"
                    >
                      {seat.number}
                    </text>
                    
                    {/* Enhanced Tooltip */}
                    {isHovered && (
                      <g>
                        <rect
                          x={x - 60}
                          y={y - 50}
                          width="150"
                          height={currentSeat.status === 'locked' || currentSeat.status === 'selected' ? "45" : "30"}
                          fill="#333"
                          rx="4"
                        />
                        <text
                          x={x + 15}
                          y={y - 30}
                          textAnchor="middle"
                          fill="white"
                          fontSize="10"
                        >
                          {seat.row}{seat.number} - {getSeatPrice(seat)}
                        </text>
                        
                        {/* Additional info for locked/selected seats */}
                        {(currentSeat.status === 'locked' || currentSeat.status === 'selected') && (
                          <text
                            x={x + 15}
                            y={y - 15}
                            textAnchor="middle"
                            fill={currentSeat.status === 'locked' ? '#FF9500' : '#7C4DFF'}
                            fontSize="9"
                          >
                            {currentSeat.status === 'locked' 
                              ? `Locked ${lockExpiryTime ? `(${lockExpiryTime})` : ''}` 
                              : `Selected ${lockExpiryTime ? `(${lockExpiryTime})` : ''}`
                            }
                          </text>
                        )}
                      </g>
                    )}
                  </g>
                )
              })}
            </g>
          )
        })}

        {/* Enhanced Category Labels and Status Legend */}
        <g>
          <text x="400" y="560" textAnchor="middle" fill="#333" fontSize="14" fontWeight="600">
            Chú thích:
          </text>
          
          {/* Gold */}
          <rect x="200" y="570" width="20" height="15" fill="#FFD700" stroke="#333" />
          <text x="230" y="582" fill="#333" fontSize="12">Gold - 120k</text>
          
          {/* Platinum */}
          <rect x="300" y="570" width="20" height="15" fill="#E5E4E2" stroke="#333" />
          <text x="330" y="582" fill="#333" fontSize="12">Platinum - 150k</text>
          
          {/* Box */}
          <rect x="430" y="570" width="20" height="15" fill="#FF6B6B" stroke="#333" />
          <text x="460" y="582" fill="#333" fontSize="12">Box - 200k</text>
          
          {/* Status Legend */}
          <text x="400" y="600" textAnchor="middle" fill="#333" fontSize="14" fontWeight="600">
            Trạng thái:
          </text>
          
          {/* Available */}
          <rect x="200" y="610" width="20" height="15" fill="#28a745" stroke="#333" />
          <text x="230" y="622" fill="#333" fontSize="12">Trống</text>
          
          {/* Selected */}
          <rect x="270" y="610" width="20" height="15" fill="#7C4DFF" stroke="#333" />
          <text x="300" y="622" fill="#333" fontSize="12">Đã chọn</text>
          
          {/* Locked */}
          <rect x="360" y="610" width="20" height="15" fill="#FF9500" stroke="#333" />
          <text x="390" y="622" fill="#333" fontSize="12">Đang khóa</text>
          
          {/* Occupied */}
          <rect x="460" y="610" width="20" height="15" fill="#6c757d" stroke="#333" />
          <text x="490" y="622" fill="#333" fontSize="12">Đã bán</text>
        </g>
      </svg>
    </div>
  )
} 