<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Container\Container;
use Illuminate\Events\Dispatcher;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Config\Repository;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Facade;

// Bootstrap Laravel components
$app = new Container();
$app->instance('app', $app);
$app->singleton('config', function () {
    return new Repository([
        'filesystems' => [
            'default' => 'local',
            'disks' => [
                'local' => [
                    'driver' => 'local',
                    'root' => __DIR__ . '/storage/app',
                ],
                'public' => [
                    'driver' => 'local',
                    'root' => __DIR__ . '/storage/app/public',
                    'url' => 'http://localhost/storage',
                    'visibility' => 'public',
                ],
            ],
        ],
        'app' => [
            'url' => 'http://localhost',
        ],
    ]);
});

// Set up facades
Facade::setFacadeApplication($app);

// Create a simple test to check QR code generation
try {
    // Include the QrCodeService class
    require_once __DIR__ . '/app/Services/QrCodeService.php';
    
    $qrService = new \App\Services\QrCodeService();
    
    // Test the getQrCodeUrl method directly
    $testPath = 'qr_codes/test_file.png';
    $url = $qrService->getQrCodeUrl($testPath);
    
    echo "QR Code URL generation test:\n";
    echo "Input path: " . $testPath . "\n";
    echo "Generated URL: " . $url . "\n";
    
    // Test generating a QR code
    $result = $qrService->generateTicketQrCode('TEST001', [
        'movie_title' => 'Test Movie',
        'theater_name' => 'Test Theater',
        'show_datetime' => '2025-09-18 19:00:00',
        'seats' => ['A1', 'A2'],
        'total_amount' => 200000
    ]);
    
    if ($result['success']) {
        echo "\nQR Code generated successfully!\n";
        echo "QR Code URL: " . $result['data']['qr_code_url'] . "\n";
        echo "QR Code Path: " . $result['data']['qr_code_path'] . "\n";
        
        // Test getting the URL
        $url = $qrService->getQrCodeUrl($result['data']['qr_code_path']);
        echo "Retrieved URL: " . $url . "\n";
    } else {
        echo "\nQR Code generation failed: " . $result['message'] . "\n";
    }
} catch (Exception $e) {
    echo "Exception occurred: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}