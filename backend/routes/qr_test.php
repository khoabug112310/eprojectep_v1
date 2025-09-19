<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Services\QrCodeService;

// Test route for QR code generation
Route::get('/test-qr', function () {
    try {
        $qrService = new QrCodeService();
        
        $result = $qrService->generateTicketQrCode('TEST001', [
            'movie_title' => 'Test Movie',
            'theater_name' => 'Test Theater',
            'show_datetime' => '2025-09-18 19:00:00',
            'seats' => ['A1', 'A2'],
            'total_amount' => 200000
        ]);
        
        if ($result['success']) {
            return response()->json([
                'success' => true,
                'data' => $result['data'],
                'message' => 'QR Code generated successfully'
            ]);
        } else {
            return response()->json([
                'success' => false,
                'message' => $result['message']
            ], 500);
        }
    } catch (Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Exception: ' . $e->getMessage()
        ], 500);
    }
});