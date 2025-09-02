<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Jobs\ReleaseSeatLockJob;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule seat lock cleanup every 5 minutes
Schedule::job(ReleaseSeatLockJob::class)
    ->everyFiveMinutes()
    ->name('seat-lock-cleanup')
    ->withoutOverlapping();
