# CineBook Frontend - Checklist Phases & Tasks

## Phase 1: Project Setup & Environment (Tuần 1)

### 1.1 Development Environment Setup
- [ ] Cài đặt Node.js (version 18+) và npm/yarn
- [ ] Khởi tạo React 18 project với Create React App hoặc Vite
- [ ] Cấu hình ESLint và Prettier cho code formatting
- [ ] Setup Git repository và .gitignore
- [ ] Cài đặt VS Code extensions (ES7, Prettier, ESLint)

### 1.2 Project Structure Setup
```
src/
├── components/
│   ├── common/
│   ├── layout/
│   └── forms/
├── pages/
│   ├── user/
│   └── admin/
├── hooks/
├── services/
├── store/
├── utils/
└── styles/
```

- [ ] Tạo folder structure theo design đã định
- [ ] Setup routing với React Router v6
- [ ] Cấu hình path aliases (@components, @pages, etc.)
- [ ] Tạo environment files (.env.development, .env.production)

### 1.3 Dependencies Installation
```bash
# Core dependencies
npm install react react-dom react-router-dom
npm install axios
npm install @reduxjs/toolkit react-redux (hoặc context API)

# UI Framework
npm install @mui/material @emotion/react @emotion/styled
# HOẶC
npm install antd

# Form handling
npm install formik yup

# Utilities
npm install date-fns
npm install classnames
npm install react-hot-toast

# Dev dependencies
npm install --save-dev @types/react @types/react-dom
```

- [ ] Cài đặt và cấu hình tất cả dependencies cần thiết
- [ ] Verify tất cả packages hoạt động properly
- [ ] Setup absolute imports và path mapping

### 1.4 Basic Configuration
- [ ] Cấu hình Tailwind CSS hoặc Material-UI theme
- [ ] Setup React Router với basic routes
- [ ] Tạo basic layout components (Header, Footer, Sidebar)
- [ ] Cấu hình API base URL và axios interceptors

## Phase 2: Authentication & User Management (Tuần 2)

### 2.1 Authentication Pages
- [ ] **Login Page (`/login`)**
  - [ ] Tạo LoginForm component với validation
  - [ ] Implement email/password inputs với proper validation
  - [ ] Handle form submission và error states
  - [ ] "Remember me" checkbox functionality
  - [ ] "Forgot password" link
  - [ ] Social login buttons (UI only)
  - [ ] Responsive design cho mobile

- [ ] **Register Page (`/register`)**
  - [ ] Tạo RegisterForm component
  - [ ] Form fields: name, email, phone, password, confirm password
  - [ ] Validation với Formik + Yup
  - [ ] Terms & conditions checkbox
  - [ ] Handle registration success/error
  - [ ] Redirect to login after successful registration

- [ ] **Forgot Password Page (`/forgot-password`)**
  - [ ] Email input form
  - [ ] Send reset link functionality (UI)
  - [ ] Success/error message display
  - [ ] Back to login link

### 2.2 Authentication Logic
- [ ] **Auth Context/Redux Store**
  - [ ] Setup authentication state management
  - [ ] Actions: login, logout, register, updateProfile
  - [ ] Selectors: isAuthenticated, currentUser, loading, error
  - [ ] Persist auth state in localStorage/cookies

- [ ] **API Integration**
  - [ ] Login API integration
  - [ ] Register API integration
  - [ ] Logout functionality
  - [ ] Token refresh mechanism
  - [ ] Axios interceptors cho authentication

- [ ] **Protected Routes**
  - [ ] PrivateRoute component
  - [ ] AdminRoute component
  - [ ] Redirect logic cho unauthenticated users
  - [ ] Loading states during auth verification

### 2.3 User Profile Management
- [ ] **Profile Page (`/profile`)**
  - [ ] Display user information
  - [ ] Edit profile form
  - [ ] Change password form
  - [ ] Update preferences (city, language)
  - [ ] Profile picture upload (bonus)

- [ ] **Profile Update Logic**
  - [ ] Update profile API integration
  - [ ] Form validation
  - [ ] Success/error handling
  - [ ] Real-time UI updates

## Phase 3: Movie Browsing & Search (Tuần 3)

### 3.1 Homepage Development
- [ ] **Hero Section**
  - [ ] Featured movie banner với background image
  - [ ] Movie title, genre, rating display
  - [ ] Trailer play button (modal popup)
  - [ ] "Book Now" CTA button
  - [ ] Auto-rotating featured movies

- [ ] **Quick Booking Form**
  - [ ] City dropdown selection
  - [ ] Movie search/selection
  - [ ] Date picker
  - [ ] Theater selection
  - [ ] Search button redirect to booking

- [ ] **Now Showing Section**
  - [ ] MovieCard component design
  - [ ] Grid layout (responsive)
  - [ ] Movie poster, title, rating, genre
  - [ ] "Book Ticket" button on each card
  - [ ] Hover effects và animations

- [ ] **Coming Soon Section**
  - [ ] Horizontal scrollable movie list
  - [ ] Different styling cho upcoming movies
  - [ ] Release date display
  - [ ] "Notify Me" functionality (bonus)

- [ ] **Promotions Section**
  - [ ] Carousel/slider component
  - [ ] Promotion banners
  - [ ] Auto-play with manual controls
  - [ ] Click-through functionality

### 3.2 Movie Listing Page
- [ ] **Movie List Page (`/movies`)**
  - [ ] Grid/List view toggle
  - [ ] Pagination hoặc infinite scroll
  - [ ] Loading states và skeletons
  - [ ] Empty state when no movies found
  - [ ] Sort options (title, rating, release date)

- [ ] **Search & Filter System**
  - [ ] Search bar với debounced input
  - [ ] Genre filter checkboxes
  - [ ] Language filter
  - [ ] Rating filter (star ratings)
  - [ ] City/Location filter
  - [ ] Date range picker
  - [ ] Clear all filters button

- [ ] **Movie Card Component**
  - [ ] Responsive poster image
  - [ ] Movie title với truncation
  - [ ] Star rating display
  - [ ] Genre tags
  - [ ] Duration display
  - [ ] Hover effects
  - [ ] "Quick Book" button

### 3.3 Movie Detail Page
- [ ] **Movie Detail Page (`/movies/:id`)**
  - [ ] Movie poster và background
  - [ ] Movie title, genre, duration, rating
  - [ ] Synopsis/Description
  - [ ] Cast và crew information
  - [ ] Director information
  - [ ] Trailer integration (YouTube/Vimeo)
  - [ ] Image gallery (bonus)

- [ ] **Showtimes Section**
  - [ ] Group showtimes by theater
  - [ ] Display available times as buttons
  - [ ] Show pricing information
  - [ ] Date selection tabs
  - [ ] "Book Now" integration

- [ ] **Reviews Section**
  - [ ] Display existing reviews
  - [ ] Average rating calculation
  - [ ] Review list với pagination
  - [ ] Add new review form (for logged-in users)
  - [ ] Like/helpful votes (bonus)

## Phase 4: Booking System (Tuần 4-5)

### 4.1 Booking Flow - Step 1: Showtime Selection
- [ ] **Showtime Selection Page (`/booking/showtimes/:movieId`)**
  - [ ] Movie information header
  - [ ] Date picker component
  - [ ] Theater list với showtimes
  - [ ] Price display cho different seat types
  - [ ] Availability indicators
  - [ ] "Select" button cho each showtime

### 4.2 Booking Flow - Step 2: Seat Selection
- [ ] **Seat Selection Page (`/booking/seats/:showtimeId`)**
  - [ ] Interactive seat map
  - [ ] Different colors cho seat types (Gold, Platinum, Box)
  - [ ] Screen position indicator
  - [ ] Seat availability states (available, occupied, selected)
  - [ ] Multiple seat selection
  - [ ] Price calculation panel
  - [ ] Continue to payment button

- [ ] **Seat Map Component**
  - [ ] SVG-based seat layout
  - [ ] Click handlers cho seat selection
  - [ ] Visual feedback cho selected seats
  - [ ] Responsive design cho mobile
  - [ ] Legend/guide for seat types
  - [ ] Maximum seat selection limit

### 4.3 Booking Flow - Step 3: Checkout
- [ ] **Checkout Page (`/booking/checkout`)**
  - [ ] Booking summary display
  - [ ] Selected seats và pricing breakdown
  - [ ] User information pre-fill
  - [ ] Contact information form
  - [ ] Payment method selection (dummy)
  - [ ] Terms và conditions checkbox
  - [ ] "Confirm Booking" button

- [ ] **Payment Integration (Dummy)**
  - [ ] Credit card form fields
  - [ ] Payment method icons
  - [ ] Form validation
  - [ ] Loading states during payment
  - [ ] Success/failure simulation

### 4.4 Booking Confirmation
- [ ] **Confirmation Page (`/booking/confirmation`)**
  - [ ] Success message với animation
  - [ ] E-ticket display
  - [ ] Booking details (movie, theater, seats, time)
  - [ ] QR code generation (bonus)
  - [ ] Download/Print e-ticket buttons
  - [ ] "Book Another Movie" CTA

- [ ] **E-ticket Component**
  - [ ] Professional ticket design
  - [ ] All necessary information display
  - [ ] Booking code/ID
  - [ ] Print-friendly styling
  - [ ] Mobile-optimized layout

### 4.5 Booking Management
- [ ] **My Bookings Page (`/profile/bookings`)**
  - [ ] List of all user bookings
  - [ ] Filter by upcoming/past bookings
  - [ ] Booking status indicators
  - [ ] View e-ticket functionality
  - [ ] Cancel booking option (với conditions)
  - [ ] Search through bookings

## Phase 5: User Experience Features (Tuần 6)

### 5.1 Advanced UI Components
- [ ] **Toast Notifications**
  - [ ] Success notifications
  - [ ] Error message handling
  - [ ] Warning và info messages
  - [ ] Auto-dismiss functionality
  - [ ] Multiple toast stack management

- [ ] **Modal Components**
  - [ ] Trailer modal với video player
  - [ ] Confirmation modals
  - [ ] Image lightbox
  - [ ] Loading modals
  - [ ] Responsive modal behavior

- [ ] **Loading States**
  - [ ] Skeleton screens cho content loading
  - [ ] Spinner components
  - [ ] Progressive loading
  - [ ] Error boundaries với retry options

### 5.2 Responsive Design Implementation
- [ ] **Mobile Optimization**
  - [ ] Hamburger menu navigation
  - [ ] Touch-friendly button sizes
  - [ ] Swipe gestures (bonus)
  - [ ] Mobile-specific layouts
  - [ ] Optimized form layouts

- [ ] **Tablet Optimization**
  - [ ] Grid layouts adaptation
  - [ ] Navigation adjustments
  - [ ] Content spacing optimization
  - [ ] Touch interaction improvements

### 5.3 Performance Optimization
- [ ] **Code Splitting**
  - [ ] Route-based code splitting
  - [ ] Component lazy loading
  - [ ] Bundle size optimization
  - [ ] Webpack bundle analysis

- [ ] **Image Optimization**
  - [ ] Lazy loading implementation
  - [ ] WebP format support
  - [ ] Responsive images
  - [ ] Placeholder blur effects

- [ ] **Caching Strategy**
  - [ ] API response caching
  - [ ] Browser cache optimization
  - [ ] Service worker setup (bonus)

## Phase 6: Admin Dashboard (Tuần 7-8)

### 6.1 Admin Authentication & Navigation
- [ ] **Admin Login**
  - [ ] Separate admin login page (`/admin/login`)
  - [ ] Role-based access control
  - [ ] Admin-specific layouts
  - [ ] Security measures

- [ ] **Admin Layout**
  - [ ] Sidebar navigation
  - [ ] Top navigation bar
  - [ ] Breadcrumb navigation
  - [ ] Responsive admin layout
  - [ ] User profile dropdown

### 6.2 Dashboard Overview
- [ ] **Main Dashboard (`/admin/dashboard`)**
  - [ ] Revenue metrics cards
  - [ ] Booking statistics
  - [ ] Popular movies display
  - [ ] Recent activity feed
  - [ ] Charts và graphs integration
  - [ ] Date range filters

### 6.3 Movie Management
- [ ] **Movies List (`/admin/movies`)**
  - [ ] Data table với pagination
  - [ ] Search và filter functionality
  - [ ] Bulk actions (delete, status change)
  - [ ] Quick edit capabilities
  - [ ] Export functionality (bonus)

- [ ] **Add/Edit Movie (`/admin/movies/create`, `/admin/movies/:id/edit`)**
  - [ ] Comprehensive movie form
  - [ ] Image upload component
  - [ ] Rich text editor cho synopsis
  - [ ] Cast và crew management
  - [ ] Form validation
  - [ ] Draft save functionality

### 6.4 Theater Management
- [ ] **Theater List (`/admin/theaters`)**
  - [ ] Theater cards layout
  - [ ] Location-based filtering
  - [ ] Status management
  - [ ] Quick actions

- [ ] **Add/Edit Theater (`/admin/theaters/create`, `/admin/theaters/:id/edit`)**
  - [ ] Theater information form
  - [ ] Seat configuration setup
  - [ ] Facilities management
  - [ ] Location mapping (bonus)

### 6.5 Showtime Management
- [ ] **Showtime Calendar (`/admin/showtimes`)**
  - [ ] Calendar view interface
  - [ ] Drag và drop scheduling
  - [ ] Quick showtime creation
  - [ ] Conflict detection
  - [ ] Bulk scheduling

- [ ] **Add Showtime (`/admin/showtimes/create`)**
  - [ ] Movie selection
  - [ ] Theater selection
  - [ ] Date và time selection
  - [ ] Pricing configuration
  - [ ] Recurring showtime setup

### 6.6 Reports & Analytics
- [ ] **Reports Dashboard (`/admin/reports`)**
  - [ ] Revenue reports
  - [ ] Booking analytics
  - [ ] Movie performance metrics
  - [ ] User analytics
  - [ ] Export reports functionality

## Phase 7: Testing & Polish (Tuần 9)

### 7.1 Component Testing
- [ ] **Unit Tests**
  - [ ] Test utility functions
  - [ ] Component render tests
  - [ ] Form validation tests
  - [ ] API service tests
  - [ ] Redux/Context tests

### 7.2 Integration Testing
- [ ] **User Flow Tests**
  - [ ] Authentication flow
  - [ ] Booking process end-to-end
  - [ ] Admin functionality tests
  - [ ] Error handling tests

### 7.3 UI/UX Polish
- [ ] **Visual Polish**
  - [ ] Consistent spacing và typography
  - [ ] Color consistency check
  - [ ] Animation và transition refinement
  - [ ] Mobile UX improvements

- [ ] **Accessibility**
  - [ ] Keyboard navigation
  - [ ] Screen reader support
  - [ ] Color contrast compliance
  - [ ] ARIA labels implementation

### 7.4 Performance Audit
- [ ] **Performance Testing**
  - [ ] Lighthouse audit
  - [ ] Bundle size analysis
  - [ ] Core Web Vitals optimization
  - [ ] Mobile performance testing

## Phase 8: Deployment & Documentation (Tuần 10)

### 8.1 Production Build
- [ ] **Build Optimization**
  - [ ] Production build configuration
  - [ ] Environment variables setup
  - [ ] Static asset optimization
  - [ ] Error logging setup

### 8.2 Deployment
- [ ] **Hosting Setup**
  - [ ] Choose hosting platform (Netlify, Vercel, etc.)
  - [ ] Domain configuration
  - [ ] SSL certificate setup
  - [ ] CI/CD pipeline setup

### 8.3 Documentation
- [ ] **User Documentation**
  - [ ] User manual creation
  - [ ] Feature documentation
  - [ ] FAQ section
  - [ ] Video tutorials (bonus)

- [ ] **Technical Documentation**
  - [ ] Code documentation
  - [ ] API integration guide
  - [ ] Deployment instructions
  - [ ] Maintenance guide

## Quality Assurance Checklist

### Code Quality
- [ ] Consistent code formatting (Prettier)
- [ ] No ESLint errors or warnings
- [ ] Proper component structure
- [ ] Reusable component library
- [ ] Clean code principles followed

### Performance
- [ ] Fast initial page load (< 3s)
- [ ] Smooth animations (60fps)
- [ ] Optimized images và assets
- [ ] Minimal bundle size
- [ ] Efficient re-renders

### Browser Compatibility
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

### Security
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Secure authentication
- [ ] Input validation
- [ ] Error handling without data exposure

## Bonus Features (Nếu có thời gian)

### Advanced Features
- [ ] **Progressive Web App (PWA)**
  - [ ] Service worker implementation
  - [ ] Offline functionality
  - [ ] Install prompt
  - [ ] Push notifications

- [ ] **Advanced Search**
  - [ ] Autocomplete suggestions
  - [ ] Search history
  - [ ] Advanced filter combinations
  - [ ] Search result highlighting

- [ ] **Social Features**
  - [ ] Movie ratings và reviews
  - [ ] Share functionality
  - [ ] Watchlist/Favorites
  - [ ] Friend recommendations

- [ ] **Internationalization**
  - [ ] Multi-language support
  - [ ] Currency conversion
  - [ ] Date/time localization
  - [ ] RTL support

### Technical Enhancements
- [ ] **Advanced State Management**
  - [ ] Redux Toolkit Query
  - [ ] Optimistic updates
  - [ ] Background sync
  - [ ] State persistence

- [ ] **Enhanced UX**
  - [ ] Micro-interactions
  - [ ] Advanced animations
  - [ ] Gesture support
  - [ ] Voice search (bonus)