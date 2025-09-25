<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API;

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
            Route::get('/showtimes/{id}', [API\ShowtimeController::class, 'show']);
            Route::post('/showtimes', [API\ShowtimeController::class, 'store']);
            Route::put('/showtimes/{id}', [API\ShowtimeController::class, 'update']);
            Route::delete('/showtimes/{id}', [API\ShowtimeController::class, 'destroy']);
            
            Route::get('/bookings', [API\BookingController::class, 'adminIndex']);
            Route::get('/bookings/{id}', [API\BookingController::class, 'show']);
            Route::put('/bookings/{id}', [API\BookingController::class, 'update']);
            Route::delete('/bookings/{id}', [API\BookingController::class, 'destroy']);
            
            // User management
            Route::get('/users', [API\UserController::class, 'index']);
            Route::get('/users/{id}', [API\UserController::class, 'show']);
            Route::post('/users', [API\UserController::class, 'store']);
            Route::put('/users/{id}', [API\UserController::class, 'update']);
            Route::delete('/users/{id}', [API\UserController::class, 'destroy']);
        });
    });
});