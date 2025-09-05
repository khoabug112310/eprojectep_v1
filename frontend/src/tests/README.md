# CineBook Form Security Testing Suite

## Overview

This comprehensive testing suite validates the security, functionality, and performance of CineBook's form validation and security middleware systems. The tests ensure that all form interactions are secure, validated properly, and perform optimally under various conditions.

## Test Structure

### 1. Unit Tests (`FormSecurityTests.test.ts`)

#### FormSecurityMiddleware Tests
- **CSRF Token Management**
  - Token generation and uniqueness
  - Token validation and one-time use
  - Token expiration handling
  
- **Rate Limiting**
  - Request allowance within limits
  - Blocking when limits exceeded
  - Rate limit window reset behavior
  
- **Form Data Validation**
  - XSS attack detection and prevention
  - SQL injection attempt blocking
  - Form size limit validation
  - Allowed field validation
  
- **Session Validation**
  - Session creation and validation
  - Session timeout handling
  - Authentication requirements

#### useSecureForm Hook Tests
- Form initialization with default values
- Field change handling and real-time validation
- Form submission validation and security checks
- Error handling and user feedback
- Form reset functionality

### 2. Integration Tests (`ValidationRulesEngineTests.test.ts`)

#### Business Logic Validation
- **Movie Booking Rules**
  - Age restriction validation for rated movies
  - Seat availability verification
  - Payment amount validation against expected totals
  
- **User Registration Rules**
  - Email uniqueness validation
  - Vietnamese phone number format validation
  - Password complexity requirements
  
- **Payment Processing Rules**
  - Credit card number validation (Luhn algorithm)
  - Expiry date validation
  - CVV format checking

#### Conditional Validation
- VIP booking requirements
- Group booking validations
- Student discount eligibility
- Time-based booking restrictions

### 3. Security Tests

#### XSS Protection Tests
- Script tag injection attempts
- Event handler injection (onerror, onload)
- URL-based JavaScript execution
- Various encoding bypass attempts

#### SQL Injection Protection
- Union-based injection attempts
- Boolean-based blind injection
- Time-based blind injection
- Comment-based injection

#### Rate Limiting Security
- Brute force attack prevention
- Concurrent request handling
- Adaptive rate limiting behavior

### 4. Performance Tests

#### Load Testing
- High-volume validation requests (100+ concurrent)
- Memory usage monitoring during tests
- Response time benchmarking

#### Caching Efficiency
- Validation result caching verification
- Cache hit rate optimization
- Memory cleanup validation

## Test Configuration

### Test Environment Setup
- **Framework**: Vitest with React Testing Library
- **Environment**: jsdom for DOM simulation
- **Coverage**: v8 provider with 80%+ thresholds
- **Mocking**: Comprehensive mocks for browser APIs

### Coverage Thresholds
```javascript
{
  global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  FormSecurityMiddleware: { branches: 90, functions: 90, lines: 90, statements: 90 },
  ValidationRulesEngine: { branches: 85, functions: 85, lines: 85, statements: 85 }
}
```

## Running Tests

### Basic Commands
```bash
# Run all tests
npm run test:run

# Run with coverage
npm run test:coverage

# Run specific test suites
npm run test:security
npm run test:validation
npm run test:performance

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# CI/CD pipeline tests
npm run test:ci
```

### Test Categories

#### Security Tests
```bash
npm run test:security
```
Validates all security mechanisms including XSS prevention, SQL injection blocking, CSRF protection, and rate limiting.

#### Validation Tests
```bash
npm run test:validation
```
Tests form validation logic, business rules, and user input sanitization.

#### Performance Tests
```bash
npm run test:performance
```
Benchmarks validation speed, memory usage, and concurrent request handling.

#### Integration Tests
```bash
npm run test:integration
```
End-to-end testing of form workflows with security middleware integration.

## Security Test Scenarios

### 1. XSS Prevention
- **Script Injection**: `<script>alert("xss")</script>`
- **Event Handlers**: `<img src="x" onerror="alert('xss')">`
- **JavaScript URLs**: `javascript:alert("xss")`
- **SVG Vectors**: `<svg onload="alert('xss')">`

### 2. SQL Injection Prevention
- **Union Attacks**: `' UNION SELECT * FROM users --`
- **Drop Tables**: `'; DROP TABLE users; --`
- **Boolean Logic**: `' OR '1'='1`
- **Comment Injection**: `admin'-- -`

### 3. CSRF Protection
- **Token Validation**: Ensures CSRF tokens are required and validated
- **Token Rotation**: Verifies one-time use tokens
- **Token Expiration**: Tests timeout mechanisms

### 4. Rate Limiting
- **Brute Force**: Simulates repeated login attempts
- **Form Spam**: Tests rapid form submission prevention
- **API Abuse**: Validates request throttling

## Business Rules Testing

### Movie Booking Validation
```javascript
// Age restriction validation
const context = { 
  movie: { ageRating: 'R' }, 
  user: { age: 16 } 
};
// Should block booking for underage users

// Seat availability
const seatContext = { 
  showtimeId: 'show123',
  requestedSeats: ['A1', 'A2'] 
};
// Should verify seat availability in real-time
```

### Payment Validation
```javascript
// Amount verification
const paymentContext = {
  expectedAmount: 270000,
  calculatedAmount: 250000
};
// Should detect payment amount mismatches

// Credit card validation
const cardData = {
  number: '4532015112830366', // Valid Visa test number
  expiry: '12/25',
  cvv: '123'
};
// Should validate card using Luhn algorithm
```

## Performance Benchmarks

### Validation Speed Requirements
- **Single Field Validation**: < 10ms
- **Full Form Validation**: < 50ms
- **Security Middleware**: < 100ms per request
- **Concurrent Requests**: Handle 100+ simultaneous validations

### Memory Usage Limits
- **Baseline Memory**: < 50MB during tests
- **Peak Memory**: < 100MB under load
- **Memory Leaks**: No persistent growth after test cycles

## Test Data Factories

The test suite includes comprehensive factories for creating realistic test data:

```javascript
// User factory
createTestUser({ age: 17, membershipLevel: 'vip' })

// Movie factory
createTestMovie({ ageRating: 'R', isPremiere: true })

// Booking factory
createTestBooking({ seats: ['A1', 'A2'], totalAmount: 240000 })
```

## Continuous Integration

### CI/CD Pipeline Tests
```yaml
test_security:
  - Run comprehensive security test suite
  - Validate all attack vectors are blocked
  - Ensure no security regressions

test_performance:
  - Benchmark validation performance
  - Monitor memory usage
  - Verify response time requirements

test_coverage:
  - Maintain 80%+ code coverage
  - Critical security components require 90%+
  - Generate coverage reports for review
```

### Quality Gates
- All security tests must pass (100%)
- Performance benchmarks within limits
- Code coverage above thresholds
- No critical security vulnerabilities

## Debugging and Troubleshooting

### Debug Mode
```bash
DEBUG=true npm run test:run
```
Enables verbose logging and performance monitoring during tests.

### Common Issues

#### Test Timeouts
- Increase timeout values in vitest.config.ts
- Check for infinite loops in validation logic
- Verify async operations complete properly

#### Memory Issues
- Monitor memory usage with built-in utilities
- Check for proper cleanup in teardown functions
- Verify no global state pollution between tests

#### Security Test Failures
- Review XSS/SQL injection patterns
- Validate sanitization logic
- Check rate limiting configuration

## Future Enhancements

### Planned Additions
1. **End-to-End Security Tests**: Full browser automation testing
2. **Load Testing**: High-volume concurrent user simulation
3. **Penetration Testing**: Automated security scanning
4. **Performance Regression**: Historical performance tracking
5. **Visual Testing**: Screenshot comparison for UI components

### Test Automation
- Automated security vulnerability scanning
- Performance regression detection
- Cross-browser compatibility testing
- Mobile device validation testing

## Contributing to Tests

### Adding New Tests
1. Follow existing test structure and naming conventions
2. Include security considerations for all new validation rules
3. Add performance benchmarks for computationally intensive operations
4. Update documentation with new test scenarios

### Test Review Checklist
- [ ] Security implications considered and tested
- [ ] Performance impact measured and acceptable
- [ ] Edge cases and error conditions covered
- [ ] Documentation updated with new scenarios
- [ ] CI/CD pipeline integration verified

---

This testing suite ensures CineBook's form security and validation systems meet the highest standards for security, performance, and reliability. Regular execution of these tests helps maintain system integrity and prevents security vulnerabilities.