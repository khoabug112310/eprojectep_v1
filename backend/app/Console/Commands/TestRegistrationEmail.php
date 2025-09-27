<?php

namespace App\Console\Commands;

use App\Mail\AccountRegistrationMail;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;

class TestRegistrationEmail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:registration-email {email} {--name= : User name} {--password= : User password}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send a test registration email to the specified email address';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $name = $this->option('name') ?? 'Test User';
        $password = $this->option('password') ?? 'testpassword123';
        
        // Create a simple user-like object
        $user = new \stdClass();
        $user->name = $name;
        $user->email = $email;
        $user->phone = '0123456789';
        
        // Send the email
        Mail::to($email)->send(new AccountRegistrationMail($user, $password));
        
        $this->info("Test registration email sent to {$email}");
        $this->info("User: {$name}");
        $this->info("Password: {$password}");
    }
}