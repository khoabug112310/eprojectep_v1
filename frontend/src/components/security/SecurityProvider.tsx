// Advanced Form Security Components for CineBook
// Comprehensive security layer with input sanitization, XSS prevention, and validation engine

import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

// Security Configuration Interface
interface SecurityConfig {
  enableXSSProtection: boolean;
  enableSQLInjectionProtection: boolean;
  enableCSRFProtection: boolean;
  enableRateLimiting: boolean;
  maxInputLength: number;
  allowedTags: string[];
  blockedPatterns: RegExp[];
  sensitiveFields: string[];
}

// Validation Rule Interface
interface ValidationRule {
  name: string;
  validator: (value: any, context?: any) => boolean | Promise<boolean>;
  message: string;
  priority: number;
  async?: boolean;
}

// Security Context Interface
interface SecurityContextType {
  config: SecurityConfig;
  sanitizeInput: (input: string, type?: 'text' | 'html' | 'email' | 'url') => string;
  validateInput: (value: any, rules: ValidationRule[]) => Promise<ValidationResult>;
  checkXSS: (input: string) => boolean;
  checkSQLInjection: (input: string) => boolean;
  generateCSRFToken: () => string;
  verifyCSRFToken: (token: string) => boolean;
  logSecurityEvent: (event: SecurityEvent) => void;
}

// Validation Result Interface
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedValue?: any;
  securityFlags: string[];
}

// Security Event Interface
interface SecurityEvent {
  type: 'XSS_ATTEMPT' | 'SQL_INJECTION' | 'CSRF_VIOLATION' | 'RATE_LIMIT_EXCEEDED' | 'SUSPICIOUS_INPUT';
  timestamp: number;
  userAgent?: string;
  ip?: string;
  input?: string;
  field?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  blocked: boolean;
}

// Default Security Configuration
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  enableXSSProtection: true,
  enableSQLInjectionProtection: true,
  enableCSRFProtection: true,
  enableRateLimiting: true,
  maxInputLength: 10000,
  allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
  blockedPatterns: [
    // XSS patterns
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    // SQL injection patterns
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /'/gi, // Simple quote check
    // Common attack vectors
    /\.\.\/|\.\.\\/, // Directory traversal
    /\b(eval|exec|system|shell_exec)\s*\(/gi, // Code execution
  ],
  sensitiveFields: ['password', 'creditCard', 'ssn', 'token', 'secret']
};

// Security Context
const SecurityContext = createContext<SecurityContextType | null>(null);

// Security Provider Component
export const SecurityProvider: React.FC<{ 
  children: React.ReactNode; 
  config?: Partial<SecurityConfig> 
}> = ({ children, config = {} }) => {
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    ...DEFAULT_SECURITY_CONFIG,
    ...config
  });
  const [csrfTokens, setCSRFTokens] = useState<Set<string>>(new Set());
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);

  // Sanitize Input Function
  const sanitizeInput = useCallback((
    input: string, 
    type: 'text' | 'html' | 'email' | 'url' = 'text'
  ): string => {
    if (!input || typeof input !== 'string') return '';

    let sanitized = input;

    // Length check
    if (sanitized.length > securityConfig.maxInputLength) {
      sanitized = sanitized.substring(0, securityConfig.maxInputLength);
    }

    // Type-specific sanitization
    switch (type) {
      case 'html':
        // Use DOMPurify for HTML sanitization
        sanitized = DOMPurify.sanitize(sanitized, {
          ALLOWED_TAGS: securityConfig.allowedTags,
          ALLOWED_ATTR: ['href', 'src', 'alt', 'title']
        });
        break;
      
      case 'email':
        // Basic email sanitization
        sanitized = sanitized.toLowerCase().trim();
        sanitized = sanitized.replace(/[^a-z0-9@.\-_]/g, '');
        break;
      
      case 'url':
        // URL sanitization
        try {
          const url = new URL(sanitized);
          if (!['http:', 'https:'].includes(url.protocol)) {
            sanitized = '';
          }
        } catch {
          sanitized = encodeURIComponent(sanitized);
        }
        break;
      
      default:
        // Text sanitization
        sanitized = sanitized.replace(/[<>]/g, '');
        sanitized = sanitized.replace(/&/g, '&amp;');
        sanitized = sanitized.replace(/"/g, '&quot;');
        sanitized = sanitized.replace(/'/g, '&#x27;');
        break;
    }

    return sanitized;
  }, [securityConfig]);

  // Check for XSS attempts
  const checkXSS = useCallback((input: string): boolean => {
    if (!securityConfig.enableXSSProtection) return false;

    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }, [securityConfig.enableXSSProtection]);

  // Check for SQL Injection attempts
  const checkSQLInjection = useCallback((input: string): boolean => {
    if (!securityConfig.enableSQLInjectionProtection) return false;

    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /('|(\\x27)|(\\x2D\\x2D)|(%27)|(%2D%2D))/gi,
      /((\%3D)|(=))[^\n]*((\%27)|(\\x27)|(\')|((\%3B)|(;)))/gi
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }, [securityConfig.enableSQLInjectionProtection]);

  // Generate CSRF Token
  const generateCSRFToken = useCallback((): string => {
    const token = btoa(Math.random().toString(36) + Date.now().toString(36));
    setCSRFTokens(prev => new Set([...prev, token]));
    
    // Clean up old tokens (keep last 10)
    if (csrfTokens.size > 10) {
      const tokensArray = Array.from(csrfTokens);
      setCSRFTokens(new Set(tokensArray.slice(-10)));
    }
    
    return token;
  }, [csrfTokens]);

  // Verify CSRF Token
  const verifyCSRFToken = useCallback((token: string): boolean => {
    if (!securityConfig.enableCSRFProtection) return true;
    return csrfTokens.has(token);
  }, [csrfTokens, securityConfig.enableCSRFProtection]);

  // Log Security Event
  const logSecurityEvent = useCallback((event: SecurityEvent): void => {
    const enhancedEvent = {
      ...event,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    };

    setSecurityEvents(prev => [...prev.slice(-99), enhancedEvent]); // Keep last 100 events
    
    // In production, send to monitoring service
    console.warn('Security Event:', enhancedEvent);
    
    // Alert for critical events
    if (event.severity === 'CRITICAL') {
      console.error('CRITICAL Security Event:', enhancedEvent);
    }
  }, []);

  // Validate Input Function
  const validateInput = useCallback(async (
    value: any, 
    rules: ValidationRule[]
  ): Promise<ValidationResult> => {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      securityFlags: []
    };

    // Security checks first
    if (typeof value === 'string') {
      if (checkXSS(value)) {
        result.securityFlags.push('XSS_DETECTED');
        result.errors.push('Potentially malicious content detected');
        result.isValid = false;
        
        logSecurityEvent({
          type: 'XSS_ATTEMPT',
          timestamp: Date.now(),
          input: value,
          severity: 'HIGH',
          blocked: true
        });
      }

      if (checkSQLInjection(value)) {
        result.securityFlags.push('SQL_INJECTION_DETECTED');
        result.errors.push('Potentially harmful database query detected');
        result.isValid = false;
        
        logSecurityEvent({
          type: 'SQL_INJECTION',
          timestamp: Date.now(),
          input: value,
          severity: 'HIGH',
          blocked: true
        });
      }

      // Sanitize the value
      result.sanitizedValue = sanitizeInput(value);
    }

    // Sort rules by priority
    const sortedRules = rules.sort((a, b) => a.priority - b.priority);

    // Apply validation rules
    for (const rule of sortedRules) {
      try {
        let isRuleValid: boolean;
        
        if (rule.async) {
          isRuleValid = await rule.validator(value);
        } else {
          isRuleValid = rule.validator(value) as boolean;
        }

        if (!isRuleValid) {
          result.errors.push(rule.message);
          result.isValid = false;
        }
      } catch (error) {
        console.error(`Validation rule "${rule.name}" failed:`, error);
        result.warnings.push(`Validation error in rule: ${rule.name}`);
      }
    }

    return result;
  }, [checkXSS, checkSQLInjection, sanitizeInput, logSecurityEvent]);

  // Context value
  const contextValue = useMemo<SecurityContextType>(() => ({
    config: securityConfig,
    sanitizeInput,
    validateInput,
    checkXSS,
    checkSQLInjection,
    generateCSRFToken,
    verifyCSRFToken,
    logSecurityEvent
  }), [
    securityConfig,
    sanitizeInput,
    validateInput,
    checkXSS,
    checkSQLInjection,
    generateCSRFToken,
    verifyCSRFToken,
    logSecurityEvent
  ]);

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
};

// Hook to use Security Context
export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

// Secure Input Component
interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  validationRules?: ValidationRule[];
  sanitizationType?: 'text' | 'html' | 'email' | 'url';
  onSecurityEvent?: (event: SecurityEvent) => void;
  showSecurityIndicator?: boolean;
  realTimeValidation?: boolean;
}

export const SecureInput: React.FC<SecureInputProps> = ({
  validationRules = [],
  sanitizationType = 'text',
  onSecurityEvent,
  showSecurityIndicator = true,
  realTimeValidation = true,
  onChange,
  onBlur,
  value,
  className = '',
  ...props
}) => {
  const security = useSecurity();
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<'safe' | 'warning' | 'danger'>('safe');

  // Debounced validation
  const validateValue = useCallback(async (inputValue: string) => {
    if (!inputValue || validationRules.length === 0) {
      setValidationResult(null);
      setSecurityStatus('safe');
      return;
    }

    setIsValidating(true);
    
    try {
      const result = await security.validateInput(inputValue, validationRules);
      setValidationResult(result);
      
      // Update security status
      if (result.securityFlags.length > 0) {
        setSecurityStatus('danger');
      } else if (result.warnings.length > 0) {
        setSecurityStatus('warning');
      } else {
        setSecurityStatus('safe');
      }

      // Trigger security event callback
      if (result.securityFlags.length > 0 && onSecurityEvent) {
        onSecurityEvent({
          type: 'SUSPICIOUS_INPUT',
          timestamp: Date.now(),
          input: inputValue,
          severity: 'MEDIUM',
          blocked: !result.isValid
        });
      }
    } finally {
      setIsValidating(false);
    }
  }, [security, validationRules, onSecurityEvent]);

  // Handle input change
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    
    // Sanitize input
    const sanitizedValue = security.sanitizeInput(inputValue, sanitizationType);
    
    // Update the input value with sanitized version
    if (sanitizedValue !== inputValue) {
      event.target.value = sanitizedValue;
    }

    // Real-time validation
    if (realTimeValidation) {
      validateValue(sanitizedValue);
    }

    // Call original onChange
    if (onChange) {
      onChange(event);
    }
  }, [security, sanitizationType, realTimeValidation, validateValue, onChange]);

  // Handle blur for non-real-time validation
  const handleBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    if (!realTimeValidation) {
      validateValue(event.target.value);
    }

    if (onBlur) {
      onBlur(event);
    }
  }, [realTimeValidation, validateValue, onBlur]);

  // Security indicator class
  const securityIndicatorClass = showSecurityIndicator 
    ? `security-indicator security-indicator--${securityStatus}` 
    : '';

  return (
    <div className={`secure-input-wrapper ${className}`}>
      <input
        {...props}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`secure-input ${securityIndicatorClass} ${props.className || ''}`}
      />
      
      {/* Security Status Indicator */}
      {showSecurityIndicator && (
        <div className={`security-status security-status--${securityStatus}`}>
          {isValidating ? (
            <span className="security-loading">🔄</span>
          ) : (
            <span className="security-icon">
              {securityStatus === 'safe' && '🔒'}
              {securityStatus === 'warning' && '⚠️'}
              {securityStatus === 'danger' && '🚨'}
            </span>
          )}
        </div>
      )}

      {/* Validation Messages */}
      {validationResult && (
        <div className="validation-messages">
          {validationResult.errors.map((error, index) => (
            <div key={index} className="validation-error">
              ❌ {error}
            </div>
          ))}
          {validationResult.warnings.map((warning, index) => (
            <div key={index} className="validation-warning">
              ⚠️ {warning}
            </div>
          ))}
          {validationResult.securityFlags.map((flag, index) => (
            <div key={index} className="security-flag">
              🚨 Security Alert: {flag}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Built-in Validation Rules
export const ValidationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    name: 'required',
    validator: (value) => Boolean(value && value.toString().trim()),
    message,
    priority: 1
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    name: 'email',
    validator: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !value || emailRegex.test(value);
    },
    message,
    priority: 2
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    name: 'minLength',
    validator: (value) => !value || value.toString().length >= min,
    message: message || `Must be at least ${min} characters`,
    priority: 3
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    name: 'maxLength',
    validator: (value) => !value || value.toString().length <= max,
    message: message || `Must not exceed ${max} characters`,
    priority: 3
  }),

  pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule => ({
    name: 'pattern',
    validator: (value) => !value || regex.test(value),
    message,
    priority: 4
  }),

  noSpecialChars: (message = 'Special characters not allowed'): ValidationRule => ({
    name: 'noSpecialChars',
    validator: (value) => !value || /^[a-zA-Z0-9\s]*$/.test(value),
    message,
    priority: 5
  }),

  strongPassword: (message = 'Password must contain uppercase, lowercase, number and special character'): ValidationRule => ({
    name: 'strongPassword',
    validator: (value) => {
      if (!value) return true;
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      return strongPasswordRegex.test(value);
    },
    message,
    priority: 6
  }),

  asyncEmailUnique: (checkEmailFn: (email: string) => Promise<boolean>, message = 'Email already exists'): ValidationRule => ({
    name: 'asyncEmailUnique',
    validator: async (value) => {
      if (!value) return true;
      return await checkEmailFn(value);
    },
    message,
    priority: 10,
    async: true
  })
};

export default SecurityProvider;