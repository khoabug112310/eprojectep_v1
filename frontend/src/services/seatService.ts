import api from './api'

// Simple seat service for basic functionality
export const seatService = {
  // Get seat availability for booking
  getSeatAvailability: async (showtimeId: number) => {
    const response = await api.get(`/showtimes/${showtimeId}/seats`)
    return response.data
  },

  // Book selected seats
  bookSeats: async (showtimeId: number, seats: string[]) => {
    const response = await api.post(`/showtimes/${showtimeId}/book`, { seats })
    return response.data
  }
}

export default seatService