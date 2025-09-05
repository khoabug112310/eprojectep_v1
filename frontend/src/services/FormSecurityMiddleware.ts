// Form Security Middleware for CineBook
// Comprehensive middleware for CSRF protection, rate limiting per form, and session validation

import { useSecurity } from '../components/security/SecurityProvider';

// Rate Limiting Configuration
interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
  message: string;
}

// Form Security Configuration
interface FormSecurityConfig {
  enableCSRF: boolean;
  enableRateLimit: boolean;
  enableSessionValidation: boolean;
  rateLimit: RateLimitConfig;
  csrfTokenExpiry: number;
  sessionTimeout: number;
  maxFormSize: number; // bytes
  allowedFields: string[];
  sensitiveFields: string[];
}

// Security Event for Middleware
interface MiddlewareSecurityEvent {
  type: 'RATE_LIMIT_EXCEEDED' | 'CSRF_VALIDATION_FAILED' | 'SESSION_INVALID' | 'SUSPICIOUS_FORM_DATA';
  formId: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  timestamp: number;
  details: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  blocked: boolean;
}

// Rate Limit Entry
interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  blocked: boolean;
  blockExpiry?: number;
}

// Session Information
interface SessionInfo {
  sessionId: string;
  userId?: string;
  createdAt: number;
  lastActivity: number;
  isValid: boolean;
  ipAddress?: string;
  userAgent?: string;
}

// Form Security Result
interface FormSecurityResult {
  isAllowed: boolean;
  reason?: string;
  remainingAttempts?: number;
  blockExpiry?: number;
  csrfToken?: string;
  securityEvents: MiddlewareSecurityEvent[];
}

// Default Security Configurations for Different Form Types
const DEFAULT_FORM_CONFIGS: Record<string, FormSecurityConfig> = {
  login: {
    enableCSRF: true,
    enableRateLimit: true,
    enableSessionValidation: false, // Login creates session
    rateLimit: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 30 * 60 * 1000, // 30 minutes
      message: 'Too many login attempts. Please try again later.'
    },
    csrfTokenExpiry: 30 * 60 * 1000, // 30 minutes
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxFormSize: 1024, // 1KB
    allowedFields: ['email', 'phone', 'password', 'rememberMe'],
    sensitiveFields: ['password']
  },
  registration: {
    enableCSRF: true,
    enableRateLimit: true,
    enableSessionValidation: false,
    rateLimit: {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 2 * 60 * 60 * 1000, // 2 hours
      message: 'Too many registration attempts. Please try again later.'
    },
    csrfTokenExpiry: 30 * 60 * 1000,
    sessionTimeout: 24 * 60 * 60 * 1000,
    maxFormSize: 2048, // 2KB
    allowedFields: ['name', 'email', 'phone', 'password', 'confirmPassword', 'dateOfBirth', 'agreeToTerms'],
    sensitiveFields: ['password', 'confirmPassword']
  },
  booking: {
    enableCSRF: true,
    enableRateLimit: true,
    enableSessionValidation: true,
    rateLimit: {
      maxAttempts: 10,
      windowMs: 10 * 60 * 1000, // 10 minutes
      blockDurationMs: 20 * 60 * 1000, // 20 minutes
      message: 'Too many booking attempts. Please wait before trying again.'
    },
    csrfTokenExpiry: 15 * 60 * 1000, // 15 minutes (shorter for booking)
    sessionTimeout: 4 * 60 * 60 * 1000, // 4 hours
    maxFormSize: 4096, // 4KB
    allowedFields: ['showtimeId', 'seats', 'paymentMethod', 'customerInfo', 'specialRequests'],
    sensitiveFields: ['paymentMethod', 'customerInfo']
  },
  payment: {
    enableCSRF: true,
    enableRateLimit: true,
    enableSessionValidation: true,
    rateLimit: {
      maxAttempts: 3,
      windowMs: 30 * 60 * 1000, // 30 minutes
      blockDurationMs: 60 * 60 * 1000, // 1 hour
      message: 'Too many payment attempts. Please contact support if needed.'
    },
    csrfTokenExpiry: 10 * 60 * 1000, // 10 minutes (very short for payment)
    sessionTimeout: 2 * 60 * 60 * 1000, // 2 hours
    maxFormSize: 2048, // 2KB
    allowedFields: ['cardNumber', 'expiryDate', 'cvv', 'cardHolderName', 'billingAddress'],
    sensitiveFields: ['cardNumber', 'cvv', 'cardHolderName', 'billingAddress']
  },
  review: {
    enableCSRF: true,
    enableRateLimit: true,
    enableSessionValidation: true,
    rateLimit: {
      maxAttempts: 5,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 2 * 60 * 60 * 1000, // 2 hours
      message: 'Too many review submissions. Please wait before submitting another review.'
    },
    csrfTokenExpiry: 60 * 60 * 1000, // 1 hour
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
    maxFormSize: 4096, // 4KB
    allowedFields: ['movieId', 'rating', 'comment', 'anonymous'],
    sensitiveFields: ['comment']
  },
  adminAction: {
    enableCSRF: true,
    enableRateLimit: true,
    enableSessionValidation: true,
    rateLimit: {
      maxAttempts: 20,
      windowMs: 5 * 60 * 1000, // 5 minutes
      blockDurationMs: 15 * 60 * 1000, // 15 minutes
      message: 'Admin action rate limit exceeded. Please wait before performing more actions.'
    },
    csrfTokenExpiry: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 2 * 60 * 60 * 1000, // 2 hours for admin
    maxFormSize: 8192, // 8KB
    allowedFields: ['*'], // Allow all fields for admin
    sensitiveFields: ['password', 'secret', 'token', 'key']
  }
};

class FormSecurityMiddleware {
  private rateLimitStore: Map<string, RateLimitEntry> = new Map();
  private sessionStore: Map<string, SessionInfo> = new Map();
  private csrfTokenStore: Map<string, { token: string; expiry: number; used: boolean }> = new Map();
  private securityEvents: MiddlewareSecurityEvent[] = [];
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);

    // Bind methods
    this.validateFormSecurity = this.validateFormSecurity.bind(this);
    this.generateCSRFToken = this.generateCSRFToken.bind(this);
    this.validateCSRFToken = this.validateCSRFToken.bind(this);
  }

  // Cleanup expired entries
  private cleanupExpiredEntries(): void {
    const now = Date.now();

    // Cleanup rate limit entries
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (entry.blockExpiry && entry.blockExpiry < now) {
        this.rateLimitStore.delete(key);
      }
    }

    // Cleanup expired CSRF tokens
    for (const [key, token] of this.csrfTokenStore.entries()) {
      if (token.expiry < now) {
        this.csrfTokenStore.delete(key);
      }
    }

    // Cleanup expired sessions
    for (const [key, session] of this.sessionStore.entries()) {
      if (!session.isValid || (now - session.lastActivity) > DEFAULT_FORM_CONFIGS.login.sessionTimeout) {
        this.sessionStore.delete(key);
      }
    }

    // Keep only last 1000 security events
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }
  }

  // Generate unique identifier for rate limiting
  private generateRateLimitKey(formId: string, identifier: string): string {
    return `${formId}:${identifier}`;
  }

  // Get client identifier (IP + User Agent hash)
  private getClientIdentifier(req?: any): string {
    // In a real application, this would extract IP and User Agent from request
    // For demo purposes, we'll use a combination of localStorage and session data
    const userAgent = navigator.userAgent;
    const sessionId = sessionStorage.getItem('sessionId') || this.generateSessionId();
    
    // Create a hash-like identifier
    let hash = 0;
    const str = userAgent + sessionId;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  // Generate session ID
  private generateSessionId(): string {
    const sessionId = btoa(Math.random().toString(36) + Date.now().toString(36));
    sessionStorage.setItem('sessionId', sessionId);
    return sessionId;
  }

  // Check rate limiting
  private checkRateLimit(formId: string, config: FormSecurityConfig): {
    allowed: boolean;
    remainingAttempts: number;
    blockExpiry?: number;
  } {
    const identifier = this.getClientIdentifier();
    const key = this.generateRateLimitKey(formId, identifier);
    const now = Date.now();
    
    let entry = this.rateLimitStore.get(key);
    
    if (!entry) {
      entry = {
        attempts: 0,
        firstAttempt: now,
        lastAttempt: now,
        blocked: false
      };
    }

    // Check if block has expired
    if (entry.blocked && entry.blockExpiry && entry.blockExpiry < now) {
      entry.blocked = false;
      entry.attempts = 0;
      entry.firstAttempt = now;
      delete entry.blockExpiry;
    }

    // Check if currently blocked
    if (entry.blocked) {
      return {
        allowed: false,
        remainingAttempts: 0,
        blockExpiry: entry.blockExpiry
      };
    }

    // Check if window has expired
    if (now - entry.firstAttempt > config.rateLimit.windowMs) {
      entry.attempts = 0;
      entry.firstAttempt = now;
    }

    // Check if limit exceeded
    if (entry.attempts >= config.rateLimit.maxAttempts) {
      entry.blocked = true;
      entry.blockExpiry = now + config.rateLimit.blockDurationMs;
      
      this.logSecurityEvent({
        type: 'RATE_LIMIT_EXCEEDED',
        formId,
        timestamp: now,
        details: {
          attempts: entry.attempts,
          maxAttempts: config.rateLimit.maxAttempts,
          identifier
        },
        severity: 'HIGH',
        blocked: true
      });

      this.rateLimitStore.set(key, entry);
      return {
        allowed: false,
        remainingAttempts: 0,
        blockExpiry: entry.blockExpiry
      };
    }

    // Increment attempts
    entry.attempts++;
    entry.lastAttempt = now;
    this.rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remainingAttempts: config.rateLimit.maxAttempts - entry.attempts
    };
  }

  // Generate CSRF Token
  generateCSRFToken(formId: string, config?: FormSecurityConfig): string {
    const formConfig = config || DEFAULT_FORM_CONFIGS[formId] || DEFAULT_FORM_CONFIGS.login;
    const token = btoa(Math.random().toString(36) + Date.now().toString(36) + formId);
    const expiry = Date.now() + formConfig.csrfTokenExpiry;

    this.csrfTokenStore.set(token, {
      token,
      expiry,
      used: false
    });

    return token;
  }

  // Validate CSRF Token
  validateCSRFToken(token: string, formId: string): boolean {
    const tokenEntry = this.csrfTokenStore.get(token);
    
    if (!tokenEntry) {
      this.logSecurityEvent({
        type: 'CSRF_VALIDATION_FAILED',
        formId,
        timestamp: Date.now(),
        details: { reason: 'Token not found', token: token.substring(0, 10) + '...' },
        severity: 'HIGH',
        blocked: true
      });
      return false;
    }

    if (tokenEntry.used) {
      this.logSecurityEvent({
        type: 'CSRF_VALIDATION_FAILED',
        formId,
        timestamp: Date.now(),
        details: { reason: 'Token already used', token: token.substring(0, 10) + '...' },
        severity: 'HIGH',
        blocked: true
      });
      return false;
    }

    if (tokenEntry.expiry < Date.now()) {
      this.csrfTokenStore.delete(token);
      this.logSecurityEvent({
        type: 'CSRF_VALIDATION_FAILED',
        formId,
        timestamp: Date.now(),
        details: { reason: 'Token expired', token: token.substring(0, 10) + '...' },
        severity: 'MEDIUM',
        blocked: true
      });
      return false;
    }

    // Mark token as used (one-time use)
    tokenEntry.used = true;
    this.csrfTokenStore.set(token, tokenEntry);

    return true;
  }

  // Validate session
  private validateSession(formId: string, config: FormSecurityConfig): boolean {
    if (!config.enableSessionValidation) {
      return true;
    }

    const sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      this.logSecurityEvent({
        type: 'SESSION_INVALID',
        formId,
        timestamp: Date.now(),
        details: { reason: 'No session ID' },
        severity: 'MEDIUM',
        blocked: true
      });
      return false;
    }

    const session = this.sessionStore.get(sessionId);
    const now = Date.now();

    if (!session) {
      // Create new session
      const newSession: SessionInfo = {
        sessionId,
        createdAt: now,
        lastActivity: now,
        isValid: true,
        ipAddress: this.getClientIdentifier(),
        userAgent: navigator.userAgent
      };
      this.sessionStore.set(sessionId, newSession);
      return true;
    }

    // Check session timeout
    if (now - session.lastActivity > config.sessionTimeout) {
      session.isValid = false;
      this.sessionStore.set(sessionId, session);
      
      this.logSecurityEvent({
        type: 'SESSION_INVALID',
        formId,
        timestamp: Date.now(),
        details: { reason: 'Session timeout', sessionAge: now - session.createdAt },
        severity: 'LOW',
        blocked: true
      });
      return false;
    }

    // Update last activity
    session.lastActivity = now;
    this.sessionStore.set(sessionId, session);

    return true;
  }

  // Validate form data structure and content
  private validateFormData(formData: any, formId: string, config: FormSecurityConfig): {
    isValid: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    // Check form size
    const formDataSize = JSON.stringify(formData).length;
    if (formDataSize > config.maxFormSize) {
      violations.push(`Form data exceeds maximum size (${formDataSize} > ${config.maxFormSize} bytes)`);
    }

    // Check allowed fields (if not wildcard for admin)
    if (!config.allowedFields.includes('*')) {
      const submittedFields = Object.keys(formData);
      for (const field of submittedFields) {
        if (!config.allowedFields.includes(field)) {
          violations.push(`Unexpected field: ${field}`);
        }
      }
    }

    // Check for suspicious patterns in sensitive fields
    for (const field of config.sensitiveFields) {
      if (formData[field]) {
        const value = String(formData[field]);
        
        // Check for script injection
        if (/<script|javascript:|on\w+\s*=/i.test(value)) {
          violations.push(`Suspicious content in sensitive field: ${field}`);
        }

        // Check for SQL injection patterns
        if (/(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i.test(value)) {
          violations.push(`Potential SQL injection in field: ${field}`);
        }
      }
    }

    if (violations.length > 0) {
      this.logSecurityEvent({
        type: 'SUSPICIOUS_FORM_DATA',
        formId,
        timestamp: Date.now(),
        details: { violations, fieldsCount: Object.keys(formData).length },
        severity: violations.length > 2 ? 'HIGH' : 'MEDIUM',
        blocked: true
      });
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  // Log security event
  private logSecurityEvent(event: MiddlewareSecurityEvent): void {
    this.securityEvents.push({
      ...event,
      ip: this.getClientIdentifier(),
      userAgent: navigator.userAgent
    });
    
    // Also log to console for development
    if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
      console.warn('Form Security Event:', event);
    }
  }

  // Main validation method
  async validateFormSecurity(
    formId: string,
    formData: any,
    csrfToken?: string,
    customConfig?: Partial<FormSecurityConfig>
  ): Promise<FormSecurityResult> {
    const config = {
      ...DEFAULT_FORM_CONFIGS[formId] || DEFAULT_FORM_CONFIGS.login,
      ...customConfig
    };

    const result: FormSecurityResult = {
      isAllowed: true,
      securityEvents: []
    };

    // 1. Check rate limiting
    if (config.enableRateLimit) {
      const rateLimitResult = this.checkRateLimit(formId, config);
      if (!rateLimitResult.allowed) {
        result.isAllowed = false;
        result.reason = config.rateLimit.message;
        result.remainingAttempts = rateLimitResult.remainingAttempts;
        result.blockExpiry = rateLimitResult.blockExpiry;
        return result;
      }
      result.remainingAttempts = rateLimitResult.remainingAttempts;
    }

    // 2. Validate CSRF token
    if (config.enableCSRF && csrfToken) {
      if (!this.validateCSRFToken(csrfToken, formId)) {
        result.isAllowed = false;
        result.reason = 'CSRF token validation failed';
        return result;
      }
    } else if (config.enableCSRF && !csrfToken) {
      result.isAllowed = false;
      result.reason = 'CSRF token required';
      return result;
    }

    // 3. Validate session
    if (!this.validateSession(formId, config)) {
      result.isAllowed = false;
      result.reason = 'Session validation failed';
      return result;
    }

    // 4. Validate form data
    const formValidation = this.validateFormData(formData, formId, config);
    if (!formValidation.isValid) {
      result.isAllowed = false;
      result.reason = `Form validation failed: ${formValidation.violations.join(', ')}`;
      return result;
    }

    // Generate new CSRF token for next request
    if (config.enableCSRF) {
      result.csrfToken = this.generateCSRFToken(formId, config);
    }

    // Collect security events that occurred during validation
    result.securityEvents = this.securityEvents.slice(-10); // Last 10 events

    return result;
  }

  // Get security statistics
  getSecurityStats(formId?: string): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    activeBlocks: number;
    activeSessions: number;
    recentEvents: MiddlewareSecurityEvent[];
  } {
    const filteredEvents = formId 
      ? this.securityEvents.filter(e => e.formId === formId)
      : this.securityEvents;

    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};

    filteredEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });

    const activeBlocks = Array.from(this.rateLimitStore.values())
      .filter(entry => entry.blocked && entry.blockExpiry && entry.blockExpiry > Date.now())
      .length;

    const activeSessions = Array.from(this.sessionStore.values())
      .filter(session => session.isValid)
      .length;

    return {
      totalEvents: filteredEvents.length,
      eventsByType,
      eventsBySeverity,
      activeBlocks,
      activeSessions,
      recentEvents: filteredEvents.slice(-20)
    };
  }

  // Get form configuration
  getFormConfig(formId: string): FormSecurityConfig {
    return DEFAULT_FORM_CONFIGS[formId] || DEFAULT_FORM_CONFIGS.login;
  }

  // Update form configuration
  updateFormConfig(formId: string, config: Partial<FormSecurityConfig>): void {
    DEFAULT_FORM_CONFIGS[formId] = {
      ...DEFAULT_FORM_CONFIGS[formId] || DEFAULT_FORM_CONFIGS.login,
      ...config
    };
  }

  // Reset security data for testing
  resetSecurityData(): void {
    this.rateLimitStore.clear();
    this.sessionStore.clear();
    this.csrfTokenStore.clear();
    this.securityEvents.length = 0;
  }

  // Cleanup resources
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.resetSecurityData();
  }
}

// Singleton instance
export const formSecurityMiddleware = new FormSecurityMiddleware();

// React Hook for using form security
export function useFormSecurity(formId: string, customConfig?: Partial<FormSecurityConfig>) {
  const [csrfToken, setCsrfToken] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [securityResult, setSecurityResult] = React.useState<FormSecurityResult | null>(null);

  React.useEffect(() => {
    // Generate initial CSRF token
    const config = formSecurityMiddleware.getFormConfig(formId);
    if (config.enableCSRF) {
      const token = formSecurityMiddleware.generateCSRFToken(formId, config);
      setCsrfToken(token);
    }
  }, [formId]);

  const validateFormSubmission = React.useCallback(async (
    formData: any,
    options?: { skipRateLimit?: boolean }
  ): Promise<FormSecurityResult> => {
    setIsLoading(true);
    
    try {
      const result = await formSecurityMiddleware.validateFormSecurity(
        formId,
        formData,
        csrfToken,
        {
          ...customConfig,
          ...(options?.skipRateLimit && { enableRateLimit: false })
        }
      );

      setSecurityResult(result);

      // Update CSRF token if new one was generated
      if (result.csrfToken) {
        setCsrfToken(result.csrfToken);
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  }, [formId, csrfToken, customConfig]);

  const getSecurityStats = React.useCallback(() => {
    return formSecurityMiddleware.getSecurityStats(formId);
  }, [formId]);

  const resetFormSecurity = React.useCallback(() => {
    // Generate new CSRF token
    const config = formSecurityMiddleware.getFormConfig(formId);
    if (config.enableCSRF) {
      const token = formSecurityMiddleware.generateCSRFToken(formId, config);
      setCsrfToken(token);
    }
    setSecurityResult(null);
  }, [formId]);

  return {
    csrfToken,
    isLoading,
    securityResult,
    validateFormSubmission,
    getSecurityStats,
    resetFormSecurity,
    formConfig: formSecurityMiddleware.getFormConfig(formId)
  };
}

export default FormSecurityMiddleware;
export type {
  FormSecurityConfig,
  FormSecurityResult,
  MiddlewareSecurityEvent,
  RateLimitConfig,
  SessionInfo
};