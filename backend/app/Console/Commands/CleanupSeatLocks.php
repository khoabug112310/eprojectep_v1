<?php

namespace App\Console\Commands;

use App\Jobs\ReleaseSeatLockJob;
use App\Services\SeatLockingService;
use Illuminate\Console\Command;

class CleanupSeatLocks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'seats:cleanup 
                            {--dry-run : Show what would be cleaned without actually doing it}
                            {--stats : Show current lock statistics}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up expired seat locks and show statistics';

    /**
     * Execute the console command.
     */
    public function handle(SeatLockingService $seatLockingService)
    {
        if ($this->option('stats')) {
            $this->showStatistics($seatLockingService);
            return Command::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $this->dryRun($seatLockingService);
            return Command::SUCCESS;
        }

        $this->info('Starting seat lock cleanup...');
        
        // Dispatch the cleanup job
        ReleaseSeatLockJob::dispatch();
        
        $this->info('Cleanup job dispatched successfully!');
        
        // Show current statistics
        $this->newLine();
        $this->showStatistics($seatLockingService);
        
        return Command::SUCCESS;
    }
    
    /**
     * Show current lock statistics
     */
    private function showStatistics(SeatLockingService $seatLockingService)
    {
        $this->info('📊 Current Seat Lock Statistics');
        $this->line('═══════════════════════════════');
        
        $stats = $seatLockingService->getLockStatistics();
        
        if (!$stats['success']) {
            $this->error('❌ Failed to retrieve statistics: ' . ($stats['error'] ?? 'Unknown error'));
            return;
        }
        
        $statistics = $stats['statistics'];
        
        $this->line("🔒 Total Active Locks: {$statistics['total_locks']}");
        
        if (!empty($statistics['locks_by_showtime'])) {
            $this->newLine();
            $this->line('📅 Locks by Showtime:');
            foreach ($statistics['locks_by_showtime'] as $showtimeId => $count) {
                $this->line("   Showtime #{$showtimeId}: {$count} locks");
            }
        }
        
        if (!empty($statistics['locks_by_user'])) {
            $this->newLine();
            $this->line('👤 Locks by User:');
            foreach ($statistics['locks_by_user'] as $userId => $count) {
                $this->line("   User #{$userId}: {$count} locks");
            }
        }
        
        $this->newLine();
        $this->line("📝 Generated at: {$stats['generated_at']}");
    }
    
    /**
     * Show what would be cleaned without actually doing it
     */
    private function dryRun(SeatLockingService $seatLockingService)
    {
        $this->info('🔍 Dry Run - Seat Lock Cleanup Analysis');
        $this->line('════════════════════════════════════════');
        
        // Get current statistics
        $stats = $seatLockingService->getLockStatistics();
        
        if (!$stats['success']) {
            $this->error('❌ Failed to analyze locks: ' . ($stats['error'] ?? 'Unknown error'));
            return;
        }
        
        $totalLocks = $stats['statistics']['total_locks'];
        
        $this->line("📊 Total locks found: {$totalLocks}");
        
        if ($totalLocks === 0) {
            $this->info('✨ No locks to clean up!');
            return;
        }
        
        // Test Redis connection
        $connectionTest = $seatLockingService->testConnection();
        
        if ($connectionTest['success']) {
            $this->line('✅ Redis connection: OK');
        } else {
            $this->error('❌ Redis connection: FAILED');
            $this->error('   Error: ' . $connectionTest['message']);
            return;
        }
        
        $this->newLine();
        $this->info('💡 Run without --dry-run to perform actual cleanup');
        
        // Show what the cleanup would do
        $this->line('🧹 Cleanup process would:');
        $this->line('   1. Check each lock for expiration');
        $this->line('   2. Remove expired locks from Redis');
        $this->line('   3. Log cleanup statistics');
        $this->line('   4. Report any errors encountered');
    }
}