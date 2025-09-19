<?php

// Test login to get authentication token
$data = [
    'email' => 'test@admin.com',
    'password' => 'test123'
];

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => [
            'Content-Type: application/json',
        ],
        'content' => json_encode($data),
        'timeout' => 10
    ]
]);

$url = 'http://localhost:8000/api/v1/auth/login';
$response = file_get_contents($url, false, $context);

if ($response === false) {
    echo "Failed to connect to login endpoint\n";
    exit(1);
}

echo "Login Response:\n";
echo $response . "\n";

// Get HTTP response code
$http_response_header_array = $http_response_header;
if (isset($http_response_header_array[0])) {
    echo "HTTP Status: " . $http_response_header_array[0] . "\n";
}