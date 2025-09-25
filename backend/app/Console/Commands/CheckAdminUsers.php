<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class CheckAdminUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:check';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check admin users in the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking admin users...');
        
        $adminUsers = User::where('role', 'admin')->get(['id', 'name', 'email', 'role']);
        
        if ($adminUsers->count() > 0) {
            $this->info('Found ' . $adminUsers->count() . ' admin users:');
            foreach ($adminUsers as $user) {
                $this->line("ID: {$user->id} - Name: {$user->name} - Email: {$user->email} - Role: {$user->role}");
            }
        } else {
            $this->warn('No admin users found.');
            
            // Check all users
            $allUsers = User::all(['id', 'name', 'email', 'role']);
            $this->info('Total users: ' . $allUsers->count());
            foreach ($allUsers as $user) {
                $this->line("ID: {$user->id} - Name: {$user->name} - Email: {$user->email} - Role: {$user->role}");
            }
        }
    }
}
