<?php

// Check if the request is for our test endpoint
if (isset($_SERVER['REQUEST_URI']) && $_SERVER['REQUEST_URI'] === '/test-qr') {
    require_once __DIR__ . '/test_qr_endpoint.php';
    exit;
}

// Default Laravel index.php
require_once __DIR__ . '/public/index.php';