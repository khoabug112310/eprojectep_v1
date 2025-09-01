<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Movie;
use App\Models\Theater;
use App\Models\Showtime;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create default admin user
        User::firstOrCreate(
            ['email' => 'admin@cinebook.com'],
            [
                'name' => 'CineBook Admin',
                'email' => 'admin@cinebook.com',
                'phone' => '0999999999',
                'password' => bcrypt('admin123'),
                'role' => 'admin',
                'preferred_city' => 'TP.HCM',
                'status' => 'active',
            ]
        );

        // Create default test user
        User::firstOrCreate(
            ['email' => 'user@cinebook.com'],
            [
                'name' => 'Test User',
                'email' => 'user@cinebook.com',
                'phone' => '0123456789',
                'password' => bcrypt('user123'),
                'role' => 'user',
                'preferred_city' => 'TP.HCM',
                'status' => 'active',
            ]
        );

        // Run individual seeders in proper order
        $this->call([
            // Step 1: Create base data (movies and theaters)
            MovieSeeder::class,
            TheaterSeeder::class,
            
            // Step 2: Create dependent data (showtimes depend on movies and theaters)
            ShowtimeSeeder::class,
            
            // Step 3: Create user-dependent data (reviews depend on users and movies)
            ReviewSeeder::class,
        ]);

        $this->command->info('Database seeding completed successfully!');
        $this->command->info('==================================================');
        $this->command->info('Sample Data Created:');
        $this->command->info('- Movies: ' . Movie::count());
        $this->command->info('- Theaters: ' . Theater::count());
        $this->command->info('- Showtimes: ' . Showtime::count());
        $this->command->info('- Users: ' . User::count());
        $this->command->info('==================================================');
        $this->command->info('Default Login Credentials:');
        $this->command->info('Admin: admin@cinebook.com / admin123');
        $this->command->info('User: user@cinebook.com / user123');
        $this->command->info('==================================================');
    }
}
