import { useEffect, useCallback, useRef, useState } from 'react'
import websocketService from '../services/websocketService'
import type { 
  SeatUpdate, 
  WebSocketSeatUpdate, 
  BookingConflict, 
  WebSocketEventHandlers 
} from '../services/websocketService'

interface UseWebSocketOptions {
  showtimeId?: number
  userId?: number
  autoSubscribe?: boolean
  onSeatUpdate?: (updates: SeatUpdate[]) => void
  onBookingConflict?: (conflict: BookingConflict) => void
  onConnectionChange?: (status: 'connected' | 'disconnected' | 'reconnecting') => void
  onConnectionFallback?: () => void // Callback for polling fallback when WebSocket is disconnected
}

interface UseWebSocketReturn {
  isConnected: boolean
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
  subscribeToShowtime: (showtimeId: number, userId?: number) => void
  unsubscribeFromShowtime: (showtimeId: number) => void
  lockSeat: (showtimeId: number, seatId: string, userId: number) => void
  releaseSeat: (showtimeId: number, seatId: string, userId: number) => void
  reconnect: () => void
  lastUpdate: Date | null
}

/**
 * React hook for managing WebSocket connections and real-time seat updates
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    showtimeId,
    userId,
    autoSubscribe = true,
    onSeatUpdate,
    onBookingConflict,
    onConnectionChange,
    onConnectionFallback
  } = options

  const [isConnected, setIsConnected] = useState(websocketService.isConnected())
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  
  // Refs to store callback functions to avoid re-registering handlers
  const onSeatUpdateRef = useRef(onSeatUpdate)
  const onBookingConflictRef = useRef(onBookingConflict)
  const onConnectionChangeRef = useRef(onConnectionChange)

  // Update refs when callbacks change
  useEffect(() => {
    onSeatUpdateRef.current = onSeatUpdate
  }, [onSeatUpdate])

  useEffect(() => {
    onBookingConflictRef.current = onBookingConflict
  }, [onBookingConflict])

  useEffect(() => {
    onConnectionChangeRef.current = onConnectionChange
  }, [onConnectionChange])

  // Handle seat status updates
  const handleSeatStatusUpdate = useCallback((data: WebSocketSeatUpdate) => {
    console.log('🔄 Seat status update received in hook:', data)
    setLastUpdate(new Date())
    
    if (onSeatUpdateRef.current) {
      onSeatUpdateRef.current(data.seatUpdates)
    }
  }, [])

  // Handle booking conflicts
  const handleBookingConflict = useCallback((conflict: BookingConflict) => {
    console.log('⚠️ Booking conflict received in hook:', conflict)
    
    if (onBookingConflictRef.current) {
      onBookingConflictRef.current(conflict)
    }
  }, [])

  // Handle connection status changes
  const handleConnectionStatus = useCallback((status: 'connected' | 'disconnected' | 'reconnecting') => {
    console.log('📡 Connection status changed:', status)
    setConnectionStatus(status)
    setIsConnected(status === 'connected')
    
    if (onConnectionChangeRef.current) {
      onConnectionChangeRef.current(status)
    }
  }, [])

  // Handle individual seat lock/release events
  const handleSeatLocked = useCallback((data: { seat: string; userId: number; showtimeId: number }) => {
    console.log('🔒 Individual seat locked:', data)
    setLastUpdate(new Date())
  }, [])

  const handleSeatReleased = useCallback((data: { seat: string; showtimeId: number }) => {
    console.log('🔓 Individual seat released:', data)
    setLastUpdate(new Date())
  }, [])

  // Register WebSocket event handlers
  useEffect(() => {
    const handlers: Partial<WebSocketEventHandlers> = {
      seatStatusUpdate: handleSeatStatusUpdate,
      bookingConflict: handleBookingConflict,
      connectionStatus: handleConnectionStatus,
      seatLocked: handleSeatLocked,
      seatReleased: handleSeatReleased
    }

    // Register all handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      if (handler) {
        websocketService.on(event as keyof WebSocketEventHandlers, handler as any)
      }
    })

    // Cleanup function to remove handlers
    return () => {
      Object.keys(handlers).forEach((event) => {
        websocketService.off(event as keyof WebSocketEventHandlers)
      })
    }
  }, [handleSeatStatusUpdate, handleBookingConflict, handleConnectionStatus, handleSeatLocked, handleSeatReleased])

  // Auto-subscribe to showtime if specified
  useEffect(() => {
    if (autoSubscribe && showtimeId && isConnected) {
      console.log('🔄 Auto-subscribing to showtime:', showtimeId)
      websocketService.subscribeToShowtime(showtimeId, userId)
      
      // Cleanup: unsubscribe when component unmounts or showtimeId changes
      return () => {
        websocketService.unsubscribeFromShowtime(showtimeId)
      }
    }
  }, [showtimeId, userId, isConnected, autoSubscribe])

  // Wrapper functions for WebSocket service methods
  const subscribeToShowtime = useCallback((showtimeId: number, userId?: number) => {
    websocketService.subscribeToShowtime(showtimeId, userId)
  }, [])

  const unsubscribeFromShowtime = useCallback((showtimeId: number) => {
    websocketService.unsubscribeFromShowtime(showtimeId)
  }, [])

  const lockSeat = useCallback((showtimeId: number, seatId: string, userId: number) => {
    websocketService.lockSeat(showtimeId, seatId, userId)
  }, [])

  const releaseSeat = useCallback((showtimeId: number, seatId: string, userId: number) => {
    websocketService.releaseSeat(showtimeId, seatId, userId)
  }, [])

  const reconnect = useCallback(() => {
    websocketService.reconnect()
  }, [])

  // Enhanced heartbeat and polling fallback mechanism
  useEffect(() => {
    let heartbeatInterval: NodeJS.Timeout | undefined
    let pollingFallbackInterval: NodeJS.Timeout | undefined
    
    if (isConnected) {
      // Regular heartbeat for connected state
      heartbeatInterval = setInterval(() => {
        websocketService.sendHeartbeat()
      }, 30000) // Send heartbeat every 30 seconds
      
      // Clear any polling fallback since WebSocket is active
      if (pollingFallbackInterval) {
        clearInterval(pollingFallbackInterval)
        pollingFallbackInterval = undefined
      }
    } else {
      // Polling fallback when WebSocket is disconnected
      pollingFallbackInterval = setInterval(() => {
        console.log('📡 WebSocket disconnected - using polling fallback')
        // Trigger a manual update via callback if available
        if (onConnectionFallback) {
          onConnectionFallback()
        }
      }, 5000) // Poll every 5 seconds when disconnected
    }

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval)
      if (pollingFallbackInterval) clearInterval(pollingFallbackInterval)
    }
  }, [isConnected, onConnectionFallback])

  return {
    isConnected,
    connectionStatus,
    subscribeToShowtime,
    unsubscribeFromShowtime,
    lockSeat,
    releaseSeat,
    reconnect,
    lastUpdate
  }
}

/**
 * Hook specifically for seat selection components
 */
export function useRealtimeSeatSelection(
  showtimeId: number, 
  userId?: number,
  onSeatConflict?: (conflictedSeats: string[]) => void,
  onConnectionFallback?: () => void // Polling fallback when WebSocket disconnects
) {
  const [seatUpdates, setSeatUpdates] = useState<SeatUpdate[]>([])
  const [conflictedSeats, setConflictedSeats] = useState<string[]>([])

  const handleSeatUpdate = useCallback((updates: SeatUpdate[]) => {
    setSeatUpdates(prev => {
      // Merge updates with existing seat statuses
      const newUpdates = [...prev]
      
      updates.forEach(update => {
        const existingIndex = newUpdates.findIndex(seat => seat.seat === update.seat)
        if (existingIndex >= 0) {
          newUpdates[existingIndex] = update
        } else {
          newUpdates.push(update)
        }
      })
      
      return newUpdates
    })
  }, [])

  const handleBookingConflict = useCallback((conflict: BookingConflict) => {
    if (conflict.showtimeId === showtimeId) {
      setConflictedSeats(conflict.conflictedSeats)
      if (onSeatConflict) {
        onSeatConflict(conflict.conflictedSeats)
      }
    }
  }, [showtimeId, onSeatConflict])

  const websocketHook = useWebSocket({
    showtimeId,
    userId,
    autoSubscribe: true,
    onSeatUpdate: handleSeatUpdate,
    onBookingConflict: handleBookingConflict,
    onConnectionFallback
  })

  // Clear conflicted seats after a timeout
  useEffect(() => {
    if (conflictedSeats.length > 0) {
      const timeout = setTimeout(() => {
        setConflictedSeats([])
      }, 5000) // Clear conflicts after 5 seconds

      return () => clearTimeout(timeout)
    }
  }, [conflictedSeats])

  return {
    ...websocketHook,
    seatUpdates,
    conflictedSeats,
    clearConflicts: () => setConflictedSeats([])
  }
}

export default useWebSocket