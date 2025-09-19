<?php

// Test the API endpoint directly
$url = 'http://localhost:8000/api/v1/admin/users';

// Create a stream context
$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => [
            'Content-Type: application/json',
        ],
        'timeout' => 10
    ]
]);

// Make the request
$response = file_get_contents($url, false, $context);

if ($response === false) {
    echo "Failed to connect to the API endpoint\n";
    exit(1);
}

echo "Response:\n";
echo $response . "\n";

// Get HTTP response code
$http_response_header_array = $http_response_header;
if (isset($http_response_header_array[0])) {
    echo "HTTP Status: " . $http_response_header_array[0] . "\n";
}