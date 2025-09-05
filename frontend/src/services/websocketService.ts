// Mock Socket.io-client for build compatibility
// TODO: Install socket.io-client package for full WebSocket functionality

interface MockSocket {
  connected: boolean
  on(event: string, callback: (...args: any[]) => void): void
  emit(event: string, data?: any): void
  disconnect(): void
}

function mockIo(url: string, options?: any): MockSocket {
  console.warn('Mock WebSocket - Real functionality requires socket.io-client package')
  return {
    connected: false,
    on: () => {},
    emit: () => {},
    disconnect: () => {}
  }
}

// Use mock types
type Socket = MockSocket
const io = mockIo

interface SeatUpdate {
  seat: string
  status: 'available' | 'locked' | 'occupied'
  lockedBy?: number
  lockedAt?: string
  expiresAt?: string
  showtimeId: number
}

interface WebSocketSeatUpdate {
  showtimeId: number
  seatUpdates: SeatUpdate[]
  timestamp: string
}

interface BookingConflict {
  showtimeId: number
  conflictedSeats: string[]
  userId: number
  message: string
}

type WebSocketEventHandlers = {
  seatStatusUpdate: (data: WebSocketSeatUpdate) => void
  bookingConflict: (data: BookingConflict) => void
  seatLocked: (data: { seat: string; userId: number; showtimeId: number }) => void
  seatReleased: (data: { seat: string; showtimeId: number }) => void
  connectionStatus: (status: 'connected' | 'disconnected' | 'reconnecting') => void
}

class WebSocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private eventHandlers: Partial<WebSocketEventHandlers> = {}
  private isConnecting = false

  constructor() {
    this.connect()
  }

  /**
   * Initialize WebSocket connection
   */
  private connect(): void {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      return
    }

    this.isConnecting = true
    
    // Use environment variable for WebSocket URL
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080'
    
    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    this.setupEventListeners()
    this.isConnecting = false
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return

    // Connection events
    this.socket.on('connect', () => {
      console.log('🟢 WebSocket connected')
      this.reconnectAttempts = 0
      this.triggerHandler('connectionStatus', 'connected')
    })

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 WebSocket disconnected:', reason)
      this.triggerHandler('connectionStatus', 'disconnected')
    })

    this.socket.on('reconnect', () => {
      console.log('🟡 WebSocket reconnected')
      this.triggerHandler('connectionStatus', 'connected')
    })

    this.socket.on('reconnecting', (attemptNumber) => {
      console.log(`🟡 WebSocket reconnecting... Attempt ${attemptNumber}`)
      this.triggerHandler('connectionStatus', 'reconnecting')
    })

    // Seat-related events
    this.socket.on('seat:status:update', (data: WebSocketSeatUpdate) => {
      console.log('📡 Seat status update received:', data)
      this.triggerHandler('seatStatusUpdate', data)
    })

    this.socket.on('seat:locked', (data) => {
      console.log('🔒 Seat locked:', data)
      this.triggerHandler('seatLocked', data)
    })

    this.socket.on('seat:released', (data) => {
      console.log('🔓 Seat released:', data)
      this.triggerHandler('seatReleased', data)
    })

    // Booking conflict events
    this.socket.on('booking:conflict', (data: BookingConflict) => {
      console.log('⚠️ Booking conflict:', data)
      this.triggerHandler('bookingConflict', data)
    })

    // Error handling
    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error)
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('🚫 Max reconnection attempts reached')
        this.triggerHandler('connectionStatus', 'disconnected')
      }
    })
  }

  /**
   * Trigger event handler if it exists
   */
  private triggerHandler<K extends keyof WebSocketEventHandlers>(
    event: K,
    data: Parameters<WebSocketEventHandlers[K]>[0]
  ): void {
    const handler = this.eventHandlers[event]
    if (handler) {
      handler(data as any)
    }
  }

  /**
   * Subscribe to showtime seat updates
   */
  public subscribeToShowtime(showtimeId: number, userId?: number): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ WebSocket not connected, cannot subscribe to showtime')
      return
    }

    const subscriptionData = { showtimeId, userId }
    this.socket.emit('subscribe:showtime', subscriptionData)
    console.log('📺 Subscribed to showtime updates:', subscriptionData)
  }

  /**
   * Unsubscribe from showtime seat updates
   */
  public unsubscribeFromShowtime(showtimeId: number): void {
    if (!this.socket || !this.socket.connected) {
      return
    }

    this.socket.emit('unsubscribe:showtime', { showtimeId })
    console.log('📺 Unsubscribed from showtime:', showtimeId)
  }

  /**
   * Send seat lock request
   */
  public lockSeat(showtimeId: number, seatId: string, userId: number): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ WebSocket not connected, cannot lock seat')
      return
    }

    const lockData = { showtimeId, seatId, userId, timestamp: new Date().toISOString() }
    this.socket.emit('seat:lock', lockData)
    console.log('🔒 Seat lock request sent:', lockData)
  }

  /**
   * Send seat release request
   */
  public releaseSeat(showtimeId: number, seatId: string, userId: number): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ WebSocket not connected, cannot release seat')
      return
    }

    const releaseData = { showtimeId, seatId, userId, timestamp: new Date().toISOString() }
    this.socket.emit('seat:release', releaseData)
    console.log('🔓 Seat release request sent:', releaseData)
  }

  /**
   * Register event handler
   */
  public on<K extends keyof WebSocketEventHandlers>(
    event: K,
    handler: WebSocketEventHandlers[K]
  ): void {
    this.eventHandlers[event] = handler
  }

  /**
   * Remove event handler
   */
  public off<K extends keyof WebSocketEventHandlers>(event: K): void {
    delete this.eventHandlers[event]
  }

  /**
   * Get connection status
   */
  public isConnected(): boolean {
    return this.socket ? this.socket.connected : false
  }

  /**
   * Manually reconnect
   */
  public reconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
    }
    this.reconnectAttempts = 0
    this.connect()
  }

  /**
   * Disconnect and cleanup
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.eventHandlers = {}
  }

  /**
   * Send heartbeat to keep connection alive
   */
  public sendHeartbeat(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('heartbeat', { timestamp: new Date().toISOString() })
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService()

export default websocketService
export type { SeatUpdate, WebSocketSeatUpdate, BookingConflict, WebSocketEventHandlers }