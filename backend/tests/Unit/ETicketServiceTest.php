<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\ETicketService;
use App\Services\QrCodeService;
use App\Models\Booking;
use App\Models\User;
use App\Models\Movie;
use App\Models\Theater;
use App\Models\Showtime;
use App\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class ETicketServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $eTicketService;
    protected $user;
    protected $movie;
    protected $theater;
    protected $showtime;
    protected $booking;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Fake storage
        Storage::fake('public');
        
        $this->eTicketService = app(ETicketService::class);
        
        // Create test data
        $this->createTestData();
    }

    private function createTestData()
    {
        $this->user = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '0123456789'
        ]);

        $this->movie = Movie::factory()->create([
            'title' => 'Test Movie',
            'duration' => 120,
            'genre' => ['Action', 'Drama'],
            'age_rating' => 'PG-13',
            'language' => 'English'
        ]);

        $this->theater = Theater::factory()->create([
            'name' => 'Test Theater',
            'address' => '123 Main St, Test City',
            'city' => 'Test City'
        ]);

        $this->showtime = Showtime::factory()->create([
            'movie_id' => $this->movie->id,
            'theater_id' => $this->theater->id,
            'show_date' => Carbon::tomorrow()->format('Y-m-d'),
            'show_time' => '19:00:00'
        ]);

        $this->booking = Booking::factory()->create([
            'booking_code' => 'CB20250901001',
            'user_id' => $this->user->id,
            'showtime_id' => $this->showtime->id,
            'seats' => [
                ['seat' => 'A1', 'type' => 'gold'],
                ['seat' => 'A2', 'type' => 'gold']
            ],
            'total_amount' => 240000,
            'payment_status' => Booking::PAYMENT_COMPLETED,
            'booking_status' => Booking::STATUS_CONFIRMED
        ]);

        // Create payment record
        Payment::factory()->create([
            'booking_id' => $this->booking->id,
            'amount' => 240000,
            'status' => Payment::STATUS_COMPLETED
        ]);
    }

    public function test_it_can_generate_eticket_for_valid_booking()
    {
        $result = $this->eTicketService->generateETicket($this->booking);

        if (!$result['success']) {
            dump('Error:', $result['message']);
        }

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('data', $result);
        $this->assertEquals($this->booking->booking_code, $result['data']['booking_code']);
        $this->assertArrayHasKey('ticket_data', $result['data']);
        $this->assertArrayHasKey('qr_code', $result['data']);
        
        // Verify booking was updated
        $this->booking->refresh();
        $this->assertNotNull($this->booking->ticket_data);
    }

    public function test_it_builds_comprehensive_ticket_data()
    {
        $result = $this->eTicketService->generateETicket($this->booking);
        $ticketData = $result['data']['ticket_data'];

        // Check all required sections
        $this->assertArrayHasKey('movie', $ticketData);
        $this->assertArrayHasKey('theater', $ticketData);
        $this->assertArrayHasKey('showtime', $ticketData);
        $this->assertArrayHasKey('seats', $ticketData);
        $this->assertArrayHasKey('customer', $ticketData);
        $this->assertArrayHasKey('payment', $ticketData);
        $this->assertArrayHasKey('ticket_info', $ticketData);

        // Verify specific data
        $this->assertEquals('Test Movie', $ticketData['movie']['title']);
        $this->assertEquals('Test Theater', $ticketData['theater']['name']);
        $this->assertEquals(['A1', 'A2'], $ticketData['seats']['seat_numbers']);
        $this->assertEquals(2, $ticketData['seats']['count']);
        $this->assertEquals('John Doe', $ticketData['customer']['name']);
        $this->assertEquals(240000, $ticketData['payment']['total_amount']);
    }

    public function test_it_rejects_unpaid_booking()
    {
        $this->booking->update(['payment_status' => Booking::PAYMENT_PENDING]);

        $result = $this->eTicketService->generateETicket($this->booking);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('not eligible', $result['message']);
    }

    public function test_it_rejects_cancelled_booking()
    {
        $this->booking->update(['booking_status' => Booking::STATUS_CANCELLED]);

        $result = $this->eTicketService->generateETicket($this->booking);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('not eligible', $result['message']);
    }

    public function test_it_can_verify_valid_ticket()
    {
        // First generate a ticket
        $ticketResult = $this->eTicketService->generateETicket($this->booking);
        $this->assertTrue($ticketResult['success']);

        $qrData = $ticketResult['data']['qr_code']['qr_code_data'];

        // Now verify the ticket
        $verifyResult = $this->eTicketService->verifyTicket($qrData);

        $this->assertTrue($verifyResult['success']);
        $this->assertEquals($this->booking->id, $verifyResult['data']['booking']->id);
        $this->assertEquals('valid', $verifyResult['data']['status']);
    }

    public function test_it_rejects_invalid_qr_data()
    {
        $invalidQrData = 'invalid qr code data';

        $result = $this->eTicketService->verifyTicket($invalidQrData);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Invalid QR code format', $result['message']);
    }

    public function test_it_rejects_non_cinema_ticket_qr()
    {
        $nonCinemaQr = json_encode([
            'type' => 'restaurant_booking',
            'booking_code' => 'REST001'
        ]);

        $result = $this->eTicketService->verifyTicket($nonCinemaQr);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Not a valid cinema ticket', $result['message']);
    }

    public function test_it_validates_ticket_eligibility()
    {
        // Test paid and confirmed booking
        $this->assertTrue($this->eTicketService->isBookingEligibleForTicket($this->booking));

        // Test unpaid booking
        $this->booking->update(['payment_status' => Booking::PAYMENT_PENDING]);
        $this->assertFalse($this->eTicketService->isBookingEligibleForTicket($this->booking));

        // Test cancelled booking
        $this->booking->update([
            'payment_status' => Booking::PAYMENT_COMPLETED,
            'booking_status' => Booking::STATUS_CANCELLED
        ]);
        $this->assertFalse($this->eTicketService->isBookingEligibleForTicket($this->booking));
    }

    public function test_it_validates_ticket_timing()
    {
        // Test future showtime (should be valid)
        $this->assertTrue($this->eTicketService->isTicketValid($this->booking));

        // Test past showtime (within 2 hours - should be valid)
        $this->showtime->update([
            'show_date' => Carbon::now()->subHour()->format('Y-m-d'),
            'show_time' => Carbon::now()->subHour()->format('H:i:s')
        ]);
        $this->booking->refresh();
        $this->assertTrue($this->eTicketService->isTicketValid($this->booking));

        // Test very old showtime (should be invalid)
        $this->showtime->update([
            'show_date' => Carbon::now()->subDays(1)->format('Y-m-d'),
            'show_time' => '19:00:00'
        ]);
        $this->booking->refresh();
        $this->assertFalse($this->eTicketService->isTicketValid($this->booking));
    }

    public function test_it_generates_html_ticket()
    {
        $result = $this->eTicketService->generateETicket($this->booking);

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('pdf_ticket', $result['data']);
        
        $pdfData = $result['data']['pdf_ticket'];
        $this->assertArrayHasKey('html_content', $pdfData);
        $this->assertStringContainsString('CINEBOOK E-TICKET', $pdfData['html_content']);
        $this->assertStringContainsString($this->booking->booking_code, $pdfData['html_content']);
        $this->assertStringContainsString('Test Movie', $pdfData['html_content']);
    }

    public function test_it_can_regenerate_eticket()
    {
        // Generate initial ticket
        $result1 = $this->eTicketService->generateETicket($this->booking);
        $this->assertTrue($result1['success']);
        $originalQrPath = $this->booking->fresh()->qr_code;

        // Regenerate ticket
        $result2 = $this->eTicketService->regenerateETicket($this->booking);
        $this->assertTrue($result2['success']);
        
        $newQrPath = $this->booking->fresh()->qr_code;
        $this->assertNotEquals($originalQrPath, $newQrPath);
    }

    public function test_it_provides_ticket_display_data()
    {
        // Test without generated ticket
        $result = $this->eTicketService->getTicketDisplayData($this->booking);
        $this->assertFalse($result['success']);

        // Generate ticket first
        $this->eTicketService->generateETicket($this->booking);

        // Now test with generated ticket
        $result = $this->eTicketService->getTicketDisplayData($this->booking);
        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('ticket_data', $result['data']);
        $this->assertArrayHasKey('is_valid', $result['data']);
        $this->assertTrue($result['data']['is_valid']);
    }

    public function test_it_handles_qr_generation_failure_gracefully()
    {
        // Mock QrCodeService to simulate failure
        $mockQrService = $this->createMock(QrCodeService::class);
        $mockQrService->method('generateTicketQrCode')
                     ->willReturn(['success' => false, 'message' => 'QR generation failed']);

        $eTicketService = new ETicketService($mockQrService);
        $result = $eTicketService->generateETicket($this->booking);

        // Should still succeed but without QR code
        $this->assertTrue($result['success']);
        $this->assertNull($result['data']['qr_code']);
    }

    public function test_it_identifies_ticket_invalid_reasons()
    {
        // Test unpaid booking
        $this->booking->update(['payment_status' => Booking::PAYMENT_PENDING]);
        $this->assertFalse($this->eTicketService->isTicketValid($this->booking));

        // Test cancelled booking
        $this->booking->update([
            'payment_status' => Booking::PAYMENT_COMPLETED,
            'booking_status' => Booking::STATUS_CANCELLED
        ]);
        $this->assertFalse($this->eTicketService->isTicketValid($this->booking));

        // Test expired ticket
        $this->booking->update(['booking_status' => Booking::STATUS_CONFIRMED]);
        $this->showtime->update([
            'show_date' => Carbon::now()->subDays(1)->format('Y-m-d'),
            'show_time' => '19:00:00'
        ]);
        $this->booking->refresh();
        $this->assertFalse($this->eTicketService->isTicketValid($this->booking));
    }
}