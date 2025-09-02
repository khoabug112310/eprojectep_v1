<?php

namespace App\Console\Commands;

use App\Services\DatabaseMigrationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class DatabaseMigrationManager extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:migration-manager 
                          {action : Action to perform (backup|validate|rollback|integrity)}
                          {--migration= : Migration name for rollback operations}
                          {--backup-name= : Custom backup name}
                          {--dry-run : Simulate rollback without making changes}
                          {--force : Force rollback even with warnings}
                          {--preserve-data : Preserve critical data during rollback}
                          {--skip-backup : Skip backup creation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Manage database migrations with safety checks and rollback capabilities';

    protected DatabaseMigrationService $migrationService;

    /**
     * Create a new command instance.
     */
    public function __construct(DatabaseMigrationService $migrationService)
    {
        parent::__construct();
        $this->migrationService = $migrationService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $action = $this->argument('action');

        $this->info("🚀 Database Migration Manager - Action: {$action}");
        $this->newLine();

        try {
            switch ($action) {
                case 'backup':
                    return $this->handleBackup();
                
                case 'validate':
                    return $this->handleValidation();
                
                case 'rollback':
                    return $this->handleRollback();
                
                case 'integrity':
                    return $this->handleIntegrityCheck();
                
                default:
                    $this->error("❌ Unknown action: {$action}");
                    $this->line('Available actions: backup, validate, rollback, integrity');
                    return Command::FAILURE;
            }
        } catch (\Exception $e) {
            $this->error("❌ Command failed: {$e->getMessage()}");
            Log::error('Database migration manager command failed', [
                'action' => $action,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return Command::FAILURE;
        }
    }

    /**
     * Handle backup creation
     */
    protected function handleBackup(): int
    {
        $backupName = $this->option('backup-name');
        
        $this->info('📦 Creating database backup...');
        
        $result = $this->migrationService->createBackup($backupName);
        
        if ($result['success']) {
            $this->info("✅ Backup created successfully!");
            $this->table(['Property', 'Value'], [
                ['Backup Name', $result['backup_name']],
                ['File Path', $result['backup_path']],
                ['File Size', $this->formatBytes($result['file_size'])],
                ['Created At', $result['created_at']]
            ]);
            return Command::SUCCESS;
        } else {
            $this->error("❌ Backup failed: {$result['error']}");
            return Command::FAILURE;
        }
    }

    /**
     * Handle rollback validation
     */
    protected function handleValidation(): int
    {
        $migration = $this->option('migration');
        
        if (!$migration) {
            $this->error('❌ Migration name is required for validation');
            $this->line('Use: --migration=migration_name');
            return Command::FAILURE;
        }
        
        $this->info("🔍 Validating rollback safety for: {$migration}");
        
        $result = $this->migrationService->validateRollbackSafety($migration);
        
        // Display validation results
        $this->displayValidationResults($result);
        
        return $result['safe'] ? Command::SUCCESS : Command::FAILURE;
    }

    /**
     * Handle migration rollback
     */
    protected function handleRollback(): int
    {
        $migration = $this->option('migration');
        
        if (!$migration) {
            $this->error('❌ Migration name is required for rollback');
            $this->line('Use: --migration=migration_name');
            return Command::FAILURE;
        }
        
        // Prepare rollback options
        $options = [
            'create_backup' => !$this->option('skip-backup'),
            'preserve_critical_data' => $this->option('preserve-data'),
            'validate_before_rollback' => true,
            'dry_run' => $this->option('dry-run')
        ];
        
        if ($options['dry_run']) {
            $this->warn('🔄 Running in DRY RUN mode - no actual changes will be made');
        }
        
        // Pre-rollback validation
        if (!$this->option('force')) {
            $this->info('🔍 Performing pre-rollback validation...');
            $validation = $this->migrationService->validateRollbackSafety($migration);
            
            if (!$validation['safe']) {
                $this->displayValidationResults($validation);
                
                if (!$this->confirm('⚠️  Validation failed. Do you want to continue anyway?')) {
                    $this->info('🚫 Rollback cancelled by user');
                    return Command::FAILURE;
                }
            } else {
                $this->info('✅ Pre-rollback validation passed');
            }
        }
        
        // Confirm rollback
        if (!$options['dry_run'] && !$this->option('force')) {
            $confirmMessage = "Are you sure you want to rollback migration: {$migration}?";
            if (!$this->confirm($confirmMessage)) {
                $this->info('🚫 Rollback cancelled by user');
                return Command::FAILURE;
            }
        }
        
        // Perform rollback
        $this->info("🔄 Performing migration rollback: {$migration}");
        $progressBar = $this->output->createProgressBar(5);
        
        $result = $this->migrationService->performSafeRollback($migration, $options);
        
        $progressBar->finish();
        $this->newLine(2);
        
        // Display rollback results
        $this->displayRollbackResults($result);
        
        return $result['success'] ? Command::SUCCESS : Command::FAILURE;
    }

    /**
     * Handle database integrity check
     */
    protected function handleIntegrityCheck(): int
    {
        $this->info('🔍 Performing database integrity check...');
        
        $result = $this->migrationService->verifyDatabaseIntegrity();
        
        if ($result['valid']) {
            $this->info('✅ Database integrity check passed');
            $this->line("Checked at: {$result['checked_at']}");
        } else {
            $this->error('❌ Database integrity issues found:');
            foreach ($result['issues'] as $issue) {
                $this->line("  • {$issue}");
            }
        }
        
        return $result['valid'] ? Command::SUCCESS : Command::FAILURE;
    }

    /**
     * Display validation results in a formatted way
     */
    protected function displayValidationResults(array $result): void
    {
        $this->newLine();
        
        if ($result['safe']) {
            $this->info('✅ Rollback validation PASSED');
        } else {
            $this->error('❌ Rollback validation FAILED');
        }
        
        if (!empty($result['blockers'])) {
            $this->error('🚫 BLOCKERS:');
            foreach ($result['blockers'] as $blocker) {
                $this->line("  • {$blocker}");
            }
        }
        
        if (!empty($result['warnings'])) {
            $this->warn('⚠️  WARNINGS:');
            foreach ($result['warnings'] as $warning) {
                $this->line("  • {$warning}");
            }
        }
        
        if (!empty($result['affected_tables'])) {
            $this->line('📊 Affected Tables: ' . implode(', ', $result['affected_tables']));
        }
        
        if (isset($result['migration_details']) && $result['migration_details']) {
            $this->table(['Migration Detail', 'Value'], [
                ['ID', $result['migration_details']['id']],
                ['Migration', $result['migration_details']['migration']],
                ['Batch', $result['migration_details']['batch']],
                ['Executed At', $result['migration_details']['executed_at'] ?? 'Unknown']
            ]);
        }
    }

    /**
     * Display rollback results in a formatted way
     */
    protected function displayRollbackResults(array $result): void
    {
        $this->newLine();
        
        if ($result['success']) {
            $this->info('✅ Migration rollback completed successfully!');
        } else {
            $this->error('❌ Migration rollback failed!');
            if (isset($result['error'])) {
                $this->line("Error: {$result['error']}");
            }
        }
        
        // Display completed steps
        if (!empty($result['steps_completed'])) {
            $this->line('📋 Steps completed:');
            foreach ($result['steps_completed'] as $step) {
                $this->line("  ✓ {$step}");
            }
        }
        
        // Display backup information
        if (isset($result['backup']) && $result['backup']['success']) {
            $this->newLine();
            $this->info('📦 Backup Information:');
            $this->table(['Property', 'Value'], [
                ['Backup Name', $result['backup']['backup_name']],
                ['File Size', $this->formatBytes($result['backup']['file_size'])],
                ['Created At', $result['backup']['created_at']]
            ]);
        }
        
        // Display timing information
        if (isset($result['rollback_started_at'])) {
            $startTime = $result['rollback_started_at'];
            $endTime = $result['rollback_completed_at'] ?? $result['rollback_failed_at'] ?? null;
            
            $this->newLine();
            $this->line("⏱️  Started: {$startTime}");
            if ($endTime) {
                $this->line("⏱️  Ended: {$endTime}");
            }
        }
    }

    /**
     * Format bytes to human readable format
     */
    protected function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }
}