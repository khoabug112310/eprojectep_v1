import axios from 'axios';

// Create axios instance with default config for v1 API
const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1', // Laravel backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Movie endpoints
export const movieAPI = {
  getAll: (params) => api.get('/movies', { params }),
  getById: (id) => api.get(`/movies/${id}`),
  getShowtimes: (id) => api.get(`/movies/${id}/showtimes`),
  getReviews: (id) => api.get(`/movies/${id}/reviews`),
};

// Theater endpoints
export const theaterAPI = {
  getAll: (params) => api.get('/theaters', { params }),
  getById: (id) => api.get(`/theaters/${id}`),
};

// Showtime endpoints
export const showtimeAPI = {
  getAll: (params) => api.get('/showtimes', { params }),
  getById: (id) => api.get(`/showtimes/${id}`),
  getSeats: (id) => api.get(`/showtimes/${id}/seats`),
  lockSeats: (id, data) => api.post(`/showtimes/${id}/seats/lock`, data),
  unlockSeats: (id, data) => api.post(`/showtimes/${id}/seats/unlock`, data),
  extendLock: (id, data) => api.post(`/showtimes/${id}/seats/extend`, data),
  getSeatStatus: (id) => api.get(`/showtimes/${id}/seats/status`),
};

// Booking endpoints
export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  getUserBookings: () => api.get('/user/bookings'),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
  // Add method to get ticket data
  getTicket: (id) => api.get(`/bookings/${id}/ticket`),
  // Add process payment method
  processPayment: (id, data) => api.post(`/bookings/${id}/payment`, data),
};

// Review endpoints
export const reviewAPI = {
  create: (movieId, data) => api.post(`/movies/${movieId}/reviews`, data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// Admin endpoints
export const adminAPI = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  
  // Movies
  getAdminMovies: (params) => api.get('/admin/movies', { params }),
  getMovieById: (id) => api.get(`/admin/movies/${id}`),
  createMovie: (data) => api.post('/admin/movies', data),
  updateMovie: (id, data) => api.put(`/admin/movies/${id}`, data),
  deleteMovie: (id) => api.delete(`/admin/movies/${id}`),
  
  // Theaters
  getAdminTheaters: (params) => api.get('/admin/theaters', { params }),
  getTheaterById: (id) => api.get(`/admin/theaters/${id}`),
  createTheater: (data) => api.post('/admin/theaters', data),
  updateTheater: (id, data) => api.put(`/admin/theaters/${id}`, data),
  deleteTheater: (id) => api.delete(`/admin/theaters/${id}`),
  
  // Showtimes
  getAdminShowtimes: (params) => api.get('/admin/showtimes', { params }),
  getShowtimeById: (id) => api.get(`/admin/showtimes/${id}`),
  createShowtime: (data) => api.post('/admin/showtimes', data),
  updateShowtime: (id, data) => api.put(`/admin/showtimes/${id}`, data),
  deleteShowtime: (id) => api.delete(`/admin/showtimes/${id}`),
  
  // Bookings
  getAdminBookings: (params) => api.get('/admin/bookings', { params }),
  updateBooking: (id, data) => api.put(`/admin/bookings/${id}`, data),
  deleteBooking: (id) => api.delete(`/admin/bookings/${id}`),
  
  // Users (using v1 API with admin prefix)
  getAdminUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  // Reviews
  getAdminReviews: (params) => api.get('/admin/reviews', { params }),
  approveReview: (id) => api.put(`/admin/reviews/${id}/approve`),
  rejectReview: (id) => api.put(`/admin/reviews/${id}/reject`),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`),
};

export default api;