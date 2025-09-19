<?php

require_once 'vendor/autoload.php';

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    // Test database connection
    DB::connection()->getPdo();
    echo "Database connection: OK\n";
    
    // Test if users table exists and has records
    $usersCount = DB::table('users')->count();
    echo "Users table records: $usersCount\n";
    
    // Test User model
    $user = \App\Models\User::first();
    if ($user) {
        echo "First user: " . $user->name . " (" . $user->email . ")\n";
        echo "User role: " . $user->role . "\n";
    } else {
        echo "No users found\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}