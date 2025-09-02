<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Database\Schema\Builder;
use Carbon\Carbon;
use Exception;

class DatabaseMigrationService
{
    /**
     * Create database backup before migration rollback
     *
     * @param string $backupName Optional backup name
     * @return array Backup result with path and status
     */
    public function createBackup(string $backupName = null): array
    {
        try {
            $backupName = $backupName ?? 'rollback_backup_' . Carbon::now()->format('Y_m_d_H_i_s');
            $databaseName = config('database.connections.mysql.database');
            $username = config('database.connections.mysql.username');
            $password = config('database.connections.mysql.password');
            $host = config('database.connections.mysql.host');
            
            $backupPath = storage_path("app/backups/{$backupName}.sql");
            
            // Ensure backup directory exists
            if (!is_dir(dirname($backupPath))) {
                mkdir(dirname($backupPath), 0755, true);
            }
            
            // Create MySQL dump command
            $command = sprintf(
                'mysqldump --host=%s --user=%s --password=%s --single-transaction --routines --triggers %s > %s',
                escapeshellarg($host),
                escapeshellarg($username),
                escapeshellarg($password),
                escapeshellarg($databaseName),
                escapeshellarg($backupPath)
            );
            
            // Execute backup command
            exec($command, $output, $returnCode);
            
            if ($returnCode === 0 && file_exists($backupPath)) {
                Log::info('Database backup created successfully', [
                    'backup_name' => $backupName,
                    'backup_path' => $backupPath,
                    'file_size' => filesize($backupPath)
                ]);
                
                return [
                    'success' => true,
                    'backup_name' => $backupName,
                    'backup_path' => $backupPath,
                    'file_size' => filesize($backupPath),
                    'created_at' => Carbon::now()->toISOString()
                ];
            } else {
                throw new Exception('Backup command failed with return code: ' . $returnCode);
            }
            
        } catch (Exception $e) {
            Log::error('Database backup failed', [
                'error' => $e->getMessage(),
                'backup_name' => $backupName ?? 'unknown'
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'backup_name' => $backupName ?? null
            ];
        }
    }
    
    /**
     * Validate rollback safety by checking data dependencies
     *
     * @param string $migrationName Migration to rollback
     * @return array Validation result with warnings and blockers
     */
    public function validateRollbackSafety(string $migrationName): array
    {
        $warnings = [];
        $blockers = [];
        $affectedTables = [];
        
        try {
            // Get migration details
            $migrationDetails = $this->getMigrationDetails($migrationName);
            
            if (!$migrationDetails) {
                return [
                    'safe' => false,
                    'blockers' => ['Migration not found or not yet applied'],
                    'warnings' => [],
                    'affected_tables' => []
                ];
            }
            
            // Check for data dependencies based on common CineBook patterns
            $dependencyChecks = [
                'bookings' => $this->checkBookingDependencies(),
                'showtimes' => $this->checkShowtimeDependencies(),
                'payments' => $this->checkPaymentDependencies(),
                'reviews' => $this->checkReviewDependencies()
            ];
            
            foreach ($dependencyChecks as $table => $check) {
                if ($check['has_data']) {
                    $affectedTables[] = $table;
                    
                    if ($check['critical']) {
                        $blockers[] = "Critical data exists in {$table}: {$check['message']}";
                    } else {
                        $warnings[] = "Data exists in {$table}: {$check['message']}";
                    }
                }
            }
            
            // Check foreign key constraints
            $constraintChecks = $this->checkForeignKeyConstraints($migrationName);
            if (!empty($constraintChecks['blockers'])) {
                $blockers = array_merge($blockers, $constraintChecks['blockers']);
            }
            if (!empty($constraintChecks['warnings'])) {
                $warnings = array_merge($warnings, $constraintChecks['warnings']);
            }
            
            return [
                'safe' => empty($blockers),
                'blockers' => $blockers,
                'warnings' => $warnings,
                'affected_tables' => $affectedTables,
                'migration_details' => $migrationDetails
            ];
            
        } catch (Exception $e) {
            Log::error('Rollback safety validation failed', [
                'migration' => $migrationName,
                'error' => $e->getMessage()
            ]);
            
            return [
                'safe' => false,
                'blockers' => ['Validation failed: ' . $e->getMessage()],
                'warnings' => [],
                'affected_tables' => []
            ];
        }
    }
    
    /**
     * Perform safe migration rollback with data preservation options
     *
     * @param string $migrationName Migration to rollback
     * @param array $options Rollback options (backup, preserve_data, etc.)
     * @return array Rollback result
     */
    public function performSafeRollback(string $migrationName, array $options = []): array
    {
        $defaultOptions = [
            'create_backup' => true,
            'preserve_critical_data' => true,
            'validate_before_rollback' => true,
            'dry_run' => false
        ];
        
        $options = array_merge($defaultOptions, $options);
        
        try {
            DB::beginTransaction();
            
            $result = [
                'success' => false,
                'steps_completed' => [],
                'rollback_started_at' => Carbon::now()->toISOString()
            ];
            
            // Step 1: Validation
            if ($options['validate_before_rollback']) {
                $validation = $this->validateRollbackSafety($migrationName);
                $result['validation'] = $validation;
                $result['steps_completed'][] = 'validation';
                
                if (!$validation['safe'] && !empty($validation['blockers'])) {
                    throw new Exception('Rollback blocked: ' . implode(', ', $validation['blockers']));
                }
            }
            
            // Step 2: Create backup
            if ($options['create_backup']) {
                $backup = $this->createBackup("rollback_{$migrationName}_" . time());
                $result['backup'] = $backup;
                $result['steps_completed'][] = 'backup';
                
                if (!$backup['success']) {
                    throw new Exception('Backup failed: ' . $backup['error']);
                }
            }
            
            // Step 3: Preserve critical data if requested
            if ($options['preserve_critical_data']) {
                $preservation = $this->preserveCriticalData($migrationName);
                $result['data_preservation'] = $preservation;
                $result['steps_completed'][] = 'data_preservation';
            }
            
            // Step 4: Perform rollback (or simulate in dry run)
            if (!$options['dry_run']) {
                $rollbackResult = $this->executeMigrationRollback($migrationName);
                $result['migration_rollback'] = $rollbackResult;
                $result['steps_completed'][] = 'migration_rollback';
                
                if (!$rollbackResult['success']) {
                    throw new Exception('Migration rollback failed: ' . $rollbackResult['error']);
                }
            } else {
                $result['migration_rollback'] = ['success' => true, 'dry_run' => true];
                $result['steps_completed'][] = 'migration_rollback_simulated';
            }
            
            // Step 5: Verify database integrity after rollback
            if (!$options['dry_run']) {
                $integrity = $this->verifyDatabaseIntegrity();
                $result['integrity_check'] = $integrity;
                $result['steps_completed'][] = 'integrity_verification';
                
                if (!$integrity['valid']) {
                    throw new Exception('Database integrity check failed after rollback');
                }
            }
            
            DB::commit();
            
            $result['success'] = true;
            $result['rollback_completed_at'] = Carbon::now()->toISOString();
            
            Log::info('Migration rollback completed successfully', [
                'migration' => $migrationName,
                'options' => $options,
                'steps' => $result['steps_completed']
            ]);
            
            return $result;
            
        } catch (Exception $e) {
            DB::rollBack();
            
            Log::error('Migration rollback failed', [
                'migration' => $migrationName,
                'error' => $e->getMessage(),
                'steps_completed' => $result['steps_completed'] ?? []
            ]);
            
            $result['success'] = false;
            $result['error'] = $e->getMessage();
            $result['rollback_failed_at'] = Carbon::now()->toISOString();
            
            return $result;
        }
    }
    
    /**
     * Check booking dependencies for rollback safety
     *
     * @return array Dependency check result
     */
    private function checkBookingDependencies(): array
    {
        if (!Schema::hasTable('bookings')) {
            return ['has_data' => false, 'critical' => false, 'message' => 'Table does not exist'];
        }
        
        $activeBookings = DB::table('bookings')
            ->where('booking_status', '!=', 'cancelled')
            ->where('payment_status', 'completed')
            ->count();
        
        $futureBookings = DB::table('bookings')
            ->join('showtimes', 'bookings.showtime_id', '=', 'showtimes.id')
            ->where('showtimes.show_date', '>', Carbon::now()->toDateString())
            ->where('bookings.booking_status', 'confirmed')
            ->count();
        
        if ($futureBookings > 0) {
            return [
                'has_data' => true,
                'critical' => true,
                'message' => "{$futureBookings} future bookings exist, rollback may cause customer issues"
            ];
        }
        
        if ($activeBookings > 0) {
            return [
                'has_data' => true,
                'critical' => false,
                'message' => "{$activeBookings} active bookings exist"
            ];
        }
        
        return ['has_data' => false, 'critical' => false, 'message' => 'No critical booking data'];
    }
    
    /**
     * Check showtime dependencies for rollback safety
     *
     * @return array Dependency check result
     */
    private function checkShowtimeDependencies(): array
    {
        if (!Schema::hasTable('showtimes')) {
            return ['has_data' => false, 'critical' => false, 'message' => 'Table does not exist'];
        }
        
        $futureShowtimes = DB::table('showtimes')
            ->where('show_date', '>', Carbon::now()->toDateString())
            ->where('status', 'active')
            ->count();
        
        $showtimesWithBookings = DB::table('showtimes')
            ->join('bookings', 'showtimes.id', '=', 'bookings.showtime_id')
            ->where('bookings.booking_status', '!=', 'cancelled')
            ->count();
        
        if ($showtimesWithBookings > 0) {
            return [
                'has_data' => true,
                'critical' => true,
                'message' => "{$showtimesWithBookings} showtimes have active bookings"
            ];
        }
        
        if ($futureShowtimes > 0) {
            return [
                'has_data' => true,
                'critical' => false,
                'message' => "{$futureShowtimes} future showtimes exist"
            ];
        }
        
        return ['has_data' => false, 'critical' => false, 'message' => 'No critical showtime data'];
    }
    
    /**
     * Check payment dependencies for rollback safety
     *
     * @return array Dependency check result
     */
    private function checkPaymentDependencies(): array
    {
        if (!Schema::hasTable('payments')) {
            return ['has_data' => false, 'critical' => false, 'message' => 'Table does not exist'];
        }
        
        $completedPayments = DB::table('payments')
            ->where('status', 'completed')
            ->count();
        
        $pendingPayments = DB::table('payments')
            ->where('status', 'pending')
            ->count();
        
        if ($completedPayments > 0) {
            return [
                'has_data' => true,
                'critical' => true,
                'message' => "{$completedPayments} completed payments exist, rollback may affect financial records"
            ];
        }
        
        if ($pendingPayments > 0) {
            return [
                'has_data' => true,
                'critical' => false,
                'message' => "{$pendingPayments} pending payments exist"
            ];
        }
        
        return ['has_data' => false, 'critical' => false, 'message' => 'No critical payment data'];
    }
    
    /**
     * Check review dependencies for rollback safety
     *
     * @return array Dependency check result
     */
    private function checkReviewDependencies(): array
    {
        if (!Schema::hasTable('reviews')) {
            return ['has_data' => false, 'critical' => false, 'message' => 'Table does not exist'];
        }
        
        $approvedReviews = DB::table('reviews')
            ->where('status', 'approved')
            ->count();
        
        if ($approvedReviews > 0) {
            return [
                'has_data' => true,
                'critical' => false,
                'message' => "{$approvedReviews} approved reviews exist"
            ];
        }
        
        return ['has_data' => false, 'critical' => false, 'message' => 'No critical review data'];
    }
    
    /**
     * Get migration details from migrations table
     *
     * @param string $migrationName Migration name to check
     * @return array|null Migration details or null if not found
     */
    private function getMigrationDetails(string $migrationName): ?array
    {
        try {
            $migration = DB::table('migrations')
                ->where('migration', 'LIKE', "%{$migrationName}%")
                ->first();
            
            if ($migration) {
                return [
                    'id' => $migration->id,
                    'migration' => $migration->migration,
                    'batch' => $migration->batch,
                    'executed_at' => $migration->created_at ?? null
                ];
            }
            
            return null;
        } catch (Exception $e) {
            Log::warning('Could not retrieve migration details', [
                'migration' => $migrationName,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
    
    /**
     * Check foreign key constraints that might be affected by rollback
     *
     * @param string $migrationName Migration to analyze
     * @return array Constraint check results
     */
    private function checkForeignKeyConstraints(string $migrationName): array
    {
        $blockers = [];
        $warnings = [];
        
        try {
            // Check critical foreign key relationships
            $criticalConstraints = [
                'bookings' => ['user_id', 'showtime_id'],
                'showtimes' => ['movie_id', 'theater_id'],
                'payments' => ['booking_id'],
                'reviews' => ['user_id', 'movie_id']
            ];
            
            foreach ($criticalConstraints as $table => $columns) {
                if (!Schema::hasTable($table)) {
                    continue;
                }
                
                foreach ($columns as $column) {
                    if (Schema::hasColumn($table, $column)) {
                        $referencedCount = DB::table($table)
                            ->whereNotNull($column)
                            ->count();
                        
                        if ($referencedCount > 0) {
                            $warnings[] = "Table '{$table}' has {$referencedCount} records with foreign key '{$column}'";
                        }
                    }
                }
            }
            
        } catch (Exception $e) {
            $blockers[] = 'Failed to check foreign key constraints: ' . $e->getMessage();
        }
        
        return [
            'blockers' => $blockers,
            'warnings' => $warnings
        ];
    }
    
    /**
     * Preserve critical data before rollback
     *
     * @param string $migrationName Migration being rolled back
     * @return array Preservation result
     */
    private function preserveCriticalData(string $migrationName): array
    {
        try {
            $preservationPath = storage_path("app/data_preservation/" . time());
            
            if (!is_dir($preservationPath)) {
                mkdir($preservationPath, 0755, true);
            }
            
            $preservedFiles = [];
            
            // Preserve critical tables data as JSON
            $criticalTables = ['bookings', 'payments', 'users'];
            
            foreach ($criticalTables as $table) {
                if (Schema::hasTable($table)) {
                    $data = DB::table($table)->get()->toArray();
                    
                    if (!empty($data)) {
                        $filePath = "{$preservationPath}/{$table}_backup.json";
                        file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT));
                        $preservedFiles[] = $filePath;
                    }
                }
            }
            
            return [
                'success' => true,
                'preservation_path' => $preservationPath,
                'preserved_files' => $preservedFiles,
                'file_count' => count($preservedFiles)
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Execute the actual migration rollback
     *
     * @param string $migrationName Migration to rollback
     * @return array Rollback execution result
     */
    private function executeMigrationRollback(string $migrationName): array
    {
        try {
            // Execute Laravel migration rollback
            Artisan::call('migrate:rollback', [
                '--step' => 1,
                '--force' => true
            ]);
            
            $output = Artisan::output();
            
            return [
                'success' => true,
                'artisan_output' => $output,
                'executed_at' => Carbon::now()->toISOString()
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Verify database integrity after rollback
     *
     * @return array Integrity verification result
     */
    public function verifyDatabaseIntegrity(): array
    {
        try {
            $issues = [];
            
            // Check for orphaned records
            $orphanChecks = $this->checkOrphanedRecords();
            if (!empty($orphanChecks)) {
                $issues = array_merge($issues, $orphanChecks);
            }
            
            // Check table structure consistency
            $structureChecks = $this->checkTableStructure();
            if (!empty($structureChecks)) {
                $issues = array_merge($issues, $structureChecks);
            }
            
            // Check data consistency
            $dataChecks = $this->checkDataConsistency();
            if (!empty($dataChecks)) {
                $issues = array_merge($issues, $dataChecks);
            }
            
            return [
                'valid' => empty($issues),
                'issues' => $issues,
                'checked_at' => Carbon::now()->toISOString()
            ];
            
        } catch (Exception $e) {
            return [
                'valid' => false,
                'issues' => ['Integrity check failed: ' . $e->getMessage()],
                'checked_at' => Carbon::now()->toISOString()
            ];
        }
    }
    
    /**
     * Check for orphaned records after rollback
     *
     * @return array List of orphaned record issues
     */
    private function checkOrphanedRecords(): array
    {
        $issues = [];
        
        try {
            // Check orphaned bookings (bookings without valid showtimes)
            if (Schema::hasTable('bookings') && Schema::hasTable('showtimes')) {
                $orphanedBookings = DB::table('bookings')
                    ->leftJoin('showtimes', 'bookings.showtime_id', '=', 'showtimes.id')
                    ->whereNull('showtimes.id')
                    ->count();
                
                if ($orphanedBookings > 0) {
                    $issues[] = "Found {$orphanedBookings} bookings with invalid showtime references";
                }
            }
            
            // Check orphaned payments (payments without valid bookings)
            if (Schema::hasTable('payments') && Schema::hasTable('bookings')) {
                $orphanedPayments = DB::table('payments')
                    ->leftJoin('bookings', 'payments.booking_id', '=', 'bookings.id')
                    ->whereNull('bookings.id')
                    ->count();
                
                if ($orphanedPayments > 0) {
                    $issues[] = "Found {$orphanedPayments} payments with invalid booking references";
                }
            }
            
        } catch (Exception $e) {
            $issues[] = 'Failed to check orphaned records: ' . $e->getMessage();
        }
        
        return $issues;
    }
    
    /**
     * Check table structure consistency
     *
     * @return array List of structure issues
     */
    private function checkTableStructure(): array
    {
        $issues = [];
        
        try {
            // Verify expected tables exist
            $expectedTables = ['users', 'movies', 'theaters', 'showtimes'];
            
            foreach ($expectedTables as $table) {
                if (!Schema::hasTable($table)) {
                    $issues[] = "Required table '{$table}' is missing";
                }
            }
            
            // Check critical columns exist
            $criticalColumns = [
                'users' => ['id', 'email'],
                'movies' => ['id', 'title'],
                'theaters' => ['id', 'name'],
                'showtimes' => ['id', 'movie_id', 'theater_id']
            ];
            
            foreach ($criticalColumns as $table => $columns) {
                if (Schema::hasTable($table)) {
                    foreach ($columns as $column) {
                        if (!Schema::hasColumn($table, $column)) {
                            $issues[] = "Critical column '{$column}' missing from table '{$table}'";
                        }
                    }
                }
            }
            
        } catch (Exception $e) {
            $issues[] = 'Failed to check table structure: ' . $e->getMessage();
        }
        
        return $issues;
    }
    
    /**
     * Check data consistency after rollback
     *
     * @return array List of data consistency issues
     */
    private function checkDataConsistency(): array
    {
        $issues = [];
        
        try {
            // Check booking amount consistency
            if (Schema::hasTable('bookings')) {
                $invalidAmounts = DB::table('bookings')
                    ->where('total_amount', '<=', 0)
                    ->count();
                
                if ($invalidAmounts > 0) {
                    $issues[] = "Found {$invalidAmounts} bookings with invalid amounts";
                }
            }
            
            // Check showtime date consistency
            if (Schema::hasTable('showtimes')) {
                $invalidDates = DB::table('showtimes')
                    ->where('show_date', '<', '1970-01-01')
                    ->orWhere('show_date', '>', '2099-12-31')
                    ->count();
                
                if ($invalidDates > 0) {
                    $issues[] = "Found {$invalidDates} showtimes with invalid dates";
                }
            }
            
        } catch (Exception $e) {
            $issues[] = 'Failed to check data consistency: ' . $e->getMessage();
        }
        
        return $issues;
    }
}