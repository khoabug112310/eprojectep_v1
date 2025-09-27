<?php

// Simple script to test review management API endpoints
require_once 'vendor/autoload.php';

use GuzzleHttp\Client;

// Create HTTP client
$client = new Client([
    'base_uri' => 'http://localhost:8000/api/v1/',
    'timeout' => 10.0,
]);

try {
    // Step 1: Login as admin to get token
    echo "Logging in as admin...\n";
    $response = $client->post('auth/login', [
        'json' => [
            'email' => 'admin@cinebook.com',
            'password' => 'admin123'
        ]
    ]);
    
    $loginData = json_decode($response->getBody(), true);
    $token = $loginData['data']['token'];
    echo "Login successful. Token: " . substr($token, 0, 20) . "...\n";
    
    // Step 2: Get reviews for a movie
    echo "Fetching reviews for movie ID 1...\n";
    $response = $client->get('admin/reviews', [
        'headers' => [
            'Authorization' => 'Bearer ' . $token
        ],
        'query' => [
            'movie_id' => 1
        ]
    ]);
    
    $reviewsData = json_decode($response->getBody(), true);
    echo "Reviews fetched successfully. Found " . count($reviewsData['data']['data'] ?? []) . " reviews.\n";
    
    // Step 3: Approve a review (if any exist)
    if (!empty($reviewsData['data']['data'])) {
        $reviewId = $reviewsData['data']['data'][0]['id'];
        echo "Approving review ID: {$reviewId}...\n";
        
        $response = $client->put("admin/reviews/{$reviewId}/approve", [
            'headers' => [
                'Authorization' => 'Bearer ' . $token
            ]
        ]);
        
        $approveData = json_decode($response->getBody(), true);
        echo "Review approved: " . ($approveData['success'] ? 'SUCCESS' : 'FAILED') . "\n";
    } else {
        echo "No reviews found to approve.\n";
    }
    
    echo "All API tests completed successfully!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}