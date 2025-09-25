# CineBook Backend (Laravel 10)

A comprehensive cinema management and booking system backend built with Laravel 10, featuring advanced seat management, real-time booking, and complete admin functionality.

## System Requirements

- **PHP**: 8.1 or higher
- **Composer**: Latest version
- **Database**: MySQL 8.0+ (or SQLite for quick development)
- **Redis**: For session management and seat locking (optional)
- **Node.js**: For asset compilation (if needed)

## Features

### Core Functionality
- 🎬 **Movie Management** - Complete CRUD with image upload and metadata
- 🏢 **Theater Management** - Multi-theater support with seat configurations
- 🕐 **Showtime Management** - Advanced scheduling with conflict detection
- 💺 **Seat Management** - Real-time seat locking and booking
- 👥 **User Management** - Role-based access control
- 📈 **Analytics & Reports** - Revenue, booking, and user analytics

### Advanced Features
- 🔐 **Authentication** - JWT-based with Sanctum
- 🛡️ **Security** - Role-based permissions and data validation
- 🔄 **Real-time Updates** - Live seat availability
- 💾 **Data Management** - Advanced filtering, sorting, and pagination
- 📄 **API Documentation** - Auto-generated OpenAPI specs
- 📈 **Performance** - Optimized queries and caching

### Admin Features
- 🎛️ **Dashboard** - System overview and quick stats
- 🗺️ **Theater Configuration** - Seat layouts and facility management
- 📊 **Revenue Tracking** - Financial reports and analytics
- 👥 **User Administration** - Account management and role assignment
- 🔧 **System Settings** - Configuration and maintenance tools

## Installation & Setup

### 1. Clone and Setup
```bash
cd backend
cp .env.example .env
```

### 2. Database Configuration

**Option A: MySQL (Recommended for production)**
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cinebook
DB_USERNAME=root
DB_PASSWORD=your_password
```

**Option B: SQLite (Quick development)**
```env
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
```

### 3. Install Dependencies
```bash
composer install
php artisan key:generate
```

### 4. Database Setup
```bash
# Create database file for SQLite (if using SQLite)
touch database/database.sqlite

# Run migrations
php artisan migrate

# Seed with sample data
php artisan db:seed
```

### 5. Start Development Server
```bash
php artisan serve
```

The API will be available at `http://localhost:8000`

## Database Schema

### Core Tables

#### Users Table
| Field | Type | Description |
|-------|------|-------------|
| id | bigint | Primary key |
| name | varchar(255) | User full name |
| email | varchar(255) | Unique email address |
| phone | varchar(20) | User phone number |
| password | varchar(255) | Hashed password |
| role | enum | user, admin |
| status | enum | active, inactive |
| date_of_birth | date | User birth date |
| preferred_city | varchar(100) | Preferred city |
| preferred_language | varchar(20) | Language preference |

#### Movies Table
| Field | Type | Description |
|-------|------|-------------|
| id | bigint | Primary key |
| title | varchar(255) | Movie title |
| description | text | Movie description |
| genre | varchar(100) | Movie genre |
| duration | int | Duration in minutes |
| release_date | date | Release date |
| director | varchar(255) | Director name |
| cast | text | Cast information |
| rating | decimal(2,1) | Movie rating |
| poster_url | varchar(500) | Poster image URL |
| trailer_url | varchar(500) | Trailer video URL |
| status | enum | active, inactive |

#### Theaters Table
| Field | Type | Description |
|-------|------|-------------|
| id | bigint | Primary key |
| name | varchar(255) | Theater name |
| address | text | Full address |
| city | varchar(100) | City location |
| total_seats | int | Total seat count |
| seat_configuration | json | Seat layout config |
| facilities | json | Available facilities |
| status | enum | active, inactive, maintenance |

#### Showtimes Table
| Field | Type | Description |
|-------|------|-------------|
| id | bigint | Primary key |
| movie_id | bigint | Foreign key to movies |
| theater_id | bigint | Foreign key to theaters |
| show_date | date | Showtime date |
| show_time | time | Showtime time |
| prices | json | Pricing for seat types |
| available_seats | int | Available seat count |
| status | enum | active, cancelled |

#### Bookings Table
| Field | Type | Description |
|-------|------|-------------|
| id | bigint | Primary key |
| user_id | bigint | Foreign key to users |
| showtime_id | bigint | Foreign key to showtimes |
| seats | json | Selected seat information |
| total_amount | decimal(10,2) | Total booking amount |
| booking_status | enum | pending, confirmed, cancelled |
| payment_status | enum | pending, completed, failed |
| payment_method | varchar(50) | Payment method used |
| qr_code | text | QR code for ticket |

## API Endpoints

### Authentication
```
POST   /api/v1/auth/register     # User registration
POST   /api/v1/auth/login        # User login
POST   /api/v1/auth/logout       # User logout
GET    /api/v1/auth/me           # Get user profile
PUT    /api/v1/auth/profile      # Update profile
PUT    /api/v1/auth/change-password # Change password
```

### Public Endpoints
```
GET    /api/v1/movies            # List movies
GET    /api/v1/movies/{id}       # Movie details
GET    /api/v1/movies/{id}/showtimes # Movie showtimes
GET    /api/v1/theaters          # List theaters
GET    /api/v1/theaters/{id}     # Theater details
GET    /api/v1/showtimes         # List showtimes
GET    /api/v1/showtimes/{id}/seats # Seat availability
```

### User Endpoints (Authenticated)
```
POST   /api/v1/bookings          # Create booking
GET    /api/v1/user/bookings     # User booking history
PUT    /api/v1/bookings/{id}/cancel # Cancel booking
POST   /api/v1/showtimes/{id}/seats/lock # Lock seats
```

### Admin Endpoints (Admin Role Required)
```
# Dashboard
GET    /api/v1/admin/dashboard/stats

# Movie Management
GET    /api/v1/admin/movies
POST   /api/v1/admin/movies
PUT    /api/v1/admin/movies/{id}
DELETE /api/v1/admin/movies/{id}

# Theater Management
GET    /api/v1/admin/theaters
POST   /api/v1/admin/theaters
PUT    /api/v1/admin/theaters/{id}
DELETE /api/v1/admin/theaters/{id}

# User Management
GET    /api/v1/admin/users
POST   /api/v1/admin/users
PUT    /api/v1/admin/users/{id}
DELETE /api/v1/admin/users/{id}

# Showtime Management
GET    /api/v1/admin/showtimes
POST   /api/v1/admin/showtimes
PUT    /api/v1/admin/showtimes/{id}
DELETE /api/v1/admin/showtimes/{id}
```

## Configuration

### Environment Variables

```env
# Application
APP_NAME=CineBook
APP_ENV=local
APP_KEY=base64:generated_key
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cinebook
DB_USERNAME=root
DB_PASSWORD=

# Cache & Session
CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync

# Redis (Optional)
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"
```

## Advanced Features

### Seat Locking System
- **Technology**: Redis with TTL (Time To Live)
- **Lock Duration**: 15 minutes
- **Auto-Release**: Automatic seat release after timeout
- **Conflict Prevention**: Prevents double booking

### Error Handling
- **Standardized Responses**: Consistent error format across all endpoints
- **Validation**: Comprehensive input validation
- **Exception Handling**: Custom exception handlers
- **Logging**: Detailed error logging for debugging

### Performance Optimizations
- **Query Optimization**: Efficient database queries with proper indexing
- **Eager Loading**: Prevent N+1 query problems
- **Caching**: Strategic caching for frequently accessed data
- **Pagination**: Memory-efficient data retrieval

### Security Features
- **Authentication**: JWT tokens with Sanctum
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive data validation
- **SQL Injection Prevention**: Eloquent ORM protection
- **CORS Configuration**: Proper cross-origin setup

## Sample Data

The seeder provides comprehensive sample data:

- **Movies**: 19 popular movies with complete metadata
- **Theaters**: 19 theaters across Vietnam with realistic configurations
- **Users**: Admin and regular user accounts
- **Showtimes**: 4,378 showtimes across different dates
- **Reviews**: 129 sample reviews
- **Bookings**: 50 sample bookings with payments

### Default Credentials

**Admin Account**
- Email: admin@cinebook.com
- Password: admin123

**User Account**
- Email: user@cinebook.com
- Password: user123

## Development Commands

### Database Operations
```bash
# Fresh migration with seeding
php artisan migrate:fresh --seed

# Run specific seeder
php artisan db:seed --class=MovieSeeder

# Create new migration
php artisan make:migration create_table_name

# Create new seeder
php artisan make:seeder TableSeeder
```

### Code Generation
```bash
# Create controller
php artisan make:controller API/ControllerName

# Create model with migration
php artisan make:model ModelName -m

# Create request validation
php artisan make:request RequestName

# Create middleware
php artisan make:middleware MiddlewareName
```

### Testing
```bash
# Run all tests
php artisan test

# Run specific test
php artisan test --filter=testMethodName

# Generate test coverage
php artisan test --coverage
```

### Maintenance
```bash
# Clear all caches
php artisan optimize:clear

# Generate application cache
php artisan optimize

# View application routes
php artisan route:list

# Check application status
php artisan about
```

## API Documentation

### Auto-Generated Documentation
- **OpenAPI**: Available at `/api/docs/openapi.json`
- **Swagger UI**: Can be integrated for interactive documentation
- **Postman Collection**: Can be generated from OpenAPI spec

### Response Format

**Success Response**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

**Error Response**
```json
{
  "success": false,
  "error": "Error message",
  "errors": {
    "field": ["Validation error message"]
  }
}
```

**Paginated Response**
```json
{
  "success": true,
  "data": {
    "data": [], // Items
    "current_page": 1,
    "last_page": 10,
    "per_page": 15,
    "total": 150
  }
}
```

## Deployment

### Production Setup

1. **Environment Configuration**
   ```bash
   cp .env.example .env.production
   # Configure production settings
   ```

2. **Optimize for Production**
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   composer install --optimize-autoloader --no-dev
   ```

3. **Database Setup**
   ```bash
   php artisan migrate --force
   php artisan db:seed --force
   ```

### Server Requirements

- **Web Server**: Apache 2.4+ or Nginx 1.18+
- **PHP Extensions**: PDO, Mbstring, OpenSSL, Tokenizer, XML, Ctype, JSON
- **Memory Limit**: 512MB minimum
- **Storage**: SSD recommended for better performance

## Monitoring & Logging

### Logs
- **Application Logs**: `storage/logs/laravel.log`
- **Query Logs**: Enable with `DB_LOG_QUERIES=true`
- **Error Tracking**: Can integrate with services like Sentry

### Health Checks
- **Endpoint**: `/api/health`
- **Database**: Connection status
- **Redis**: Connection status (if configured)
- **Seat Locking**: System status

## Contributing

1. **Code Style**: Follow PSR-12 coding standards
2. **Testing**: Write tests for new features
3. **Documentation**: Update API documentation
4. **Migrations**: Always create reversible migrations
5. **Security**: Follow Laravel security best practices

## Architecture Notes

- **Booking Seat Lock**: Redis TTL implementation for preventing double bookings
- **API Versioning**: Supports v1 and v2 with middleware-based routing
- **Error Handling**: Centralized error handling through custom handlers
- **Database Design**: Normalized schema with proper relationships
- **Performance**: Optimized queries with proper indexing and eager loading

## Support

For issues and questions:
1. Check the Laravel documentation
2. Review the API endpoints documentation
3. Check application logs for errors
4. Verify database connections and configurations
