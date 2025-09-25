# CineBook - Cinema Ticket Booking Platform
## Project Documentation

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Features](#features)
5. [Database Design](#database-design)
6. [API Documentation](#api-documentation)
7. [Frontend Components](#frontend-components)
8. [Backend Architecture](#backend-architecture)
9. [Installation Guide](#installation-guide)
10. [User Roles & Permissions](#user-roles--permissions)
11. [Security Features](#security-features)
12. [Testing](#testing)
13. [Deployment](#deployment)

---

## Project Overview

**CineBook** is a comprehensive cinema ticket booking platform that revolutionizes the movie-going experience by providing a seamless online booking system. The platform eliminates the need for physical queuing and provides customers with an intuitive interface to browse movies, select seats, and manage bookings.

### Key Objectives
- Streamline cinema ticket booking process
- Provide real-time seat selection and availability
- Enable efficient cinema management operations
- Enhance customer experience with modern web technologies
- Support multiple theaters and movie scheduling

### Target Users
- **Customers**: Movie enthusiasts looking for convenient booking experience
- **Cinema Administrators**: Staff managing theaters, movies, and bookings
- **System Administrators**: Technical staff maintaining the platform

---

## Technology Stack

### Frontend
- **Framework**: React 18+
- **UI Library**: React Bootstrap 5
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **State Management**: React Hooks (useState, useEffect)
- **Build Tool**: Create React App
- **Styling**: CSS3, Bootstrap 5

### Backend
- **Framework**: Laravel 10+
- **Language**: PHP 8.0+
- **API Architecture**: RESTful API
- **Authentication**: Laravel Sanctum
- **ORM**: Eloquent
- **Queue System**: Laravel Queues
- **Mail**: Laravel Mail with SMTP

### Database
- **Database**: MySQL 8.0+
- **Migration**: Laravel Migrations
- **Seeding**: Laravel Seeders
- **Relationships**: Eloquent Relationships

### Additional Tools
- **Version Control**: Git
- **Package Managers**: Composer (PHP), NPM (Node.js)
- **Development Tools**: Laravel Artisan, React DevTools
- **Email Service**: SMTP Configuration
- **File Storage**: Local filesystem with organized directory structure

---

## Project Structure

### Frontend Structure
```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── HomeFooter.jsx
│   │   ├── MainLayout.jsx
│   │   └── Navbar.jsx
│   ├── services/            # API service layer
│   │   └── api.js
│   ├── utils/               # Utility functions
│   │   └── helpers.js
│   ├── views/               # Page components
│   │   ├── admin/           # Admin interface
│   │   ├── auth/            # Authentication pages
│   │   ├── booking/         # Booking process pages
│   │   ├── Home.jsx
│   │   ├── Movies.jsx
│   │   ├── Theaters.jsx
│   │   └── MyBookings.jsx
│   ├── App.js
│   └── index.js
└── package.json
```

### Backend Structure
```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/API/  # API Controllers
│   │   ├── Middleware/       # Custom middleware
│   │   └── Requests/         # Form request validation
│   ├── Models/              # Eloquent models
│   ├── Services/            # Business logic services
│   ├── Jobs/                # Background jobs
│   └── Mail/                # Email templates
├── database/
│   ├── migrations/          # Database schema
│   ├── seeders/             # Sample data
│   └── factories/           # Model factories
├── routes/
│   ├── api.php             # API routes
│   └── web.php             # Web routes
└── composer.json
```

---

## Features

### Customer Features

#### 1. Authentication System
- **User Registration**: Comprehensive registration with email verification
- **Login/Logout**: Secure authentication with session management
- **Password Recovery**: Forgot password functionality with email reset
- **Profile Management**: Update personal information and change password

#### 2. Movie Browsing
- **Homepage**: Featured movies carousel with quick booking widget
- **Movie Listings**: Browse all movies with filtering and search
- **Movie Details**: Comprehensive movie information with trailers and reviews
- **Genre Filtering**: Filter movies by genre, language, and rating

#### 3. Quick Booking System
- **Progressive Filtering**: Select movie → date → theater → showtime
- **Real-time Availability**: Dynamic filtering based on actual showtimes
- **Date Range**: Show next 7 days of available showtimes
- **Theater Selection**: Choose from available theaters for selected date/movie

#### 4. Seat Selection
- **Interactive Seat Map**: Visual theater layout with seat types
- **Real-time Updates**: Live seat availability updates
- **Seat Types**: Gold, Platinum, and Box seats with different pricing
- **Selection Management**: Add/remove seats with pricing calculation
- **Seat Locking**: Temporary seat reservation during booking process

#### 5. Booking Management
- **My Bookings**: Complete booking history with search and filtering
- **Booking Details**: Detailed view of each booking with QR codes
- **Cancellation**: Cancel future bookings with policy enforcement
- **Status Tracking**: Track booking status (Pending, Confirmed, Completed, Cancelled)

#### 6. Payment & Checkout
- **Payment Methods**: Multiple payment options (Credit Card, Debit Card, Bank Transfer, E-Wallet)
- **Discount System**: Apply discount codes and promotional offers
- **Secure Processing**: Encrypted payment data handling
- **E-tickets**: Digital ticket generation with QR codes
- **Email Confirmation**: Automated booking confirmation emails

### Admin Features

#### 1. Dashboard & Analytics
- **Admin Dashboard**: Key performance indicators and system metrics
- **Revenue Reports**: Booking analytics and revenue tracking
- **User Statistics**: Customer registration and activity metrics
- **System Health**: Monitor application performance and errors

#### 2. Movie Management
- **CRUD Operations**: Create, read, update, delete movies
- **Media Upload**: Poster and trailer URL management
- **Genre Management**: Categorize movies by multiple genres
- **Status Control**: Manage movie availability (Active, Inactive, Coming Soon)
- **Bulk Operations**: Mass update movie information

#### 3. Theater Management
- **Theater Configuration**: Set up theater details and locations
- **Seat Mapping**: Configure theater layout and seat arrangements
- **Facility Management**: Manage theater amenities and services
- **Pricing Setup**: Set pricing for different seat types

#### 4. Showtime Management
- **Schedule Creation**: Create movie showtimes across theaters
- **Date Management**: Schedule shows for specific dates (September 27-29 preference)
- **Time Slots**: Manage multiple show times per day
- **Availability Control**: Monitor and update seat availability

#### 5. Booking Administration
- **Booking Overview**: View all customer bookings
- **Booking Details**: Access complete booking information
- **Cancellation Management**: Process booking cancellations and refunds
- **Customer Support**: Assist customers with booking issues

#### 6. User Management
- **Customer Accounts**: Manage customer profiles and account status
- **Admin Accounts**: Create and manage administrative users
- **Role Management**: Assign user roles and permissions
- **Account Security**: Monitor and secure user accounts

---

## Database Design

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    date_of_birth DATE NULL,
    role ENUM('customer', 'admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Movies Table
```sql
CREATE TABLE movies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    synopsis TEXT,
    genre JSON, -- Array of genres
    language VARCHAR(50),
    duration INT, -- Duration in minutes
    average_rating DECIMAL(2,1) DEFAULT 0,
    poster_url VARCHAR(500),
    trailer_url VARCHAR(500) NULL,
    release_date DATE,
    status ENUM('active', 'inactive', 'coming_soon') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Theaters Table
```sql
CREATE TABLE theaters (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    phone VARCHAR(20),
    facilities JSON, -- Array of facilities
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Showtimes Table
```sql
CREATE TABLE showtimes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    movie_id BIGINT NOT NULL,
    theater_id BIGINT NOT NULL,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    price_gold DECIMAL(8,2) DEFAULT 0,
    price_platinum DECIMAL(8,2) DEFAULT 0,
    price_box DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (theater_id) REFERENCES theaters(id) ON DELETE CASCADE
);
```

#### Bookings Table
```sql
CREATE TABLE bookings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    showtime_id BIGINT NOT NULL,
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    seats JSON, -- Array of selected seats with details
    total_amount DECIMAL(10,2) NOT NULL,
    booking_status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    qr_code TEXT NULL,
    eticket_path VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE
);
```

#### Payments Table
```sql
CREATE TABLE payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    transaction_id VARCHAR(255) NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
```

#### Reviews Table
```sql
CREATE TABLE reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    movie_id BIGINT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);
```

### Database Relationships
- **Users** → **Bookings** (One-to-Many)
- **Users** → **Reviews** (One-to-Many)
- **Movies** → **Showtimes** (One-to-Many)
- **Movies** → **Reviews** (One-to-Many)
- **Theaters** → **Showtimes** (One-to-Many)
- **Showtimes** → **Bookings** (One-to-Many)
- **Bookings** → **Payments** (One-to-One)

---

## API Documentation

### Authentication Endpoints
```
POST /api/register          - User registration
POST /api/login             - User login
POST /api/logout            - User logout
POST /api/forgot-password   - Password reset request
POST /api/reset-password    - Password reset confirmation
```

### Movie Endpoints
```
GET  /api/movies                    - Get all movies
GET  /api/movies/{id}               - Get movie details
GET  /api/movies/{id}/showtimes     - Get movie showtimes
GET  /api/movies/{id}/reviews       - Get movie reviews
POST /api/movies/{id}/reviews       - Create movie review
```

### Theater Endpoints
```
GET  /api/theaters          - Get all theaters
GET  /api/theaters/{id}     - Get theater details
```

### Showtime Endpoints
```
GET  /api/showtimes                 - Get all showtimes
GET  /api/showtimes/{id}            - Get showtime details
GET  /api/showtimes/{id}/seats      - Get seat availability
POST /api/showtimes/{id}/lock-seats - Lock seats for booking
```

### Booking Endpoints
```
GET  /api/bookings              - Get user bookings
POST /api/bookings              - Create new booking
GET  /api/bookings/{id}         - Get booking details
PUT  /api/bookings/{id}/cancel  - Cancel booking
```

### Admin Endpoints
```
GET    /api/admin/dashboard         - Admin dashboard data
GET    /api/admin/movies            - Manage movies (CRUD)
POST   /api/admin/movies            - Create movie
PUT    /api/admin/movies/{id}       - Update movie
DELETE /api/admin/movies/{id}       - Delete movie
GET    /api/admin/theaters          - Manage theaters
GET    /api/admin/showtimes         - Manage showtimes
GET    /api/admin/bookings          - Manage all bookings
GET    /api/admin/users             - Manage users
```

---

## Frontend Components

### Layout Components
- **MainLayout.jsx**: Main application layout with header and footer
- **Header.jsx**: Navigation header with user menu
- **Footer.jsx**: Site footer with links and information
- **HomeFooter.jsx**: Enhanced footer for homepage

### Authentication Components
- **Login.jsx**: User login form with validation
- **Register.jsx**: User registration form
- **ForgotPassword.jsx**: Password recovery form

### Movie Components
- **Home.jsx**: Homepage with featured movies and quick booking
- **Movies.jsx**: Movie listing with filtering and search
- **MovieDetail.jsx**: Detailed movie information page

### Booking Components
- **Seats.jsx**: Interactive seat selection interface
- **Checkout.jsx**: Payment and booking confirmation
- **Confirmation.jsx**: Booking confirmation and e-ticket display
- **MyBookings.jsx**: User booking history and management

### Theater Components
- **Theaters.jsx**: Theater listing and information
- **TheaterDetails.jsx**: Detailed theater information

### Admin Components
- **AdminLayout.jsx**: Admin panel layout
- **Dashboard.jsx**: Admin dashboard with analytics
- **Movies.jsx**: Movie management interface
- **Theaters.jsx**: Theater management interface
- **Showtimes.jsx**: Showtime management interface
- **Bookings.jsx**: Booking management interface
- **Users.jsx**: User management interface

---

## Backend Architecture

### Controllers
- **AuthController**: Handle user authentication
- **MovieController**: Manage movie operations
- **TheaterController**: Handle theater operations
- **ShowtimeController**: Manage showtimes and seat availability
- **BookingController**: Process bookings and payments
- **UserController**: User profile management
- **ReportController**: Generate analytics and reports

### Services
- **AtomicBookingService**: Handle atomic booking transactions
- **SeatLockingService**: Manage seat reservations
- **PaymentService**: Process payments securely
- **NotificationService**: Send email notifications
- **ETicketService**: Generate electronic tickets
- **QrCodeService**: Generate QR codes for tickets

### Middleware
- **AdminMiddleware**: Restrict admin-only access
- **ApiErrorHandler**: Handle API errors gracefully
- **ContentSecurityPolicy**: Implement security headers
- **SanitizeInput**: Clean and validate input data

### Jobs & Queues
- **ReleaseSeatLockJob**: Release expired seat locks
- **SendBookingReminderJob**: Send booking reminders

### Mail Templates
- **BookingConfirmationMail**: Booking confirmation emails
- **ETicketMail**: E-ticket delivery emails

---

## Installation Guide

### Prerequisites
- PHP 8.0 or higher
- Composer
- Node.js 16+ and NPM
- MySQL 8.0+
- Git

### Backend Setup
```bash
# Clone repository
git clone <repository-url>
cd backend

# Install PHP dependencies
composer install

# Environment setup
cp .env.example .env
# Edit .env file with database credentials

# Generate application key
php artisan key:generate

# Run database migrations
php artisan migrate

# Seed sample data
php artisan db:seed

# Start development server
php artisan serve
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start development server
npm start
```

### Database Configuration
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cinebook
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

---

## User Roles & Permissions

### Customer Role
- Browse movies and theaters
- Book tickets and select seats
- Manage personal bookings
- Leave movie reviews
- Update profile information
- Change password for account security

### Admin Role
- Full system administration access
- Manage movies, theaters, and showtimes
- View all bookings and analytics
- Manage user accounts
- Configure system settings
- Access administrative reports

### Permission System
- Role-based access control (RBAC)
- Route-level permissions
- API endpoint restrictions
- UI component visibility control

---

## Security Features

### Authentication Security
- Password hashing with bcrypt
- JWT token-based authentication
- Session management
- Login attempt rate limiting

### Data Security
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF token validation

### API Security
- API rate limiting
- Request validation
- Error handling without data exposure
- Secure headers implementation

### File Security
- Image upload validation
- File type restrictions
- Secure file storage in organized directories
- Path traversal prevention

---

## Testing

### Backend Testing
- Unit tests for models and services
- Feature tests for API endpoints
- Integration tests for booking flow
- Security validation tests

### Frontend Testing
- Component unit tests
- Integration tests for user flows
- End-to-end testing scenarios
- Cross-browser compatibility testing

### Test Coverage
- Authentication flows
- Booking process
- Payment handling
- Admin operations
- Error scenarios

---

## Deployment

### Production Environment
- Web server configuration (Apache/Nginx)
- SSL certificate setup
- Database optimization
- Caching implementation
- Performance monitoring

### Environment Configuration
- Production environment variables
- Database configuration
- Email service setup
- File storage optimization
- Security headers implementation

### Monitoring & Maintenance
- Error logging and monitoring
- Performance metrics tracking
- Regular database backups
- Security updates and patches
- System health monitoring

---

## Future Enhancements

### Planned Features
- Mobile application (React Native)
- Real-time chat support
- Loyalty program integration
- Advanced analytics dashboard
- Multi-language support
- Social media integration

### Performance Optimizations
- Redis caching implementation
- Database query optimization
- Image compression and CDN
- API response caching
- Progressive Web App (PWA) features

### Security Enhancements
- Two-factor authentication (2FA)
- Advanced fraud detection
- Enhanced payment security
- Audit logging system
- Penetration testing implementation

---

## Project Team

**Development Team:**
- Frontend Developer: React.js implementation
- Backend Developer: Laravel API development
- Database Designer: MySQL schema design
- UI/UX Designer: User interface design

**Technologies Mastered:**
- Modern web development practices
- RESTful API design
- Database optimization
- Security implementation
- User experience design

---

## Contact Information

For technical support or project inquiries:
- Email: support@cinebook.com
- Documentation: [Project Repository]
- Issue Tracking: [GitHub Issues]

---

*This documentation serves as a comprehensive guide for the CineBook cinema ticket booking platform. For the latest updates and detailed technical information, please refer to the project repository and inline code documentation.*