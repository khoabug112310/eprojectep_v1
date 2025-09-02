<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\QrCodeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

class QrCodeServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $qrCodeService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->qrCodeService = new QrCodeService();
        
        // Fake the storage for testing
        Storage::fake('public');
    }

    /** @test */
    public function it_can_generate_ticket_qr_code()
    {
        $bookingCode = 'CB20250901001';
        $ticketData = [
            'movie' => 'Test Movie',
            'theater' => 'Test Theater',
            'seats' => ['A1', 'A2']
        ];

        $result = $this->qrCodeService->generateTicketQrCode($bookingCode, $ticketData);

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('qr_code_data', $result['data']);
        $this->assertArrayHasKey('qr_code_image_base64', $result['data']);
        $this->assertArrayHasKey('verification_data', $result['data']);
        
        // Check QR code data contains expected fields
        $qrData = json_decode($result['data']['qr_code_data'], true);
        $this->assertEquals($bookingCode, $qrData['booking_code']);
        $this->assertEquals('cinema_ticket', $qrData['type']);
        $this->assertEquals('Test Movie', $qrData['movie']);
    }

    /** @test */
    public function it_can_generate_simple_qr_code()
    {
        $data = 'https://example.com/test';
        $options = [
            'size' => 150,
            'save_to_storage' => true
        ];

        $result = $this->qrCodeService->generateQrCode($data, $options);

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('qr_code_data', $result['data']);
        $this->assertArrayHasKey('qr_code_image_base64', $result['data']);
        $this->assertArrayHasKey('qr_code_url', $result['data']);
    }

    /** @test */
    public function it_can_verify_qr_code_data()
    {
        $validData = json_encode([
            'booking_code' => 'CB20250901001',
            'type' => 'cinema_ticket',
            'generated_at' => now()->toISOString(),
            'verification_url' => 'https://example.com/verify/CB20250901001'
        ]);

        $result = $this->qrCodeService->verifyQrCodeData($validData);

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('data', $result);
        $this->assertEquals('CB20250901001', $result['data']['booking_code']);
    }

    /** @test */
    public function it_handles_invalid_qr_code_data()
    {
        $invalidData = 'invalid json data';

        $result = $this->qrCodeService->verifyQrCodeData($invalidData);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Invalid QR code format', $result['message']);
    }

    /** @test */
    public function it_validates_required_fields_for_ticket_qr_codes()
    {
        $incompleteData = json_encode([
            'booking_code' => 'CB20250901001',
            'type' => 'cinema_ticket'
            // Missing required fields
        ]);

        $result = $this->qrCodeService->verifyQrCodeData($incompleteData);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Missing required field', $result['message']);
    }

    /** @test */
    public function it_can_generate_svg_qr_code()
    {
        $data = 'Test SVG QR Code';
        $svgCode = $this->qrCodeService->generateSvgQrCode($data, 200);

        $this->assertIsString($svgCode);
        $this->assertStringContainsString('<svg', $svgCode);
        $this->assertStringContainsString('</svg>', $svgCode);
    }
}