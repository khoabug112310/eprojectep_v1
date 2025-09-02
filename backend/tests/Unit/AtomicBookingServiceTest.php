<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\AtomicBookingService;
use App\Services\SeatLockingService;
use App\Services\PaymentService;
use App\Models\Booking;
use App\Models\Showtime;
use App\Models\Payment;
use App\Models\User;
use App\Models\Movie;
use App\Models\Theater;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Mockery;
use Carbon\Carbon;

class AtomicBookingServiceTest extends TestCase
{
    use RefreshDatabase;

    protected AtomicBookingService $atomicBookingService;
    protected $seatLockingService;
    protected $paymentService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->seatLockingService = Mockery::mock(SeatLockingService::class);
        $this->paymentService = Mockery::mock(PaymentService::class);
        
        $this->atomicBookingService = new AtomicBookingService(
            $this->seatLockingService,
            $this->paymentService
        );
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_can_create_atomic_booking_successfully()
    {
        $testData = $this->createTestData();
        
        // Mock seat locking service
        $this->seatLockingService
            ->shouldReceive('lockSeat')
            ->times(2)
            ->andReturn([
                'success' => true,
                'lock_key' => 'test_lock_key',
                'expires_at' => Carbon::now()->addMinutes(15)->toISOString()
            ]);

        $bookingData = [
            'user_id' => $testData['user']->id,
            'showtime_id' => $testData['showtime']->id,
            'seats' => [
                ['seat' => 'A1', 'type' => 'gold'],
                ['seat' => 'A2', 'type' => 'gold']
            ],
            'payment_method' => 'credit_card'
        ];

        $result = $this->atomicBookingService->createAtomicBooking($bookingData);

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('booking', $result);
        $this->assertArrayHasKey('transaction_id', $result);
        $this->assertInstanceOf(Booking::class, $result['booking']);
        
        // Verify booking was created in database
        $this->assertDatabaseHas('bookings', [
            'user_id' => $testData['user']->id,
            'showtime_id' => $testData['showtime']->id,
            'booking_status' => 'confirmed'
        ]);
    }

    /** @test */
    public function it_fails_when_seat_locking_fails()
    {
        $testData = $this->createTestData();
        
        // Mock seat locking service to fail
        $this->seatLockingService
            ->shouldReceive('lockSeat')
            ->once()
            ->andReturn([
                'success' => false,
                'message' => 'Seat already locked'
            ]);

        $bookingData = [
            'user_id' => $testData['user']->id,
            'showtime_id' => $testData['showtime']->id,
            'seats' => [
                ['seat' => 'A1', 'type' => 'gold']
            ],
            'payment_method' => 'credit_card'
        ];

        $result = $this->atomicBookingService->createAtomicBooking($bookingData);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Seat locking failed', $result['message']);
        
        // Verify no booking was created
        $this->assertDatabaseMissing('bookings', [
            'user_id' => $testData['user']->id,
            'showtime_id' => $testData['showtime']->id
        ]);
    }

    /** @test */
    public function it_fails_when_showtime_is_invalid()
    {
        $testData = $this->createTestData();
        
        // Create past showtime
        $pastShowtime = Showtime::factory()->create([
            'movie_id' => $testData['movie']->id,
            'theater_id' => $testData['theater']->id,
            'show_date' => Carbon::yesterday()->format('Y-m-d'),
            'show_time' => '19:00:00',
            'status' => 'active'
        ]);

        $bookingData = [
            'user_id' => $testData['user']->id,
            'showtime_id' => $pastShowtime->id,
            'seats' => [
                ['seat' => 'A1', 'type' => 'gold']
            ],
            'payment_method' => 'credit_card'
        ];

        $result = $this->atomicBookingService->createAtomicBooking($bookingData);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Showtime validation failed', $result['message']);
    }

    /** @test */
    public function it_can_cancel_booking_atomically()
    {
        $testData = $this->createTestData();
        
        // Create a booking to cancel
        $booking = Booking::factory()->create([
            'user_id' => $testData['user']->id,
            'showtime_id' => $testData['showtime']->id,
            'booking_code' => 'TEST123',
            'booking_status' => 'confirmed',
            'payment_status' => 'pending',
            'seats' => [['seat' => 'A1', 'type' => 'gold', 'price' => 120000]],
            'total_amount' => 120000
        ]);

        $result = $this->atomicBookingService->cancelBookingAtomically('TEST123');

        $this->assertTrue($result['success']);
        $this->assertEquals('cancelled', $result['booking']->booking_status);
        
        // Verify booking was updated in database
        $this->assertDatabaseHas('bookings', [
            'booking_code' => 'TEST123',
            'booking_status' => 'cancelled'
        ]);
    }

    /** @test */
    public function it_fails_to_cancel_non_existent_booking()
    {
        $result = $this->atomicBookingService->cancelBookingAtomically('NONEXISTENT');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Booking not found', $result['message']);
    }

    /** @test */
    public function it_fails_to_cancel_already_cancelled_booking()
    {
        $testData = $this->createTestData();
        
        // Create a cancelled booking
        $booking = Booking::factory()->create([
            'user_id' => $testData['user']->id,
            'showtime_id' => $testData['showtime']->id,
            'booking_code' => 'TEST456',
            'booking_status' => 'cancelled'
        ]);

        $result = $this->atomicBookingService->cancelBookingAtomically('TEST456');

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('already cancelled', $result['message']);
    }

    /** @test */
    public function it_validates_showtime_constraints_correctly()
    {
        $testData = $this->createTestData();

        $reflection = new \ReflectionClass($this->atomicBookingService);
        $method = $reflection->getMethod('validateShowtimeConstraints');
        $method->setAccessible(true);

        $seats = [['seat' => 'A1', 'type' => 'gold']];
        $result = $method->invoke($this->atomicBookingService, $testData['showtime']->id, $seats);

        $this->assertTrue($result['valid']);
        $this->assertArrayHasKey('showtime', $result);
        $this->assertArrayHasKey('deadline', $result);
    }

    /** @test */
    public function it_calculates_pricing_correctly()
    {
        $testData = $this->createTestData();

        $reflection = new \ReflectionClass($this->atomicBookingService);
        $method = $reflection->getMethod('calculateAtomicPricing');
        $method->setAccessible(true);

        $seats = [
            ['seat' => 'A1', 'type' => 'gold'],
            ['seat' => 'P1', 'type' => 'platinum']
        ];
        
        $result = $method->invoke($this->atomicBookingService, $testData['showtime']->id, $seats);

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('pricing', $result);
        $this->assertEquals(270000, $result['pricing']['total_amount']); // 120000 + 150000
        $this->assertCount(2, $result['pricing']['seat_pricing']);
    }

    /** @test */
    public function it_updates_showtime_availability_correctly()
    {
        $testData = $this->createTestData();

        $reflection = new \ReflectionClass($this->atomicBookingService);
        $method = $reflection->getMethod('updateShowtimeAvailability');
        $method->setAccessible(true);

        $seats = [['seat' => 'A1', 'type' => 'gold']];
        
        // Reserve seat
        $result = $method->invoke($this->atomicBookingService, $testData['showtime']->id, $seats, 'reserve');
        $this->assertTrue($result['success']);
        
        // Check that A1 was removed from available seats
        $showtime = Showtime::find($testData['showtime']->id);
        $availableSeats = $showtime->available_seats;
        $this->assertNotContains('A1', $availableSeats['gold']);
        
        // Release seat
        $result = $method->invoke($this->atomicBookingService, $testData['showtime']->id, $seats, 'release');
        $this->assertTrue($result['success']);
        
        // Check that A1 was added back to available seats
        $showtime = Showtime::find($testData['showtime']->id);
        $availableSeats = $showtime->available_seats;
        $this->assertContains('A1', $availableSeats['gold']);
    }

    /** @test */
    public function it_validates_cancellation_eligibility()
    {
        $testData = $this->createTestData();
        
        $booking = Booking::factory()->create([
            'user_id' => $testData['user']->id,
            'showtime_id' => $testData['showtime']->id,
            'booking_status' => 'confirmed'
        ]);

        $reflection = new \ReflectionClass($this->atomicBookingService);
        $method = $reflection->getMethod('validateCancellationEligibility');
        $method->setAccessible(true);

        $result = $method->invoke($this->atomicBookingService, $booking);

        $this->assertTrue($result['eligible']);
    }

    /** @test */
    public function it_prevents_cancellation_of_used_booking()
    {
        $testData = $this->createTestData();
        
        $booking = Booking::factory()->create([
            'user_id' => $testData['user']->id,
            'showtime_id' => $testData['showtime']->id,
            'booking_status' => 'used'
        ]);

        $reflection = new \ReflectionClass($this->atomicBookingService);
        $method = $reflection->getMethod('validateCancellationEligibility');
        $method->setAccessible(true);

        $result = $method->invoke($this->atomicBookingService, $booking);

        $this->assertFalse($result['eligible']);
        $this->assertStringContainsString('already been used', $result['reason']);
    }

    /** @test */
    public function it_generates_unique_booking_codes()
    {
        $reflection = new \ReflectionClass($this->atomicBookingService);
        $method = $reflection->getMethod('generateUniqueBookingCode');
        $method->setAccessible(true);

        $code1 = $method->invoke($this->atomicBookingService);
        $code2 = $method->invoke($this->atomicBookingService);

        $this->assertNotEquals($code1, $code2);
        $this->assertStringStartsWith('CB', $code1);
        $this->assertStringStartsWith('CB', $code2);
        $this->assertEquals(10, strlen($code1)); // CB + 8 characters
    }

    /** @test */
    public function it_gets_correct_error_codes()
    {
        $reflection = new \ReflectionClass($this->atomicBookingService);
        $method = $reflection->getMethod('getErrorCode');
        $method->setAccessible(true);

        $this->assertEquals('SEAT_ERROR', $method->invoke($this->atomicBookingService, 'Seat is not available'));
        $this->assertEquals('PAYMENT_ERROR', $method->invoke($this->atomicBookingService, 'Payment failed'));
        $this->assertEquals('SHOWTIME_ERROR', $method->invoke($this->atomicBookingService, 'Showtime not found'));
        $this->assertEquals('DEADLINE_ERROR', $method->invoke($this->atomicBookingService, 'Booking deadline has passed'));
        $this->assertEquals('GENERAL_ERROR', $method->invoke($this->atomicBookingService, 'Some other error'));
    }

    /** @test */
    public function it_handles_database_transaction_rollback_on_failure()
    {
        $testData = $this->createTestData();
        
        // Mock seat locking to succeed initially
        $this->seatLockingService
            ->shouldReceive('lockSeat')
            ->once()
            ->andReturn([
                'success' => true,
                'lock_key' => 'test_lock_key',
                'expires_at' => Carbon::now()->addMinutes(15)->toISOString()
            ]);
        
        // Mock release seat for cleanup
        $this->seatLockingService
            ->shouldReceive('releaseSeat')
            ->once()
            ->andReturn(['success' => true]);

        $bookingData = [
            'user_id' => $testData['user']->id,
            'showtime_id' => 999999, // Non-existent showtime
            'seats' => [
                ['seat' => 'A1', 'type' => 'gold']
            ],
            'payment_method' => 'credit_card'
        ];

        $result = $this->atomicBookingService->createAtomicBooking($bookingData);

        $this->assertFalse($result['success']);
        
        // Verify no booking was created due to transaction rollback
        $this->assertDatabaseMissing('bookings', [
            'user_id' => $testData['user']->id
        ]);
    }

    /**
     * Create test data for booking scenarios
     */
    protected function createTestData(): array
    {
        $user = User::factory()->create();
        $movie = Movie::factory()->create();
        $theater = Theater::factory()->create();
        
        $showtime = Showtime::factory()->create([
            'movie_id' => $movie->id,
            'theater_id' => $theater->id,
            'show_date' => Carbon::tomorrow()->format('Y-m-d'),
            'show_time' => '19:00:00',
            'prices' => [
                'gold' => 120000,
                'platinum' => 150000
            ],
            'available_seats' => [
                'gold' => ['A1', 'A2', 'A3', 'B1', 'B2'],
                'platinum' => ['P1', 'P2', 'P3']
            ],
            'status' => 'active'
        ]);

        return [
            'user' => $user,
            'movie' => $movie,
            'theater' => $theater,
            'showtime' => $showtime
        ];
    }
}