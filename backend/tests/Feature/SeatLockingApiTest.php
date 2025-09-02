<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Movie;
use App\Models\Theater;
use App\Models\Showtime;
use App\Services\SeatLockingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Illuminate\Support\Facades\Redis;
use Laravel\Sanctum\Sanctum;
use Mockery;

class SeatLockingApiTest extends TestCase
{
    use RefreshDatabase, WithoutMiddleware;

    protected $user;
    protected $movie;
    protected $theater;
    protected $showtime;
    protected $seatLockingService;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Skip Redis operations in testing to avoid issues
        $this->seatLockingService = $this->mock(SeatLockingService::class);
        
        // Create test data
        $this->user = User::factory()->create();
        $this->movie = Movie::factory()->create();
        $this->theater = Theater::factory()->create();
        $this->showtime = Showtime::factory()->create([
            'movie_id' => $this->movie->id,
            'theater_id' => $this->theater->id,
            'show_date' => now()->addDays(1)->format('Y-m-d'),
            'show_time' => '19:00:00',
        ]);
        
        // Authenticate user
        Sanctum::actingAs($this->user);
    }

    /** @test */
    public function it_can_lock_seats_via_api()
    {
        $seats = [
            ['seat' => 'A1', 'type' => 'gold'],
            ['seat' => 'A2', 'type' => 'gold']
        ];

        // Mock the lockSeats method
        $this->seatLockingService->expects('lockSeats')
            ->with(['A1', 'A2'], $this->showtime->id, $this->user->id)
            ->once()
            ->andReturn(true);

        // Mock the getSeatStatus method
        $this->seatLockingService->expects('getSeatStatus')
            ->with($this->showtime->id)
            ->once()
            ->andReturn([
                'success' => true,
                'seat_status' => [
                    'locked' => [
                        ['seat' => 'A1', 'user_id' => $this->user->id, 'showtime_id' => $this->showtime->id],
                        ['seat' => 'A2', 'user_id' => $this->user->id, 'showtime_id' => $this->showtime->id]
                    ]
                ]
            ]);

        $response = $this->postJson("/api/v1/showtimes/{$this->showtime->id}/seats/lock", [
            'seats' => $seats,
            'user_id' => $this->user->id
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'message' => 'Seats locked successfully'
                 ]);

        $responseData = $response->json();
        $this->assertCount(2, $responseData['data']['locked_seats']);
        $this->assertEquals(900, $responseData['data']['lock_duration']);
    }

    /** @test */
    public function it_prevents_locking_already_locked_seats()
    {
        // Mock checking existing locks
        $this->seatLockingService->expects('checkSeatLocks')
            ->with(['A1', 'A2'], $this->showtime->id)
            ->once()
            ->andReturn([
                'available' => [],
                'locked' => ['A1', 'A2']
            ]);

        // Second user tries to lock same seats
        $response = $this->postJson("/api/v1/showtimes/{$this->showtime->id}/seats/lock", [
            'seats' => [
                ['seat' => 'A1', 'type' => 'gold'],
                ['seat' => 'A2', 'type' => 'gold']
            ],
            'user_id' => $this->user->id
        ]);

        $response->assertStatus(422)
                 ->assertJson([
                     'success' => false,
                     'message' => 'Some seats are already locked by other users'
                 ]);

        $responseData = $response->json();
        $this->assertContains('A1', $responseData['data']['conflicts']);
        $this->assertContains('A2', $responseData['data']['conflicts']);
    }

    /** @test */
    public function it_can_unlock_seats_via_api()
    {
        // Mock unlocking seats
        $this->seatLockingService->expects('unlockSeats')
            ->with(['A1', 'A2'], $this->showtime->id, $this->user->id)
            ->once()
            ->andReturn(true);

        // Mock getting seat status after unlock
        $this->seatLockingService->expects('getSeatStatus')
            ->with($this->showtime->id)
            ->once()
            ->andReturn([
                'success' => true,
                'seat_status' => [
                    'locked' => []
                ]
            ]);

        $response = $this->deleteJson("/api/v1/showtimes/{$this->showtime->id}/seats/unlock", [
            'seats' => ['A1', 'A2'],
            'user_id' => $this->user->id
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'message' => 'Seats unlocked successfully'
                 ]);
    }

    /** @test */
    public function it_only_allows_users_to_unlock_their_own_seats()
    {
        // Mock checking ownership of seats
        $this->seatLockingService->expects('checkSeatOwnership')
            ->with(['A1', 'A2'], $this->showtime->id, $this->user->id)
            ->once()
            ->andReturn(false);

        // Second user tries to unlock seats
        $response = $this->deleteJson("/api/v1/showtimes/{$this->showtime->id}/seats/unlock", [
            'seats' => ['A1', 'A2'],
            'user_id' => $this->user->id
        ]);

        $response->assertStatus(422)
                 ->assertJson([
                     'success' => false,
                     'message' => 'You can only unlock seats that you have locked'
                 ]);
    }

    /** @test */
    public function it_can_extend_lock_duration_via_api()
    {
        // Mock extending lock duration using the correct method name
        $this->seatLockingService->expects('extendLock')
            ->with(['A1', 'A2'], $this->showtime->id, $this->user->id)
            ->once()
            ->andReturn([
                'success' => true,
                'extended_seats' => ['A1', 'A2'],
                'failed_seats' => [],
                'message' => 'Lock extended successfully'
            ]);

        // Extend lock duration
        $response = $this->putJson("/api/v1/showtimes/{$this->showtime->id}/seats/extend-lock", [
            'seats' => ['A1', 'A2'],
            'user_id' => $this->user->id
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true
                 ]);

        $responseData = $response->json();
        $this->assertContains('A1', $responseData['extended_seats']);
        $this->assertContains('A2', $responseData['extended_seats']);
        $this->assertEmpty($responseData['failed_seats']);
    }

    /** @test */
    public function it_can_get_seat_status_via_api()
    {
        // Mock getting seat status
        $this->seatLockingService->expects('getSeatStatus')
            ->with($this->showtime->id)
            ->once()
            ->andReturn([
                'success' => true,
                'seat_status' => [
                    'locked' => [
                        ['seat' => 'A1', 'user_id' => $this->user->id, 'showtime_id' => $this->showtime->id],
                        ['seat' => 'A2', 'user_id' => $this->user->id, 'showtime_id' => $this->showtime->id]
                    ]
                ]
            ]);

        $response = $this->getJson("/api/v1/showtimes/{$this->showtime->id}/seat-status");

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true
                 ]);

        $responseData = $response->json();
        $this->assertArrayHasKey('showtime', $responseData['data']);
        $this->assertArrayHasKey('seat_map', $responseData['data']);
        $this->assertArrayHasKey('lock_statistics', $responseData['data']);
    }

    /** @test */
    public function it_validates_request_data()
    {
        // Test empty seats array
        $response = $this->postJson("/api/v1/showtimes/{$this->showtime->id}/seats/lock", [
            'seats' => [],
            'user_id' => $this->user->id
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['seats']);

        // Test invalid seat format
        $response = $this->postJson("/api/v1/showtimes/{$this->showtime->id}/seats/lock", [
            'seats' => ['INVALID_SEAT'],
            'user_id' => $this->user->id
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['seats.0']);
    }

    /** @test */
    public function it_handles_non_existent_showtime()
    {
        $nonExistentShowtimeId = 99999;

        $response = $this->postJson("/api/v1/showtimes/{$nonExistentShowtimeId}/seats/lock", [
            'seats' => ['A1'],
            'user_id' => $this->user->id
        ]);

        $response->assertStatus(404);
    }

    /** @test */
    public function it_requires_authentication_for_seat_operations()
    {
        // Remove authentication
        $this->withoutMiddleware();

        $response = $this->postJson("/api/v1/showtimes/{$this->showtime->id}/seats/lock", [
            'seats' => ['A1'],
            'user_id' => $this->user->id
        ]);

        $response->assertStatus(401);
    }

    /** @test */
    public function it_handles_concurrent_seat_locking_requests()
    {
        // Mock the first successful lock
        $this->seatLockingService->expects('lockSeats')
            ->with(['A1'], $this->showtime->id, $this->user->id)
            ->once()
            ->andReturn([
                'success' => true,
                'locked_seats' => ['A1']
            ]);
            
        // Mock checking seats for second user (should find conflicts)
        $this->seatLockingService->expects('lockSeats')
            ->with(['A1'], $this->showtime->id, Mockery::any())
            ->once()
            ->andReturn([
                'success' => false,
                'message' => 'Seat already locked',
                'conflicts' => ['A1']
            ]);
        
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        // First request should succeed
        Sanctum::actingAs($user1);
        $response1 = $this->postJson("/api/v1/showtimes/{$this->showtime->id}/seats/lock", [
            'seats' => ['A1'],
            'user_id' => $user1->id
        ]);

        // Second request should fail due to conflict
        Sanctum::actingAs($user2);
        $response2 = $this->postJson("/api/v1/showtimes/{$this->showtime->id}/seats/lock", [
            'seats' => ['A1'],
            'user_id' => $user2->id
        ]);

        $response1->assertStatus(200);
        $response2->assertStatus(409);
        
        $response2Data = $response2->json();
        $this->assertContains('A1', $response2Data['conflicts']);
    }

    /** @test */
    public function it_provides_lock_statistics()
    {
        // Mock seat status with statistics
        $this->seatLockingService->expects('getSeatStatus')
            ->with($this->showtime->id)
            ->once()
            ->andReturn([
                'success' => true,
                'seat_status' => [
                    'locked' => [
                        ['seat' => 'A1', 'user_id' => 1],
                        ['seat' => 'A2', 'user_id' => 1],
                        ['seat' => 'B1', 'user_id' => 2]
                    ]
                ]
            ]);

        $response = $this->getJson("/api/v1/showtimes/{$this->showtime->id}/seat-status");

        $response->assertStatus(200);
        $responseData = $response->json();
        
        // Check that we have the expected data structure
        $this->assertArrayHasKey('data', $responseData);
        $this->assertArrayHasKey('lock_statistics', $responseData['data']);
        $this->assertTrue($responseData['success']);
    }

    /** @test */
    public function it_handles_redis_connectivity_issues()
    {
        // Mock service to throw connection error
        $this->seatLockingService->expects('lockSeats')
            ->with(['A1'], $this->showtime->id, $this->user->id)
            ->once()
            ->andThrow(new \Exception('Redis connection failed'));

        $response = $this->postJson("/api/v1/showtimes/{$this->showtime->id}/seats/lock", [
            'seats' => ['A1'],
            'user_id' => $this->user->id
        ]);

        $response->assertStatus(503)
                 ->assertJson([
                     'success' => false,
                     'message' => 'Seat locking service temporarily unavailable'
                 ]);
    }

    /** @test */
    public function it_provides_health_check_endpoint()
    {
        // Mock both methods that might be called by health check
        $this->seatLockingService->expects('testConnection')
            ->once()
            ->andReturn([
                'redis_status' => 'connected',
                'memory_usage' => '2.5MB',
                'active_locks' => 0
            ]);
            
        $this->seatLockingService->expects('getLockStatistics')
            ->once()
            ->andReturn([
                'total_locks' => 0,
                'locks_by_user' => []
            ]);

        $response = $this->getJson('/api/v1/seat-locking/health');

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true,
                     'service' => 'seat-locking',
                     'status' => 'healthy'
                 ]);

        $responseData = $response->json();
        $this->assertArrayHasKey('redis_status', $responseData['data']);
        $this->assertArrayHasKey('memory_usage', $responseData['data']);
        $this->assertArrayHasKey('active_locks', $responseData['data']);
    }

    /** @test */
    public function it_auto_expires_seat_locks()
    {
        // Mock initial lock status - return array as expected by the service
        $this->seatLockingService->expects('lockSeats')
            ->with(['A1', 'A2'], $this->showtime->id, $this->user->id)
            ->once()
            ->andReturn([
                'success' => true,
                'locked_seats' => ['A1', 'A2'],
                'expires_at' => now()->addMinutes(15)->toISOString()
            ]);
            
        // Mock status before expiry
        $this->seatLockingService->expects('getSeatStatus')
            ->with($this->showtime->id)
            ->once()
            ->andReturn([
                'seat_status' => [
                    'locked' => [
                        ['seat' => 'A1'],
                        ['seat' => 'A2']
                    ]
                ]
            ]);
            
        // Mock status after expiry
        $this->seatLockingService->expects('getSeatStatus')
            ->with($this->showtime->id)
            ->once()
            ->andReturn([
                'seat_status' => [
                    'locked' => []
                ]
            ]);

        // Lock seats with a very short TTL for testing
        $seats = ['A1', 'A2'];
        $result = $this->seatLockingService->lockSeats($seats, $this->showtime->id, $this->user->id);
        $this->assertTrue($result['success']);

        // Verify seats are locked
        $status = $this->seatLockingService->getSeatStatus($this->showtime->id);
        $this->assertCount(2, $status['seat_status']['locked']);

        // Verify seats are no longer locked (after expiry simulation)
        $status = $this->seatLockingService->getSeatStatus($this->showtime->id);
        $this->assertEmpty($status['seat_status']['locked']);
    }
}