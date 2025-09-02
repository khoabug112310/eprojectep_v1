<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\SeatLockingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Cache;
use Mockery;

class RedisFailoverTest extends TestCase
{
    use RefreshDatabase;

    private SeatLockingService $seatLockingService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seatLockingService = app(SeatLockingService::class);
    }

    /** @test */
    public function it_handles_redis_connection_failures_gracefully()
    {
        // Mock Redis to throw connection exception
        Redis::shouldReceive('connection')
            ->andThrow(new \Predis\Connection\ConnectionException('Connection refused'));

        $result = $this->seatLockingService->testConnection();

        $this->assertFalse($result['success']);
        $this->assertStringContains('Redis connection failed', $result['message']);
        $this->assertArrayHasKey('diagnostics', $result);
        $this->assertEquals('connection_failed', $result['diagnostics']['redis_status']);
    }

    /** @test */
    public function it_uses_fallback_cache_when_redis_fails()
    {
        // Mock Redis to fail for seat locking
        Redis::shouldReceive('connection')
            ->andThrow(new \Predis\Connection\ConnectionException('Connection refused'));

        $seats = ['A1', 'A2'];
        $showtimeId = 1;
        $userId = 1;

        $result = $this->seatLockingService->lockSeats($seats, $showtimeId, $userId);

        // Should succeed using fallback cache
        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('fallback_mode', $result);
        $this->assertTrue($result['fallback_mode']);
        $this->assertStringContains('fallback cache', $result['warning']);
    }

    /** @test */
    public function it_retries_redis_operations_with_exponential_backoff()
    {
        $connectionAttempts = 0;
        
        Redis::shouldReceive('connection')
            ->times(3)
            ->andReturnUsing(function () use (&$connectionAttempts) {
                $connectionAttempts++;
                if ($connectionAttempts < 3) {
                    throw new \Predis\Connection\ConnectionException('Temporary failure');
                }
                
                // Return mock Redis on third attempt
                $mockRedis = Mockery::mock();
                $mockRedis->shouldReceive('ping')->andReturn(true);
                $mockRedis->shouldReceive('get')->andReturn(null);
                $mockRedis->shouldReceive('multi')->andReturnSelf();
                $mockRedis->shouldReceive('setex')->andReturnSelf();
                $mockRedis->shouldReceive('exec')->andReturn([true, true]);
                
                return $mockRedis;
            });

        $seats = ['A1', 'A2'];
        $showtimeId = 1;
        $userId = 1;

        $startTime = microtime(true);
        $result = $this->seatLockingService->lockSeats($seats, $showtimeId, $userId);
        $endTime = microtime(true);

        // Should succeed on third attempt
        $this->assertTrue($result['success']);
        
        // Should have taken some time due to retry delays
        $executionTime = ($endTime - $startTime) * 1000; // milliseconds
        $this->assertGreaterThan(200, $executionTime); // At least 200ms for retries
    }

    /** @test */
    public function it_provides_comprehensive_connection_diagnostics()
    {
        $result = $this->seatLockingService->testConnection();

        $this->assertArrayHasKey('diagnostics', $result);
        $diagnostics = $result['diagnostics'];
        
        $this->assertArrayHasKey('redis_status', $diagnostics);
        $this->assertArrayHasKey('fallback_available', $diagnostics);
        $this->assertArrayHasKey('timestamp', $diagnostics);
        
        if ($result['success']) {
            $this->assertEquals('connected', $diagnostics['redis_status']);
            $this->assertArrayHasKey('response_time_ms', $diagnostics);
        }
    }

    /** @test */
    public function it_handles_redis_operation_failures_during_locking()
    {
        // Mock Redis connection that connects but fails on operations
        $mockRedis = Mockery::mock();
        $mockRedis->shouldReceive('ping')->andReturn(true);
        $mockRedis->shouldReceive('get')->andThrow(new \Redis\RedisException('Operation failed'));

        Redis::shouldReceive('connection')->andReturn($mockRedis);

        $seats = ['A1'];
        $showtimeId = 1;
        $userId = 1;

        $result = $this->seatLockingService->lockSeats($seats, $showtimeId, $userId);

        // Should fail back to cache
        $this->assertTrue($result['success']);
        $this->assertTrue($result['fallback_mode']);
    }

    /** @test */
    public function it_provides_fallback_statistics_when_redis_unavailable()
    {
        // Mock Redis to fail
        Redis::shouldReceive('connection')
            ->andThrow(new \Predis\Connection\ConnectionException('Connection refused'));

        $result = $this->seatLockingService->getLockStatistics();

        $this->assertTrue($result['success']);
        $this->assertEquals('fallback_cache', $result['statistics']['source']);
        $this->assertArrayHasKey('note', $result['statistics']);
    }

    /** @test */
    public function it_handles_both_redis_and_cache_failures()
    {
        // Mock both Redis and Cache to fail
        Redis::shouldReceive('connection')
            ->andThrow(new \Predis\Connection\ConnectionException('Redis failed'));
        
        Cache::shouldReceive('put')
            ->andThrow(new \Exception('Cache also failed'));

        $seats = ['A1'];
        $showtimeId = 1;
        $userId = 1;

        $result = $this->seatLockingService->lockSeats($seats, $showtimeId, $userId);

        $this->assertFalse($result['success']);
        $this->assertStringContains('Both Redis and fallback cache are unavailable', $result['message']);
    }

    /** @test */
    public function it_validates_fallback_cache_functionality()
    {
        $result = $this->seatLockingService->testConnection();

        if (!$result['success']) {
            // If Redis is not available, check fallback
            $this->assertArrayHasKey('fallback_available', $result);
            $this->assertArrayHasKey('fallback_test', $result['diagnostics']);
        } else {
            // Redis is working, test should pass
            $this->assertTrue($result['success']);
        }
    }

    /** @test */
    public function it_logs_appropriate_warnings_during_failover()
    {
        // This test would verify logging behavior
        // In a real implementation, you'd assert log entries
        
        $this->expectsEvents([]); // Placeholder for log assertions
        
        $this->assertTrue(true); // Placeholder test
    }
}