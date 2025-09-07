<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\MovieController;
use App\Http\Controllers\API\TheaterController;
use App\Http\Controllers\API\ShowtimeController;
use App\Http\Controllers\API\BookingController;
use App\Http\Controllers\API\ReviewController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\ReportController;
use App\Http\Controllers\API\HealthController;
use App\Http\Controllers\API\QrCodeController;
use App\Http\Controllers\API\RateLimitingController;
use App\Http\Controllers\API\CachingController;

// Simple test routes without complex middleware
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is working!',
        'timestamp' => now()->toISOString()
    ]);
});

Route::get('/test/movies', [MovieController::class, 'index']);
Route::get('/test/movies/{id}', [MovieController::class, 'show']);
Route::get('/test/theaters', [TheaterController::class, 'index']);
Route::get('/test/theaters/{id}', [TheaterController::class, 'show']);
Route::get('/test/showtimes', [ShowtimeController::class, 'index']);
Route::post('/test/auth/login', [AuthController::class, 'login']);

// Simple working API v1 routes (without problematic middleware)
Route::prefix('v1')->group(function () {
    // Auth routes
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
    
    // Public routes
    Route::get('/movies', [MovieController::class, 'index']);
    Route::get('/movies/{id}', [MovieController::class, 'show']);
    Route::get('/movies/{id}/showtimes', [MovieController::class, 'showtimes']);
    Route::get('/movies/{id}/reviews', [MovieController::class, 'reviews']);
    
    Route::get('/theaters', [TheaterController::class, 'index']);
    Route::get('/theaters/{id}', [TheaterController::class, 'show']);
    
    Route::get('/showtimes', [ShowtimeController::class, 'index']);
    Route::get('/showtimes/{id}', [ShowtimeController::class, 'show']);
    Route::get('/showtimes/{id}/seats', [ShowtimeController::class, 'seats']);
    
    // Protected routes (require authentication)
    Route::middleware('auth:sanctum')->group(function () {
        // User profile routes
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
        Route::put('/auth/change-password', [AuthController::class, 'changePassword']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        
        // Booking routes
        Route::post('/bookings', [BookingController::class, 'store']);
        Route::get('/user/bookings', [BookingController::class, 'userBookings']);
        Route::get('/bookings/{id}', [BookingController::class, 'show']);
        Route::put('/bookings/{id}/cancel', [BookingController::class, 'cancel']);
        
        // Review routes
        Route::post('/movies/{id}/reviews', [ReviewController::class, 'store']);
        Route::put('/reviews/{id}', [ReviewController::class, 'update']);
        Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);
        
        // Admin routes
        Route::prefix('admin')->middleware('admin')->group(function () {
            Route::get('/dashboard/stats', [ReportController::class, 'dashboard']);
            Route::get('/movies', [MovieController::class, 'adminIndex']);
            Route::post('/movies', [MovieController::class, 'store']);
            Route::put('/movies/{id}', [MovieController::class, 'update']);
            Route::delete('/movies/{id}', [MovieController::class, 'destroy']);
            
            Route::get('/theaters', [TheaterController::class, 'adminIndex']);
            Route::post('/theaters', [TheaterController::class, 'store']);
            Route::put('/theaters/{id}', [TheaterController::class, 'update']);
            Route::delete('/theaters/{id}', [TheaterController::class, 'destroy']);
            
            Route::get('/showtimes', [ShowtimeController::class, 'adminIndex']);
            Route::post('/showtimes', [ShowtimeController::class, 'store']);
            Route::put('/showtimes/{id}', [ShowtimeController::class, 'update']);
            Route::delete('/showtimes/{id}', [ShowtimeController::class, 'destroy']);
            
            Route::get('/bookings', [BookingController::class, 'adminIndex']);
            Route::put('/bookings/{id}', [BookingController::class, 'update']);
            Route::delete('/bookings/{id}', [BookingController::class, 'destroy']);
        });
    });
});

// Complex middleware API v1 routes (with issues) - DISABLED
/*
Route::prefix('v1')->middleware(['api.versioning', 'advanced.rate.limit', 'api.cache'])->group(function () {
    // Health check routes
    Route::get('/health', [HealthController::class, 'index']);
    Route::get('/health/redis', [HealthController::class, 'redis']);
    Route::get('/health/seat-locking', [HealthController::class, 'seatLockingStats']);
    Route::get('/seat-locking/health', [HealthController::class, 'seatLockingHealth']);
    
    // Auth routes with advanced rate limiting (handled by middleware)
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
    
    // Public routes
    Route::get('/movies', [MovieController::class, 'index']);
    Route::get('/movies/{id}', [MovieController::class, 'show']);
    Route::get('/movies/{id}/showtimes', [MovieController::class, 'showtimes']);
    Route::get('/movies/{id}/reviews', [MovieController::class, 'reviews']);
    
    Route::get('/theaters', [TheaterController::class, 'index']);
    Route::get('/theaters/{id}', [TheaterController::class, 'show']);
    
    Route::get('/showtimes', [ShowtimeController::class, 'index']);
    Route::get('/showtimes/{id}', [ShowtimeController::class, 'show']);
    Route::get('/showtimes/{id}/seats', [ShowtimeController::class, 'seats']);
    Route::get('/showtimes/{id}/seat-status', [ShowtimeController::class, 'seatStatus']);
    
    // QR Code test endpoints (development only)
    Route::post('/qr/test-generate', [QrCodeController::class, 'testGenerate']);
    Route::post('/qr/verify', [QrCodeController::class, 'verify']);
    
    // Protected routes (require authentication)
    Route::middleware('auth:sanctum')->group(function () {
        // User profile routes
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
        Route::put('/auth/change-password', [AuthController::class, 'changePassword']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        
        // User booking routes (rate limiting handled by middleware)
        Route::post('/bookings', [BookingController::class, 'store']);
        Route::post('/bookings/{id}/payment', [BookingController::class, 'processPayment']);
        Route::post('/showtimes/{id}/seats/lock', [ShowtimeController::class, 'lockSeats']);
        
        // Other user routes
        Route::get('/user/bookings', [BookingController::class, 'userBookings']);
        Route::get('/bookings/{id}', [BookingController::class, 'show']);
        Route::put('/bookings/{id}/cancel', [BookingController::class, 'cancel']);
        
        // Payment routes
        Route::get('/bookings/{id}/payment/status', [BookingController::class, 'getPaymentStatus']);
        Route::get('/bookings/{id}/ticket', [BookingController::class, 'getTicket']);
        Route::post('/bookings/{id}/resend-email', [BookingController::class, 'resendEmail']);
        
        // E-ticket management routes
        Route::post('/bookings/{id}/generate-ticket', [BookingController::class, 'generateETicket']);
        Route::post('/tickets/verify', [BookingController::class, 'verifyTicket']);
        
        // Seat management - Enhanced with Redis locking
        Route::delete('/showtimes/{id}/seats/unlock', [ShowtimeController::class, 'unlockSeats']);
        Route::put('/showtimes/{id}/seats/extend-lock', [ShowtimeController::class, 'extendLock']);
        
        // Review routes
        Route::post('/movies/{id}/reviews', [ReviewController::class, 'store']);
        Route::put('/reviews/{id}', [ReviewController::class, 'update']);
        Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);
        
        // File upload routes (admin only)
        Route::middleware('admin')->group(function () {
            Route::post('/movies/upload-poster', [MovieController::class, 'uploadPoster']);
        });
        
        // Admin routes
        Route::prefix('admin')->middleware('admin')->group(function () {
            // Admin dashboard
            Route::get('/dashboard', [ReportController::class, 'dashboard']);
            Route::get('/reports/revenue', [ReportController::class, 'revenue']);
            Route::get('/reports/bookings', [ReportController::class, 'bookings']);
            Route::get('/reports/movies', [ReportController::class, 'movies']);
            Route::get('/reports/users', [ReportController::class, 'users']);
            Route::get('/reports/payment-analytics', [ReportController::class, 'paymentAnalytics']);
            Route::get('/reports/ticket-analytics', [ReportController::class, 'ticketAnalytics']);
            
            // Movie management
            Route::get('/movies', [MovieController::class, 'adminIndex']);
            Route::post('/movies', [MovieController::class, 'store']);
            Route::put('/movies/{id}', [MovieController::class, 'update']);
            Route::delete('/movies/{id}', [MovieController::class, 'destroy']);
            
            // Theater management
            Route::get('/theaters', [TheaterController::class, 'adminIndex']);
            Route::post('/theaters', [TheaterController::class, 'store']);
            Route::put('/theaters/{id}', [TheaterController::class, 'update']);
            Route::delete('/theaters/{id}', [TheaterController::class, 'destroy']);
            
            // Showtime management
            Route::get('/showtimes', [ShowtimeController::class, 'adminIndex']);
            Route::post('/showtimes', [ShowtimeController::class, 'store']);
            Route::put('/showtimes/{id}', [ShowtimeController::class, 'update']);
            Route::delete('/showtimes/{id}', [ShowtimeController::class, 'destroy']);
            
            // Booking management
            Route::get('/bookings', [BookingController::class, 'adminIndex']);
            Route::put('/bookings/{id}', [BookingController::class, 'update']);
            Route::delete('/bookings/{id}', [BookingController::class, 'destroy']);
            
            // Payment management
            Route::get('/payments', [BookingController::class, 'adminPayments']);
            Route::get('/payments/{id}', [BookingController::class, 'getPaymentDetails']);
            Route::put('/payments/{id}/status', [BookingController::class, 'updatePaymentStatus']);
            Route::post('/payments/{id}/refund', [BookingController::class, 'processRefund']);
            Route::get('/payments/statistics', [BookingController::class, 'getPaymentStats']);
            
            // E-ticket management
            Route::get('/tickets', [BookingController::class, 'adminTickets']);
            Route::post('/tickets/{id}/regenerate', [BookingController::class, 'adminRegenerateTicket']);
            Route::get('/tickets/statistics', [BookingController::class, 'getTicketStats']);
            
            // Review management
            Route::get('/reviews', [ReviewController::class, 'adminIndex']);
            Route::put('/reviews/{id}/approve', [ReviewController::class, 'approve']);
            Route::put('/reviews/{id}/reject', [ReviewController::class, 'reject']);
            Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);
            
            // User management
            Route::get('/users', [UserController::class, 'index']);
            Route::get('/users/{id}', [UserController::class, 'show']);
            Route::put('/users/{id}', [UserController::class, 'update']);
            Route::delete('/users/{id}', [UserController::class, 'destroy']);
            
            // File upload
            Route::post('/upload/movie-poster', [MovieController::class, 'uploadPoster']);
            
            // API Monitoring (Admin only)
            Route::get('/monitoring/usage-stats', [\App\Http\Controllers\API\ApiMonitoringController::class, 'getUsageStats']);
            Route::get('/monitoring/popular-endpoints', [\App\Http\Controllers\API\ApiMonitoringController::class, 'getPopularEndpoints']);
            Route::get('/monitoring/health-metrics', [\App\Http\Controllers\API\ApiMonitoringController::class, 'getHealthMetrics']);
            Route::get('/monitoring/deprecation-info', [\App\Http\Controllers\API\ApiMonitoringController::class, 'getDeprecationInfo']);
            Route::get('/monitoring/version-comparison', [\App\Http\Controllers\API\ApiMonitoringController::class, 'getVersionComparison']);
            
            // Rate Limiting Management (Admin only)
            Route::get('/rate-limiting/analytics', [RateLimitingController::class, 'getAnalytics']);
            Route::get('/rate-limiting/configuration', [RateLimitingController::class, 'getConfiguration']);
            Route::get('/rate-limiting/health', [RateLimitingController::class, 'getHealthStatus']);
            Route::post('/rate-limiting/reset', [RateLimitingController::class, 'resetClientLimits']);
            
            // API Response Caching Management (Admin only)
            Route::get('/caching/statistics', [CachingController::class, 'getStatistics']);
            Route::get('/caching/health', [CachingController::class, 'getHealthStatus']);
            Route::post('/caching/invalidate-tags', [CachingController::class, 'invalidateByTags']);
            Route::post('/caching/invalidate-events', [CachingController::class, 'invalidateByEvent']);
            Route::post('/caching/clear-all', [CachingController::class, 'clearAllCache']);
            Route::post('/caching/warmup', [CachingController::class, 'warmupCache']);
        });
    });
});
*/

// API Version 2 (Current)
Route::prefix('v2')->middleware(['api.versioning', 'advanced.rate.limit', 'api.cache'])->group(function () {
    // Health check routes
    Route::get('/health', [HealthController::class, 'index']);
    Route::get('/health/redis', [HealthController::class, 'redis']);
    Route::get('/health/seat-locking', [HealthController::class, 'seatLockingStats']);
    Route::get('/seat-locking/health', [HealthController::class, 'seatLockingHealth']);
    
    // Auth routes with advanced rate limiting (handled by middleware)
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
    
    // Public routes with enhanced features
    Route::get('/movies', [MovieController::class, 'index']);
    Route::get('/movies/{id}', [MovieController::class, 'show']);
    Route::get('/movies/{id}/showtimes', [MovieController::class, 'showtimes']);
    Route::get('/movies/{id}/reviews', [MovieController::class, 'reviews']);
    
    Route::get('/theaters', [TheaterController::class, 'index']);
    Route::get('/theaters/{id}', [TheaterController::class, 'show']);
    
    Route::get('/showtimes', [ShowtimeController::class, 'index']);
    Route::get('/showtimes/{id}', [ShowtimeController::class, 'show']);
    Route::get('/showtimes/{id}/seats', [ShowtimeController::class, 'seats']);
    Route::get('/showtimes/{id}/seat-status', [ShowtimeController::class, 'seatStatus']);
    
    // QR Code endpoints
    Route::post('/qr/test-generate', [QrCodeController::class, 'testGenerate']);
    Route::post('/qr/verify', [QrCodeController::class, 'verify']);
    
    // Protected routes (require authentication)
    Route::middleware('auth:sanctum')->group(function () {
        // User profile routes
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
        Route::put('/auth/change-password', [AuthController::class, 'changePassword']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        
        // User booking routes (rate limiting handled by middleware)
        Route::post('/bookings', [BookingController::class, 'store']);
        Route::post('/bookings/{id}/payment', [BookingController::class, 'processPayment']);
        Route::post('/showtimes/{id}/seats/lock', [ShowtimeController::class, 'lockSeats']);
        
        // Other user routes
        Route::get('/user/bookings', [BookingController::class, 'userBookings']);
        Route::get('/bookings/{id}', [BookingController::class, 'show']);
        Route::put('/bookings/{id}/cancel', [BookingController::class, 'cancel']);
        
        // Payment routes
        Route::get('/bookings/{id}/payment/status', [BookingController::class, 'getPaymentStatus']);
        Route::get('/bookings/{id}/ticket', [BookingController::class, 'getTicket']);
        Route::post('/bookings/{id}/resend-email', [BookingController::class, 'resendEmail']);
        
        // E-ticket management routes
        Route::post('/bookings/{id}/generate-ticket', [BookingController::class, 'generateETicket']);
        Route::post('/tickets/verify', [BookingController::class, 'verifyTicket']);
        
        // Seat management - Enhanced with Redis locking
        Route::delete('/showtimes/{id}/seats/unlock', [ShowtimeController::class, 'unlockSeats']);
        Route::put('/showtimes/{id}/seats/extend-lock', [ShowtimeController::class, 'extendLock']);
        
        // Review routes
        Route::post('/movies/{id}/reviews', [ReviewController::class, 'store']);
        Route::put('/reviews/{id}', [ReviewController::class, 'update']);
        Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);
        
        // File upload routes (admin only)
        Route::middleware('admin')->group(function () {
            Route::post('/movies/upload-poster', [MovieController::class, 'uploadPoster']);
        });
        
        // Admin routes
        Route::prefix('admin')->middleware('admin')->group(function () {
            // Admin dashboard
            Route::get('/dashboard', [ReportController::class, 'dashboard']);
            Route::get('/reports/revenue', [ReportController::class, 'revenue']);
            Route::get('/reports/bookings', [ReportController::class, 'bookings']);
            Route::get('/reports/movies', [ReportController::class, 'movies']);
            Route::get('/reports/users', [ReportController::class, 'users']);
            Route::get('/reports/payment-analytics', [ReportController::class, 'paymentAnalytics']);
            Route::get('/reports/ticket-analytics', [ReportController::class, 'ticketAnalytics']);
            
            // Movie management
            Route::get('/movies', [MovieController::class, 'adminIndex']);
            Route::post('/movies', [MovieController::class, 'store']);
            Route::put('/movies/{id}', [MovieController::class, 'update']);
            Route::delete('/movies/{id}', [MovieController::class, 'destroy']);
            
            // Theater management
            Route::get('/theaters', [TheaterController::class, 'adminIndex']);
            Route::post('/theaters', [TheaterController::class, 'store']);
            Route::put('/theaters/{id}', [TheaterController::class, 'update']);
            Route::delete('/theaters/{id}', [TheaterController::class, 'destroy']);
            
            // Showtime management
            Route::get('/showtimes', [ShowtimeController::class, 'adminIndex']);
            Route::post('/showtimes', [ShowtimeController::class, 'store']);
            Route::put('/showtimes/{id}', [ShowtimeController::class, 'update']);
            Route::delete('/showtimes/{id}', [ShowtimeController::class, 'destroy']);
            
            // Booking management
            Route::get('/bookings', [BookingController::class, 'adminIndex']);
            Route::put('/bookings/{id}', [BookingController::class, 'update']);
            Route::delete('/bookings/{id}', [BookingController::class, 'destroy']);
            
            // Payment management
            Route::get('/payments', [BookingController::class, 'adminPayments']);
            Route::get('/payments/{id}', [BookingController::class, 'getPaymentDetails']);
            Route::put('/payments/{id}/status', [BookingController::class, 'updatePaymentStatus']);
            Route::post('/payments/{id}/refund', [BookingController::class, 'processRefund']);
            Route::get('/payments/statistics', [BookingController::class, 'getPaymentStats']);
            
            // E-ticket management
            Route::get('/tickets', [BookingController::class, 'adminTickets']);
            Route::post('/tickets/{id}/regenerate', [BookingController::class, 'adminRegenerateTicket']);
            Route::get('/tickets/statistics', [BookingController::class, 'getTicketStats']);
            
            // Review management
            Route::get('/reviews', [ReviewController::class, 'adminIndex']);
            Route::put('/reviews/{id}/approve', [ReviewController::class, 'approve']);
            Route::put('/reviews/{id}/reject', [ReviewController::class, 'reject']);
            Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);
            
            // User management
            Route::get('/users', [UserController::class, 'index']);
            Route::get('/users/{id}', [UserController::class, 'show']);
            Route::put('/users/{id}', [UserController::class, 'update']);
            Route::delete('/users/{id}', [UserController::class, 'destroy']);
            
            // File upload
            Route::post('/upload/movie-poster', [MovieController::class, 'uploadPoster']);
            
            // API Monitoring (Admin only) - Enhanced in v2
            Route::get('/monitoring/usage-stats', [\App\Http\Controllers\API\ApiMonitoringController::class, 'getUsageStats']);
            Route::get('/monitoring/popular-endpoints', [\App\Http\Controllers\API\ApiMonitoringController::class, 'getPopularEndpoints']);
            Route::get('/monitoring/health-metrics', [\App\Http\Controllers\API\ApiMonitoringController::class, 'getHealthMetrics']);
            Route::get('/monitoring/deprecation-info', [\App\Http\Controllers\API\ApiMonitoringController::class, 'getDeprecationInfo']);
            Route::get('/monitoring/version-comparison', [\App\Http\Controllers\API\ApiMonitoringController::class, 'getVersionComparison']);
            
            // Rate Limiting Management (Admin only) - Enhanced in v2
            Route::get('/rate-limiting/analytics', [RateLimitingController::class, 'getAnalytics']);
            Route::get('/rate-limiting/configuration', [RateLimitingController::class, 'getConfiguration']);
            Route::get('/rate-limiting/health', [RateLimitingController::class, 'getHealthStatus']);
            Route::post('/rate-limiting/reset', [RateLimitingController::class, 'resetClientLimits']);
            Route::get('/rate-limiting/client-status', [RateLimitingController::class, 'getClientStatus']);
            
            // API Response Caching Management (Admin only) - Enhanced in v2
            Route::get('/caching/statistics', [CachingController::class, 'getStatistics']);
            Route::get('/caching/health', [CachingController::class, 'getHealthStatus']);
            Route::post('/caching/invalidate-tags', [CachingController::class, 'invalidateByTags']);
            Route::post('/caching/invalidate-events', [CachingController::class, 'invalidateByEvent']);
            Route::post('/caching/clear-all', [CachingController::class, 'clearAllCache']);
            Route::post('/caching/warmup', [CachingController::class, 'warmupCache']);
            Route::get('/caching/performance-metrics', [CachingController::class, 'getPerformanceMetrics']);
            Route::post('/caching/refresh-endpoint', [CachingController::class, 'refreshEndpointCache']);
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
Route::get('/health', [HealthController::class, 'index'])->name('api.health');

// Rate limiting status endpoint (version-agnostic)
Route::get('/rate-limiting/status', [RateLimitingController::class, 'getClientStatus'])->middleware(['auth:sanctum', 'advanced.rate.limit']); 