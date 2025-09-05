// CineBook Standardized Error Response System
// Frontend integration for handling standardized backend error responses

import { Logger } from './Logger'

// Standardized Error Response Interface
interface StandardizedErrorResponse {
  success: false
  error: {
    code: string
    message: string
    type: 'validation' | 'authentication' | 'authorization' | 'business' | 'system' | 'network'
    details?: Record<string, any>
    field?: string
    timestamp: string
    requestId: string
    path: string
  }
  meta?: {
    version: string
    environment: string
    supportContact?: string
  }
}

// Success Response Interface
interface StandardizedSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
  meta?: {
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    timestamp: string
    requestId: string
    version: string
  }
}

// Combined Response Type
type StandardizedResponse<T = any> = StandardizedSuccessResponse<T> | StandardizedErrorResponse

// Error Types Enum
enum ErrorTypes {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  BUSINESS = 'business',
  SYSTEM = 'system',
  NETWORK = 'network'
}

// Error Codes Enum
enum ErrorCodes {
  // Validation Errors (1000-1999)
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_LENGTH = 'INVALID_LENGTH',
  INVALID_VALUE = 'INVALID_VALUE',
  
  // Authentication Errors (2000-2999)
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  
  // Authorization Errors (3000-3999)
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_FORBIDDEN = 'RESOURCE_FORBIDDEN',
  ADMIN_REQUIRED = 'ADMIN_REQUIRED',
  
  // Business Logic Errors (4000-4999)
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  BOOKING_CONFLICT = 'BOOKING_CONFLICT',
  SEAT_UNAVAILABLE = 'SEAT_UNAVAILABLE',
  SHOWTIME_FULL = 'SHOWTIME_FULL',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  BOOKING_EXPIRED = 'BOOKING_EXPIRED',
  
  // System Errors (5000-5999)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Network Errors (6000-6999)
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR'
}

// Error Response Handler Class
class ErrorResponseHandler {
  private logger: Logger
  private errorCallbacks: Map<string, Function[]> = new Map()

  constructor() {
    this.logger = new Logger({
      level: 'ERROR',
      enableConsole: true,
      enableRemote: true,
      remoteEndpoint: '/api/monitoring/errors'
    })
  }

  // Handle API Response
  handleResponse<T>(response: StandardizedResponse<T>): T {
    if (response.success) {
      this.logSuccessResponse(response)
      return response.data
    } else {
      this.handleError(response)
      throw new StandardizedError(response.error)
    }
  }

  // Handle Specific Error
  private handleError(errorResponse: StandardizedErrorResponse): void {
    const { error } = errorResponse

    // Log error
    this.logger.logError('api_error', new Error(error.message), {
      errorCode: error.code,
      errorType: error.type,
      requestId: error.requestId,
      path: error.path,
      details: error.details,
      timestamp: error.timestamp
    })

    // Execute error callbacks
    this.executeErrorCallbacks(error.code, errorResponse)
    this.executeErrorCallbacks(error.type, errorResponse)

    // Handle specific error types
    switch (error.type) {
      case ErrorTypes.AUTHENTICATION:
        this.handleAuthenticationError(error)
        break
      case ErrorTypes.AUTHORIZATION:
        this.handleAuthorizationError(error)
        break
      case ErrorTypes.VALIDATION:
        this.handleValidationError(error)
        break
      case ErrorTypes.BUSINESS:
        this.handleBusinessError(error)
        break
      case ErrorTypes.SYSTEM:
        this.handleSystemError(error)
        break
      case ErrorTypes.NETWORK:
        this.handleNetworkError(error)
        break
    }
  }

  // Log Success Response
  private logSuccessResponse<T>(response: StandardizedSuccessResponse<T>): void {
    this.logger.logInfo('api_success', {
      requestId: response.meta?.requestId,
      timestamp: response.meta?.timestamp,
      message: response.message
    })
  }

  // Handle Authentication Errors
  private handleAuthenticationError(error: StandardizedErrorResponse['error']): void {
    switch (error.code) {
      case ErrorCodes.TOKEN_EXPIRED:
      case ErrorCodes.TOKEN_INVALID:
        // Clear auth token and redirect to login
        localStorage.removeItem('auth_token')
        sessionStorage.removeItem('user_data')
        window.location.href = '/auth/login?reason=session_expired'
        break
      case ErrorCodes.ACCOUNT_LOCKED:
        // Show account locked message
        this.showErrorNotification('Your account has been locked. Please contact support.', 'error')
        break
      case ErrorCodes.ACCOUNT_DISABLED:
        // Show account disabled message
        this.showErrorNotification('Your account has been disabled. Please contact support.', 'error')
        break
      case ErrorCodes.INVALID_CREDENTIALS:
        // Show invalid credentials message
        this.showErrorNotification('Invalid email or password. Please try again.', 'error')
        break
    }
  }

  // Handle Authorization Errors
  private handleAuthorizationError(error: StandardizedErrorResponse['error']): void {
    switch (error.code) {
      case ErrorCodes.INSUFFICIENT_PERMISSIONS:
        this.showErrorNotification('You do not have permission to perform this action.', 'error')
        break
      case ErrorCodes.ADMIN_REQUIRED:
        this.showErrorNotification('Administrator access required.', 'error')
        window.location.href = '/403'
        break
      case ErrorCodes.RESOURCE_FORBIDDEN:
        this.showErrorNotification('Access to this resource is forbidden.', 'error')
        break
    }
  }

  // Handle Validation Errors
  private handleValidationError(error: StandardizedErrorResponse['error']): void {
    // Dispatch validation error event for forms to handle
    const validationEvent = new CustomEvent('validation-error', {
      detail: {
        field: error.field,
        message: error.message,
        code: error.code,
        details: error.details
      }
    })
    document.dispatchEvent(validationEvent)
  }

  // Handle Business Logic Errors
  private handleBusinessError(error: StandardizedErrorResponse['error']): void {
    switch (error.code) {
      case ErrorCodes.SEAT_UNAVAILABLE:
        this.showErrorNotification('Selected seats are no longer available. Please choose different seats.', 'warning')
        // Dispatch seat update event
        const seatEvent = new CustomEvent('seat-availability-changed', {
          detail: { unavailableSeats: error.details?.seats }
        })
        document.dispatchEvent(seatEvent)
        break
        
      case ErrorCodes.BOOKING_CONFLICT:
        this.showErrorNotification('Booking conflict detected. Please try again.', 'warning')
        break
        
      case ErrorCodes.SHOWTIME_FULL:
        this.showErrorNotification('This showtime is fully booked. Please select another time.', 'info')
        break
        
      case ErrorCodes.PAYMENT_FAILED:
        this.showErrorNotification('Payment processing failed. Please try again or use a different payment method.', 'error')
        break
        
      case ErrorCodes.RESOURCE_NOT_FOUND:
        this.showErrorNotification('The requested resource was not found.', 'error')
        // Optionally redirect to 404 page
        if (error.details?.redirectToNotFound) {
          window.location.href = '/404'
        }
        break
        
      case ErrorCodes.RESOURCE_ALREADY_EXISTS:
        this.showErrorNotification(`${error.details?.resource || 'Resource'} already exists.`, 'warning')
        break
    }
  }

  // Handle System Errors
  private handleSystemError(error: StandardizedErrorResponse['error']): void {
    switch (error.code) {
      case ErrorCodes.INTERNAL_SERVER_ERROR:
        this.showErrorNotification('An internal server error occurred. Please try again later.', 'error')
        break
      case ErrorCodes.DATABASE_ERROR:
        this.showErrorNotification('Database error occurred. Please try again later.', 'error')
        break
      case ErrorCodes.SERVICE_UNAVAILABLE:
        this.showErrorNotification('Service is temporarily unavailable. Please try again later.', 'error')
        break
      case ErrorCodes.EXTERNAL_SERVICE_ERROR:
        this.showErrorNotification('External service error. Please try again later.', 'error')
        break
    }
  }

  // Handle Network Errors
  private handleNetworkError(error: StandardizedErrorResponse['error']): void {
    switch (error.code) {
      case ErrorCodes.NETWORK_ERROR:
        this.showErrorNotification('Network error. Please check your connection and try again.', 'error')
        break
      case ErrorCodes.TIMEOUT_ERROR:
        this.showErrorNotification('Request timed out. Please try again.', 'warning')
        break
      case ErrorCodes.CONNECTION_ERROR:
        this.showErrorNotification('Connection error. Please check your internet connection.', 'error')
        break
    }
  }

  // Show Error Notification
  private showErrorNotification(message: string, type: 'error' | 'warning' | 'info'): void {
    // Dispatch notification event
    const notificationEvent = new CustomEvent('show-notification', {
      detail: { message, type, duration: 5000 }
    })
    document.dispatchEvent(notificationEvent)
  }

  // Register Error Callback
  onError(errorCodeOrType: string, callback: Function): void {
    if (!this.errorCallbacks.has(errorCodeOrType)) {
      this.errorCallbacks.set(errorCodeOrType, [])
    }
    this.errorCallbacks.get(errorCodeOrType)!.push(callback)
  }

  // Execute Error Callbacks
  private executeErrorCallbacks(key: string, errorResponse: StandardizedErrorResponse): void {
    const callbacks = this.errorCallbacks.get(key) || []
    callbacks.forEach(callback => {
      try {
        callback(errorResponse)
      } catch (error) {
        console.error('Error in error callback:', error)
      }
    })
  }

  // Remove Error Callback
  offError(errorCodeOrType: string, callback: Function): void {
    const callbacks = this.errorCallbacks.get(errorCodeOrType) || []
    const index = callbacks.indexOf(callback)
    if (index > -1) {
      callbacks.splice(index, 1)
    }
  }

  // Clear All Error Callbacks
  clearErrorCallbacks(errorCodeOrType?: string): void {
    if (errorCodeOrType) {
      this.errorCallbacks.delete(errorCodeOrType)
    } else {
      this.errorCallbacks.clear()
    }
  }
}

// Standardized Error Class
class StandardizedError extends Error {
  public code: string
  public type: string
  public details?: Record<string, any>
  public field?: string
  public timestamp: string
  public requestId: string
  public path: string

  constructor(error: StandardizedErrorResponse['error']) {
    super(error.message)
    this.name = 'StandardizedError'
    this.code = error.code
    this.type = error.type
    this.details = error.details
    this.field = error.field
    this.timestamp = error.timestamp
    this.requestId = error.requestId
    this.path = error.path
  }

  // Check if error is of specific type
  isType(type: ErrorTypes): boolean {
    return this.type === type
  }

  // Check if error has specific code
  hasCode(code: ErrorCodes): boolean {
    return this.code === code
  }

  // Get user-friendly message
  getUserMessage(): string {
    const userMessages: Record<string, string> = {
      [ErrorCodes.VALIDATION_FAILED]: 'Please check your input and try again.',
      [ErrorCodes.INVALID_CREDENTIALS]: 'Invalid email or password.',
      [ErrorCodes.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
      [ErrorCodes.SEAT_UNAVAILABLE]: 'Selected seats are no longer available.',
      [ErrorCodes.BOOKING_CONFLICT]: 'Booking conflict detected. Please try again.',
      [ErrorCodes.PAYMENT_FAILED]: 'Payment processing failed.',
      [ErrorCodes.NETWORK_ERROR]: 'Network error. Please check your connection.',
      [ErrorCodes.INTERNAL_SERVER_ERROR]: 'An internal error occurred. Please try again later.'
    }

    return userMessages[this.code as ErrorCodes] || this.message
  }
}

// API Client with Error Handling
class ApiClient {
  private baseURL: string
  private errorHandler: ErrorResponseHandler
  private defaultHeaders: Record<string, string>

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL
    this.errorHandler = new ErrorResponseHandler()
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  // Set Auth Token
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  // Clear Auth Token
  clearAuthToken(): void {
    delete this.defaultHeaders['Authorization']
  }

  // Generic Request Method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const url = `${this.baseURL}${endpoint}`
      const config: RequestInit = {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers
        }
      }

      // Add request ID for tracking
      const requestId = this.generateRequestId()
      config.headers = {
        ...config.headers,
        'X-Request-ID': requestId
      }

      const response = await fetch(url, config)
      const data: StandardizedResponse<T> = await response.json()

      return this.errorHandler.handleResponse(data)
    } catch (error) {
      if (error instanceof StandardizedError) {
        throw error
      }

      // Handle network errors
      const networkError: StandardizedErrorResponse = {
        success: false,
        error: {
          code: ErrorCodes.NETWORK_ERROR,
          message: 'Network request failed',
          type: ErrorTypes.NETWORK,
          timestamp: new Date().toISOString(),
          requestId: this.generateRequestId(),
          path: endpoint,
          details: { originalError: error }
        }
      }

      this.errorHandler.handleResponse(networkError)
      throw new StandardizedError(networkError.error)
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint
    return this.request<T>(url, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  // File Upload
  async upload<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
    }

    const headers = { ...this.defaultHeaders }
    delete headers['Content-Type'] // Let browser set content-type for FormData

    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: formData
    })
  }

  // Error Handler Access
  get errors(): ErrorResponseHandler {
    return this.errorHandler
  }

  // Generate Request ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Global API instance
const apiClient = new ApiClient()

// React Hook for API calls
export function useApi() {
  return {
    apiClient,
    ErrorTypes,
    ErrorCodes,
    StandardizedError
  }
}

// Error Boundary HOC
export function withErrorHandling<T extends object>(Component: React.ComponentType<T>) {
  return function ErrorHandledComponent(props: T) {
    const [error, setError] = React.useState<StandardizedError | null>(null)

    React.useEffect(() => {
      const handleError = (errorResponse: StandardizedErrorResponse) => {
        setError(new StandardizedError(errorResponse.error))
      }

      // Listen for global errors
      apiClient.errors.onError('GLOBAL', handleError)

      return () => {
        apiClient.errors.offError('GLOBAL', handleError)
      }
    }, [])

    if (error) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{error.getUserMessage()}</p>
          <button onClick={() => setError(null)}>Try Again</button>
        </div>
      )
    }

    return <Component {...props} />
  }
}

export default apiClient
export {
  ErrorResponseHandler,
  StandardizedError,
  ErrorTypes,
  ErrorCodes,
  ApiClient,
  type StandardizedResponse,
  type StandardizedErrorResponse,
  type StandardizedSuccessResponse
}