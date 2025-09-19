<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

// Test route to check if basic Laravel functionality is working
Route::get('/test-users', function () {
    try {
        $users = \App\Models\User::all();
        return response()->json([
            'success' => true,
            'count' => $users->count(),
            'message' => 'Successfully retrieved users'
        ]);
    } catch (Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

Route::get('/test', function () {
    return response()->json(['message' => 'Test route working']);
});

// Include QR test routes
require_once __DIR__ . '/qr_test.php';