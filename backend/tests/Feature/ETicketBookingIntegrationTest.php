<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Movie;
use App\Models\Theater;
use App\Models\Showtime;
use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class ETicketBookingIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $movie;
    protected $theater;
    protected $showtime;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Fake storage for testing
        Storage::fake('public');
        
        $this->createTestData();
    }

    private function createTestData()
    {
        $this->user = User::factory()->create();

        $this->movie = Movie::factory()->create([
            'title' => 'Integration Test Movie',
            'duration' => 120,
            'genre' => ['Action', 'Drama'],
            'status' => 'active'
        ]);

        $this->theater = Theater::factory()->create([
            'name' => 'Integration Test Theater',
            'city' => 'Test City'
        ]);

        $this->showtime = Showtime::factory()->create([
            'movie_id' => $this->movie->id,
            'theater_id' => $this->theater->id,
            'show_date' => Carbon::tomorrow()->format('Y-m-d'),
            'show_time' => '19:00:00',
            'prices' => [
                'gold' => 120000,
                'platinum' => 150000,
                'box' => 200000
            ]
        ]);
    }

    public function test_complete_booking_flow_with_eticket_generation()
    {
        // Step 1: Create booking
        $bookingData = [
            'showtime_id' => $this->showtime->id,
            'seats' => [
                ['seat' => 'A1', 'type' => 'gold'],
                ['seat' => 'A2', 'type' => 'gold']
            ],
            'payment_method' => 'credit_card'
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/bookings', $bookingData);

        $response->assertStatus(200)
                ->assertJsonStructure(['success', 'data', 'message']);

        $bookingId = $response->json('data.id');
        $booking = Booking::find($bookingId);

        // Step 2: Process payment (which should trigger e-ticket generation)
        $paymentData = [
            'payment_method' => 'credit_card',
            'card_details' => [
                'card_number' => '4111111111111111',
                'card_holder' => 'John Doe',
                'expiry_month' => 12,
                'expiry_year' => 2025,
                'cvv' => '123'
            ]
        ];

        $paymentResponse = $this->actingAs($this->user)
            ->postJson("/api/v1/bookings/{$bookingId}/payment", $paymentData);

        $paymentResponse->assertStatus(200);

        // Verify payment response includes e-ticket data
        $paymentResponse->assertJsonStructure([
            'success',
            'data' => [
                'payment',
                'booking',
                'transaction_id',
                'eticket'
            ]
        ]);

        // Step 3: Verify e-ticket was generated and booking updated
        $booking->refresh();
        $this->assertNotNull($booking->ticket_data);
        $this->assertNotNull($booking->qr_code);

        // Step 4: Get e-ticket via API
        $ticketResponse = $this->actingAs($this->user)
            ->getJson("/api/v1/bookings/{$bookingId}/ticket");

        $ticketResponse->assertStatus(200)
                      ->assertJsonStructure([
                          'success',
                          'data' => [
                              'booking_code',
                              'ticket_data',
                              'qr_code_url',
                              'is_valid',
                              'validation_message'
                          ]
                      ]);

        $this->assertTrue($ticketResponse->json('data.is_valid'));

        // Step 5: Verify ticket verification works
        $qrCodeData = json_encode([
            'booking_code' => $booking->booking_code,
            'type' => 'cinema_ticket',
            'generated_at' => now()->toISOString(),
            'verification_url' => config('app.url') . '/api/v1/tickets/verify/' . $booking->booking_code,
        ]);

        $verifyResponse = $this->postJson('/api/v1/tickets/verify', [
            'qr_data' => $qrCodeData
        ]);

        $verifyResponse->assertStatus(200)
                      ->assertJson(['success' => true]);
    }

    public function test_manual_eticket_generation()
    {
        // Create a paid booking without e-ticket
        $booking = Booking::factory()->create([
            'user_id' => $this->user->id,
            'showtime_id' => $this->showtime->id,
            'payment_status' => Booking::PAYMENT_COMPLETED,
            'booking_status' => Booking::STATUS_CONFIRMED,
            'ticket_data' => null
        ]);

        Payment::factory()->create([
            'booking_id' => $booking->id,
            'status' => Payment::STATUS_COMPLETED
        ]);

        // Generate e-ticket manually
        $response = $this->actingAs($this->user)
            ->postJson("/api/v1/bookings/{$booking->id}/generate-ticket");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'booking_id',
                        'booking_code',
                        'ticket_data',
                        'qr_code'
                    ],
                    'message'
                ]);

        // Verify booking was updated
        $booking->refresh();
        $this->assertNotNull($booking->ticket_data);
    }

    public function test_regenerate_existing_eticket()
    {
        // Create booking with existing e-ticket data
        $booking = Booking::factory()->create([
            'user_id' => $this->user->id,
            'showtime_id' => $this->showtime->id,
            'payment_status' => Booking::PAYMENT_COMPLETED,
            'booking_status' => Booking::STATUS_CONFIRMED,
            'ticket_data' => ['old' => 'data'],
            'qr_code' => 'old_qr_path.png'
        ]);

        Payment::factory()->create([
            'booking_id' => $booking->id,
            'status' => Payment::STATUS_COMPLETED
        ]);

        // Regenerate e-ticket
        $response = $this->actingAs($this->user)
            ->postJson("/api/v1/bookings/{$booking->id}/generate-ticket");

        $response->assertStatus(200);

        // Verify booking was updated with new data
        $booking->refresh();
        $this->assertNotEquals(['old' => 'data'], $booking->ticket_data);
    }

    public function test_eticket_access_control()
    {
        $otherUser = User::factory()->create();
        
        $booking = Booking::factory()->create([
            'user_id' => $this->user->id,
            'showtime_id' => $this->showtime->id,
            'payment_status' => Booking::PAYMENT_COMPLETED,
            'booking_status' => Booking::STATUS_CONFIRMED
        ]);

        // Other user tries to access ticket
        $response = $this->actingAs($otherUser)
            ->getJson("/api/v1/bookings/{$booking->id}/ticket");

        $response->assertStatus(403)
                ->assertJson(['success' => false]);

        // Other user tries to generate ticket
        $response = $this->actingAs($otherUser)
            ->postJson("/api/v1/bookings/{$booking->id}/generate-ticket");

        $response->assertStatus(403)
                ->assertJson(['success' => false]);
    }

    public function test_eticket_generation_for_ineligible_booking()
    {
        // Create unpaid booking
        $booking = Booking::factory()->create([
            'user_id' => $this->user->id,
            'showtime_id' => $this->showtime->id,
            'payment_status' => Booking::PAYMENT_PENDING,
            'booking_status' => Booking::STATUS_PENDING
        ]);

        // Try to generate e-ticket
        $response = $this->actingAs($this->user)
            ->postJson("/api/v1/bookings/{$booking->id}/generate-ticket");

        $response->assertStatus(400)
                ->assertJson(['success' => false])
                ->assertJsonFragment(['message' => 'Booking không đủ điều kiện tạo e-ticket']);
    }

    public function test_payment_flow_includes_eticket_in_response()
    {
        $booking = Booking::factory()->create([
            'user_id' => $this->user->id,
            'showtime_id' => $this->showtime->id,
            'payment_status' => Booking::PAYMENT_PENDING,
            'booking_status' => Booking::STATUS_PENDING
        ]);

        $paymentData = [
            'payment_method' => 'credit_card',
            'card_details' => [
                'card_number' => '4111111111111111',
                'card_holder' => 'John Doe',
                'expiry_month' => 12,
                'expiry_year' => 2025,
                'cvv' => '123'
            ]
        ];

        $response = $this->actingAs($this->user)
            ->postJson("/api/v1/bookings/{$booking->id}/payment", $paymentData);

        $response->assertStatus(200);

        // Verify response includes e-ticket data
        $responseData = $response->json('data');
        $this->assertArrayHasKey('eticket', $responseData);

        // If e-ticket generation succeeded, it should have the proper structure
        if ($responseData['eticket'] !== null) {
            $this->assertArrayHasKey('booking_code', $responseData['eticket']);
            $this->assertArrayHasKey('ticket_data', $responseData['eticket']);
        }
    }
}