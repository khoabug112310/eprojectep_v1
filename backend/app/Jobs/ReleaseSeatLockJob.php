<?php

namespace App\Jobs;

use App\Services\SeatLockingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Exception;

class ReleaseSeatLockJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The maximum number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 120;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        // This job doesn't need any parameters as it cleans up all expired locks
    }

    /**
     * Execute the job.
     */
    public function handle(SeatLockingService $seatLockingService): void
    {
        try {
            Log::info('Starting seat lock cleanup job');
            
            $result = $seatLockingService->cleanupExpiredLocks();
            
            if ($result['success']) {
                Log::info('Seat lock cleanup completed successfully', [
                    'total_checked' => $result['total_checked'],
                    'cleaned_locks' => $result['cleaned'],
                    'errors' => $result['errors']
                ]);
                
                // If there were many locks cleaned, it might indicate a problem
                if ($result['cleaned'] > 50) {
                    Log::warning('High number of expired locks cleaned', [
                        'cleaned_count' => $result['cleaned'],
                        'suggestion' => 'Consider checking if users are abandoning bookings'
                    ]);
                }
            } else {
                Log::error('Seat lock cleanup failed', [
                    'error' => $result['error'] ?? 'Unknown error'
                ]);
                
                throw new Exception('Cleanup failed: ' . ($result['error'] ?? 'Unknown error'));
            }
            
        } catch (Exception $e) {
            Log::error('Seat lock cleanup job failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Re-throw to mark job as failed
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(Exception $exception): void
    {
        Log::critical('Seat lock cleanup job failed permanently', [
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts(),
            'max_tries' => $this->tries
        ]);
        
        // Could send notification to administrators here
        // NotificationService::notifyAdmins('Seat lock cleanup job failed', $exception);
    }

    /**
     * Get the tags that should be assigned to the job.
     *
     * @return array<int, string>
     */
    public function tags(): array
    {
        return ['seat-locking', 'cleanup', 'maintenance'];
    }
}