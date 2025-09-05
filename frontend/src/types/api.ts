// API Response Types for CineBook Application
// This file defines all TypeScript interfaces for API responses to eliminate 'any' types

// Base API Response Structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
}

// Authentication Types
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  preferred_city?: string;
  preferred_language: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expires_in?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  date_of_birth?: string;
  preferred_city?: string;
}

// Movie Types
export interface Movie {
  id: number;
  title: string;
  slug: string;
  synopsis: string;
  duration: number; // in minutes
  genre: string[];
  language: string;
  age_rating: string;
  release_date: string;
  poster_url?: string;
  trailer_url?: string;
  cast: CastMember[];
  director: string;
  average_rating: number;
  total_reviews: number;
  status: 'active' | 'inactive' | 'coming_soon';
  created_at: string;
  updated_at: string;
}

export interface CastMember {
  name: string;
  role: string;
  character?: string;
}

export interface MovieFilters {
  search?: string;
  genre?: string[];
  language?: string;
  city?: string;
  status?: 'active' | 'coming_soon';
  sort_by?: 'title' | 'release_date' | 'rating';
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

// Theater Types
export interface Theater {
  id: number;
  name: string;
  address: string;
  city: string;
  total_seats: number;
  seat_configuration: SeatConfiguration;
  facilities: string[];
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  updated_at: string;
}

export interface SeatConfiguration {
  gold: number;
  platinum: number;
  box: number;
}

// Showtime Types
export interface Showtime {
  id: number;
  movie_id: number;
  theater_id: number;
  movie: Movie;
  theater: Theater;
  show_date: string;
  show_time: string;
  prices: SeatPricing;
  available_seats: AvailableSeats;
  status: 'active' | 'cancelled' | 'full';
  created_at: string;
  updated_at: string;
}

export interface SeatPricing {
  gold: number;
  platinum: number;
  box: number;
}

export interface AvailableSeats {
  gold: SeatStatus;
  platinum: SeatStatus;
  box: SeatStatus;
}

export interface SeatStatus {
  available: string[];
  occupied: string[];
  selected?: string[];
  price: number;
}

// Booking Types
export interface Booking {
  id: number;
  booking_code: string;
  user_id: number;
  showtime_id: number;
  user: User;
  showtime: Showtime;
  seats: BookedSeat[];
  total_amount: number;
  payment_method?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  booking_status: 'confirmed' | 'cancelled' | 'used';
  booked_at: string;
  created_at: string;
  updated_at: string;
}

export interface BookedSeat {
  seat: string;
  type: 'gold' | 'platinum' | 'box';
  price: number;
}

export interface CreateBookingRequest {
  showtime_id: number;
  seats: {
    seat: string;
    type: 'gold' | 'platinum' | 'box';
  }[];
  payment_method: string;
}

export interface BookingConfirmation {
  booking: Booking;
  e_ticket: ETicket;
}

export interface ETicket {
  booking_code: string;
  qr_code: string;
  movie_title: string;
  theater_name: string;
  show_date: string;
  show_time: string;
  seats: string[];
  total_amount: number;
  booking_date: string;
}

// Payment Types
export interface PaymentRequest {
  booking_id: number;
  amount: number;
  payment_method: string;
  return_url: string;
  cancel_url: string;
}

export interface PaymentResponse {
  payment_url: string;
  transaction_id: string;
  amount: number;
  status: 'pending' | 'processing';
}

export interface PaymentReturn {
  success: boolean;
  transaction_id: string;
  booking_id: string;
  amount: number;
  payment_date: string;
  bank_code?: string;
  transaction_status: 'SUCCESS' | 'FAILED';
  message?: string;
}

// Review Types
export interface Review {
  id: number;
  user_id: number;
  movie_id: number;
  user: Pick<User, 'id' | 'name'>;
  rating: number; // 1-5
  comment?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface CreateReviewRequest {
  movie_id: number;
  rating: number;
  comment?: string;
}

// Admin Dashboard Types
export interface DashboardStats {
  revenue: {
    today: number;
    this_week: number;
    this_month: number;
    growth_percentage: number;
  };
  bookings: {
    today: number;
    this_week: number;
    this_month: number;
    growth_percentage: number;
  };
  popular_movies: PopularMovie[];
  theater_performance: TheaterPerformance[];
  recent_bookings: Booking[];
}

export interface PopularMovie {
  movie: Movie;
  total_bookings: number;
  total_revenue: number;
  average_rating: number;
}

export interface TheaterPerformance {
  theater: Theater;
  occupancy_rate: number;
  total_revenue: number;
  total_bookings: number;
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  errors?: ValidationError[];
  code?: string;
  status?: number;
}

// Pagination Types
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Notification Types
export interface Notification {
  id: number;
  user_id: number;
  type: 'booking_confirmation' | 'show_reminder' | 'payment_success' | 'promotion';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read_at?: string;
  created_at: string;
}

// Upload Types
export interface FileUpload {
  file: File;
  type: 'poster' | 'avatar' | 'document';
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

// WebSocket Types
export interface WebSocketMessage {
  type: 'seat_update' | 'booking_notification' | 'system_message';
  data: unknown;
  timestamp: string;
}

export interface SeatUpdateMessage {
  showtime_id: number;
  seat: string;
  status: 'available' | 'occupied' | 'selected';
  user_id?: number;
}

// Form Types
export interface ContactForm {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface FeedbackForm {
  rating: number;
  category: 'bug' | 'feature' | 'improvement' | 'general';
  message: string;
  email?: string;
}

// Settings Types
export interface UserSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    marketing: boolean;
  };
  preferences: {
    language: string;
    theme: 'light' | 'dark' | 'auto';
    city: string;
    currency: string;
  };
}

// Export utility type for API calls
export type ApiCall<T = unknown> = Promise<ApiResponse<T>>;