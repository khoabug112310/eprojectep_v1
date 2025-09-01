<?php

namespace Tests\Feature;

use Tests\Feature\ApiTestCase;
use Tests\Traits\CreatesTestData;
use Tests\Helpers\TestHelper;

class BookingFlowTest extends ApiTestCase
{
    use CreatesTestData;

    /** @test */
    public function it_can_complete_full_booking_flow()
    {
        // 1. Create test data
        $flowData = $this->createBookingFlow();
        $user = $flowData['user'];
        $showtime = $flowData['showtime'];
        $headers = $this->authenticateUser($user);

        // 2. Get available seats
        $seatsResponse = $this->getJson("/api/v1/showtimes/{$showtime->id}/seats", $headers);
        $this->assertApiResponse($seatsResponse);

        // 3. Lock seats
        $lockData = ['seats' => ['A1', 'A2']];
        $lockResponse = $this->postJson("/api/v1/showtimes/{$showtime->id}/seats/lock", $lockData, $headers);
        $this->assertApiResponse($lockResponse);

        // 4. Create booking
        $bookingData = $this->getBookingData($showtime);
        $bookingResponse = $this->postJson('/api/v1/bookings', $bookingData, $headers);
        $this->assertApiResponse($bookingResponse);

        // 5. Verify booking was created
        $booking = $bookingResponse->json('data');
        $this->assertArrayHasKey('booking_code', $booking);
        $this->assertArrayHasKey('total_amount', $booking);
        $this->assertEquals($showtime->id, $booking['showtime_id']);

        // 6. Verify booking in database
        $this->assertDatabaseHas('bookings', [
            'id' => $booking['id'],
            'user_id' => $user->id,
            'showtime_id' => $showtime->id,
            'booking_status' => 'confirmed'
        ]);

        // 7. Get booking details
        $detailsResponse = $this->getJson("/api/v1/bookings/{$booking['id']}", $headers);
        $this->assertApiResponse($detailsResponse);

        $bookingDetails = $detailsResponse->json('data');
        $this->assertEquals($booking['id'], $bookingDetails['id']);
        $this->assertArrayHasKey('showtime', $bookingDetails);
        $this->assertArrayHasKey('movie', $bookingDetails['showtime']);
    }

    /** @test */
    public function it_prevents_booking_occupied_seats()
    {
        $flowData = $this->createBookingFlow();
        $user1 = $flowData['user'];
        $user2 = $this->createUser();
        $showtime = $flowData['showtime'];

        // User 1 books seats A1, A2
        $bookingData1 = [
            'showtime_id' => $showtime->id,
            'seats' => [
                ['seat' => 'A1', 'type' => 'gold'],
                ['seat' => 'A2', 'type' => 'gold']
            ],
            'payment_method' => 'credit_card'
        ];

        $response1 = $this->postJson('/api/v1/bookings', $bookingData1, $this->authenticateUser($user1));
        $this->assertApiResponse($response1);

        // User 2 tries to book the same seats
        $bookingData2 = [
            'showtime_id' => $showtime->id,
            'seats' => [
                ['seat' => 'A1', 'type' => 'gold'],
                ['seat' => 'A3', 'type' => 'gold']
            ],
            'payment_method' => 'credit_card'
        ];

        $response2 = $this->postJson('/api/v1/bookings', $bookingData2, $this->authenticateUser($user2));
        $this->assertApiError($response2, 422);
        $this->assertStringContainsString('occupied', $response2->json('message'));
    }

    /** @test */
    public function it_can_cancel_booking()
    {
        $booking = $this->createBooking(['booking_status' => 'confirmed']);
        $user = $booking->user;
        $headers = $this->authenticateUser($user);

        $response = $this->putJson("/api/v1/bookings/{$booking->id}/cancel", [], $headers);

        $this->assertApiResponse($response);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'booking_status' => 'cancelled'
        ]);
    }

    /** @test */
    public function it_prevents_cancelling_others_bookings()
    {
        $booking = $this->createBooking();
        $otherUser = $this->createUser();
        $headers = $this->authenticateUser($otherUser);

        $response = $this->putJson("/api/v1/bookings/{$booking->id}/cancel", [], $headers);

        $this->assertApiError($response, 403);
    }

    /** @test */
    public function it_can_get_user_booking_history()
    {
        $user = $this->createUser();
        $booking1 = $this->createBooking(['user_id' => $user->id]);
        $booking2 = $this->createBooking(['user_id' => $user->id]);
        $otherBooking = $this->createBooking(); // Different user

        $headers = $this->authenticateUser($user);
        $response = $this->getJson('/api/v1/user/bookings', $headers);

        $this->assertApiResponse($response);
        $this->assertPaginatedResponse($response);

        $bookings = $response->json('data.data');
        $this->assertCount(2, $bookings);

        $bookingIds = collect($bookings)->pluck('id')->toArray();
        $this->assertContains($booking1->id, $bookingIds);
        $this->assertContains($booking2->id, $bookingIds);
        $this->assertNotContains($otherBooking->id, $bookingIds);
    }

    /** @test */
    public function it_can_filter_bookings_by_status()
    {
        $user = $this->createUser();
        $confirmedBooking = $this->createBooking([
            'user_id' => $user->id,
            'booking_status' => 'confirmed'
        ]);
        $cancelledBooking = $this->createBooking([
            'user_id' => $user->id,
            'booking_status' => 'cancelled'
        ]);

        $headers = $this->authenticateUser($user);

        // Filter confirmed bookings
        $response = $this->getJson('/api/v1/user/bookings?status=confirmed', $headers);
        $this->assertApiResponse($response);

        $bookings = $response->json('data.data');
        $this->assertCount(1, $bookings);
        $this->assertEquals($confirmedBooking->id, $bookings[0]['id']);

        // Filter cancelled bookings
        $response = $this->getJson('/api/v1/user/bookings?status=cancelled', $headers);
        $this->assertApiResponse($response);

        $bookings = $response->json('data.data');
        $this->assertCount(1, $bookings);
        $this->assertEquals($cancelledBooking->id, $bookings[0]['id']);
    }

    /** @test */
    public function it_calculates_correct_booking_total()
    {
        $showtime = $this->createShowtime([
            'prices' => [
                'gold' => 120000,
                'platinum' => 150000,
                'box' => 200000
            ]
        ]);

        $user = $this->createUser();
        $headers = $this->authenticateUser($user);

        $bookingData = [
            'showtime_id' => $showtime->id,
            'seats' => [
                ['seat' => 'A1', 'type' => 'gold'],      // 120,000
                ['seat' => 'A2', 'type' => 'platinum'],  // 150,000
                ['seat' => 'B1', 'type' => 'box']        // 200,000
            ],
            'payment_method' => 'credit_card'
        ];

        $response = $this->postJson('/api/v1/bookings', $bookingData, $headers);
        $this->assertApiResponse($response);

        $booking = $response->json('data');
        $expectedTotal = 120000 + 150000 + 200000; // 470,000
        $this->assertEquals($expectedTotal, $booking['total_amount']);
    }

    /** @test */
    public function it_generates_unique_booking_codes()
    {
        $user = $this->createUser();
        $showtime = $this->createShowtime();
        $headers = $this->authenticateUser($user);

        $bookingData = $this->getBookingData($showtime);

        // Create multiple bookings
        $response1 = $this->postJson('/api/v1/bookings', $bookingData, $headers);
        $this->assertApiResponse($response1);

        $bookingData['seats'] = [['seat' => 'B1', 'type' => 'gold']]; // Different seats
        $response2 = $this->postJson('/api/v1/bookings', $bookingData, $headers);
        $this->assertApiResponse($response2);

        $booking1 = $response1->json('data');
        $booking2 = $response2->json('data');

        $this->assertNotEquals($booking1['booking_code'], $booking2['booking_code']);
        $this->assertMatchesRegularExpression('/^CB\d{8}\d{3}$/', $booking1['booking_code']);
        $this->assertMatchesRegularExpression('/^CB\d{8}\d{3}$/', $booking2['booking_code']);
    }

    /** @test */
    public function it_requires_authentication_for_booking()
    {
        $showtime = $this->createShowtime();
        $bookingData = $this->getBookingData($showtime);

        $response = $this->postJson('/api/v1/bookings', $bookingData);

        $this->assertApiError($response, 401);
    }

    /** @test */
    public function it_validates_booking_data()
    {
        $user = $this->createUser();
        $headers = $this->authenticateUser($user);

        // Missing required fields
        $invalidData = [
            'seats' => [],
            'payment_method' => ''
        ];

        $response = $this->postJson('/api/v1/bookings', $invalidData, $headers);

        $this->assertApiError($response, 422, true);
        $this->assertArrayHasKey('errors', $response->json());
    }
}