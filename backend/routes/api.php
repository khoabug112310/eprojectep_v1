<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\MovieController;
use App\Http\Controllers\API\TheaterController;
use App\Http\Controllers\API\ShowtimeController;
use App\Http\Controllers\API\BookingController;
use App\Http\Controllers\API\ReviewController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ReportController;
use App\Http\Controllers\API\UserController;

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
        
        // User booking routes
        Route::get('/user/bookings', [BookingController::class, 'userBookings']);
        Route::get('/bookings/{id}', [BookingController::class, 'show']);
        Route::post('/bookings', [BookingController::class, 'store']);
        Route::put('/bookings/{id}/cancel', [BookingController::class, 'cancel']);
        
        // Seat management
        Route::post('/showtimes/{id}/seats/lock', [ShowtimeController::class, 'lockSeats']);
        Route::post('/showtimes/{id}/seats/release', [ShowtimeController::class, 'releaseSeats']);
        
        // Review routes
        Route::post('/movies/{id}/reviews', [ReviewController::class, 'store']);
        Route::put('/reviews/{id}', [ReviewController::class, 'update']);
        Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);
        
        // Admin routes
        Route::prefix('admin')->middleware('admin')->group(function () {
            // Admin dashboard
            Route::get('/dashboard', [ReportController::class, 'dashboard']);
            Route::get('/reports/revenue', [ReportController::class, 'revenue']);
            Route::get('/reports/bookings', [ReportController::class, 'bookings']);
            Route::get('/reports/movies', [ReportController::class, 'movies']);
            Route::get('/reports/users', [ReportController::class, 'users']);
            
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
        });
    });
}); 