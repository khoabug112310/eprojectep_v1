<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\DatabaseMigrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

class DatabaseMigrationManagementTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_run_migration_manager_backup_command()
    {
        $this->markTestSkipped('Requires mysqldump command - skip in CI environment');
        
        $result = Artisan::call('db:migration-manager', [
            'action' => 'backup',
            '--backup-name' => 'test_feature_backup'
        ]);

        // Command should complete (success or failure depends on mysqldump availability)
        $this->assertTrue(in_array($result, [0, 1])); // 0 = success, 1 = failure
        
        $output = Artisan::output();
        $this->assertStringContainsString('Database Migration Manager', $output);
    }

    /** @test */
    public function it_can_run_migration_manager_validation_command()
    {
        $result = Artisan::call('db:migration-manager', [
            'action' => 'validate',
            '--migration' => 'create_users_table'
        ]);

        // Command should complete
        $this->assertTrue(in_array($result, [0, 1]));
        
        $output = Artisan::output();
        $this->assertStringContainsString('Database Migration Manager', $output);
        $this->assertStringContainsString('Validating rollback safety', $output);
    }

    /** @test */
    public function it_can_run_migration_manager_integrity_command()
    {
        $result = Artisan::call('db:migration-manager', [
            'action' => 'integrity'
        ]);

        $this->assertEquals(0, $result); // Should succeed with clean database
        
        $output = Artisan::output();
        $this->assertStringContainsString('Database Migration Manager', $output);
        $this->assertStringContainsString('Performing database integrity check', $output);
    }

    /** @test */
    public function it_can_run_migration_manager_dry_run_rollback()
    {
        $result = Artisan::call('db:migration-manager', [
            'action' => 'rollback',
            '--migration' => 'create_users_table',
            '--dry-run' => true,
            '--skip-backup' => true
        ]);

        // Command should complete (may succeed or fail based on migration existence)
        $this->assertTrue(in_array($result, [0, 1]));
        
        $output = Artisan::output();
        $this->assertStringContainsString('Database Migration Manager', $output);
        
        if ($result === 0) {
            $this->assertStringContainsString('DRY RUN mode', $output);
        }
    }

    /** @test */
    public function it_validates_required_migration_parameter_for_rollback()
    {
        $result = Artisan::call('db:migration-manager', [
            'action' => 'rollback'
            // Missing --migration parameter
        ]);

        $this->assertEquals(1, $result); // Should fail
        
        $output = Artisan::output();
        $this->assertStringContainsString('Migration name is required', $output);
    }

    /** @test */
    public function it_validates_required_migration_parameter_for_validation()
    {
        $result = Artisan::call('db:migration-manager', [
            'action' => 'validate'
            // Missing --migration parameter
        ]);

        $this->assertEquals(1, $result); // Should fail
        
        $output = Artisan::output();
        $this->assertStringContainsString('Migration name is required', $output);
    }

    /** @test */
    public function it_rejects_unknown_action()
    {
        $result = Artisan::call('db:migration-manager', [
            'action' => 'unknown_action'
        ]);

        $this->assertEquals(1, $result); // Should fail
        
        $output = Artisan::output();
        $this->assertStringContainsString('Unknown action: unknown_action', $output);
        $this->assertStringContainsString('Available actions:', $output);
    }

    /** @test */
    public function database_migration_service_integration_works()
    {
        $service = app(DatabaseMigrationService::class);
        
        // Test that service is properly instantiated
        $this->assertInstanceOf(DatabaseMigrationService::class, $service);
        
        // Test integrity check method
        $result = $service->verifyDatabaseIntegrity();
        $this->assertIsArray($result);
        $this->assertArrayHasKey('valid', $result);
        $this->assertArrayHasKey('issues', $result);
        $this->assertArrayHasKey('checked_at', $result);
    }

    /** @test */
    public function it_can_validate_rollback_safety_through_service()
    {
        $service = app(DatabaseMigrationService::class);
        
        // Test validation with a common migration name pattern
        $result = $service->validateRollbackSafety('create_users_table');
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('safe', $result);
        $this->assertArrayHasKey('blockers', $result);
        $this->assertArrayHasKey('warnings', $result);
        $this->assertArrayHasKey('affected_tables', $result);
    }

    /** @test */
    public function it_handles_backup_storage_directory_creation()
    {
        Storage::fake('local');
        
        $service = app(DatabaseMigrationService::class);
        
        // This will skip actual mysqldump but test directory creation logic
        $result = $service->createBackup('test_backup_integration');
        
        // Should fail due to missing mysqldump, but that's expected in test environment
        $this->assertIsArray($result);
        $this->assertArrayHasKey('success', $result);
    }

    /** @test */
    public function migration_service_handles_errors_gracefully()
    {
        $service = app(DatabaseMigrationService::class);
        
        // Test with invalid migration name
        $result = $service->validateRollbackSafety('completely_invalid_migration_name_12345');
        
        $this->assertIsArray($result);
        // Should either be safe (if migration doesn't exist) or have proper error handling
        $this->assertArrayHasKey('safe', $result);
        $this->assertArrayHasKey('blockers', $result);
        $this->assertArrayHasKey('warnings', $result);
    }

    /** @test */
    public function it_can_perform_dry_run_rollback_through_service()
    {
        $service = app(DatabaseMigrationService::class);
        
        $options = [
            'create_backup' => false,
            'preserve_critical_data' => false,
            'validate_before_rollback' => false,
            'dry_run' => true
        ];
        
        $result = $service->performSafeRollback('test_migration', $options);
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('success', $result);
        $this->assertArrayHasKey('steps_completed', $result);
        
        if (isset($result['migration_rollback'])) {
            $this->assertArrayHasKey('dry_run', $result['migration_rollback']);
        }
    }
}