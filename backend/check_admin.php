<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Checking for admin users:" . PHP_EOL;

// Check all users
$users = App\Models\User::all();
echo "Total users: " . $users->count() . PHP_EOL;

// Check admin users
$admins = App\Models\User::where('role', 'admin')->get();
echo "Admin users: " . $admins->count() . PHP_EOL;

foreach($admins as $admin) {
    echo "- " . $admin->email . " (" . $admin->name . ")" . PHP_EOL;
}

// Create admin user if none exists
if ($admins->count() === 0) {
    echo "Creating admin user..." . PHP_EOL;
    
    $admin = App\Models\User::create([
        'name' => 'Admin User',
        'email' => 'admin@cinebook.com',
        'password' => bcrypt('admin123'),
        'role' => 'admin'
    ]);
    
    echo "Admin user created: " . $admin->email . " (ID: " . $admin->id . ")" . PHP_EOL;
    echo "Login credentials: admin@cinebook.com / admin123" . PHP_EOL;
}