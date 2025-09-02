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
use Carbon\Carbon;

class AdminPaymentManagementTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $user;
    protected $booking;
    protected $payment;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createTestData();
    }

    private function createTestData()
    {
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->user = User::factory()->create();

        $movie = Movie::factory()->create();
        $theater = Theater::factory()->create();
        $showtime = Showtime::factory()->create([
            'movie_id' => $movie->id,
            'theater_id' => $theater->id,
        ]);

        $this->booking = Booking::factory()->create([
            'user_id' => $this->user->id,
            'showtime_id' => $showtime->id,
            'payment_status' => Booking::PAYMENT_COMPLETED,
            'booking_status' => Booking::STATUS_CONFIRMED,
        ]);

        $this->payment = Payment::factory()->create([
            'booking_id' => $this->booking->id,
            'amount' => 250000,
            'status' => Payment::STATUS_COMPLETED,
        ]);
    }

    public function test_admin_can_get_payments_list()
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/payments');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'data' => [
                            '*' => [
                                'id',
                                'amount',
                                'status',
                                'payment_method',
                                'booking' => [
                                    'booking_code',
                                    'user' => ['name', 'email']
                                ]
                            ]
                        ]
                    ]
                ]);
    }

    public function test_admin_can_filter_payments_by_status()
    {
        // Create additional payment with different status
        Payment::factory()->create([
            'booking_id' => $this->booking->id,
            'status' => Payment::STATUS_FAILED,
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/payments?status=completed');

        $response->assertStatus(200);
        
        $payments = $response->json('data.data');
        foreach ($payments as $payment) {
            $this->assertEquals('completed', $payment['status']);
        }
    }

    public function test_admin_can_search_payments_by_booking_code()
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/payments?search=' . $this->booking->booking_code);

        $response->assertStatus(200);
        
        $payments = $response->json('data.data');
        $this->assertNotEmpty($payments);
        $this->assertEquals($this->booking->booking_code, $payments[0]['booking']['booking_code']);
    }

    public function test_admin_can_get_payment_details()
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/payments/' . $this->payment->id);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'payment',
                        'booking_details',
                        'customer',
                        'movie',
                        'theater',
                        'showtime'
                    ]
                ]);
    }

    public function test_admin_can_update_payment_status()
    {
        $response = $this->actingAs($this->admin)
            ->putJson('/api/v1/admin/payments/' . $this->payment->id . '/status', [
                'status' => 'failed',
                'reason' => 'Credit card declined'
            ]);

        $response->assertStatus(200)
                ->assertJson(['success' => true]);

        $this->payment->refresh();
        $this->assertEquals('failed', $this->payment->status);
        $this->assertEquals('Credit card declined', $this->payment->failure_reason);
    }

    public function test_admin_can_process_refund()
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/payments/' . $this->payment->id . '/refund', [
                'refund_amount' => 100000,
                'reason' => 'Customer request'
            ]);

        $response->assertStatus(200)
                ->assertJson(['success' => true])
                ->assertJsonStructure([
                    'data' => [
                        'original_payment',
                        'refund_payment',
                        'booking'
                    ]
                ]);

        $this->payment->refresh();
        $this->assertEquals(Payment::STATUS_REFUNDED, $this->payment->status);

        // Check refund payment was created
        $refundPayment = Payment::where('booking_id', $this->booking->id)
            ->where('amount', '<', 0)
            ->first();
        
        $this->assertNotNull($refundPayment);
        $this->assertEquals(-100000, $refundPayment->amount);
    }

    public function test_cannot_refund_pending_payment()
    {
        $pendingPayment = Payment::factory()->create([
            'booking_id' => $this->booking->id,
            'status' => Payment::STATUS_PENDING,
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/payments/' . $pendingPayment->id . '/refund', [
                'reason' => 'Test refund'
            ]);

        $response->assertStatus(400)
                ->assertJson(['success' => false]);
    }

    public function test_admin_can_get_payment_statistics()
    {
        // Create additional test data
        Payment::factory()->create([
            'booking_id' => $this->booking->id,
            'status' => Payment::STATUS_FAILED,
            'failure_reason' => 'Insufficient funds',
            'created_at' => now()->subDays(1)
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/payments/statistics');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'period',
                        'overview' => [
                            'total_payments',
                            'successful_payments',
                            'success_rate',
                            'total_revenue',
                            'average_transaction_value'
                        ],
                        'status_distribution',
                        'method_distribution',
                        'daily_trends',
                        'failure_reasons'
                    ]
                ]);
    }

    public function test_admin_can_get_tickets_list()
    {
        // Add ticket data to booking
        $this->booking->update([
            'ticket_data' => ['test' => 'data'],
            'qr_code' => 'test-qr-path.png'
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/tickets');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'data' => [
                            '*' => [
                                'id',
                                'booking_code',
                                'ticket_data',
                                'qr_code',
                                'user' => ['name', 'email']
                            ]
                        ]
                    ]
                ]);
    }

    public function test_admin_can_regenerate_ticket()
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/tickets/' . $this->booking->id . '/regenerate');

        $response->assertStatus(200)
                ->assertJson(['success' => true]);
    }

    public function test_admin_can_get_ticket_statistics()
    {
        // Add ticket data to some bookings
        $this->booking->update(['ticket_data' => ['test' => 'data']]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/tickets/statistics');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'period',
                        'overview' => [
                            'total_bookings',
                            'tickets_generated',
                            'generation_rate',
                            'missing_tickets'
                        ],
                        'daily_trends'
                    ]
                ]);
    }

    public function test_regular_user_cannot_access_admin_payment_endpoints()
    {
        $endpoints = [
            '/api/v1/admin/payments',
            '/api/v1/admin/payments/' . $this->payment->id,
            '/api/v1/admin/payments/statistics',
            '/api/v1/admin/tickets',
            '/api/v1/admin/tickets/statistics'
        ];

        foreach ($endpoints as $endpoint) {
            $response = $this->actingAs($this->user)
                ->getJson($endpoint);

            $response->assertStatus(403);
        }
    }

    public function test_guest_cannot_access_admin_payment_endpoints()
    {
        $response = $this->getJson('/api/v1/admin/payments');
        $response->assertStatus(401);
    }

    public function test_admin_can_filter_payments_by_date_range()
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/payments?from_date=' . now()->subDays(7)->format('Y-m-d') . 
                      '&to_date=' . now()->format('Y-m-d'));

        $response->assertStatus(200);
    }

    public function test_admin_can_filter_payments_by_amount_range()
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/payments?min_amount=100000&max_amount=500000');

        $response->assertStatus(200);
        
        $payments = $response->json('data.data');
        foreach ($payments as $payment) {
            $this->assertGreaterThanOrEqual(100000, $payment['amount']);
            $this->assertLessThanOrEqual(500000, $payment['amount']);
        }
    }

    public function test_refund_amount_cannot_exceed_original_payment()
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/payments/' . $this->payment->id . '/refund', [
                'refund_amount' => 300000, // More than original 250000
                'reason' => 'Test excess refund'
            ]);

        $response->assertStatus(400)
                ->assertJson(['success' => false]);
    }
}