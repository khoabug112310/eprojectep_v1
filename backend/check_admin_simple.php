<?php

require_once 'vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

$app = Application::configure(basePath: __DIR__)
    ->withRouting(
        web: __DIR__.'/routes/web.php',
        api: __DIR__.'/routes/api.php',
        commands: __DIR__.'/routes/console.php',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();

$app->bootConsole();

use App\Models\User;

echo "Checking admin users...\n";

try {
    $adminUsers = User::where('role', 'admin')->get(['id', 'name', 'email', 'role']);
    
    if ($adminUsers->count() > 0) {
        echo "Found " . $adminUsers->count() . " admin users:\n";
        foreach ($adminUsers as $user) {
            echo "ID: " . $user->id . " - Name: " . $user->name . " - Email: " . $user->email . " - Role: " . $user->role . "\n";
        }
    } else {
        echo "No admin users found.\n";
        
        // Check all users
        $allUsers = User::all(['id', 'name', 'email', 'role']);
        echo "Total users: " . $allUsers->count() . "\n";
        foreach ($allUsers as $user) {
            echo "ID: " . $user->id . " - Name: " . $user->name . " - Email: " . $user->email . " - Role: " . $user->role . "\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}