# Story: Implement Redis Seat Locking System

**Epic**: Epic 3 - Booking Flow  
**Priority**: 🔴 Critical  
**Estimated Effort**: 1.5 weeks  
**Risk Level**: High (concurrency and real-time features)  
**Created**: 2025-01-09  
**Status**: Ready for Development  

---

## 🎯 Story Overview

**As a** movie-goer wanting to book tickets  
**I want** seats to be temporarily locked when I select them  
**So that** other users cannot book the same seats while I'm completing my purchase  

## 📋 Problem Statement

Currently, the CineBook booking system lacks a robust seat locking mechanism, which creates several critical issues:

1. **Race Conditions**: Multiple users can select the same seats simultaneously
2. **Booking Conflicts**: Users may complete checkout only to find their seats were taken
3. **Poor UX**: No real-time feedback on seat availability
4. **Data Integrity**: Risk of double-booking the same seats

## 🎯 Acceptance Criteria

### Primary Requirements

✅ **AC1: Seat Selection Locking**
- When a user selects a seat, it is immediately locked for 15 minutes
- Other users see the seat as "temporarily unavailable" 
- The original user can continue to interact with locked seats
- Lock is automatically extended while user remains active

✅ **AC2: Atomic Seat Operations**
- Seat locking operations are atomic (all seats in selection succeed or fail together)
- No partial seat locks that could leave the system in inconsistent state
- Proper rollback mechanism if any part of the locking process fails

✅ **AC3: Lock Expiration Management**
- Seats are automatically released after 15 minutes of inactivity
- Background job processes expired locks every 5 minutes
- Manual lock release when user cancels booking or navigates away
- Immediate lock release when booking is successfully completed

✅ **AC4: Real-time Seat Status Updates**
- Frontend displays real-time seat availability (available/occupied/locked/selected)
- Other users see immediate updates when seats become locked or released
- Visual indicators clearly distinguish between different seat states

✅ **AC5: Concurrent User Handling**
- System gracefully handles multiple users attempting to lock same seats
- Clear error messages when requested seats are unavailable
- Alternative seat suggestions when possible

### Technical Requirements

✅ **AC6: Redis Integration**
- Redis properly configured and connected to Laravel application
- Seat locks stored with appropriate TTL (Time To Live)
- Redis key naming convention: `seat_lock:{showtime_id}:{seat_code}`
- Lock data includes: user_id, locked_at timestamp, showtime_id

✅ **AC7: Performance Standards**
- Seat locking operations complete within 200ms
- System supports minimum 50 concurrent users per showtime
- No memory leaks or connection issues with Redis
- Proper error handling for Redis connectivity issues

✅ **AC8: API Endpoints**
- `POST /api/v1/showtimes/{id}/seats/lock` - Lock selected seats
- `DELETE /api/v1/showtimes/{id}/seats/unlock` - Release seat locks
- `GET /api/v1/showtimes/{id}/seats/status` - Get real-time seat status
- `PUT /api/v1/showtimes/{id}/seats/extend-lock` - Extend lock duration

## 🛠️ Technical Implementation Tasks

### Backend Tasks (Laravel)

#### Task 1: Redis Configuration & Setup
**Effort**: 0.5 days
- [ ] Configure Redis connection in Laravel config/database.php
- [ ] Update .env.example with Redis configuration variables
- [ ] Add Redis to docker-compose.yml (if using Docker)
- [ ] Test Redis connectivity with basic operations
- [ ] Add Redis health check endpoint

#### Task 2: SeatLockingService Implementation
**Effort**: 2 days
- [ ] Create `app/Services/SeatLockingService.php`
- [ ] Implement `lockSeats(array $seats, int $showtimeId, int $userId)` method
- [ ] Implement `unlockSeats(array $seats, int $showtimeId, int $userId)` method  
- [ ] Implement `extendLock(array $seats, int $showtimeId, int $userId)` method
- [ ] Add atomic operations using Redis transactions
- [ ] Handle Redis connection failures gracefully
- [ ] Add comprehensive logging for debugging

```php
// Example service structure
class SeatLockingService 
{
    private const LOCK_TTL = 900; // 15 minutes
    private const LOCK_KEY_PREFIX = 'seat_lock';
    
    public function lockSeats(array $seats, int $showtimeId, int $userId): bool
    {
        // Implementation with Redis transactions
    }
    
    public function getSeatStatus(int $showtimeId): array
    {
        // Return comprehensive seat status
    }
}
```

#### Task 3: Background Job for Lock Cleanup
**Effort**: 1 day
- [ ] Create `app/Jobs/ReleaseSeatLockJob.php`
- [ ] Implement expired lock detection and cleanup
- [ ] Schedule job to run every 5 minutes
- [ ] Add job monitoring and failure handling
- [ ] Test job performance with large datasets

#### Task 4: API Controller Updates
**Effort**: 1.5 days
- [ ] Update `ShowtimeController` with new seat locking endpoints
- [ ] Add proper request validation for seat locking operations
- [ ] Implement error handling for lock conflicts
- [ ] Add rate limiting for seat operations
- [ ] Create comprehensive API responses

#### Task 5: Database Schema Updates
**Effort**: 0.5 days
- [ ] Add `locked_seats` JSON column to showtimes table (if needed)
- [ ] Update showtime seeder to include proper seat configuration
- [ ] Create migration for any necessary schema changes
- [ ] Update existing seat availability logic

### Frontend Tasks (React)

#### Task 6: Real-time Seat Status Component
**Effort**: 2 days
- [ ] Update `SeatMap.tsx` component for real-time status
- [ ] Implement polling mechanism for seat status updates (every 10 seconds)
- [ ] Add visual indicators for all seat states (available, occupied, locked, selected)
- [ ] Handle seat status changes gracefully in UI
- [ ] Add loading states during seat operations

#### Task 7: Seat Selection Logic Enhancement
**Effort**: 1.5 days
- [ ] Implement optimistic seat locking on selection
- [ ] Add confirmation dialogs for seat conflicts
- [ ] Implement automatic lock extension on user activity
- [ ] Add seat release on navigation away
- [ ] Handle network errors and retry logic

#### Task 8: API Integration
**Effort**: 1 day
- [ ] Add seat locking API calls to `api.ts`
- [ ] Implement proper error handling for lock failures
- [ ] Add request timeout handling
- [ ] Create TypeScript interfaces for seat status responses

### Testing Tasks

#### Task 9: Backend Unit Tests
**Effort**: 1.5 days
- [ ] Test SeatLockingService with various scenarios
- [ ] Test concurrent seat locking attempts
- [ ] Test lock expiration and cleanup
- [ ] Test Redis connection failure handling
- [ ] Test API endpoints with PHPUnit

#### Task 10: Frontend Component Tests
**Effort**: 1 day
- [ ] Test SeatMap component seat selection logic
- [ ] Test real-time status updates
- [ ] Test error handling in seat operations
- [ ] Test user interaction scenarios

#### Task 11: Integration Tests
**Effort**: 1 day
- [ ] End-to-end booking flow with seat locking
- [ ] Concurrent user scenario testing
- [ ] Performance testing with multiple users
- [ ] Redis failover testing

## 🔄 Definition of Done

### Functional Criteria
- [ ] All acceptance criteria met and verified
- [ ] All unit tests passing with >80% coverage
- [ ] Integration tests passing
- [ ] Manual testing completed for all user scenarios
- [ ] Performance benchmarks met (200ms response time)

### Technical Criteria
- [ ] Code review completed and approved
- [ ] No security vulnerabilities identified
- [ ] Error handling tested and documented
- [ ] Redis configuration documented
- [ ] API documentation updated

### Quality Criteria
- [ ] No console errors in frontend
- [ ] Proper logging implemented
- [ ] Memory usage within acceptable limits
- [ ] Compatible with existing booking flow

## 🚨 Risk Assessment & Mitigation

### High-Risk Areas

#### Risk 1: Redis Integration Complexity
**Impact**: High | **Probability**: Medium
- **Mitigation**: Start with simple Redis operations and gradually add complexity
- **Fallback**: Implement database-based locking as temporary solution

#### Risk 2: Concurrent User Race Conditions
**Impact**: High | **Probability**: High
- **Mitigation**: Use Redis atomic operations and proper testing
- **Monitoring**: Add detailed logging for debugging race conditions

#### Risk 3: Frontend Real-time Updates Performance
**Impact**: Medium | **Probability**: Medium
- **Mitigation**: Implement efficient polling strategy and consider WebSocket future upgrade
- **Optimization**: Use React.memo and proper state management

### Medium-Risk Areas

#### Risk 4: Database Synchronization
**Impact**: Medium | **Probability**: Low
- **Mitigation**: Ensure Redis and database consistency checks
- **Recovery**: Implement data reconciliation procedures

## 📊 Success Metrics

### Performance Metrics
- Seat locking operations complete within 200ms
- System supports 50+ concurrent users per showtime
- Memory usage increase <10% with Redis integration
- Zero data inconsistency incidents

### User Experience Metrics
- Booking conflict rate reduces to <1%
- User abandonment rate during booking decreases
- Clear visual feedback for all seat states
- Error rate for seat operations <0.5%

## 🔗 Dependencies

### Technical Dependencies
- Redis server installation and configuration
- Laravel Redis package properly configured
- Updated frontend API service layer
- Background job processing setup

### Story Dependencies
- Depends on: Current booking flow implementation
- Blocks: Payment processing improvements
- Enables: Advanced booking features (group bookings, hold reservations)

## 📝 Notes for Development Team

### Implementation Order
1. Start with Redis configuration and basic connectivity
2. Implement backend SeatLockingService with comprehensive tests
3. Add API endpoints and test with Postman
4. Update frontend components incrementally
5. Add background job processing
6. Conduct thorough integration testing

### Special Considerations
- Consider Redis cluster configuration for production scalability
- Plan for Redis failover scenarios
- Ensure proper cleanup of abandoned locks
- Monitor Redis memory usage and implement appropriate eviction policies

### Future Enhancements
- WebSocket implementation for real-time updates
- Advanced booking features (group reservations, VIP hold periods)
- Analytics on booking patterns and seat popularity
- Integration with external payment systems

---

**Story Ready for Development Sprint Planning**

**Recommended Sprint Assignment**: 2-week sprint with full-stack developer pair
**QA Involvement**: High (concurrent testing scenarios required)
**DevOps Involvement**: Medium (Redis infrastructure setup)