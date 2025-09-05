// Test Setup Configuration for CineBook Form Security Tests
// Global test environment setup, mocks, and utilities

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with React Testing Library matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Global Mocks
// Mock Window APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
class IntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
});

Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
});

// Mock ResizeObserver
class ResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserver,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  writable: true,
  value: sessionStorageMock,
});

// Mock console methods for cleaner test output
const originalConsole = { ...console };
beforeEach(() => {
  // Suppress console errors/warns during tests unless specifically needed
  console.error = vi.fn();
  console.warn = vi.fn();
  console.log = vi.fn();
});

afterEach(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

// Mock Crypto API for CSRF token generation
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn().mockReturnValue(new Uint8Array(16)),
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(16)),
      decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(16)),
    },
  },
});

// Mock Navigator
Object.defineProperty(window, 'navigator', {
  writable: true,
  value: {
    ...window.navigator,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    language: 'en-US',
    languages: ['en-US', 'en'],
    onLine: true,
    cookieEnabled: true,
  },
});

// Mock Fetch API
global.fetch = vi.fn();

// Setup default fetch responses
const setupDefaultFetchMocks = () => {
  // Default successful response
  const mockResponse = {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: vi.fn().mockResolvedValue({ success: true }),
    text: vi.fn().mockResolvedValue('{"success": true}'),
    blob: vi.fn().mockResolvedValue(new Blob()),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    headers: new Headers(),
    url: '',
    redirected: false,
    type: 'basic' as ResponseType,
    clone: vi.fn(),
    body: null,
    bodyUsed: false,
  };

  (global.fetch as any).mockResolvedValue(mockResponse);
};

// Setup default mocks before each test
beforeEach(() => {
  setupDefaultFetchMocks();
  
  // Reset all mocks
  vi.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  
  // Set default session ID for tests
  sessionStorageMock.getItem.mockImplementation((key) => {
    if (key === 'sessionId') return 'test-session-id-12345';
    return null;
  });
});

// Custom Test Utilities
export const createMockFormEvent = (values: Record<string, any> = {}) => ({
  preventDefault: vi.fn(),
  target: {
    elements: Object.entries(values).reduce((acc, [name, value]) => {
      acc[name] = { name, value, type: 'text' };
      return acc;
    }, {} as any),
    reset: vi.fn(),
  },
});

export const createMockInputEvent = (name: string, value: any, type: string = 'text') => ({
  target: {
    name,
    value,
    type,
    checked: type === 'checkbox' ? value : undefined,
  },
});

export const mockSecurityValidationSuccess = () => {
  return {
    isAllowed: true,
    securityEvents: [],
    remainingAttempts: 5,
  };
};

export const mockSecurityValidationFailure = (reason: string = 'Security validation failed') => {
  return {
    isAllowed: false,
    reason,
    securityEvents: [
      {
        type: 'SUSPICIOUS_FORM_DATA',
        timestamp: Date.now(),
        severity: 'HIGH',
        blocked: true,
      },
    ],
  };
};

// Performance Testing Utilities
export const measurePerformance = async (fn: () => Promise<any>, iterations: number = 1) => {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }
  
  return {
    times,
    average: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    total: times.reduce((a, b) => a + b, 0),
  };
};

// Memory Usage Monitoring
export const monitorMemoryUsage = () => {
  const memoryInfo = (performance as any).memory;
  if (memoryInfo) {
    return {
      usedJSHeapSize: memoryInfo.usedJSHeapSize,
      totalJSHeapSize: memoryInfo.totalJSHeapSize,
      jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
    };
  }
  return null;
};

// Security Testing Utilities
export const createXSSPayload = (type: 'script' | 'img' | 'svg' | 'iframe' = 'script') => {
  const payloads = {
    script: '<script>alert("xss")</script>',
    img: '<img src="x" onerror="alert(\'xss\')">',
    svg: '<svg onload="alert(\'xss\')">',
    iframe: '<iframe src="javascript:alert(\'xss\')"></iframe>',
  };
  return payloads[type];
};

export const createSQLInjectionPayload = (type: 'union' | 'drop' | 'insert' | 'boolean' = 'union') => {
  const payloads = {
    union: "' UNION SELECT * FROM users --",
    drop: "'; DROP TABLE users; --",
    insert: "'; INSERT INTO users VALUES ('hacker', 'password'); --",
    boolean: "' OR '1'='1",
  };
  return payloads[type];
};

// Rate Limiting Test Utilities
export const simulateRateLimitExhaustion = async (
  validationFn: (data: any) => Promise<any>,
  maxAttempts: number = 5
) => {
  const formData = { email: 'test@example.com', password: 'password123' };
  const results = [];
  
  for (let i = 0; i < maxAttempts + 1; i++) {
    const result = await validationFn(formData);
    results.push(result);
  }
  
  return results;
};

// Form Testing Utilities
export const fillFormFields = async (container: HTMLElement, fields: Record<string, any>) => {
  const { fireEvent } = await import('@testing-library/react');
  
  for (const [fieldName, value] of Object.entries(fields)) {
    const field = container.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;
    if (field) {
      if (field.type === 'checkbox') {
        if (value !== field.checked) {
          fireEvent.click(field);
        }
      } else {
        fireEvent.change(field, { target: { value } });
      }
    }
  }
};

// Async Testing Utilities
export const waitForSecurityValidation = (timeout: number = 5000) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

// Environment Detection
export const isCI = process.env.CI === 'true';
export const isDebugMode = process.env.DEBUG === 'true';

// Test Data Factories
export const createTestUser = (overrides: Partial<any> = {}) => ({
  id: 'test-user-123',
  name: 'Test User',
  email: 'test@example.com',
  phone: '+84901234567',
  age: 25,
  membershipLevel: 'standard',
  isVip: false,
  hasStudentId: false,
  ...overrides,
});

export const createTestMovie = (overrides: Partial<any> = {}) => ({
  id: 'test-movie-123',
  title: 'Test Movie',
  ageRating: 'PG-13',
  duration: 120,
  isPremiere: false,
  ...overrides,
});

export const createTestShowtime = (overrides: Partial<any> = {}) => ({
  id: 'test-showtime-123',
  movieId: 'test-movie-123',
  theaterId: 'test-theater-123',
  startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
  price: { gold: 120000, platinum: 150000, box: 200000 },
  availableSeats: ['A1', 'A2', 'A3', 'B1', 'B2'],
  ...overrides,
});

export const createTestBooking = (overrides: Partial<any> = {}) => ({
  id: 'test-booking-123',
  userId: 'test-user-123',
  showtimeId: 'test-showtime-123',
  seats: [{ seat: 'A1', type: 'gold', price: 120000 }],
  totalAmount: 120000,
  status: 'confirmed',
  ...overrides,
});

// Console Logging for Debug Mode
if (isDebugMode) {
  console.log('🧪 Test environment initialized with debug mode');
  console.log('📊 Performance monitoring enabled');
  console.log('🔒 Security testing utilities loaded');
}

export default {
  createMockFormEvent,
  createMockInputEvent,
  mockSecurityValidationSuccess,
  mockSecurityValidationFailure,
  measurePerformance,
  monitorMemoryUsage,
  createXSSPayload,
  createSQLInjectionPayload,
  simulateRateLimitExhaustion,
  fillFormFields,
  waitForSecurityValidation,
  createTestUser,
  createTestMovie,
  createTestShowtime,
  createTestBooking,
  isCI,
  isDebugMode,
};