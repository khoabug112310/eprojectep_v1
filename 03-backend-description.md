# CineBook Backend - Mô Tả Chi Tiết Laravel API

## Tổng Quan Backend

Backend CineBook được xây dựng trên Laravel 10, cung cấp RESTful API để phục vụ cả User interface và Admin dashboard. Hệ thống được thiết kế theo kiến trúc MVC với các best practices của Laravel.

## Kiến Trúc Backend

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── API/
│   │   │   ├── AuthController.php
│   │   │   ├── MovieController.php
│   │   │   ├── BookingController.php
│   │   │   └── Admin/
│   │   │       ├── AdminController.php
│   │   │       ├── MovieManagementController.php
│   │   │       ├── TheaterManagementController.php
│   │   │       └── ReportController.php
│   │   ├── Middleware/
│   │   └── Requests/
│   │       ├── Auth/
│   │       ├── Booking/
│   │       └── Admin/
├── Models/
│   ├── User.php
│   ├── Movie.php
│   ├── Theater.php
│   ├── Showtime.php
│   ├── Booking.php
│   ├── Seat.php
│   └── Review.php
├── Services/
│   ├── AuthService.php
│   ├── BookingService.php
│   ├── PaymentService.php
│   └── NotificationService.php
├── Jobs/
├── Mail/
└── Exceptions/

database/
├── migrations/
├── seeders/
└── factories/

routes/
├── api.php
├── web.php
└── admin.php
```

## Database Design

### 1. Users Table
```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    preferred_city VARCHAR(100),
    preferred_language VARCHAR(20) DEFAULT 'vi',
    role ENUM('user', 'admin') DEFAULT 'user',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. Movies Table
```sql
CREATE TABLE movies (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    synopsis TEXT,
    duration INT NOT NULL, -- minutes
    genre JSON, -- ['Action', 'Drama']
    language VARCHAR(50) NOT NULL,
    age_rating VARCHAR(10), -- G, PG, PG-13, R
    release_date DATE NOT NULL,
    poster_url VARCHAR(500),
    trailer_url VARCHAR(500),
    cast JSON, -- [{'name': 'Actor Name', 'role': 'Character'}]
    director VARCHAR(255),
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    status ENUM('active', 'inactive', 'coming_soon') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3. Theaters Table
```sql
CREATE TABLE theaters (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    total_seats INT NOT NULL,
    seat_configuration JSON, -- {'gold': 100, 'platinum': 50, 'box': 20}
    facilities JSON, -- ['3D', 'IMAX', 'Dolby Atmos']
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 4. Showtimes Table
```sql
CREATE TABLE showtimes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    movie_id BIGINT UNSIGNED NOT NULL,
    theater_id BIGINT UNSIGNED NOT NULL,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    prices JSON, -- {'gold': 120000, 'platinum': 150000, 'box': 200000}
    available_seats JSON, -- Track available seats
    status ENUM('active', 'cancelled', 'full') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (theater_id) REFERENCES theaters(id) ON DELETE CASCADE,
    INDEX idx_showtime_lookup (show_date, theater_id, movie_id)
);
```

### 5. Bookings Table
```sql
CREATE TABLE bookings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    showtime_id BIGINT UNSIGNED NOT NULL,
    seats JSON NOT NULL, -- [{'seat': 'A1', 'type': 'gold', 'price': 120000}]
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    booking_status ENUM('confirmed', 'cancelled', 'used') DEFAULT 'confirmed',
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE
);
```

### 6. Reviews Table
```sql
CREATE TABLE reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    movie_id BIGINT UNSIGNED NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_movie_review (user_id, movie_id)
);
```

## API Endpoints

### 1. Authentication APIs

#### POST `/api/auth/register`
```php
// RegisterRequest validation
{
    "name": "required|string|max:255",
    "email": "required|email|unique:users",
    "phone": "required|string|unique:users",
    "password": "required|min:8|confirmed",
    "date_of_birth": "nullable|date",
    "preferred_city": "nullable|string"
}

// Response
{
    "success": true,
    "data": {
        "user": {...},
        "token": "bearer_token_here"
    },
    "message": "Đăng ký thành công"
}
```

#### POST `/api/auth/login`
```php
// LoginRequest validation
{
    "email": "required|email",
    "password": "required"
}

// Response
{
    "success": true,
    "data": {
        "user": {...},
        "token": "bearer_token_here"
    },
    "message": "Đăng nhập thành công"
}
```

### 2. Movie APIs

#### GET `/api/movies`
```php
// Query parameters
{
    "search": "optional|string",
    "genre": "optional|array",
    "language": "optional|string",
    "city": "optional|string",
    "status": "optional|in:active,coming_soon",
    "sort_by": "optional|in:title,release_date,rating",
    "sort_order": "optional|in:asc,desc",
    "per_page": "optional|integer|max:50"
}

// Response
{
    "success": true,
    "data": {
        "movies": [...],
        "pagination": {...}
    }
}
```

#### GET `/api/movies/{id}`
```php
// Response includes full movie details + showtimes
{
    "success": true,
    "data": {
        "movie": {...},
        "showtimes": [...],
        "reviews": [...]
    }
}
```

### 3. Booking APIs

#### GET `/api/showtimes/{id}/seats`
```php
// Response
{
    "success": true,
    "data": {
        "showtime": {...},
        "seat_map": {
            "gold": {
                "available": ["A1", "A2", "A3"],
                "occupied": ["A4", "A5"],
                "selected": [],
                "price": 120000
            },
            "platinum": {...},
            "box": {...}
        }
    }
}
```

#### POST `/api/bookings`
```php
// CreateBookingRequest validation
{
    "showtime_id": "required|exists:showtimes,id",
    "seats": "required|array|min:1",
    "seats.*.seat": "required|string",
    "seats.*.type": "required|in:gold,platinum,box",
    "payment_method": "required|string"
}

// Response
{
    "success": true,
    "data": {
        "booking": {...},
        "e_ticket": {...}
    },
    "message": "Đặt vé thành công"
}
```

### 4. Admin APIs

#### GET `/api/admin/dashboard/stats`
```php
// Response
{
    "success": true,
    "data": {
        "revenue": {
            "today": 15000000,
            "this_week": 105000000,
            "this_month": 450000000
        },
        "bookings": {
            "today": 250,
            "this_week": 1750,
            "this_month": 7500
        },
        "popular_movies": [...],
        "theater_performance": [...]
    }
}
```

#### POST `/api/admin/movies`
```php
// CreateMovieRequest validation
{
    "title": "required|string|max:255",
    "synopsis": "required|string",
    "duration": "required|integer|min:1",
    "genre": "required|array",
    "language": "required|string",
    "age_rating": "required|string",
    "release_date": "required|date",
    "poster": "nullable|image|max:2048",
    "trailer_url": "nullable|url",
    "cast": "required|array",
    "director": "required|string"
}
```

## Services Layer

### 1. BookingService
```php
<?php

class BookingService
{
    public function checkSeatAvailability($showtimeId, $seats)
    {
        // Check if selected seats are still available
        // Lock seats temporarily during booking process
    }
    
    public function calculatePrice($seats, $showtime)
    {
        // Calculate total price based on seat types and pricing
        // Apply discounts if any
    }
    
    public function createBooking($userId, $bookingData)
    {
        // Create booking with transaction
        // Update seat availability
        // Generate booking code
        // Send confirmation email
    }
    
    public function generateETicket($booking)
    {
        // Generate QR code
        // Create PDF ticket
        // Return ticket data
    }
}
```

### 2. NotificationService
```php
<?php

class NotificationService
{
    public function sendBookingConfirmation($booking)
    {
        // Send email confirmation
        // Send SMS if phone provided
    }
    
    public function sendShowReminder($booking)
    {
        // Send reminder 2 hours before show
        // Queue background job
    }
    
    public function sendPromotionalOffers($users, $offer)
    {
        // Send promotional notifications
        // Respect user notification preferences
    }
}
```

## Middleware

### 1. Authentication Middleware
```php
<?php

class AuthMiddleware
{
    public function handle($request, Closure $next, ...$guards)
    {
        // Verify JWT token
        // Set authenticated user
        // Check user status (active/inactive)
    }
}
```

### 2. Admin Middleware
```php
<?php

class AdminMiddleware
{
    public function handle($request, Closure $next)
    {
        if (!auth()->user() || auth()->user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        return $next($request);
    }
}
```

## Background Jobs

### 1. Seat Lock Job
```php
<?php

class ReleaseSeatLockJob implements ShouldQueue
{
    protected $showtimeId;
    protected $seats;
    
    public function handle()
    {
        // Release locked seats after 15 minutes
        // If booking not completed
    }
}
```

### 2. Show Reminder Job
```php
<?php

class SendShowReminderJob implements ShouldQueue
{
    protected $booking;
    
    public function handle()
    {
        // Send reminder 2 hours before show
        // Mark reminder as sent
    }
}
```

## Validation Rules

### Custom Validation Rules
```php
<?php

class PhoneNumberRule implements Rule
{
    public function passes($attribute, $value)
    {
        // Vietnamese phone number validation
        return preg_match('/^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/', $value);
    }
    
    public function message()
    {
        return 'Số điện thoại không đúng định dạng.';
    }
}

class SeatAvailabilityRule implements Rule
{
    protected $showtimeId;
    
    public function __construct($showtimeId)
    {
        $this->showtimeId = $showtimeId;
    }
    
    public function passes($attribute, $value)
    {
        // Check if seats are available for the showtime
        return BookingService::checkSeatAvailability($this->showtimeId, $value);
    }
}
```

## Error Handling

### Custom Exception Handler
```php
<?php

class Handler extends ExceptionHandler
{
    public function render($request, Throwable $exception)
    {
        if ($request->is('api/*')) {
            if ($exception instanceof ValidationException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $exception->errors()
                ], 422);
            }
            
            if ($exception instanceof ModelNotFoundException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy dữ liệu'
                ], 404);
            }
        }
        
        return parent::render($request, $exception);
    }
}
```

## Caching Strategy

### 1. Movie List Caching
```php
<?php

public function getMovies($filters = [])
{
    $cacheKey = 'movies:' . md5(serialize($filters));
    
    return Cache::remember($cacheKey, 3600, function () use ($filters) {
        return Movie::with(['reviews'])
            ->when($filters['genre'] ?? null, function ($query, $genre) {
                $query->whereJsonContains('genre', $genre);
            })
            ->get();
    });
}
```

### 2. Seat Availability Caching
```php
<?php

public function getSeatAvailability($showtimeId)
{
    $cacheKey = "seats:showtime:{$showtimeId}";
    
    return Cache::remember($cacheKey, 300, function () use ($showtimeId) {
        // Get seat availability
        // Cache for 5 minutes only due to frequent updates
    });
}
```

## Security Measures

### 1. Rate Limiting
```php
// In RouteServiceProvider
Route::middleware(['throttle:60,1'])->group(function () {
    // API routes with rate limiting
});

// Custom rate limiting for booking
Route::middleware(['throttle:10,1'])->group(function () {
    Route::post('/bookings', [BookingController::class, 'store']);
});
```

### 2. Input Sanitization
```php
<?php

class SanitizeInput
{
    public function handle($request, Closure $next)
    {
        $input = $request->all();
        
        array_walk_recursive($input, function (&$value) {
            $value = strip_tags($value);
            $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
        });
        
        $request->merge($input);
        return $next($request);
    }
}
```

## Performance Optimization

### 1. Database Optimization
- Index on frequently queried columns
- Eager loading relationships
- Query optimization with explain
- Database connection pooling

### 2. API Response Optimization
```php
<?php

// Use API Resources for consistent responses
class MovieResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'poster_url' => $this->poster_url,
            'average_rating' => (float) $this->average_rating,
            'showtimes' => ShowtimeResource::collection($this->whenLoaded('showtimes')),
        ];
    }
}
```

### 3. Monitoring & Logging
```php
<?php

// Log important events
Log::info('Booking created', [
    'booking_id' => $booking->id,
    'user_id' => $booking->user_id,
    'total_amount' => $booking->total_amount
]);

// Performance monitoring
DB::listen(function ($query) {
    if ($query->time > 1000) {
        Log::warning('Slow query detected', [
            'sql' => $query->sql,
            'time' => $query->time
        ]);
    }
});
```