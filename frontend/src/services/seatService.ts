import api from './api'

export interface SeatLockRequest {
  seats: Array<{
    seat: string
    type: 'gold' | 'platinum' | 'box'
  }>
  user_id: number
}

export interface SeatUnlockRequest {
  seats: string[]
  user_id: number
}

export interface ExtendLockRequest {
  seats: string[]
  user_id: number
}

export interface SeatStatusResponse {
  success: boolean
  data: {
    showtime_id: number
    seat_status: {
      locked: Array<{
        seat: string
        user_id: number
        locked_at: string
        expires_at: string
        showtime_id: number
      }>
      available: string[]
      occupied: string[]
    }
    total_seats: number
    lock_statistics: {
      total_locks: number
      locks_by_user: Record<string, number>
    }
  }
}

export const seatService = {
  // Lock seats for a showtime
  lockSeats: async (showtimeId: number, request: SeatLockRequest) => {
    const response = await api.post(`/showtimes/${showtimeId}/seats/lock`, request)
    return response.data
  },

  // Unlock seats for a showtime
  unlockSeats: async (showtimeId: number, request: SeatUnlockRequest) => {
    const response = await api.delete(`/showtimes/${showtimeId}/seats/unlock`, {
      data: request
    })
    return response.data
  },

  // Extend lock duration
  extendLock: async (showtimeId: number, request: ExtendLockRequest) => {
    const response = await api.put(`/showtimes/${showtimeId}/seats/extend-lock`, request)
    return response.data
  },

  // Get current seat status
  getSeatStatus: async (showtimeId: number): Promise<SeatStatusResponse> => {
    const response = await api.get(`/showtimes/${showtimeId}/seat-status`)
    return response.data
  },

  // Get seat availability for booking
  getSeatAvailability: async (showtimeId: number) => {
    const response = await api.get(`/showtimes/${showtimeId}/seats`)
    return response.data
  }
}

export default seatService