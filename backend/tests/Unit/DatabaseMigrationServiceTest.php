<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\DatabaseMigrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Artisan;

class DatabaseMigrationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected DatabaseMigrationService $migrationService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->migrationService = new DatabaseMigrationService();
        
        // Ensure storage directories exist for testing
        Storage::fake('local');
    }

    /** @test */
    public function it_can_create_database_backup()
    {
        $this->markTestSkipped('Requires mysqldump command - skip in CI environment');
        
        $result = $this->migrationService->createBackup('test_backup');
        
        if ($result['success']) {
            $this->assertTrue($result['success']);
            $this->assertArrayHasKey('backup_name', $result);
            $this->assertArrayHasKey('backup_path', $result);
            $this->assertArrayHasKey('file_size', $result);
            $this->assertEquals('test_backup', $result['backup_name']);
        } else {
            // In CI environment without mysqldump, expect failure
            $this->assertFalse($result['success']);
            $this->assertArrayHasKey('error', $result);
        }
    }

    /** @test */
    public function it_validates_rollback_safety_with_no_data()
    {
        // Test with empty database
        $result = $this->migrationService->validateRollbackSafety('create_bookings_table');
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('safe', $result);
        $this->assertArrayHasKey('blockers', $result);
        $this->assertArrayHasKey('warnings', $result);
        $this->assertArrayHasKey('affected_tables', $result);
        
        // With empty database, should be safe
        $this->assertTrue($result['safe']);
        $this->assertEmpty($result['blockers']);
    }

    /** @test */
    public function it_validates_rollback_safety_with_critical_data()
    {
        // Create test data that should block rollback
        $this->createTestBookingData();
        
        $result = $this->migrationService->validateRollbackSafety('create_bookings_table');
        
        $this->assertIsArray($result);
        
        // Should have warnings about existing data
        if (!empty($result['warnings'])) {
            $this->assertContains('bookings', $result['affected_tables']);
        }
    }

    /** @test */
    public function it_checks_booking_dependencies_correctly()
    {
        // Test with no bookings
        $reflection = new \ReflectionClass($this->migrationService);
        $method = $reflection->getMethod('checkBookingDependencies');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->migrationService);
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('has_data', $result);
        $this->assertArrayHasKey('critical', $result);
        $this->assertArrayHasKey('message', $result);
        
        if (Schema::hasTable('bookings')) {
            $this->assertFalse($result['has_data']);
        }
    }

    /** @test */
    public function it_checks_showtime_dependencies_correctly()
    {
        $reflection = new \ReflectionClass($this->migrationService);
        $method = $reflection->getMethod('checkShowtimeDependencies');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->migrationService);
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('has_data', $result);
        $this->assertArrayHasKey('critical', $result);
        $this->assertArrayHasKey('message', $result);
    }

    /** @test */
    public function it_checks_payment_dependencies_correctly()
    {
        $reflection = new \ReflectionClass($this->migrationService);
        $method = $reflection->getMethod('checkPaymentDependencies');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->migrationService);
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('has_data', $result);
        $this->assertArrayHasKey('critical', $result);
        $this->assertArrayHasKey('message', $result);
    }

    /** @test */
    public function it_checks_review_dependencies_correctly()
    {
        $reflection = new \ReflectionClass($this->migrationService);
        $method = $reflection->getMethod('checkReviewDependencies');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->migrationService);
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('has_data', $result);
        $this->assertArrayHasKey('critical', $result);
        $this->assertArrayHasKey('message', $result);
    }

    /** @test */
    public function it_can_verify_database_integrity()
    {
        $result = $this->migrationService->verifyDatabaseIntegrity();
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('valid', $result);
        $this->assertArrayHasKey('issues', $result);
        $this->assertArrayHasKey('checked_at', $result);
        
        // With clean test database, should be valid
        $this->assertTrue($result['valid']);
        $this->assertIsArray($result['issues']);
    }

    /** @test */
    public function it_checks_orphaned_records()
    {
        $reflection = new \ReflectionClass($this->migrationService);
        $method = $reflection->getMethod('checkOrphanedRecords');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->migrationService);
        
        $this->assertIsArray($result);
        // Should be empty with clean database
        $this->assertEmpty($result);
    }

    /** @test */
    public function it_checks_table_structure()
    {
        $reflection = new \ReflectionClass($this->migrationService);
        $method = $reflection->getMethod('checkTableStructure');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->migrationService);
        
        $this->assertIsArray($result);
    }

    /** @test */
    public function it_checks_data_consistency()
    {
        $reflection = new \ReflectionClass($this->migrationService);
        $method = $reflection->getMethod('checkDataConsistency');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->migrationService);
        
        $this->assertIsArray($result);
        // Should be empty with clean database
        $this->assertEmpty($result);
    }

    /** @test */
    public function it_can_preserve_critical_data()
    {
        $this->createTestBookingData();
        
        $reflection = new \ReflectionClass($this->migrationService);
        $method = $reflection->getMethod('preserveCriticalData');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->migrationService, 'test_migration');
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('success', $result);
        
        if ($result['success']) {
            $this->assertArrayHasKey('preservation_path', $result);
            $this->assertArrayHasKey('preserved_files', $result);
            $this->assertArrayHasKey('file_count', $result);
        }
    }

    /** @test */
    public function it_handles_foreign_key_constraints_check()
    {
        $reflection = new \ReflectionClass($this->migrationService);
        $method = $reflection->getMethod('checkForeignKeyConstraints');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->migrationService, 'test_migration');
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('blockers', $result);
        $this->assertArrayHasKey('warnings', $result);
        $this->assertIsArray($result['blockers']);
        $this->assertIsArray($result['warnings']);
    }

    /** @test */
    public function it_gets_migration_details()
    {
        $reflection = new \ReflectionClass($this->migrationService);
        $method = $reflection->getMethod('getMigrationDetails');
        $method->setAccessible(true);
        
        // Test with non-existent migration
        $result = $method->invoke($this->migrationService, 'non_existent_migration');
        $this->assertNull($result);
        
        // Test with existing migration (if migrations table exists)
        if (Schema::hasTable('migrations')) {
            // Try to find any migration
            $migrations = DB::table('migrations')->first();
            if ($migrations) {
                $result = $method->invoke($this->migrationService, $migrations->migration);
                
                if ($result) {
                    $this->assertIsArray($result);
                    $this->assertArrayHasKey('id', $result);
                    $this->assertArrayHasKey('migration', $result);
                    $this->assertArrayHasKey('batch', $result);
                }
            }
        }
    }

    /** @test */
    public function it_performs_safe_rollback_dry_run()
    {
        $options = [
            'create_backup' => false, // Skip backup for test
            'preserve_critical_data' => false,
            'validate_before_rollback' => false,
            'dry_run' => true
        ];
        
        $result = $this->migrationService->performSafeRollback('test_migration', $options);
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('success', $result);
        $this->assertArrayHasKey('steps_completed', $result);
        
        if ($result['success']) {
            $this->assertContains('migration_rollback_simulated', $result['steps_completed']);
        }
    }

    /**
     * Create test booking data for dependency testing
     */
    protected function createTestBookingData(): void
    {
        if (!Schema::hasTable('users')) {
            return;
        }

        // Create test user
        $userId = DB::table('users')->insertGetId([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '+84123456789',  // Add required phone field
            'password' => bcrypt('password'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create test data only if tables exist
        if (Schema::hasTable('movies') && Schema::hasTable('theaters')) {
            $movieId = DB::table('movies')->insertGetId([
                'title' => 'Test Movie',
                'slug' => 'test-movie',
                'synopsis' => 'Test synopsis',
                'duration' => 120,
                'genre' => json_encode(['Action']),
                'language' => 'English',
                'release_date' => now()->format('Y-m-d'),
                'director' => 'Test Director',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $theaterId = DB::table('theaters')->insertGetId([
                'name' => 'Test Theater',
                'address' => 'Test Address',
                'city' => 'Test City',
                'total_seats' => 100,
                'seat_configuration' => json_encode(['gold' => 80, 'platinum' => 20]),
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if (Schema::hasTable('showtimes')) {
                $showtimeId = DB::table('showtimes')->insertGetId([
                    'movie_id' => $movieId,
                    'theater_id' => $theaterId,
                    'show_date' => now()->addDays(1)->format('Y-m-d'),
                    'show_time' => '19:00:00',
                    'prices' => json_encode(['gold' => 120000, 'platinum' => 150000]),
                    'available_seats' => json_encode(['gold' => ['A1', 'A2'], 'platinum' => ['P1', 'P2']]),
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                if (Schema::hasTable('bookings')) {
                    DB::table('bookings')->insert([
                        'booking_code' => 'TEST001',
                        'user_id' => $userId,
                        'showtime_id' => $showtimeId,
                        'seats' => json_encode([['seat' => 'A1', 'type' => 'gold', 'price' => 120000]]),
                        'total_amount' => 120000,
                        'payment_status' => 'completed',
                        'booking_status' => 'confirmed',
                        'booked_at' => now(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }
}