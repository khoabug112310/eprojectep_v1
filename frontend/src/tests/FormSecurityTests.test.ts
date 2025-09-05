// Comprehensive Form Testing Suite for CineBook
// Unit tests, integration tests, and security tests for form validation and security

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Import components and hooks to test
import { FormSecurityMiddleware, formSecurityMiddleware } from '../services/FormSecurityMiddleware';
import { useFormSecurity } from '../services/FormSecurityMiddleware';
import { useSecureForm } from '../hooks/useSecureForm';
import { SecureInput, useSecurity, SecurityProvider } from '../components/security/SecurityProvider';
import { ValidationRulesEngine } from '../services/ValidationRulesEngine';

// Mock dependencies
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((input) => input.replace(/<script.*?<\/script>/gi, ''))
  }
}));

// Test utilities
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SecurityProvider>{children}</SecurityProvider>
);

const createMockFormConfig = () => ({
  formId: 'test-form',
  fields: [
    {
      name: 'email',
      type: 'email' as const,
      label: 'Email',
      required: true,
      sensitiveField: false
    },
    {
      name: 'password',
      type: 'password' as const,
      label: 'Password',
      required: true,
      sensitiveField: true,
      validation: {
        minLength: 8
      }
    },
    {
      name: 'name',
      type: 'text' as const,
      label: 'Full Name',
      required: true,
      sensitiveField: false
    }
  ]
});

// Unit Tests for FormSecurityMiddleware
describe('FormSecurityMiddleware', () => {
  let middleware: FormSecurityMiddleware;

  beforeEach(() => {
    middleware = new FormSecurityMiddleware();
    // Mock localStorage and sessionStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        clear: vi.fn()
      }
    });
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(() => 'test-session-id'),
        setItem: vi.fn(),
        clear: vi.fn()
      }
    });
  });

  afterEach(() => {
    middleware.destroy();
    vi.clearAllMocks();
  });

  describe('CSRF Token Management', () => {
    it('should generate valid CSRF tokens', () => {
      const token1 = middleware.generateCSRFToken('login');
      const token2 = middleware.generateCSRFToken('login');
      
      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toBe(token2); // Tokens should be unique
      expect(typeof token1).toBe('string');
    });

    it('should validate CSRF tokens correctly', () => {
      const token = middleware.generateCSRFToken('login');
      
      // Valid token should pass
      expect(middleware.validateCSRFToken(token, 'login')).toBe(true);
      
      // Same token should fail on second use (one-time use)
      expect(middleware.validateCSRFToken(token, 'login')).toBe(false);
      
      // Invalid token should fail
      expect(middleware.validateCSRFToken('invalid-token', 'login')).toBe(false);
    });

    it('should handle expired CSRF tokens', async () => {
      const token = middleware.generateCSRFToken('login');
      
      // Mock expired token by manipulating time
      const originalNow = Date.now;
      Date.now = vi.fn(() => originalNow() + 31 * 60 * 1000); // 31 minutes later
      
      expect(middleware.validateCSRFToken(token, 'login')).toBe(false);
      
      // Restore original Date.now
      Date.now = originalNow;
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      const formData = { email: 'test@example.com', password: 'password123' };
      
      // First few attempts should be allowed
      for (let i = 0; i < 3; i++) {
        const result = await middleware.validateFormSecurity('login', formData);
        expect(result.isAllowed).toBe(true);
        expect(result.remainingAttempts).toBe(5 - i - 1);
      }
    });

    it('should block requests when rate limit exceeded', async () => {
      const formData = { email: 'test@example.com', password: 'password123' };
      
      // Exhaust the rate limit (5 attempts for login)
      for (let i = 0; i < 5; i++) {
        await middleware.validateFormSecurity('login', formData);
      }
      
      // Next attempt should be blocked
      const result = await middleware.validateFormSecurity('login', formData);
      expect(result.isAllowed).toBe(false);
      expect(result.reason).toContain('Too many login attempts');
      expect(result.blockExpiry).toBeTruthy();
    });

    it('should reset rate limit after window expires', async () => {
      const formData = { email: 'test@example.com', password: 'password123' };
      
      // Exhaust rate limit
      for (let i = 0; i < 5; i++) {
        await middleware.validateFormSecurity('login', formData);
      }
      
      // Mock time passing (16 minutes later)
      const originalNow = Date.now;
      Date.now = vi.fn(() => originalNow() + 16 * 60 * 1000);
      
      // Should be allowed again
      const result = await middleware.validateFormSecurity('login', formData);
      expect(result.isAllowed).toBe(true);
      
      Date.now = originalNow;
    });
  });

  describe('Form Data Validation', () => {
    it('should detect XSS attempts', async () => {
      const maliciousData = {
        email: 'test@example.com',
        comment: '<script>alert("xss")</script>'
      };
      
      const result = await middleware.validateFormSecurity('review', maliciousData);
      expect(result.isAllowed).toBe(false);
      expect(result.reason).toContain('Form validation failed');
    });

    it('should detect SQL injection attempts', async () => {
      const maliciousData = {
        email: 'test@example.com',
        search: "'; DROP TABLE users; --"
      };
      
      const result = await middleware.validateFormSecurity('login', maliciousData);
      expect(result.isAllowed).toBe(false);
      expect(result.reason).toContain('Form validation failed');
    });

    it('should validate form size limits', async () => {
      const largeData = {
        email: 'test@example.com',
        comment: 'a'.repeat(10000) // Exceeds typical form size limits
      };
      
      const result = await middleware.validateFormSecurity('login', largeData);
      expect(result.isAllowed).toBe(false);
    });

    it('should validate allowed fields', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        unauthorized_field: 'malicious_value'
      };
      
      const result = await middleware.validateFormSecurity('login', invalidData);
      expect(result.isAllowed).toBe(false);
      expect(result.reason).toContain('Unexpected field');
    });
  });

  describe('Session Validation', () => {
    it('should validate sessions for forms requiring authentication', async () => {
      const formData = { showtimeId: '123', seats: ['A1', 'A2'] };
      
      // Booking form requires session validation
      const result = await middleware.validateFormSecurity('booking', formData);
      expect(result.isAllowed).toBe(true); // Should create new session
    });

    it('should handle session timeout', async () => {
      const formData = { showtimeId: '123', seats: ['A1', 'A2'] };
      
      // First request creates session
      await middleware.validateFormSecurity('booking', formData);
      
      // Mock session timeout (5 hours later)
      const originalNow = Date.now;
      Date.now = vi.fn(() => originalNow() + 5 * 60 * 60 * 1000);
      
      const result = await middleware.validateFormSecurity('booking', formData);
      expect(result.isAllowed).toBe(false);
      expect(result.reason).toContain('Session validation failed');
      
      Date.now = originalNow;
    });
  });

  describe('Security Statistics', () => {
    it('should track security events', async () => {
      const maliciousData = { email: 'test@example.com', comment: '<script>alert("xss")</script>' };
      
      // Generate some security events
      await middleware.validateFormSecurity('review', maliciousData);
      await middleware.validateFormSecurity('review', maliciousData);
      
      const stats = middleware.getSecurityStats('review');
      expect(stats.totalEvents).toBeGreaterThan(0);
      expect(stats.eventsByType.SUSPICIOUS_FORM_DATA).toBeGreaterThan(0);
      expect(stats.recentEvents.length).toBeGreaterThan(0);
    });

    it('should provide overall statistics', () => {
      const stats = middleware.getSecurityStats();
      expect(stats).toHaveProperty('totalEvents');
      expect(stats).toHaveProperty('eventsByType');
      expect(stats).toHaveProperty('eventsBySeverity');
      expect(stats).toHaveProperty('activeBlocks');
      expect(stats).toHaveProperty('activeSessions');
      expect(stats).toHaveProperty('recentEvents');
    });
  });
});

// Unit Tests for useSecureForm Hook
describe('useSecureForm Hook', () => {
  let mockConfig: any;

  beforeEach(() => {
    mockConfig = createMockFormConfig();
    formSecurityMiddleware.resetSecurityData();
  });

  it('should initialize form with default values', () => {
    const { result } = renderHook(() => useSecureForm(mockConfig), {
      wrapper: TestWrapper
    });

    expect(result.current.values.email).toBe('');
    expect(result.current.values.password).toBe('');
    expect(result.current.values.name).toBe('');
    expect(result.current.isValid).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should handle field changes correctly', () => {
    const { result } = renderHook(() => useSecureForm(mockConfig), {
      wrapper: TestWrapper
    });

    act(() => {
      result.current.handleFieldChange('email', 'test@example.com');
    });

    expect(result.current.values.email).toBe('test@example.com');
    expect(result.current.touched.email).toBe(true);
  });

  it('should validate fields on change when real-time validation enabled', () => {
    const configWithRealTime = { ...mockConfig, enableRealTimeValidation: true };
    const { result } = renderHook(() => useSecureForm(configWithRealTime), {
      wrapper: TestWrapper
    });

    act(() => {
      result.current.handleFieldChange('email', 'invalid-email');
    });

    expect(result.current.errors.email).toContain('valid email');
  });

  it('should validate required fields', () => {
    const { result } = renderHook(() => useSecureForm(mockConfig), {
      wrapper: TestWrapper
    });

    act(() => {
      result.current.handleFieldBlur('email');
    });

    expect(result.current.errors.email).toContain('required');
  });

  it('should validate password strength', () => {
    const { result } = renderHook(() => useSecureForm(mockConfig), {
      wrapper: TestWrapper
    });

    act(() => {
      result.current.handleFieldChange('password', 'weak');
      result.current.handleFieldBlur('password');
    });

    expect(result.current.errors.password).toBeTruthy();
  });

  it('should sanitize sensitive fields', () => {
    const { result } = renderHook(() => useSecureForm(mockConfig), {
      wrapper: TestWrapper
    });

    act(() => {
      result.current.handleFieldChange('password', '<script>alert("xss")</script>pass');
    });

    // Should be sanitized (script tags removed)
    expect(result.current.values.password).not.toContain('<script>');
  });

  it('should handle form submission with validation', async () => {
    const mockOnSuccess = vi.fn();
    const configWithSubmit = {
      ...mockConfig,
      onSuccess: mockOnSuccess
    };

    const { result } = renderHook(() => useSecureForm(configWithSubmit), {
      wrapper: TestWrapper
    });

    // Set valid form data
    act(() => {
      result.current.handleFieldChange('email', 'test@example.com');
      result.current.handleFieldChange('password', 'StrongPassword123!');
      result.current.handleFieldChange('name', 'John Doe');
    });

    // Submit form
    await act(async () => {
      const success = await result.current.handleSubmit();
      expect(success).toBe(true);
    });
  });

  it('should block submission with invalid data', async () => {
    const { result } = renderHook(() => useSecureForm(mockConfig), {
      wrapper: TestWrapper
    });

    // Submit form without filling required fields
    await act(async () => {
      const success = await result.current.handleSubmit();
      expect(success).toBe(false);
    });

    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);
  });

  it('should reset form correctly', () => {
    const { result } = renderHook(() => useSecureForm(mockConfig), {
      wrapper: TestWrapper
    });

    // Fill form
    act(() => {
      result.current.handleFieldChange('email', 'test@example.com');
      result.current.handleFieldChange('name', 'John Doe');
    });

    // Reset form
    act(() => {
      result.current.resetForm();
    });

    expect(result.current.values.email).toBe('');
    expect(result.current.values.name).toBe('');
    expect(Object.keys(result.current.errors).length).toBe(0);
    expect(Object.keys(result.current.touched).length).toBe(0);
  });
});

// Integration Tests for SecureInput Component
describe('SecureInput Component Integration', () => {
  const mockValidationRules = [
    {
      name: 'required',
      validator: (value: any) => Boolean(value && value.toString().trim()),
      message: 'This field is required',
      priority: 1
    }
  ];

  it('should render with security indicator', () => {
    render(
      <TestWrapper>
        <SecureInput
          placeholder="Enter text"
          validationRules={mockValidationRules}
          data-testid="secure-input"
        />
      </TestWrapper>
    );

    const input = screen.getByTestId('secure-input');
    expect(input).toBeInTheDocument();
  });

  it('should show security status based on input', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <SecureInput
          placeholder="Enter text"
          validationRules={mockValidationRules}
          data-testid="secure-input"
        />
      </TestWrapper>
    );

    const input = screen.getByTestId('secure-input');
    
    // Type malicious content
    await user.type(input, '<script>alert("xss")</script>');
    
    await waitFor(() => {
      // Should show security warning
      const securityIndicator = document.querySelector('.security-status--danger');
      expect(securityIndicator).toBeInTheDocument();
    });
  });

  it('should sanitize input in real-time', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <SecureInput
          placeholder="Enter text"
          sanitizationType="text"
          data-testid="secure-input"
        />
      </TestWrapper>
    );

    const input = screen.getByTestId('secure-input') as HTMLInputElement;
    
    await user.type(input, '<script>alert("xss")</script>test');
    
    // Input should be sanitized (no script tags)
    expect(input.value).not.toContain('<script>');
    expect(input.value).toContain('test');
  });

  it('should show validation messages', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <SecureInput
          placeholder="Enter text"
          validationRules={mockValidationRules}
          realTimeValidation={true}
          data-testid="secure-input"
        />
      </TestWrapper>
    );

    const input = screen.getByTestId('secure-input');
    
    // Focus and blur without entering value
    await user.click(input);
    await user.tab(); // Blur
    
    await waitFor(() => {
      const errorMessage = screen.getByText(/required/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });
});

// Security Tests
describe('Security Tests', () => {
  describe('XSS Protection', () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(\'xss\')">',
      '<svg onload="alert(\'xss\')">',
      '"><script>alert("xss")</script>',
      "';alert('xss');//",
    ];

    xssPayloads.forEach(payload => {
      it(`should detect and block XSS payload: ${payload}`, async () => {
        const formData = { comment: payload, email: 'test@example.com' };
        const result = await formSecurityMiddleware.validateFormSecurity('review', formData);
        
        expect(result.isAllowed).toBe(false);
        expect(result.securityEvents.some(e => e.type === 'SUSPICIOUS_FORM_DATA')).toBe(true);
      });
    });
  });

  describe('SQL Injection Protection', () => {
    const sqlInjectionPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "1; DELETE FROM users WHERE 1=1; --",
      "' UNION SELECT * FROM users --",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --",
    ];

    sqlInjectionPayloads.forEach(payload => {
      it(`should detect and block SQL injection payload: ${payload}`, async () => {
        const formData = { search: payload, email: 'test@example.com' };
        const result = await formSecurityMiddleware.validateFormSecurity('login', formData);
        
        expect(result.isAllowed).toBe(false);
        expect(result.securityEvents.some(e => e.type === 'SUSPICIOUS_FORM_DATA')).toBe(true);
      });
    });
  });

  describe('Rate Limiting Security', () => {
    it('should prevent brute force attacks', async () => {
      const formData = { email: 'test@example.com', password: 'wrong_password' };
      
      // Simulate brute force attack
      for (let i = 0; i < 10; i++) {
        const result = await formSecurityMiddleware.validateFormSecurity('login', formData);
        if (!result.isAllowed) {
          expect(result.reason).toContain('Too many');
          break;
        }
      }
    });

    it('should handle concurrent requests correctly', async () => {
      const formData = { email: 'test@example.com', password: 'password' };
      
      // Simulate concurrent requests
      const promises = Array(10).fill(0).map(() => 
        formSecurityMiddleware.validateFormSecurity('login', formData)
      );
      
      const results = await Promise.all(promises);
      
      // Should handle all requests without crashing
      expect(results.length).toBe(10);
      expect(results.every(r => typeof r.isAllowed === 'boolean')).toBe(true);
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize HTML content', () => {
      const maliciousHtml = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitized = formSecurityMiddleware.sanitizeInput(maliciousHtml, 'html');
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Safe content');
    });

    it('should sanitize email inputs', () => {
      const maliciousEmail = 'test@example.com<script>alert("xss")</script>';
      const sanitized = formSecurityMiddleware.sanitizeInput(maliciousEmail, 'email');
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('test@example.com');
    });

    it('should validate URL inputs', () => {
      const validUrl = 'https://example.com';
      const maliciousUrl = 'javascript:alert("xss")';
      
      const sanitizedValid = formSecurityMiddleware.sanitizeInput(validUrl, 'url');
      const sanitizedMalicious = formSecurityMiddleware.sanitizeInput(maliciousUrl, 'url');
      
      expect(sanitizedValid).toBe(validUrl);
      expect(sanitizedMalicious).not.toContain('javascript:');
    });
  });
});

// Performance Tests
describe('Performance Tests', () => {
  it('should handle large numbers of validation requests', async () => {
    const startTime = Date.now();
    const formData = { email: 'test@example.com', password: 'password123' };
    
    // Perform 100 validations
    for (let i = 0; i < 100; i++) {
      await formSecurityMiddleware.validateFormSecurity('login', formData);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Should complete within reasonable time (5 seconds for 100 validations)
    expect(totalTime).toBeLessThan(5000);
  });

  it('should clean up expired data efficiently', () => {
    // Generate test data
    for (let i = 0; i < 50; i++) {
      formSecurityMiddleware.generateCSRFToken('test');
    }
    
    const initialStats = formSecurityMiddleware.getSecurityStats();
    
    // Mock time passing and trigger cleanup
    const originalNow = Date.now;
    Date.now = vi.fn(() => originalNow() + 60 * 60 * 1000); // 1 hour later
    
    // Trigger cleanup by calling any method that uses Date.now
    formSecurityMiddleware.generateCSRFToken('test');
    
    const finalStats = formSecurityMiddleware.getSecurityStats();
    
    // Should have cleaned up expired data
    expect(finalStats.totalEvents).toBeLessThanOrEqual(initialStats.totalEvents);
    
    Date.now = originalNow;
  });
});

// Edge Cases and Error Handling
describe('Edge Cases and Error Handling', () => {
  it('should handle undefined and null inputs', async () => {
    const formData = { email: null, password: undefined, name: '' };
    
    const result = await formSecurityMiddleware.validateFormSecurity('login', formData);
    
    // Should handle gracefully without crashing
    expect(typeof result.isAllowed).toBe('boolean');
  });

  it('should handle very long input strings', async () => {
    const veryLongString = 'a'.repeat(100000);
    const formData = { email: 'test@example.com', comment: veryLongString };
    
    const result = await formSecurityMiddleware.validateFormSecurity('review', formData);
    
    // Should reject due to size limit
    expect(result.isAllowed).toBe(false);
  });

  it('should handle special characters correctly', async () => {
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
    const formData = { email: 'test@example.com', name: specialChars };
    
    const result = await formSecurityMiddleware.validateFormSecurity('login', formData);
    
    // Should handle without crashing
    expect(typeof result.isAllowed).toBe('boolean');
  });

  it('should handle network-like failures', async () => {
    // Mock network failure during validation
    const originalFetch = global.fetch;
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
    
    const mockConfig = {
      ...createMockFormConfig(),
      submitEndpoint: 'https://api.example.com/submit'
    };
    
    const { result } = renderHook(() => useSecureForm(mockConfig), {
      wrapper: TestWrapper
    });

    // Fill form with valid data
    act(() => {
      result.current.handleFieldChange('email', 'test@example.com');
      result.current.handleFieldChange('password', 'StrongPassword123!');
      result.current.handleFieldChange('name', 'John Doe');
    });

    // Submit should fail gracefully
    await act(async () => {
      const success = await result.current.handleSubmit();
      expect(success).toBe(false);
    });
    
    // Restore original fetch
    global.fetch = originalFetch;
  });
});

export default {
  FormSecurityMiddleware,
  useSecureForm,
  SecureInput,
  ValidationRulesEngine
};