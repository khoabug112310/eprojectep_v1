# CineBook Testing - Checklist Tính Năng Từng Page

## Tổng Quan Testing Strategy

Testing checklist này bao gồm tất cả các test cases cho từng page và tính năng của CineBook, đảm bảo chất lượng và độ tin cậy của hệ thống trước khi triển khai.

## Phase 1: Authentication Testing

### 1.1 Login Page (`/login`)

#### Functional Testing
- [ ] **Valid Login Scenarios**
  - [ ] Login với email và password đúng
  - [ ] Login với phone number và password đúng
  - [ ] "Remember me" checkbox hoạt động correctly
  - [ ] Redirect to intended page after login
  - [ ] Login state persistent across browser sessions

- [ ] **Invalid Login Scenarios**
  - [ ] Login với email không tồn tại
  - [ ] Login với password sai
  - [ ] Login với email format sai
  - [ ] Empty email field validation
  - [ ] Empty password field validation
  - [ ] Account disabled/inactive handling

- [ ] **UI/UX Testing**
  - [ ] Error messages hiển thị chính xác
  - [ ] Loading state during login request
  - [ ] Password show/hide toggle functionality
  - [ ] Forgot password link navigation
  - [ ] Register link navigation
  - [ ] Social login buttons (UI only)

#### Security Testing
- [ ] Password không hiển thị trong plain text
- [ ] No sensitive data trong network requests
- [ ] Protection against brute force attacks
- [ ] XSS protection trong form inputs
- [ ] CSRF token validation

#### Performance Testing
- [ ] Login response time < 2 seconds
- [ ] Form submission không bị double-click
- [ ] Proper error handling for network failures

#### Mobile Testing
- [ ] Touch-friendly form inputs
- [ ] Virtual keyboard behavior
- [ ] Portrait/landscape orientation
- [ ] Small screen layout optimization

### 1.2 Register Page (`/register`)

#### Functional Testing
- [ ] **Valid Registration Scenarios**
  - [ ] Successful registration với all required fields
  - [ ] Email verification process (if implemented)
  - [ ] Auto-login after successful registration
  - [ ] Welcome email sent (if implemented)

- [ ] **Form Validation Testing**
  - [ ] Name field validation (required, length)
  - [ ] Email format validation
  - [ ] Email uniqueness check
  - [ ] Phone number format validation (Vietnamese)
  - [ ] Phone number uniqueness check
  - [ ] Password strength validation
  - [ ] Password confirmation matching
  - [ ] Date of birth validation
  - [ ] Terms & conditions checkbox required

- [ ] **Error Handling**
  - [ ] Duplicate email error message
  - [ ] Duplicate phone error message
  - [ ] Network error handling
  - [ ] Server error handling
  - [ ] Field-specific error messages

#### UI/UX Testing
- [ ] Progressive form validation
- [ ] Password strength indicator
- [ ] Clear error message display
- [ ] Success confirmation message
- [ ] Loading state during registration
- [ ] Terms & conditions modal/link

### 1.3 Profile Management (`/profile`)

#### Functional Testing
- [ ] **View Profile**
  - [ ] Display current user information
  - [ ] Profile picture display (if implemented)
  - [ ] Booking history access

- [ ] **Update Profile**
  - [ ] Edit name functionality
  - [ ] Edit phone number functionality
  - [ ] Edit preferences (city, language)
  - [ ] Profile picture upload (if implemented)
  - [ ] Changes saved successfully
  - [ ] Real-time UI updates

- [ ] **Change Password**
  - [ ] Current password validation
  - [ ] New password strength validation
  - [ ] Password confirmation matching
  - [ ] Success notification
  - [ ] Auto-logout after password change (optional)

## Phase 2: Movie Browsing Testing

### 2.1 Homepage (`/`)

#### Functional Testing
- [ ] **Hero Section**
  - [ ] Featured movie display
  - [ ] Movie information accuracy
  - [ ] Trailer play button functionality
  - [ ] "Book Now" button navigation
  - [ ] Auto-rotation of featured movies

- [ ] **Now Showing Section**
  - [ ] Display current movies correctly
  - [ ] Movie card information accuracy
  - [ ] "Book Ticket" button functionality
  - [ ] Grid layout responsive behavior
  - [ ] "View All" navigation

- [ ] **Coming Soon Section**
  - [ ] Display upcoming movies
  - [ ] Release date accuracy
  - [ ] Horizontal scroll functionality
  - [ ] Navigation arrows
  - [ ] "Notify Me" functionality (if implemented)

- [ ] **Quick Booking Form**
  - [ ] City selection dropdown
  - [ ] Movie search/selection
  - [ ] Date picker functionality
  - [ ] Theater selection
  - [ ] Search button navigation

#### Performance Testing
- [ ] Page load time < 3 seconds
- [ ] Image loading optimization
- [ ] Smooth scrolling animations
- [ ] No layout shift during loading

#### SEO Testing
- [ ] Proper meta tags
- [ ] Structured data markup
- [ ] Image alt tags
- [ ] Semantic HTML structure

### 2.2 Movie Listing Page (`/movies`)

#### Functional Testing
- [ ] **Movie Display**
  - [ ] All movies displayed correctly
  - [ ] Movie information accuracy
  - [ ] Poster image loading
  - [ ] Ratings display
  - [ ] Genre tags display

- [ ] **Search Functionality**
  - [ ] Search by movie title
  - [ ] Search by actor name
  - [ ] Search by director name
  - [ ] Search debouncing functionality
  - [ ] Search results accuracy
  - [ ] Empty search results handling

- [ ] **Filter Functionality**
  - [ ] Genre filter works correctly
  - [ ] Language filter functionality
  - [ ] Rating filter accuracy
  - [ ] City/location filter
  - [ ] Date range filter
  - [ ] Multiple filters combination
  - [ ] Clear all filters functionality

- [ ] **Sort Functionality**
  - [ ] Sort by title (A-Z, Z-A)
  - [ ] Sort by release date (newest, oldest)
  - [ ] Sort by rating (highest, lowest)
  - [ ] Sort by popularity (if implemented)

- [ ] **Pagination/Loading**
  - [ ] Pagination controls work
  - [ ] Infinite scroll functionality (if implemented)
  - [ ] Load more button functionality
  - [ ] Loading states display correctly

#### UI/UX Testing
- [ ] Filter panel responsive behavior
- [ ] Mobile filter overlay
- [ ] Grid/List view toggle (if implemented)
- [ ] Movie card hover effects
- [ ] Loading skeleton screens
- [ ] Empty state display

### 2.3 Movie Detail Page (`/movies/:id`)

#### Functional Testing
- [ ] **Movie Information Display**
  - [ ] Movie title, poster, trailer
  - [ ] Synopsis, cast, director information
  - [ ] Genre, duration, rating display
  - [ ] Release date accuracy
  - [ ] Age rating display

- [ ] **Trailer Functionality**
  - [ ] Trailer modal opens correctly
  - [ ] Video player controls work
  - [ ] Modal close functionality
  - [ ] Responsive video player

- [ ] **Showtimes Display**
  - [ ] Available showtimes accuracy
  - [ ] Theater grouping correct
  - [ ] Date selection functionality
  - [ ] Price information display
  - [ ] "Book Now" button navigation

- [ ] **Reviews Section**
  - [ ] Display existing reviews
  - [ ] Average rating calculation
  - [ ] Review pagination
  - [ ] Add review form (authenticated users)
  - [ ] Review submission functionality
  - [ ] Review moderation (pending status)

#### Data Validation Testing
- [ ] Movie ID validation
- [ ] 404 handling for non-existent movies
- [ ] Proper error messages
- [ ] Related movies suggestions (if implemented)

## Phase 3: Booking System Testing

### 3.1 Showtime Selection (`/booking/showtimes/:movieId`)

#### Functional Testing
- [ ] **Showtime Display**
  - [ ] Correct movie information
  - [ ] Available showtimes accuracy
  - [ ] Theater information display
  - [ ] Date selection functionality
  - [ ] Price information correctness

- [ ] **Selection Process**
  - [ ] Showtime selection functionality
  - [ ] Date picker behavior
  - [ ] Time slot availability
  - [ ] Continue to seat selection
  - [ ] Back navigation functionality

#### Validation Testing
- [ ] Movie ID validation
- [ ] Date validation (no past dates)
- [ ] Showtime availability validation
- [ ] Sold out showtimes handling

### 3.2 Seat Selection (`/booking/seats/:showtimeId`)

#### Functional Testing
- [ ] **Seat Map Display**
  - [ ] Correct theater layout
  - [ ] Seat availability accuracy
  - [ ] Seat category colors (Gold, Platinum, Box)
  - [ ] Screen position indication
  - [ ] Legend/guide display

- [ ] **Seat Selection Process**
  - [ ] Single seat selection
  - [ ] Multiple seat selection
  - [ ] Maximum seat limit (if implemented)
  - [ ] Adjacent seat recommendation
  - [ ] Seat deselection functionality

- [ ] **Price Calculation**
  - [ ] Real-time price updates
  - [ ] Correct pricing per seat type
  - [ ] Total calculation accuracy
  - [ ] Tax calculation (if applicable)

- [ ] **Booking Information**
  - [ ] Selected seats summary
  - [ ] Movie và showtime information
  - [ ] Continue to checkout functionality
  - [ ] Back navigation

#### UI/UX Testing
- [ ] Seat map responsive design
- [ ] Touch-friendly seat selection (mobile)
- [ ] Visual feedback for selection
- [ ] Occupied seat indication
- [ ] Loading states for seat data

#### Real-time Testing
- [ ] Seat availability updates
- [ ] Concurrent user conflict handling
- [ ] Seat locking mechanism (if implemented)
- [ ] Session timeout handling

### 3.3 Checkout Page (`/booking/checkout`)

#### Functional Testing
- [ ] **Booking Summary**
  - [ ] Correct booking information display
  - [ ] Selected seats accuracy
  - [ ] Total price calculation
  - [ ] Movie và theater information

- [ ] **User Information**
  - [ ] Pre-filled user data (logged in users)
  - [ ] Contact information form
  - [ ] Information validation
  - [ ] Guest booking (if implemented)

- [ ] **Payment Process (Dummy)**
  - [ ] Payment method selection
  - [ ] Credit card form validation
  - [ ] Payment simulation
  - [ ] Success/failure scenarios
  - [ ] Payment processing loading

- [ ] **Terms & Conditions**
  - [ ] Terms display/modal
  - [ ] Acceptance checkbox required
  - [ ] Legal information accuracy

#### Security Testing
- [ ] Input validation on all fields
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Sensitive data handling

#### Error Handling Testing
- [ ] Network error scenarios
- [ ] Payment failure handling
- [ ] Seat no longer available
- [ ] Session timeout scenarios

### 3.4 Confirmation Page (`/booking/confirmation`)

#### Functional Testing
- [ ] **Booking Confirmation**
  - [ ] Success message display
  - [ ] Booking ID generation
  - [ ] E-ticket display
  - [ ] Booking details accuracy

- [ ] **E-ticket Features**
  - [ ] QR code generation (if implemented)
  - [ ] Download functionality
  - [ ] Print functionality
  - [ ] Email confirmation (if implemented)

- [ ] **Post-booking Actions**
  - [ ] "Book Another Movie" functionality
  - [ ] Navigate to booking history
  - [ ] Share functionality (if implemented)

### 3.5 Booking History (`/profile/bookings`)

#### Functional Testing
- [ ] **Booking List Display**
  - [ ] All user bookings displayed
  - [ ] Correct booking information
  - [ ] Chronological ordering
  - [ ] Booking status indication

- [ ] **Filtering Options**
  - [ ] Upcoming bookings filter
  - [ ] Past bookings filter
  - [ ] Search functionality
  - [ ] Date range filtering

- [ ] **Booking Actions**
  - [ ] View e-ticket functionality
  - [ ] Cancel booking (if applicable)
  - [ ] Booking details modal
  - [ ] Download ticket options

## Phase 4: Admin Dashboard Testing

### 4.1 Admin Login & Authentication

#### Functional Testing
- [ ] **Admin Login**
  - [ ] Admin role authentication
  - [ ] Admin dashboard access
  - [ ] Regular user access restriction
  - [ ] Admin session management

- [ ] **Security Testing**
  - [ ] Role-based access control
  - [ ] Unauthorized access prevention
  - [ ] Admin privilege validation

### 4.2 Dashboard Overview (`/admin/dashboard`)

#### Functional Testing
- [ ] **Metrics Display**
  - [ ] Revenue statistics accuracy
  - [ ] Booking count correctness
  - [ ] Popular movies data
  - [ ] Theater performance metrics

- [ ] **Charts & Graphs**
  - [ ] Chart data accuracy
  - [ ] Interactive chart functionality
  - [ ] Date range selection
  - [ ] Export functionality (if implemented)

- [ ] **Recent Activity**
  - [ ] Recent bookings display
  - [ ] Real-time updates
  - [ ] Activity detail accuracy

### 4.3 Movie Management (`/admin/movies`)

#### Functional Testing
- [ ] **Movie List**
  - [ ] All movies displayed correctly
  - [ ] Search functionality
  - [ ] Filter options
  - [ ] Pagination functionality
  - [ ] Bulk actions (if implemented)

- [ ] **Add New Movie**
  - [ ] Form validation
  - [ ] Image upload functionality
  - [ ] Movie creation success
  - [ ] Database update verification

- [ ] **Edit Movie**
  - [ ] Pre-populated form data
  - [ ] Update functionality
  - [ ] Image replacement
  - [ ] Changes saved correctly

- [ ] **Delete Movie**
  - [ ] Confirmation dialog
  - [ ] Cascading delete handling
  - [ ] Associated data cleanup
  - [ ] Error handling

#### Data Validation Testing
- [ ] Required fields validation
- [ ] Image file validation
- [ ] Duration validation
- [ ] Release date validation
- [ ] Genre selection validation

### 4.4 Theater Management (`/admin/theaters`)

#### Functional Testing
- [ ] **Theater CRUD Operations**
  - [ ] Create new theater
  - [ ] View theater details
  - [ ] Update theater information
  - [ ] Delete theater (with constraints)

- [ ] **Seat Configuration**
  - [ ] Seat map setup
  - [ ] Seat category configuration
  - [ ] Total seat calculation
  - [ ] Configuration validation

### 4.5 Showtime Management (`/admin/showtimes`)

#### Functional Testing
- [ ] **Showtime Scheduling**
  - [ ] Create new showtimes
  - [ ] Movie selection
  - [ ] Theater selection
  - [ ] Date and time selection
  - [ ] Pricing configuration

- [ ] **Calendar View**
  - [ ] Calendar display accuracy
  - [ ] Showtime visualization
  - [ ] Date navigation
  - [ ] Quick edit functionality

- [ ] **Conflict Detection**
  - [ ] Theater availability checking
  - [ ] Time slot conflicts
  - [ ] Warning notifications
  - [ ] Resolution suggestions

### 4.6 Booking Management (`/admin/bookings`)

#### Functional Testing
- [ ] **Booking List**
  - [ ] All bookings displayed
  - [ ] Booking search functionality
  - [ ] Status filtering
  - [ ] Date range filtering

- [ ] **Booking Details**
  - [ ] Complete booking information
  - [ ] Customer details
  - [ ] Payment status
  - [ ] Ticket status

- [ ] **Booking Actions**
  - [ ] Cancel booking functionality
  - [ ] Refund processing (if implemented)
  - [ ] Status updates
  - [ ] Customer notifications

### 4.7 Reports & Analytics (`/admin/reports`)

#### Functional Testing
- [ ] **Revenue Reports**
  - [ ] Daily/weekly/monthly reports
  - [ ] Accurate calculations
  - [ ] Chart visualizations
  - [ ] Export functionality

- [ ] **Movie Performance**
  - [ ] Popular movies ranking
  - [ ] Box office statistics
  - [ ] Rating analytics
  - [ ] Trend analysis

- [ ] **Theater Performance**
  - [ ] Occupancy rates
  - [ ] Revenue per theater
  - [ ] Seat utilization
  - [ ] Performance comparisons

## Phase 5: Cross-cutting Concerns Testing

### 5.1 Responsive Design Testing

#### Device Testing
- [ ] **Mobile Devices**
  - [ ] iPhone (various sizes)
  - [ ] Android phones
  - [ ] Touch interactions
  - [ ] Gesture support

- [ ] **Tablet Testing**
  - [ ] iPad (various sizes)
  - [ ] Android tablets
  - [ ] Portrait/landscape modes
  - [ ] Touch optimization

- [ ] **Desktop Testing**
  - [ ] Various screen resolutions
  - [ ] Multiple browsers
  - [ ] Keyboard navigation
  - [ ] Mouse interactions

#### Breakpoint Testing
- [ ] Mobile (< 768px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (> 1024px)
- [ ] Large screens (> 1400px)

### 5.2 Browser Compatibility Testing

#### Modern Browsers
- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Edge (latest 2 versions)

#### Mobile Browsers
- [ ] Chrome Mobile
- [ ] Safari Mobile
- [ ] Samsung Internet
- [ ] Firefox Mobile

#### Feature Support
- [ ] JavaScript ES6+ features
- [ ] CSS Grid và Flexbox
- [ ] WebP image support
- [ ] Local Storage support

### 5.3 Performance Testing

#### Load Time Testing
- [ ] **Homepage**
  - [ ] First Contentful Paint < 2s
  - [ ] Largest Contentful Paint < 3s
  - [ ] Time to Interactive < 4s

- [ ] **Movie Listing**
  - [ ] Initial load < 2s
  - [ ] Pagination load < 1s
  - [ ] Image loading optimization

- [ ] **Booking Flow**
  - [ ] Seat map load < 2s
  - [ ] Payment processing < 3s
  - [ ] Confirmation load < 1s

#### Core Web Vitals
- [ ] Largest Contentful Paint (LCP)
- [ ] First Input Delay (FID)
- [ ] Cumulative Layout Shift (CLS)

#### Network Testing
- [ ] 3G connection simulation
- [ ] Offline functionality (if PWA)
- [ ] Network error handling
- [ ] Retry mechanisms

### 5.4 Accessibility Testing

#### Screen Reader Testing
- [ ] NVDA compatibility
- [ ] JAWS compatibility
- [ ] VoiceOver compatibility
- [ ] Navigation announcement

#### Keyboard Navigation
- [ ] Tab order logical
- [ ] All interactive elements accessible
- [ ] Skip links functionality
- [ ] Focus indicators visible

#### Color & Contrast
- [ ] WCAG AA compliance (4.5:1)
- [ ] Color blindness simulation
- [ ] High contrast mode
- [ ] Focus indicator contrast

### 5.5 Security Testing

#### Input Validation
- [ ] XSS prevention testing
- [ ] SQL injection testing (backend)
- [ ] CSRF protection
- [ ] File upload security

#### Authentication Security
- [ ] Session management
- [ ] Password security
- [ ] Token expiration
- [ ] Brute force protection

#### Data Protection
- [ ] Sensitive data handling
- [ ] Data encryption in transit
- [ ] Privacy compliance
- [ ] Secure cookies

## Phase 6: Integration Testing

### 6.1 Frontend-Backend Integration

#### API Integration Testing
- [ ] **Authentication APIs**
  - [ ] Login/logout flow
  - [ ] Token refresh
  - [ ] User registration
  - [ ] Profile updates

- [ ] **Movie APIs**
  - [ ] Movie listing
  - [ ] Movie details
  - [ ] Search functionality
  - [ ] Filter operations

- [ ] **Booking APIs**
  - [ ] Seat availability
  - [ ] Booking creation
  - [ ] Payment processing
  - [ ] Booking confirmation

#### Error Handling
- [ ] Network timeouts
- [ ] Server errors (500)
- [ ] Authentication errors (401)
- [ ] Authorization errors (403)
- [ ] Not found errors (404)

### 6.2 Third-party Integration Testing

#### Payment Gateway (Dummy)
- [ ] Payment form integration
- [ ] Success/failure scenarios
- [ ] Error message handling
- [ ] Redirect flows

#### Email Service (If implemented)
- [ ] Confirmation emails
- [ ] Password reset emails
- [ ] Promotional emails
- [ ] Email template rendering

## Phase 7: User Acceptance Testing

### 7.1 User Journey Testing

#### New User Journey
- [ ] **Discovery to Booking**
  1. [ ] Homepage visit
  2. [ ] Movie browsing
  3. [ ] Account registration
  4. [ ] Movie selection
  5. [ ] Showtime selection
  6. [ ] Seat selection
  7. [ ] Payment process
  8. [ ] Booking confirmation

#### Returning User Journey
- [ ] **Login to Booking**
  1. [ ] Quick login
  2. [ ] Movie search
  3. [ ] Direct booking
  4. [ ] Profile management
  5. [ ] Booking history review

#### Admin User Journey
- [ ] **Admin Dashboard Usage**
  1. [ ] Admin login
  2. [ ] Dashboard overview
  3. [ ] Movie management
  4. [ ] Showtime scheduling
  5. [ ] Report generation

### 7.2 Scenario-based Testing

#### Peak Load Scenarios
- [ ] Multiple concurrent bookings
- [ ] High traffic movie releases
- [ ] System behavior under load
- [ ] Graceful degradation

#### Error Recovery Scenarios
- [ ] Network interruption during booking
- [ ] Payment failure recovery
- [ ] Session timeout handling
- [ ] Data consistency maintenance

### 7.3 Business Logic Validation

#### Booking Business Rules
- [ ] Seat availability constraints
- [ ] Booking time limits
- [ ] Maximum seats per booking
- [ ] Age rating restrictions
- [ ] Pricing calculations

#### Admin Business Rules
- [ ] Movie scheduling constraints
- [ ] Theater capacity limits
- [ ] Revenue calculations
- [ ] User role permissions

## Phase 8: Final QA & Launch Preparation

### 8.1 Pre-launch Checklist

#### Content Verification
- [ ] All text content accurate
- [ ] Images và media optimized
- [ ] Legal pages complete
- [ ] Contact information correct

#### Configuration Verification
- [ ] Environment variables set
- [ ] Database connections working
- [ ] Email configuration tested
- [ ] SSL certificates installed

#### Monitoring Setup
- [ ] Error tracking configured
- [ ] Analytics implementation
- [ ] Performance monitoring
- [ ] Uptime monitoring

### 8.2 Launch Day Testing

#### Smoke Testing
- [ ] Core user flows working
- [ ] Admin functionalities working
- [ ] Payment system operational
- [ ] Email notifications working

#### Post-launch Monitoring
- [ ] Real user behavior tracking
- [ ] Error rate monitoring
- [ ] Performance metrics
- [ ] User feedback collection

## Testing Documentation

### Test Reports
- [ ] Test execution reports
- [ ] Bug reports và resolutions
- [ ] Performance test results
- [ ] Accessibility audit report
- [ ] Security testing report

### Maintenance Documentation
- [ ] Known issues và workarounds
- [ ] Browser-specific behaviors
- [ ] Performance optimization notes
- [ ] Monitoring dashboard setup

## Success Criteria

### Functional Criteria
- [ ] All core user flows complete successfully
- [ ] Admin functionalities working correctly
- [ ] Data accuracy maintained
- [ ] Business rules enforced

### Performance Criteria
- [ ] Page load times meet targets
- [ ] API response times < 500ms
- [ ] Core Web Vitals passing
- [ ] Mobile performance optimized

### Quality Criteria
- [ ] Cross-browser compatibility confirmed
- [ ] Accessibility standards met
- [ ] Security vulnerabilities addressed
- [ ] User experience validated

### Launch Readiness
- [ ] All critical bugs resolved
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] User acceptance criteria satisfied