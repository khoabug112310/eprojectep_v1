<?php

// Simple endpoint to test QR code generation
header('Content-Type: application/json');

require_once __DIR__ . '/vendor/autoload.php';

use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Str;

try {
    // Generate a simple QR code
    $qrCodeData = json_encode([
        'booking_code' => 'TEST001',
        'type' => 'cinema_ticket',
        'generated_at' => date('c'),
        'movie_title' => 'Test Movie',
        'theater_name' => 'Test Theater',
        'show_datetime' => '2025-09-18 19:00:00',
        'seats' => ['A1', 'A2'],
        'total_amount' => 200000
    ]);
    
    // Generate QR code as PNG
    $qrCodeImage = QrCode::format('png')
        ->size(300)
        ->errorCorrection('M')
        ->margin(2)
        ->generate($qrCodeData);
    
    // Create the qr_codes directory if it doesn't exist
    $qrCodesDir = __DIR__ . '/storage/app/public/qr_codes';
    if (!file_exists($qrCodesDir)) {
        mkdir($qrCodesDir, 0755, true);
    }
    
    // Save the QR code
    $fileName = 'qr_codes/test_ticket_' . Str::random(8) . '.png';
    file_put_contents(__DIR__ . '/storage/app/public/' . $fileName, $qrCodeImage);
    
    // Try to construct URL manually
    $appUrl = 'http://localhost:8000';
    $qrCodeUrl = rtrim($appUrl, '/') . '/storage/' . $fileName;
    
    echo json_encode([
        'success' => true,
        'data' => [
            'qr_code_data' => $qrCodeData,
            'qr_code_url' => $qrCodeUrl,
            'qr_code_path' => $fileName,
            'image_size' => strlen($qrCodeImage)
        ],
        'message' => 'QR Code generated successfully'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}