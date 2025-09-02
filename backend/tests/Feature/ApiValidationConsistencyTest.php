<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Movie;
use App\Models\Theater;
use App\Models\Showtime;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class ApiValidationConsistencyTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $showtime;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test data
        $this->user = User::factory()->create();
        $movie = Movie::factory()->create();
        $theater = Theater::factory()->create();
        $this->showtime = Showtime::factory()->create([
            'movie_id' => $movie->id,
            'theater_id' => $theater->id,
            'show_date' => now()->addDays(1)->format('Y-m-d'),
            'show_time' => '19:00:00',
        ]);
        
        // Authenticate user
        Sanctum::actingAs($this->user);
    }

    /** @test */
    public function it_validates_customer_info_in_booking_creation()
    {
        // Test with invalid customer_info
        $response = $this->postJson('/api/v1/bookings', [
            'showtime_id' => $this->showtime->id,
            'seats' => [
                ['seat' => 'A1', 'type' => 'gold']
            ],
            'payment_method' => 'credit_card',
            'customer_info' => [
                'name' => '', // Invalid: empty
                'email' => 'invalid-email', // Invalid: bad format
                'phone' => '123' // Invalid: bad format
            ]
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors([
                     'customer_info.name',
                     'customer_info.email',
                     'customer_info.phone'
                 ]);
    }

    /** @test */
    public function it_validates_vietnamese_phone_numbers_correctly()
    {
        // Test with valid Vietnamese phone numbers
        $validPhones = ['0987654321', '+84987654321', '84987654321', '0356789123'];
        
        foreach ($validPhones as $phone) {
            $response = $this->postJson('/api/v1/bookings', [
                'showtime_id' => $this->showtime->id,
                'seats' => [
                    ['seat' => 'A1', 'type' => 'gold']
                ],
                'payment_method' => 'credit_card',
                'customer_info' => [
                    'name' => 'John Doe',
                    'email' => 'john@example.com',
                    'phone' => $phone
                ]
            ]);

            // Should not have phone validation error
            $data = $response->json();
            $this->assertArrayNotHasKey('customer_info.phone', $data['errors'] ?? []);
        }
    }

    /** @test */
    public function it_rejects_invalid_vietnamese_phone_numbers()
    {
        // Test with invalid phone numbers
        $invalidPhones = ['123456789', '1234567890123', '0123456789', '+8412345'];
        
        foreach ($invalidPhones as $phone) {
            $response = $this->postJson('/api/v1/bookings', [
                'showtime_id' => $this->showtime->id,
                'seats' => [
                    ['seat' => 'A1', 'type' => 'gold']
                ],
                'payment_method' => 'credit_card',
                'customer_info' => [
                    'name' => 'John Doe',
                    'email' => 'john@example.com',
                    'phone' => $phone
                ]
            ]);

            $response->assertStatus(422)
                     ->assertJsonValidationErrors(['customer_info.phone']);
        }
    }

    /** @test */
    public function it_validates_payment_processing_with_customer_info()
    {
        // First create a booking
        $booking = \App\Models\Booking::create([
            'booking_code' => 'CB12345678',
            'user_id' => $this->user->id,
            'showtime_id' => $this->showtime->id,
            'seats' => [['seat' => 'A1', 'type' => 'gold']],
            'total_amount' => 120000,
            'payment_method' => 'credit_card',
            'payment_status' => 'pending',
            'booking_status' => 'confirmed',
        ]);

        // Test payment processing with invalid customer info
        $response = $this->postJson("/api/v1/bookings/{$booking->id}/payment", [
            'payment_method' => 'credit_card',
            'customer_info' => [
                'name' => '', // Invalid
                'email' => 'invalid', // Invalid
                'phone' => '123' // Invalid
            ],
            'card_details' => [
                'card_number' => '4111111111111111',
                'card_holder' => 'JOHN DOE',
                'expiry_month' => 12,
                'expiry_year' => 2025,
                'cvv' => '123'
            ]
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors([
                     'customer_info.name',
                     'customer_info.email',
                     'customer_info.phone'
                 ]);
    }

    /** @test */
    public function it_validates_credit_card_number_format_consistently()
    {
        $booking = \App\Models\Booking::create([
            'booking_code' => 'CB12345679',
            'user_id' => $this->user->id,
            'showtime_id' => $this->showtime->id,
            'seats' => [['seat' => 'A1', 'type' => 'gold']],
            'total_amount' => 120000,
            'payment_method' => 'credit_card',
            'payment_status' => 'pending',
            'booking_status' => 'confirmed',
        ]);

        // Test with invalid card number (too short)
        $response = $this->postJson("/api/v1/bookings/{$booking->id}/payment", [
            'payment_method' => 'credit_card',
            'customer_info' => [
                'name' => 'John Doe',
                'email' => 'john@example.com',
                'phone' => '0987654321'
            ],
            'card_details' => [
                'card_number' => '123456', // Too short
                'card_holder' => 'JOHN DOE',
                'expiry_month' => 12,
                'expiry_year' => 2025,
                'cvv' => '123'
            ]
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['card_details.card_number']);
    }

    /** @test */
    public function it_accepts_valid_booking_with_customer_info()
    {
        $response = $this->postJson('/api/v1/bookings', [
            'showtime_id' => $this->showtime->id,
            'seats' => [
                ['seat' => 'A1', 'type' => 'gold']
            ],
            'payment_method' => 'bank_transfer',
            'customer_info' => [
                'name' => 'Nguyễn Văn A',
                'email' => 'nguyen.van.a@example.com',
                'phone' => '0987654321'
            ]
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'success' => true
                 ]);
    }
}