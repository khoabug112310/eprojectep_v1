<?php

// Simple test script to verify QR code generation
require_once __DIR__ . '/vendor/autoload.php';

use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

// Simple QR code generation test
try {
    echo "Testing QR code generation...\n";
    
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
    
    echo "QR Code Data: " . $qrCodeData . "\n";
    
    // Generate QR code as PNG
    $qrCodeImage = QrCode::format('png')
        ->size(300)
        ->errorCorrection('M')
        ->margin(2)
        ->generate($qrCodeData);
    
    echo "QR Code generated successfully!\n";
    echo "Image size: " . strlen($qrCodeImage) . " bytes\n";
    
    // Save to file for testing
    $fileName = 'qr_codes/test_ticket_' . Str::random(8) . '.png';
    echo "Saving to file: " . $fileName . "\n";
    
    // Create the qr_codes directory if it doesn't exist
    if (!file_exists(__DIR__ . '/storage/app/public/qr_codes')) {
        mkdir(__DIR__ . '/storage/app/public/qr_codes', 0755, true);
    }
    
    // Save the QR code
    file_put_contents(__DIR__ . '/storage/app/public/' . $fileName, $qrCodeImage);
    echo "QR Code saved successfully!\n";
    
    // Try to construct URL manually
    $appUrl = 'http://localhost:8000';
    $qrCodeUrl = rtrim($appUrl, '/') . '/storage/' . $fileName;
    echo "QR Code URL: " . $qrCodeUrl . "\n";
    
    echo "Test completed successfully!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}