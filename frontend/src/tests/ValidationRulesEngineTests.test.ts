// Integration Tests for Validation Rules Engine
// Tests complex validation scenarios, async validation, and business rules

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ValidationRulesEngine } from '../services/ValidationRulesEngine';

describe('ValidationRulesEngine Integration Tests', () => {
  let engine: ValidationRulesEngine;

  beforeEach(() => {
    engine = new ValidationRulesEngine();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Movie Booking Business Rules', () => {
    it('should validate age restrictions for movies', async () => {
      const context = { movie: { ageRating: 'R', title: 'Horror Movie' }, user: { age: 16 } };
      
      const result = await engine.validateField('movieBooking', 'confirm', true, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('You must be 17 or older to book this movie');
    });

    it('should allow booking for appropriate age', async () => {
      const context = { movie: { ageRating: 'PG-13', title: 'Action Movie' }, user: { age: 16 } };
      
      const result = await engine.validateField('movieBooking', 'confirm', true, context);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate seat availability', async () => {
      // Mock seat availability check
      const mockCheckSeat = vi.fn().mockResolvedValue(false); // Seat not available
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ available: false })
      });

      const context = { showtimeId: 'show123' };
      
      const result = await engine.validateField('seatSelection', 'A1', true, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Selected seat is no longer available');
    });

    it('should validate payment amounts', async () => {
      const context = { 
        seats: [{ type: 'gold', price: 120000 }, { type: 'platinum', price: 150000 }],
        expectedTotal: 270000 
      };
      
      const result = await engine.validateField('payment', 250000, true, context); // Wrong amount
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Payment amount does not match expected total');
    });
  });

  describe('User Registration Business Rules', () => {
    it('should validate email uniqueness', async () => {
      // Mock email already exists
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ exists: true })
      });

      const result = await engine.validateField('emailUniqueness', 'existing@example.com', true);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email address is already registered');
    });

    it('should validate Vietnamese phone numbers', async () => {
      const validPhones = [
        '+84901234567',
        '84901234567', 
        '0901234567',
        '0397654321'
      ];

      const invalidPhones = [
        '1234567890',
        '+1234567890',
        '84123456', // Too short
        '0201234567' // Invalid prefix
      ];

      for (const phone of validPhones) {
        const result = await engine.validateField('vietnamesePhone', phone, true);
        expect(result.isValid).toBe(true);
      }

      for (const phone of invalidPhones) {
        const result = await engine.validateField('vietnamesePhone', phone, true);
        expect(result.isValid).toBe(false);
      }
    });

    it('should validate password complexity', async () => {
      const weakPasswords = [
        'password',
        '12345678',
        'PASSWORD',
        'Pass123', // No special char
        'pass!@#' // Too short
      ];

      const strongPasswords = [
        'MyStrong123!',
        'ComplexP@ss1',
        'V3ryStr0ng#Pass'
      ];

      for (const password of weakPasswords) {
        const result = await engine.validateField('strongPassword', password, true);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('password must'))).toBe(true);
      }

      for (const password of strongPasswords) {
        const result = await engine.validateField('strongPassword', password, true);
        expect(result.isValid).toBe(true);
      }
    });
  });

  describe('Payment Validation Rules', () => {
    it('should validate credit card numbers', async () => {
      const validCards = {
        'visa': ['4532015112830366', '4485040371536584'],
        'mastercard': ['5555555555554444', '5105105105105100'],
        'amex': ['378282246310005', '371449635398431']
      };

      const invalidCards = [
        '1234567890123456', // Invalid format
        '4532015112830367', // Invalid checksum
        '123', // Too short
      ];

      for (const [type, cards] of Object.entries(validCards)) {
        for (const card of cards) {
          const result = await engine.validateField('creditCardNumber', card, true);
          expect(result.isValid).toBe(true);
        }
      }

      for (const card of invalidCards) {
        const result = await engine.validateField('creditCardNumber', card, true);
        expect(result.isValid).toBe(false);
      }
    });

    it('should validate credit card expiry dates', async () => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      // Valid future dates
      const validDates = [
        `${String(currentMonth).padStart(2, '0')}/${String(currentYear + 1).slice(-2)}`,
        `12/${String(currentYear + 2).slice(-2)}`
      ];

      // Invalid dates
      const invalidDates = [
        `${String(currentMonth - 1).padStart(2, '0')}/${String(currentYear).slice(-2)}`, // Past month
        `13/25`, // Invalid month
        `00/25`, // Invalid month
        'invalid' // Invalid format
      ];

      for (const date of validDates) {
        const result = await engine.validateField('creditCardExpiry', date, true);
        expect(result.isValid).toBe(true);
      }

      for (const date of invalidDates) {
        const result = await engine.validateField('creditCardExpiry', date, true);
        expect(result.isValid).toBe(false);
      }
    });
  });

  describe('Form-specific Validation Rules', () => {
    it('should validate login form completely', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'weakpass' // Weak password
      };

      const result = await engine.validateForm(loginData, 'login');
      
      expect(result.isValid).toBe(false);
      expect(result.summary.errorCount).toBeGreaterThan(0);
      expect(result.fieldResults.password.errors.length).toBeGreaterThan(0);
    });

    it('should validate booking form with business context', async () => {
      const bookingData = {
        showtimeId: 'show123',
        seats: ['A1', 'A2'],
        movieRating: 'R',
        userAge: 16
      };

      const context = {
        movie: { ageRating: 'R', title: 'Horror Movie' },
        user: { age: 16 },
        showtimeId: 'show123'
      };

      const result = await engine.validateForm(bookingData, 'booking', context);
      
      expect(result.isValid).toBe(false);
      expect(result.summary.errorCount).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('age'))).toBe(true);
    });

    it('should validate payment form with amount verification', async () => {
      const paymentData = {
        cardNumber: '4532015112830366',
        expiry: '12/25',
        cvv: '123',
        amount: 270000
      };

      const context = {
        expectedAmount: 250000, // Different amount
        seats: [{ type: 'gold', price: 120000 }, { type: 'platinum', price: 150000 }]
      };

      const result = await engine.validateForm(paymentData, 'payment', context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('amount'))).toBe(true);
    });
  });

  describe('Conditional Validation Rules', () => {
    it('should apply conditional validations based on context', async () => {
      // VIP booking requires special validation
      const vipContext = { 
        isVipBooking: true,
        user: { membershipLevel: 'standard' }
      };

      const result = await engine.validateField('vipBooking', true, true, vipContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('VIP booking requires Gold or Platinum membership');
    });

    it('should validate group bookings differently', async () => {
      const groupContext = {
        isGroupBooking: true,
        seatCount: 15 // More than 10 seats
      };

      const result = await engine.validateField('groupBooking', true, true, groupContext);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Group booking discounts applied automatically');
    });

    it('should validate student discounts', async () => {
      const studentContext = {
        discountType: 'student',
        user: { hasStudentId: false }
      };

      const result = await engine.validateField('studentDiscount', 0.2, true, studentContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid student ID required for student discount');
    });
  });

  describe('Performance and Caching', () => {
    it('should cache validation results for performance', async () => {
      const startTime = Date.now();
      
      // First validation
      await engine.validateField('emailUniqueness', 'test@example.com', true);
      
      const firstValidationTime = Date.now() - startTime;
      
      const secondStart = Date.now();
      
      // Second validation (should be cached)
      await engine.validateField('emailUniqueness', 'test@example.com', true);
      
      const secondValidationTime = Date.now() - secondStart;
      
      // Second validation should be faster due to caching
      expect(secondValidationTime).toBeLessThan(firstValidationTime);
    });

    it('should handle concurrent validations efficiently', async () => {
      const promises = [];
      
      // Create 20 concurrent validations
      for (let i = 0; i < 20; i++) {
        promises.push(
          engine.validateField('strongPassword', `TestPassword${i}!`, true)
        );
      }
      
      const results = await Promise.all(promises);
      
      // All should complete successfully
      expect(results.length).toBe(20);
      expect(results.every(r => typeof r.isValid === 'boolean')).toBe(true);
    });

    it('should provide performance metrics', async () => {
      // Perform several validations
      for (let i = 0; i < 10; i++) {
        await engine.validateField('strongPassword', `TestPassword${i}!`, true);
      }
      
      const metrics = engine.getPerformanceMetrics();
      
      expect(metrics.totalValidations).toBe(10);
      expect(metrics.averageValidationTime).toBeGreaterThan(0);
      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(metrics.rulesExecuted).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network failures gracefully', async () => {
      // Mock network failure
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      const result = await engine.validateField('emailUniqueness', 'test@example.com', true);
      
      // Should fail gracefully
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unable to verify email uniqueness. Please try again.');
    });

    it('should handle invalid validation rule configurations', async () => {
      // Try to validate with non-existent rule
      const result = await engine.validateField('nonExistentRule', 'value', true);
      
      expect(result.isValid).toBe(true); // Should pass if rule doesn't exist
      expect(result.warnings).toContain('Validation rule "nonExistentRule" not found');
    });

    it('should recover from rule execution errors', async () => {
      // Add a rule that throws an error
      engine.addCustomRule({
        id: 'errorRule',
        name: 'Error Rule',
        type: 'sync',
        validator: () => { throw new Error('Rule error'); },
        message: 'Rule error occurred',
        priority: 1
      });

      const result = await engine.validateField('errorRule', 'value', true);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Validation error occurred');
    });
  });

  describe('Custom Business Rules', () => {
    it('should support custom movie-specific rules', async () => {
      // Add custom rule for premiere bookings
      engine.addCustomRule({
        id: 'premiereBooking',
        name: 'Premiere Booking Rule',
        type: 'conditional',
        validator: (value, context) => {
          if (context?.movie?.isPremiere && !context?.user?.isVip) {
            return false;
          }
          return true;
        },
        message: 'Premiere bookings are only available to VIP members',
        priority: 1,
        conditions: [
          {
            field: 'movie.isPremiere',
            operator: 'equals',
            value: true
          }
        ]
      });

      const context = {
        movie: { isPremiere: true, title: 'New Premiere' },
        user: { isVip: false }
      };

      const result = await engine.validateField('premiereBooking', true, true, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Premiere bookings are only available to VIP members');
    });

    it('should support time-based validation rules', async () => {
      // Add custom rule for booking time restrictions
      engine.addCustomRule({
        id: 'bookingTimeRestriction',
        name: 'Booking Time Restriction',
        type: 'sync',
        validator: (value, context) => {
          const now = new Date();
          const showtime = new Date(context?.showtime?.startTime);
          const timeDiff = showtime.getTime() - now.getTime();
          const hoursUntilShow = timeDiff / (1000 * 60 * 60);
          
          return hoursUntilShow >= 1; // Must book at least 1 hour in advance
        },
        message: 'Bookings must be made at least 1 hour before showtime',
        priority: 1
      });

      const futureShowtime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
      const context = {
        showtime: { startTime: futureShowtime.toISOString() }
      };

      const result = await engine.validateField('bookingTimeRestriction', true, true, context);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Bookings must be made at least 1 hour before showtime');
    });
  });

  describe('Validation Suggestions and Intelligence', () => {
    it('should provide intelligent suggestions for common mistakes', async () => {
      const result = await engine.validateField('email', 'user@gmail.co', true);
      
      expect(result.isValid).toBe(false);
      expect(result.suggestions).toContain('Did you mean: user@gmail.com?');
    });

    it('should suggest corrections for phone numbers', async () => {
      const result = await engine.validateField('vietnamesePhone', '901234567', true);
      
      expect(result.isValid).toBe(false);
      expect(result.suggestions).toContain('Try adding country code: +84901234567');
    });

    it('should provide context-aware suggestions', async () => {
      const context = { 
        movie: { ageRating: 'R' },
        user: { age: 16 }
      };
      
      const result = await engine.validateField('movieBooking', 'confirm', true, context);
      
      expect(result.isValid).toBe(false);
      expect(result.suggestions).toContain('Consider booking a PG-13 or lower rated movie');
    });
  });
});

export default {
  ValidationRulesEngine
};