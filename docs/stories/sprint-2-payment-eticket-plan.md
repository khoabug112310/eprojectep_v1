# Sprint 2 Planning: Payment & E-Ticket System

## Sprint Overview
**Sprint Goal**: "Complete payment processing and e-ticket generation for seamless booking experience"  
**Duration**: 1 week (January 15-22, 2025)  
**Sprint Type**: Feature Development  

## Team Assignment
### Development Team
- **Lead Full-Stack Developer**: Payment API, e-ticket generation, frontend integration
- **QA Engineer**: Payment security testing, email delivery validation  
- **DevOps Support** (0.25 FTE): Email service setup, monitoring configuration

## Sprint Backlog

### Priority 1: Core Payment API (Monday-Tuesday)
#### Tasks:
1. **Create Payment Model & Migration**
   - Design payments table schema
   - Add e-ticket fields to bookings table
   - Create Eloquent relationships
   - **Effort**: 4 hours

2. **Implement PaymentService**
   - Dummy payment processing logic
   - Payment validation and security
   - Status management workflows
   - **Effort**: 8 hours

3. **Build Payment API Endpoints**
   - POST /bookings/{id}/payment
   - GET /bookings/{id}/ticket
   - Payment status tracking
   - **Effort**: 6 hours

### Priority 2: E-Ticket Generation (Tuesday-Wednesday)
#### Tasks:
4. **Install QR Code Dependencies**
   - Add SimpleSoftwareIO/simple-qrcode package
   - Configure QR code generation
   - **Effort**: 2 hours

5. **Build ETicketService**
   - Ticket data formatting
   - QR code generation
   - Ticket template system
   - **Effort**: 8 hours

6. **Integrate E-Ticket with Booking**
   - Auto-generate tickets on payment success
   - Store ticket data in database
   - Provide ticket retrieval API
   - **Effort**: 4 hours

### Priority 3: Email System (Wednesday-Thursday)
#### Tasks:
7. **Configure Email Service**
   - Setup Laravel Mail configuration
   - Create email templates (Blade)
   - **Effort**: 4 hours

8. **Build NotificationService**
   - Confirmation email logic
   - Reminder email scheduling
   - Email delivery tracking
   - **Effort**: 6 hours

9. **Create Email Templates**
   - Booking confirmation template
   - E-ticket attachment format
   - Reminder email template
   - **Effort**: 4 hours

### Priority 4: Frontend Integration (Thursday-Friday)
#### Tasks:
10. **Build Payment Components**
    - PaymentForm.tsx with validation
    - PaymentStatus.tsx for processing
    - Payment security implementation
    - **Effort**: 8 hours

11. **Create E-Ticket Display**
    - ETicket.tsx component
    - TicketPage.tsx for viewing
    - Download/print functionality
    - **Effort**: 6 hours

12. **Booking Flow Integration**
    - Connect payment to seat booking
    - Success/failure page handling
    - Real-time status updates
    - **Effort**: 6 hours

### Priority 5: Admin & Testing (Friday)
#### Tasks:
13. **Admin Payment Management**
    - Payment dashboard interface
    - Status update functionality
    - Refund processing UI
    - **Effort**: 6 hours

14. **Comprehensive Testing**
    - Unit tests for PaymentService
    - Integration tests for payment flow
    - Email delivery testing
    - **Effort**: 8 hours

## Technical Implementation Plan

### Database Schema
```sql
-- New Payments Table
CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT UNSIGNED NOT NULL,
    payment_method ENUM('credit_card', 'debit_card', 'bank_transfer'),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'VND',
    status ENUM('pending', 'processing', 'completed', 'failed', 'refunded'),
    gateway_response JSON,
    transaction_id VARCHAR(100),
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_booking_payment (booking_id),
    INDEX idx_status (status),
    INDEX idx_processed_at (processed_at)
);

-- Extend Bookings Table
ALTER TABLE bookings 
ADD COLUMN ticket_data JSON,
ADD COLUMN qr_code VARCHAR(255),
ADD COLUMN confirmation_sent_at TIMESTAMP NULL;
```

### API Endpoints Architecture
```
Payment Processing APIs:
POST   /api/v1/bookings/{id}/payment          # Process payment
GET    /api/v1/bookings/{id}/payment/status   # Get payment status
POST   /api/v1/bookings/{id}/resend-email     # Resend confirmation

E-Ticket APIs:
GET    /api/v1/bookings/{id}/ticket           # Get e-ticket data
GET    /api/v1/bookings/{id}/ticket/download  # Download ticket PDF
GET    /api/v1/bookings/{id}/ticket/qr        # Get QR code image

Admin Payment APIs:
GET    /api/v1/admin/payments                 # List payments
PUT    /api/v1/admin/payments/{id}/status     # Update status
POST   /api/v1/admin/payments/{id}/refund     # Process refund
GET    /api/v1/admin/reports/payments         # Payment reports
```

### Service Layer Design
```php
// PaymentService responsibilities
class PaymentService {
    public function processPayment(Booking $booking, array $paymentData): Payment
    public function validatePaymentData(array $data): bool
    public function updatePaymentStatus(Payment $payment, string $status): bool
    public function processRefund(Payment $payment): bool
}

// ETicketService responsibilities  
class ETicketService {
    public function generateTicket(Booking $booking): array
    public function createQRCode(string $bookingCode): string
    public function formatTicketData(Booking $booking): array
    public function generatePDF(array $ticketData): string
}

// NotificationService responsibilities
class NotificationService {
    public function sendBookingConfirmation(Booking $booking): bool
    public function scheduleReminder(Booking $booking): void
    public function resendConfirmation(Booking $booking): bool
}
```

## Quality Assurance Plan

### Testing Strategy
#### Unit Tests (Target: >90% coverage)
- PaymentService methods
- ETicketService generation logic
- Email notification functions
- Payment validation rules

#### Integration Tests
- Complete payment flow (booking → payment → confirmation)
- Email delivery and template rendering
- QR code generation and validation
- Admin payment management workflows

#### Security Testing
- Payment data validation
- SQL injection prevention
- XSS protection in payment forms
- Rate limiting on payment endpoints

### Performance Targets
- Payment processing response time: <2 seconds
- E-ticket generation time: <1 second
- Email delivery time: <30 seconds
- QR code generation: <500ms

## Risk Management

### High Risk Items
1. **Email Service Configuration**
   - **Risk**: Email delivery failures
   - **Mitigation**: Setup backup notification methods, test with multiple providers

2. **Payment Data Security**
   - **Risk**: Sensitive payment data exposure
   - **Mitigation**: Implement strict validation, logging, and encryption

3. **QR Code Generation Performance**
   - **Risk**: Slow ticket generation
   - **Mitigation**: Use efficient QR library, implement caching

### Medium Risk Items
1. **Frontend Payment UX**
   - **Risk**: Complex payment flow
   - **Mitigation**: User testing, clear error messages

2. **Database Performance**
   - **Risk**: Slow payment queries
   - **Mitigation**: Proper indexing, query optimization

## Success Criteria

### Functional Criteria
- [ ] All payment scenarios (success/failure) handled correctly
- [ ] E-tickets generated with proper formatting and QR codes
- [ ] Email confirmations sent reliably
- [ ] Admin can manage payments and process refunds
- [ ] Frontend payment flow intuitive and secure

### Technical Criteria
- [ ] API response times meet performance targets
- [ ] Test coverage >90% for payment-related code
- [ ] No security vulnerabilities in payment processing
- [ ] Proper error handling and logging implemented
- [ ] Database schema supports scalability

### Business Criteria
- [ ] Payment success rate >95% in testing
- [ ] Customer satisfaction with booking confirmation
- [ ] Admin efficiency in payment management
- [ ] Proper audit trail for all transactions

## Daily Standup Schedule
- **Time**: 9:00 AM daily
- **Duration**: 15 minutes
- **Focus**: Progress, blockers, next priorities

## Sprint Review & Demo
- **Date**: Friday, January 22, 2025 - 3:00 PM
- **Duration**: 1 hour
- **Attendees**: Development team, Product Owner, QA Lead
- **Demo**: Complete payment flow from seat selection to e-ticket generation

---

**Sprint Planning Completed**: January 15, 2025  
**Next Planning Session**: January 22, 2025  
**Sprint Velocity Target**: 70 story points