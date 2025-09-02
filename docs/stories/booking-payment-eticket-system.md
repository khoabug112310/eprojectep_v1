# Story: Complete Payment & E-Ticket System

## Epic
Booking Flow Enhancement

## Priority
🔴 Critical

## Effort Estimate
1 week (40 hours)

## Story Description
As a **customer**, I want to **complete payment processing and receive e-tickets** so that **I can finalize my booking and have proof of my cinema reservation**.

As an **admin**, I want to **track payment statuses and generate detailed e-tickets** so that **I can manage bookings effectively and provide customers with proper documentation**.

## Business Value
- **Revenue Protection**: Secure payment processing ensures transaction integrity
- **Customer Experience**: Professional e-tickets enhance user satisfaction
- **Operational Efficiency**: Automated ticket generation reduces manual work
- **Compliance**: Proper booking documentation meets business requirements

## Acceptance Criteria

### AC1: Payment Processing API
**Given** a user has selected seats and is ready to pay  
**When** they submit payment information through the API  
**Then** the system should:
- Validate payment details (dummy processing)
- Create payment record with proper status tracking
- Update booking status to "confirmed" on successful payment
- Handle payment failures gracefully with rollback
- Return appropriate success/error responses

```json
POST /api/v1/bookings/{id}/payment
{
  "payment_method": "credit_card",
  "card_details": {
    "card_number": "4111111111111111",
    "card_holder": "John Doe",
    "expiry_month": "12",
    "expiry_year": "2025",
    "cvv": "123"
  },
  "amount": 240000
}
```

### AC2: E-Ticket Generation
**Given** a payment has been successfully processed  
**When** the booking is confirmed  
**Then** the system should:
- Generate unique e-ticket with booking details
- Include QR code for verification
- Format ticket with movie, showtime, and seat information
- Store ticket data for future retrieval
- Provide download/email functionality

**E-Ticket Format:**
```
┌─────────────────────────────────┐
│         CINE BOOK TICKET        │
├─────────────────────────────────┤
│ Movie: Avengers: Endgame        │
│ Date: 2025-01-15                │
│ Time: 19:00                     │
│ Theater: Galaxy Nguyen Trai     │
│ Seats: A1, A2                  │
│ Price: 240,000 VND              │
│                                 │
│ Booking Code: CB20250115001     │
│ [QR CODE]                       │
└─────────────────────────────────┘
```

### AC3: Booking Status Management
**Given** different payment scenarios  
**When** payment processing occurs  
**Then** the system should:
- Update booking status to "pending_payment" during processing
- Set status to "confirmed" on successful payment
- Set status to "failed" on payment failure
- Set status to "cancelled" if payment expires
- Allow admin to manually update status if needed

### AC4: Email Confirmation System
**Given** a booking has been confirmed  
**When** payment is successful  
**Then** the system should:
- Send confirmation email with e-ticket attachment
- Include booking summary and important information
- Provide links to view/download ticket online
- Send reminder email 2 hours before showtime
- Handle email delivery failures gracefully

### AC5: Payment Security & Validation
**Given** payment data is being processed  
**When** the API receives payment information  
**Then** the system should:
- Validate credit card format (dummy validation)
- Check amount matches booking total
- Verify booking belongs to authenticated user
- Log all payment attempts for audit
- Implement rate limiting on payment endpoints

### AC6: Admin Payment Management
**Given** an admin needs to manage payments  
**When** accessing the admin payment dashboard  
**Then** the system should:
- Display all payments with status filtering
- Allow payment status updates
- Show payment failure reasons
- Provide refund processing capability
- Generate payment reports

## Technical Requirements

### Backend API Endpoints
```
POST   /api/v1/bookings/{id}/payment          # Process payment
GET    /api/v1/bookings/{id}/ticket           # Get e-ticket
POST   /api/v1/bookings/{id}/resend-email     # Resend confirmation
PUT    /api/v1/admin/payments/{id}/status     # Update payment status
GET    /api/v1/admin/payments                 # List all payments
POST   /api/v1/admin/payments/{id}/refund     # Process refund
```

### Database Schema Updates
```sql
-- Payments table
CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT UNSIGNED NOT NULL,
    payment_method ENUM('credit_card', 'debit_card', 'bank_transfer') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'VND',
    status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    gateway_response JSON,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Add e-ticket fields to bookings table
ALTER TABLE bookings ADD COLUMN ticket_data JSON;
ALTER TABLE bookings ADD COLUMN qr_code VARCHAR(255);
ALTER TABLE bookings ADD COLUMN confirmation_sent_at TIMESTAMP NULL;
```

### Frontend Components
```
src/components/
├── PaymentForm.tsx           # Payment processing form
├── ETicket.tsx              # E-ticket display component
├── PaymentStatus.tsx        # Payment status indicator
└── BookingConfirmation.tsx  # Confirmation page

src/pages/
├── PaymentPage.tsx          # Payment processing page
├── TicketPage.tsx           # E-ticket view page
└── BookingSuccessPage.tsx   # Success confirmation page
```

## Definition of Done
- [ ] Payment API endpoints implemented and tested
- [ ] E-ticket generation with QR code functionality
- [ ] Email confirmation system working
- [ ] Frontend payment flow completed
- [ ] Admin payment management interface
- [ ] Unit tests for payment logic (>90% coverage)
- [ ] Integration tests for payment flow
- [ ] Database migrations executed
- [ ] API documentation updated
- [ ] Security validation implemented
- [ ] Error handling comprehensive
- [ ] Payment audit logging functional

## Dependencies
- ✅ Redis seat locking system (completed in Sprint 1)
- ⚠️ Email service configuration
- ⚠️ QR code generation library
- ⚠️ PDF generation for e-tickets (optional)

## Risks & Mitigations
**Risk**: Payment gateway integration complexity  
**Mitigation**: Use dummy payment processing for MVP, prepare for real gateway

**Risk**: Email delivery failures  
**Mitigation**: Implement retry mechanism and alternative notification methods

**Risk**: QR code generation performance  
**Mitigation**: Generate QR codes asynchronously using queue jobs

## Testing Strategy
### Unit Tests
- Payment validation logic
- E-ticket generation
- Booking status transitions
- QR code generation

### Integration Tests
- Complete payment flow end-to-end
- Email sending functionality
- Admin payment management
- API endpoint validation

### Performance Tests
- Payment processing under load
- E-ticket generation speed
- Email sending performance

## Success Metrics
- Payment success rate > 95%
- E-ticket generation time < 2 seconds
- Email delivery success rate > 90%
- Zero payment data security issues
- Customer satisfaction with booking process

---

**Story Created**: January 15, 2025  
**Assigned To**: Lead Full-Stack Developer  
**Sprint**: Sprint 2 - Payment & E-Ticket System  
**Est. Completion**: January 22, 2025