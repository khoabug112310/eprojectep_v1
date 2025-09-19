<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Test route without middleware
Route::get('/test-users-no-auth', function () {
    try {
        $users = \App\Models\User::all();
        return response()->json([
            'success' => true,
            'count' => $users->count(),
            'data' => $users->take(5) // Limit to 5 users for testing
        ]);
    } catch (Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

// Test route with admin middleware but without auth
Route::get('/test-admin-no-auth', function () {
    return response()->json([
        'success' => true,
        'message' => 'Admin middleware test passed'
    ]);
})->middleware('admin');

// Simple API v1 routes (working version)
Route::prefix('v1')->group(function () {
    // Health check routes
    Route::get('/health', [API\HealthController::class, 'index']);
    
    // Auth routes
    Route::post('/auth/register', [API\AuthController::class, 'register']);
    Route::post('/auth/login', [API\AuthController::class, 'login']);
    Route::post('/auth/forgot-password', [API\AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [API\AuthController::class, 'resetPassword']);
    
    // Public routes
    Route::get('/movies', [API\MovieController::class, 'index']);
    Route::get('/movies/{id}', [API\MovieController::class, 'show']);
    Route::get('/movies/{id}/showtimes', [API\MovieController::class, 'showtimes']);
    Route::get('/movies/{id}/reviews', [API\MovieController::class, 'reviews']);
    
    Route::get('/theaters', [API\TheaterController::class, 'index']);
    Route::get('/theaters/{id}', [API\TheaterController::class, 'show']);
    
    Route::get('/showtimes', [API\ShowtimeController::class, 'index']);
    Route::get('/showtimes/{id}', [API\ShowtimeController::class, 'show']);
    Route::get('/showtimes/{id}/seats', [API\ShowtimeController::class, 'seats']);
    Route::get('/showtimes/{id}/seat-status', [API\ShowtimeController::class, 'seatStatus']);
    
    // Protected routes (require authentication)
    Route::middleware('auth:sanctum')->group(function () {
        // User profile routes
        Route::get('/auth/me', [API\AuthController::class, 'me']);
        Route::put('/auth/profile', [API\AuthController::class, 'updateProfile']);
        Route::put('/auth/change-password', [API\AuthController::class, 'changePassword']);
        Route::post('/auth/logout', [API\AuthController::class, 'logout']);
        
        // User booking routes
        Route::post('/bookings', [API\BookingController::class, 'store']);
        Route::post('/bookings/{id}/payment', [API\BookingController::class, 'processPayment']);
        Route::post('/showtimes/{id}/seats/lock', [API\ShowtimeController::class, 'lockSeats']);
        
        // Other user routes
        Route::get('/user/bookings', [API\BookingController::class, 'userBookings']);
        Route::get('/bookings/{id}', [API\BookingController::class, 'show']);
        Route::put('/bookings/{id}/cancel', [API\BookingController::class, 'cancel']);
        
        // Payment routes
        Route::get('/bookings/{id}/payment/status', [API\BookingController::class, 'getPaymentStatus']);
        Route::get('/bookings/{id}/ticket', [API\BookingController::class, 'getTicket']);
        Route::post('/bookings/{id}/resend-email', [API\BookingController::class, 'resendEmail']);
        
        // Review routes
        Route::post('/movies/{id}/reviews', [API\ReviewController::class, 'store']);
        Route::put('/reviews/{id}', [API\ReviewController::class, 'update']);
        Route::delete('/reviews/{id}', [API\ReviewController::class, 'destroy']);
        
        // Admin routes
        Route::prefix('admin')->middleware('admin')->group(function () {
            Route::get('/dashboard/stats', [API\ReportController::class, 'dashboard']);
            Route::get('/movies', [API\MovieController::class, 'adminIndex']);
            Route::get('/movies/{id}', [API\MovieController::class, 'show']);
            Route::post('/movies', [API\MovieController::class, 'store']);
            Route::put('/movies/{id}', [API\MovieController::class, 'update']);
            Route::delete('/movies/{id}', [API\MovieController::class, 'destroy']);
            
            Route::get('/theaters', [API\TheaterController::class, 'adminIndex']);
            Route::get('/theaters/{id}', [API\TheaterController::class, 'show']);
            Route::post('/theaters', [API\TheaterController::class, 'store']);
            Route::put('/theaters/{id}', [API\TheaterController::class, 'update']);
            Route::delete('/theaters/{id}', [API\TheaterController::class, 'destroy']);
            
            Route::get('/showtimes', [API\ShowtimeController::class, 'adminIndex']);
            Route::post('/showtimes', [API\ShowtimeController::class, 'store']);
            Route::put('/showtimes/{id}', [API\ShowtimeController::class, 'update']);
            Route::delete('/showtimes/{id}', [API\ShowtimeController::class, 'destroy']);
            
            Route::get('/bookings', [API\BookingController::class, 'adminIndex']);
            Route::put('/bookings/{id}', [API\BookingController::class, 'update']);
            Route::delete('/bookings/{id}', [API\BookingController::class, 'destroy']);
            
            // User management
            Route::get('/users', [API\UserController::class, 'index']);
            Route::get('/users/{id}', [API\UserController::class, 'show']);
            Route::put('/users/{id}', [API\UserController::class, 'update']);
            Route::delete('/users/{id}', [API\UserController::class, 'destroy']);
        });
    });
});

// Complex middleware API v1 routes (with issues) - DISABLED
/*
Route::prefix('v1')->middleware(['api.versioning', 'advanced.rate.limit', 'api.cache'])->group(function () {
    // Health check routes
    Route::get('/health', [API\HealthController::class, 'index']);
    Route::get('/health/redis', [API\HealthController::class, 'redis']);
    Route::get('/health/seat-locking', [API\HealthController::class, 'seatLockingStats']);
    Route::get('/seat-locking/health', [API\HealthController::class, 'seatLockingHealth']);
    
    // Auth routes with advanced rate limiting (handled by middleware)
    Route::post('/auth/register', [API\AuthController::class, 'register']);
    Route::post('/auth/login', [API\AuthController::class, 'login']);
    Route::post('/auth/forgot-password', [API\AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [API\AuthController::class, 'resetPassword']);
    
    // Public routes
    Route::get('/movies', [API\MovieController::class, 'index']);
    Route::get('/movies/{id}', [API\MovieController::class, 'show']);
    Route::get('/movies/{id}/showtimes', [API\MovieController::class, 'showtimes']);
    Route::get('/movies/{id}/reviews', [API\MovieController::class, 'reviews']);
    
    Route::get('/theaters', [API\TheaterController::class, 'index']);
    Route::get('/theaters/{id}', [API\TheaterController::class, 'show']);
    
    Route::get('/showtimes', [API\ShowtimeController::class, 'index']);
    Route::get('/showtimes/{id}', [API\ShowtimeController::class, 'show']);
    Route::get('/showtimes/{id}/seats', [API\ShowtimeController::class, 'seats']);
    Route::get('/showtimes/{id}/seat-status', [API\ShowtimeController::class, 'seatStatus']);
    
    // QR Code test endpoints (development only)
    Route::post('/qr/test-generate', [API\QrCodeController::class, 'testGenerate']);
    Route::post('/qr/verify', [API\QrCodeController::class, 'verify']);
    
    // Protected routes (require authentication)
    Route::middleware('auth:sanctum')->group(function () {
        // User profile routes
        Route::get('/auth/me', [API\AuthController::class, 'me']);
        Route::put('/auth/profile', [API\AuthController::class, 'updateProfile']);
        Route::put('/auth/change-password', [API\AuthController::class, 'changePassword']);
        Route::post('/auth/logout', [API\AuthController::class, 'logout']);
        
        // User booking routes (rate limiting handled by middleware)
        Route::post('/bookings', [API\BookingController::class, 'store']);
        Route::post('/bookings/{id}/payment', [API\BookingController::class, 'processPayment']);
        Route::post('/showtimes/{id}/seats/lock', [API\ShowtimeController::class, 'lockSeats']);
        
        // Other user routes
        Route::get('/user/bookings', [API\BookingController::class, 'userBookings']);
        Route::get('/bookings/{id}', [API\BookingController::class, 'show']);
        Route::put('/bookings/{id}/cancel', [API\BookingController::class, 'cancel']);
        
        // Payment routes
        Route::get('/bookings/{id}/payment/status', [API\BookingController::class, 'getPaymentStatus']);
        Route::get('/bookings/{id}/ticket', [API\BookingController::class, 'getTicket']);
        Route::post('/bookings/{id}/resend-email', [API\BookingController::class, 'resendEmail']);
        
        // E-ticket management routes
        Route::post('/bookings/{id}/generate-ticket', [API\BookingController::class, 'generateETicket']);
        Route::post('/tickets/verify', [API\BookingController::class, 'verifyTicket']);
        
        // Seat management - Enhanced with Redis locking
        Route::delete('/showtimes/{id}/seats/unlock', [API\ShowtimeController::class, 'unlockSeats']);
        Route::put('/showtimes/{id}/seats/extend-lock', [API\ShowtimeController::class, 'extendLock']);
        
        // Review routes
        Route::post('/movies/{id}/reviews', [API\ReviewController::class, 'store']);
        Route::put('/reviews/{id}', [API\ReviewController::class, 'update']);
        Route::delete('/reviews/{id}', [API\ReviewController::class, 'destroy']);
        
        // File upload routes (admin only)
        Route::middleware('admin')->group(function () {
            Route::post('/movies/upload-poster', [API\MovieController::class, 'uploadPoster']);
        });
        
        // Admin routes
        Route::prefix('admin')->middleware('admin')->group(function () {
            // Admin dashboard
            Route::get('/dashboard', [API\ReportController::class, 'dashboard']);
            Route::get('/reports/revenue', [API\ReportController::class, 'revenue']);
            Route::get('/reports/bookings', [API\ReportController::class, 'bookings']);
            Route::get('/reports/movies', [API\ReportController::class, 'movies']);
            Route::get('/reports/users', [API\ReportController::class, 'users']);
            Route::get('/reports/payment-analytics', [API\ReportController::class, 'paymentAnalytics']);
            Route::get('/reports/ticket-analytics', [API\ReportController::class, 'ticketAnalytics']);
            
            // Movie management
            Route::get('/movies', [API\MovieController::class, 'adminIndex']);
            Route::post('/movies', [API\MovieController::class, 'store']);
            Route::put('/movies/{id}', [API\MovieController::class, 'update']);
            Route::delete('/movies/{id}', [API\MovieController::class, 'destroy']);
            
            // Theater management
            Route::get('/theaters', [API\TheaterController::class, 'adminIndex']);
            Route::get('/theaters/{id}', [API\TheaterController::class, 'show']);
            Route::post('/theaters', [API\TheaterController::class, 'store']);
            Route::put('/theaters/{id}', [API\TheaterController::class, 'update']);
            Route::delete('/theaters/{id}', [API\TheaterController::class, 'destroy']);
            
            // Showtime management
            Route::get('/showtimes', [API\ShowtimeController::class, 'adminIndex']);
            Route::post('/showtimes', [API\ShowtimeController::class, 'store']);
            Route::put('/showtimes/{id}', [API\ShowtimeController::class, 'update']);
            Route::delete('/showtimes/{id}', [API\ShowtimeController::class, 'destroy']);
            
            // Booking management
            Route::get('/bookings', [API\BookingController::class, 'adminIndex']);
            Route::put('/bookings/{id}', [API\BookingController::class, 'update']);
            Route::delete('/bookings/{id}', [API\BookingController::class, 'destroy']);
            
            // Payment management
            Route::get('/payments', [API\BookingController::class, 'adminPayments']);
            Route::get('/payments/{id}', [API\BookingController::class, 'getPaymentDetails']);
            Route::put('/payments/{id}/status', [API\BookingController::class, 'updatePaymentStatus']);
            Route::post('/payments/{id}/refund', [API\BookingController::class, 'processRefund']);
            Route::get('/payments/statistics', [API\BookingController::class, 'getPaymentStats']);
            
            // E-ticket management
            Route::get('/tickets', [API\BookingController::class, 'adminTickets']);
            Route::post('/tickets/{id}/regenerate', [API\BookingController::class, 'adminRegenerateTicket']);
            Route::get('/tickets/statistics', [API\BookingController::class, 'getTicketStats']);
            
            // Review management
            Route::get('/reviews', [API\ReviewController::class, 'adminIndex']);
            Route::put('/reviews/{id}/approve', [API\ReviewController::class, 'approve']);
            Route::put('/reviews/{id}/reject', [API\ReviewController::class, 'reject']);
            Route::delete('/reviews/{id}', [API\ReviewController::class, 'destroy']);
            
            // User management
            Route::get('/users', [API\UserController::class, 'index']);
            Route::get('/users/{id}', [API\UserController::class, 'show']);
            Route::put('/users/{id}', [API\UserController::class, 'update']);
            Route::delete('/users/{id}', [API\UserController::class, 'destroy']);
            
            // File upload
            Route::post('/upload/movie-poster', [API\MovieController::class, 'uploadPoster']);
            
            // API Monitoring (Admin only)
            Route::get('/monitoring/usage-stats', [\App\Http\Controllers\API\ApiMonitoringController::class, 'getUsageStats']);
            Route::get('/monitoring/popular-endpoints', [\App\Http\Controllers\API\ApiMonitoringController::class, 'getPopularEndpoints']);
            Route::get('/monitoring/health-metrics', [\App\Http\Controllers\API\ApiMonitoringController::class, 'getHealthMetrics']);
            Route::get('/monitoring/deprecation-info', [\App\Http\Controllers\API\ApiMonitoringController::class, 'getDeprecationInfo']);
            Route::get('/monitoring/version-comparison', [\App\Http\Controllers\API\ApiMonitoringController::class, 'getVersionComparison']);
            
            // Rate Limiting Management (Admin only)
            Route::get('/rate-limiting/analytics', [API\RateLimitingController::class, 'getAnalytics']);
            Route::get('/rate-limiting/configuration', [API\RateLimitingController::class, 'getConfiguration']);
            Route::get('/rate-limiting/health', [API\RateLimitingController::class, 'getHealthStatus']);
            Route::post('/rate-limiting/reset', [API\RateLimitingController::class, 'resetClientLimits']);
            
            // API Response Caching Management (Admin only)
            Route::get('/caching/statistics', [API\CachingController::class, 'getStatistics']);
            Route::get('/caching/health', [API\CachingController::class, 'getHealthStatus']);
            Route::post('/caching/invalidate-tags', [API\CachingController::class, 'invalidateByTags']);
            Route::post('/caching/invalidate-events', [API\CachingController::class, 'invalidateByEvent']);
            Route::post('/caching/clear-all', [API\CachingController::class, 'clearAllCache']);
            Route::post('/caching/warmup', [API\CachingController::class, 'warmupCache']);
        });
    });
});
*/

// API Version 2 (Current)
Route::prefix('v2')->middleware(['api.versioning', 'advanced.rate.limit', 'api.cache'])->group(function () {
    // Health check routes
    Route::get('/health', [API\HealthController::class, 'index']);
    Route::get('/health/redis', [API\HealthController::class, 'redis']);
    Route::get('/health/seat-locking', [API\HealthController::class, 'seatLockingStats']);
    Route::get('/seat-locking/health', [API\HealthController::class, 'seatLockingHealth']);
    
    // Auth routes with advanced rate limiting (handled by middleware)
    Route::post('/auth/register', [API\AuthController::class, 'register']);
    Route::post('/auth/login', [API\AuthController::class, 'login']);
    Route::post('/auth/forgot-password', [API\AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [API\AuthController::class, 'resetPassword']);
    
    // Public routes with enhanced features
    Route::get('/movies', [API\MovieController::class, 'index']);
    Route::get('/movies/{id}', [API\MovieController::class, 'show']);
    Route::get('/movies/{id}/showtimes', [API\MovieController::class, 'showtimes']);
    Route::get('/movies/{id}/reviews', [API\MovieController::class, 'reviews']);
    
    Route::get('/theaters', [API\TheaterController::class, 'index']);
    Route::get('/theaters/{id}', [API\TheaterController::class, 'show']);
    
    Route::get('/showtimes', [API\ShowtimeController::class, 'index']);
    Route::get('/showtimes/{id}', [API\ShowtimeController::class, 'show']);
    Route::get('/showtimes/{id}/seats', [API\ShowtimeController::class, 'seats']);
    Route::get('/showtimes/{id}/seat-status', [API\ShowtimeController::class, 'seatStatus']);
    
    // QR Code endpoints
    Route::post('/qr/test-generate', [API\QrCodeController::class, 'testGenerate']);
    Route::post('/qr/verify', [API\QrCodeController::class, 'verify']);
    
    // Protected routes (require authentication)
    Route::middleware('auth:sanctum')->group(function () {
        // User profile routes
        Route::get('/auth/me', [API\AuthController::class, 'me']);
        Route::put('/auth/profile', [API\AuthController::class, 'updateProfile']);
        Route::put('/auth/change-password', [API\AuthController::class, 'changePassword']);
        Route::post('/auth/logout', [API\AuthController::class, 'logout']);
        
        // User booking routes (rate limiting handled by middleware)
        Route::post('/bookings', [API\BookingController::class, 'store']);
        Route::post('/bookings/{id}/payment', [API\BookingController::class, 'processPayment']);
        Route::post('/showtimes/{id}/seats/lock', [API\ShowtimeController::class, 'lockSeats']);
        
        // Other user routes
        Route::get('/user/bookings', [API\BookingController::class, 'userBookings']);
        Route::get('/bookings/{id}', [API\BookingController::class, 'show']);
        Route::put('/bookings/{id}/cancel', [API\BookingController::class, 'cancel']);
        
        // Payment routes
        Route::get('/bookings/{id}/payment/status', [API\BookingController::class, 'getPaymentStatus']);
        Route::get('/bookings/{id}/ticket', [API\BookingController::class, 'getTicket']);
        Route::post('/bookings/{id}/resend-email', [API\BookingController::class, 'resendEmail']);
        
        // E-ticket management routes
        Route::post('/bookings/{id}/generate-ticket', [API\BookingController::class, 'generateETicket']);
        Route::post('/tickets/verify', [API\BookingController::class, 'verifyTicket']);
        
        // Seat management - Enhanced with Redis locking
        Route::delete('/showtimes/{id}/seats/unlock', [API\ShowtimeController::class, 'unlockSeats']);
        Route::put('/showtimes/{id}/seats/extend-lock', [API\ShowtimeController::class, 'extendLock']);
        
        // Review routes
        Route::post('/movies/{id}/reviews', [API\ReviewController::class, 'store']);
        Route::put('/reviews/{id}', [API\ReviewController::class, 'update']);
        Route::delete('/reviews/{id}', [API\ReviewController::class, 'destroy']);
        
        // File upload routes (admin only)
        Route::middleware('admin')->group(function () {
            Route::post('/movies/upload-poster', [API\MovieController::class, 'uploadPoster']);
        });
        
        // Admin routes
        Route::prefix('admin')->middleware('admin')->group(function () {
            // Admin dashboard
            Route::get('/dashboard', [API\ReportController::class, 'dashboard']);
            Route::get('/reports/revenue', [API\ReportController::class, 'revenue']);
            Route::get('/reports/bookings', [API\ReportController::class, 'bookings']);
            Route::get('/reports/movies', [API\ReportController::class, 'movies']);
            Route::get('/reports/users', [API\ReportController::class, 'users']);
            Route::get('/reports/payment-analytics', [API\ReportController::class, 'paymentAnalytics']);
            Route::get('/reports/ticket-analytics', [API\ReportController::class, 'ticketAnalytics']);
            
            // Movie management
            Route::get('/movies', [API\MovieController::class, 'adminIndex']);
            Route::post('/movies', [API\MovieController::class, 'store']);
            Route::put('/movies/{id}', [API\MovieController::class, 'update']);
            Route::delete('/movies/{id}', [API\MovieController::class, 'destroy']);
            
            // Theater management
            Route::get('/theaters', [API\TheaterController::class, 'adminIndex']);
            Route::get('/theaters/{id}', [API\TheaterController::class, 'show']);
            Route::post('/theaters', [API\TheaterController::class, 'store']);
            Route::put('/theaters/{id}', [API\TheaterController::class, 'update']);
            Route::delete('/theaters/{id}', [API\TheaterController::class, 'destroy']);
            
            // Showtime management
            Route::get('/showtimes', [API\ShowtimeController::class, 'adminIndex']);
            Route::post('/showtimes', [API\ShowtimeController::class, 'store']);
            Route::put('/showtimes/{id}', [API\ShowtimeController::class, 'update']);
            Route::delete('/showtimes/{id}', [API\ShowtimeController::class, 'destroy']);
            
            // Booking management
            Route::get('/bookings', [API\BookingController::class, 'adminIndex']);
            Route::put('/bookings/{id}', [API\BookingController::class, 'update']);
            Route::delete('/bookings/{id}', [API\BookingController::class, 'destroy']);
            
            // User management
            Route::get('/users', [API\UserController::class, 'index']);
            Route::get('/users/{id}', [API\UserController::class, 'show']);
            Route::put('/users/{id}', [API\UserController::class, 'update']);
            Route::delete('/users/{id}', [API\UserController::class, 'destroy']);
            
            // File upload
            Route::post('/upload/movie-poster', [API\MovieController::class, 'uploadPoster']);
            
            // API Monitoring (Admin only) - Enhanced in v2
            Route::get('/monitoring/usage-stats', [\App\Http\Controllers\API\ApiMonitoringController::class, 'getUsageStats']);
            Route::get('/monitoring/popular-endpoints', [\App\Http\Controllers\API\ApiMonitoringController::class, 'getPopularEndpoints']);
            Route::get('/monitoring/health-metrics', [\App\Http\Controllers\API\ApiMonitoringController::class, 'getHealthMetrics']);
            Route::get('/monitoring/deprecation-info', [\App\Http\Controllers\API\ApiMonitoringController::class, 'getDeprecationInfo']);
            Route::get('/monitoring/version-comparison', [\App\Http\Controllers\API\ApiMonitoringController::class, 'getVersionComparison']);
            
            // Rate Limiting Management (Admin only) - Enhanced in v2
            Route::get('/rate-limiting/analytics', [API\RateLimitingController::class, 'getAnalytics']);
            Route::get('/rate-limiting/configuration', [API\RateLimitingController::class, 'getConfiguration']);
            Route::get('/rate-limiting/health', [API\RateLimitingController::class, 'getHealthStatus']);
            Route::post('/rate-limiting/reset', [API\RateLimitingController::class, 'resetClientLimits']);
            Route::get('/rate-limiting/client-status', [API\RateLimitingController::class, 'getClientStatus']);
            
            // API Response Caching Management (Admin only) - Enhanced in v2
            Route::get('/caching/statistics', [API\CachingController::class, 'getStatistics']);
            Route::get('/caching/health', [API\CachingController::class, 'getHealthStatus']);
            Route::post('/caching/invalidate-tags', [API\CachingController::class, 'invalidateByTags']);
            Route::post('/caching/invalidate-events', [API\CachingController::class, 'invalidateByEvent']);
            Route::post('/caching/clear-all', [API\CachingController::class, 'clearAllCache']);
            Route::post('/caching/warmup', [API\CachingController::class, 'warmupCache']);
            Route::get('/caching/performance-metrics', [API\CachingController::class, 'getPerformanceMetrics']);
            Route::post('/caching/refresh-endpoint', [API\CachingController::class, 'refreshEndpointCache']);
        });
    });
});

// API Documentation endpoints (version-agnostic)
Route::get('/docs/openapi.json', function () {
    $service = app(\App\Services\ApiDocumentationService::class);
    return response()->json($service->generateOpenApiSpec());
})->name('api.docs.json');

Route::get('/docs/openapi.yaml', function () {
    $service = app(\App\Services\ApiDocumentationService::class);
    $spec = $service->generateOpenApiSpec();
    return response(\Symfony\Component\Yaml\Yaml::dump($spec, 4, 2))
        ->header('Content-Type', 'application/x-yaml');
})->name('api.docs.yaml');

// Health endpoint (version-agnostic)
Route::get('/health', [API\HealthController::class, 'index'])->name('api.health');

// Rate limiting status endpoint (version-agnostic)
Route::get('/rate-limiting/status', [API\RateLimitingController::class, 'getClientStatus'])->middleware(['auth:sanctum', 'advanced.rate.limit']);