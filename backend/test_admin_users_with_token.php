<?php

// First, login to get the token
$loginData = [
    'email' => 'test@admin.com',
    'password' => 'test123'
];

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => [
            'Content-Type: application/json',
        ],
        'content' => json_encode($loginData),
        'timeout' => 10
    ]
]);

$loginUrl = 'http://localhost:8000/api/v1/auth/login';
$loginResponse = file_get_contents($loginUrl, false, $context);

if ($loginResponse === false) {
    echo "Failed to login\n";
    exit(1);
}

$loginData = json_decode($loginResponse, true);
$token = $loginData['data']['token'];

echo "Login successful. Token: " . $token . "\n";

// Now use the token to access admin users endpoint
$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $token,
        ],
        'timeout' => 10
    ]
]);

$usersUrl = 'http://localhost:8000/api/v1/admin/users';
$usersResponse = file_get_contents($usersUrl, false, $context);

if ($usersResponse === false) {
    echo "Failed to connect to users endpoint\n";
    
    // Get HTTP response code
    $http_response_header_array = $http_response_header;
    if (isset($http_response_header_array[0])) {
        echo "HTTP Status: " . $http_response_header_array[0] . "\n";
    }
    
    exit(1);
}

echo "Users Response:\n";
echo $usersResponse . "\n";

// Get HTTP response code
$http_response_header_array = $http_response_header;
if (isset($http_response_header_array[0])) {
    echo "HTTP Status: " . $http_response_header_array[0] . "\n";
}