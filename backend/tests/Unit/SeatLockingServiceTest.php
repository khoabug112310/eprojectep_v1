<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\SeatLockingService;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Illuminate\Support\Facades\Redis;
use Mockery;

class SeatLockingServiceTest extends TestCase
{
    use WithoutMiddleware;
    
    protected $seatLockingService;
    protected $redisMock;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->seatLockingService = new SeatLockingService();
        
        // Mock Redis connection with more detailed expectations
        $this->redisMock = Mockery::mock();
        
        // Mock basic Redis operations
        $this->redisMock->shouldReceive('pipeline')->andReturnSelf();
        $this->redisMock->shouldReceive('multi')->andReturnSelf();
        $this->redisMock->shouldReceive('exec')->andReturn([true, true]);
        
        Redis::shouldReceive('connection')->andReturn($this->redisMock);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_can_lock_seats_successfully()
    {
        $seats = ['A1', 'A2'];
        $showtimeId = 1;
        $userId = 1;

        // Mock Redis operations for successful locking
        $this->redisMock->shouldReceive('get')
            ->with('seat_lock:1:A1')
            ->once()
            ->andReturn(null); // No existing lock
            
        $this->redisMock->shouldReceive('get')
            ->with('seat_lock:1:A2')
            ->once()
            ->andReturn(null); // No existing lock

        // Mock pipeline operations properly
        $pipeline = Mockery::mock();
        $this->redisMock->shouldReceive('pipeline')
            ->once()
            ->andReturn($pipeline);
            
        $pipeline->shouldReceive('multi')
            ->once()
            ->andReturnSelf();
            
        $pipeline->shouldReceive('setex')
            ->with('seat_lock:1:A1', 900, Mockery::type('string'))
            ->once()
            ->andReturnSelf();
            
        $pipeline->shouldReceive('setex')
            ->with('seat_lock:1:A2', 900, Mockery::type('string'))
            ->once()
            ->andReturnSelf();
            
        $pipeline->shouldReceive('exec')
            ->once()
            ->andReturn([true, true]);

        $result = $this->seatLockingService->lockSeats($seats, $showtimeId, $userId);

        $this->assertTrue($result['success']);
        $this->assertEquals('Seats locked successfully', $result['message']);
        $this->assertCount(2, $result['locked_seats']);
        $this->assertEquals(900, $result['lock_duration']);
    }

    /** @test */
    public function it_prevents_locking_already_locked_seats()
    {
        $seats = ['A1', 'A2'];
        $showtimeId = 1;
        $userId = 1;
        $otherUserId = 2;

        // Mock existing lock by another user
        $existingLock = json_encode([
            'user_id' => $otherUserId,
            'locked_at' => now()->toISOString(),
            'showtime_id' => $showtimeId,
            'expires_at' => now()->addMinutes(15)->toISOString()
        ]);

        $this->redisMock->shouldReceive('get')
            ->with('seat_lock:1:A1')
            ->once()
            ->andReturn($existingLock);

        $result = $this->seatLockingService->lockSeats($seats, $showtimeId, $userId);

        $this->assertFalse($result['success']);
        $this->assertEquals('Some seats are already locked by other users', $result['message']);
        $this->assertContains('A1', $result['conflicts']);
    }

    /** @test */
    public function it_allows_same_user_to_extend_their_locks()
    {
        $seats = ['A1'];
        $showtimeId = 1;
        $userId = 1;

        // Mock existing lock by same user
        $existingLock = json_encode([
            'user_id' => $userId,
            'locked_at' => now()->toISOString(),
            'showtime_id' => $showtimeId,
            'expires_at' => now()->addMinutes(15)->toISOString()
        ]);

        $this->redisMock->shouldReceive('get')
            ->once()
            ->andReturn($existingLock);

        // Mock pipeline operations for extending lock
        $pipeline = Mockery::mock();
        $this->redisMock->shouldReceive('pipeline')
            ->once()
            ->andReturn($pipeline);
            
        $pipeline->shouldReceive('multi')
            ->once()
            ->andReturnSelf();
            
        $pipeline->shouldReceive('setex')
            ->once()
            ->andReturnSelf();
            
        $pipeline->shouldReceive('exec')
            ->once()
            ->andReturn([true]);

        $result = $this->seatLockingService->lockSeats($seats, $showtimeId, $userId);

        $this->assertTrue($result['success']);
    }

    /** @test */
    public function it_can_unlock_user_seats()
    {
        $seats = ['A1', 'A2'];
        $showtimeId = 1;
        $userId = 1;

        // Mock existing locks by the user
        $userLock = json_encode([
            'user_id' => $userId,
            'locked_at' => now()->toISOString(),
            'showtime_id' => $showtimeId,
            'expires_at' => now()->addMinutes(15)->toISOString()
        ]);

        $this->redisMock->shouldReceive('get')
            ->twice()
            ->andReturn($userLock);

        $this->redisMock->shouldReceive('del')
            ->twice()
            ->andReturn(1);

        $result = $this->seatLockingService->unlockSeats($seats, $showtimeId, $userId);

        $this->assertTrue($result);
    }

    /** @test */
    public function it_only_unlocks_seats_belonging_to_user()
    {
        $seats = ['A1'];
        $showtimeId = 1;
        $userId = 1;
        $otherUserId = 2;

        // Mock existing lock by another user
        $otherUserLock = json_encode([
            'user_id' => $otherUserId,
            'locked_at' => now()->toISOString(),
            'showtime_id' => $showtimeId,
            'expires_at' => now()->addMinutes(15)->toISOString()
        ]);

        $this->redisMock->shouldReceive('get')
            ->once()
            ->andReturn($otherUserLock);

        // Should not call del since user doesn't own the lock
        $this->redisMock->shouldNotReceive('del');

        $result = $this->seatLockingService->unlockSeats($seats, $showtimeId, $userId);

        $this->assertFalse($result);
    }

    /** @test */
    public function it_can_extend_lock_duration()
    {
        $seats = ['A1'];
        $showtimeId = 1;
        $userId = 1;

        // Mock existing lock by the user
        $userLock = json_encode([
            'user_id' => $userId,
            'locked_at' => now()->toISOString(),
            'showtime_id' => $showtimeId,
            'expires_at' => now()->addMinutes(5)->toISOString() // About to expire
        ]);

        $this->redisMock->shouldReceive('get')
            ->once()
            ->andReturn($userLock);

        $this->redisMock->shouldReceive('setex')
            ->once()
            ->with(Mockery::any(), 900, Mockery::any());

        $result = $this->seatLockingService->extendLock($seats, $showtimeId, $userId);

        $this->assertTrue($result['success']);
        $this->assertContains('A1', $result['extended_seats']);
        $this->assertEmpty($result['failed_seats']);
    }

    /** @test */
    public function it_gets_seat_status_correctly()
    {
        $showtimeId = 1;

        // Mock Redis keys and lock data
        $lockKeys = [
            'seat_lock:1:A1',
            'seat_lock:1:B2'
        ];

        $lockData1 = json_encode([
            'user_id' => 1,
            'locked_at' => now()->toISOString(),
            'showtime_id' => $showtimeId,
            'expires_at' => now()->addMinutes(15)->toISOString()
        ]);

        $lockData2 = json_encode([
            'user_id' => 2,
            'locked_at' => now()->toISOString(),
            'showtime_id' => $showtimeId,
            'expires_at' => now()->addMinutes(10)->toISOString()
        ]);

        $this->redisMock->shouldReceive('keys')
            ->once()
            ->andReturn($lockKeys);

        $this->redisMock->shouldReceive('get')
            ->with('seat_lock:1:A1')
            ->once()
            ->andReturn($lockData1);

        $this->redisMock->shouldReceive('get')
            ->with('seat_lock:1:B2')
            ->once()
            ->andReturn($lockData2);

        $result = $this->seatLockingService->getSeatStatus($showtimeId);

        $this->assertTrue($result['success']);
        $this->assertEquals($showtimeId, $result['showtime_id']);
        $this->assertCount(2, $result['seat_status']['locked']);
    }

    /** @test */
    public function it_handles_redis_connection_failure_gracefully()
    {
        $seats = ['A1'];
        $showtimeId = 1;
        $userId = 1;

        // Mock Redis connection failure
        Redis::shouldReceive('connection')->andThrow(new \Exception('Redis connection failed'));

        $result = $this->seatLockingService->lockSeats($seats, $showtimeId, $userId);

        $this->assertFalse($result['success']);
        $this->assertEquals('Seat locking service temporarily unavailable', $result['message']);
    }

    /** @test */
    public function it_can_test_redis_connectivity()
    {
        $testKey = 'connection_test_' . time();

        $this->redisMock->shouldReceive('set')
            ->once()
            ->with($testKey, 'test_value', 'EX', 10);

        $this->redisMock->shouldReceive('get')
            ->once()
            ->with($testKey)
            ->andReturn('test_value');

        $this->redisMock->shouldReceive('del')
            ->once()
            ->with($testKey);

        $this->redisMock->shouldReceive('info')
            ->once()
            ->andReturn(['redis_version' => '6.0']);

        $result = $this->seatLockingService->testConnection();

        $this->assertTrue($result['success']);
        $this->assertEquals('Redis connection is working', $result['message']);
    }

    /** @test */
    public function it_generates_correct_lock_keys()
    {
        $reflection = new \ReflectionClass($this->seatLockingService);
        $method = $reflection->getMethod('getLockKey');
        $method->setAccessible(true);

        $key = $method->invokeArgs($this->seatLockingService, [123, 'A1']);

        $this->assertEquals('seat_lock:123:A1', $key);
    }

    /** @test */
    public function it_extracts_seat_from_key_correctly()
    {
        $reflection = new \ReflectionClass($this->seatLockingService);
        $method = $reflection->getMethod('extractSeatFromKey');
        $method->setAccessible(true);

        $seat = $method->invokeArgs($this->seatLockingService, ['seat_lock:123:B5']);

        $this->assertEquals('B5', $seat);
    }

    /** @test */
    public function it_provides_lock_statistics()
    {
        $lockKeys = [
            'seat_lock:1:A1',
            'seat_lock:1:B2',
            'seat_lock:2:C3'
        ];

        $lockData1 = json_encode(['user_id' => 1, 'showtime_id' => 1]);
        $lockData2 = json_encode(['user_id' => 2, 'showtime_id' => 1]);
        $lockData3 = json_encode(['user_id' => 1, 'showtime_id' => 2]);

        $this->redisMock->shouldReceive('keys')->once()->andReturn($lockKeys);
        $this->redisMock->shouldReceive('get')->times(3)->andReturn($lockData1, $lockData2, $lockData3);

        $result = $this->seatLockingService->getLockStatistics();

        $this->assertTrue($result['success']);
        $this->assertEquals(3, $result['statistics']['total_locks']);
        $this->assertEquals(2, $result['statistics']['locks_by_showtime'][1]);
        $this->assertEquals(1, $result['statistics']['locks_by_showtime'][2]);
        $this->assertEquals(2, $result['statistics']['locks_by_user'][1]);
        $this->assertEquals(1, $result['statistics']['locks_by_user'][2]);
    }
}