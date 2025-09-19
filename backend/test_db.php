<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=cinebook_local', 'root', '');
    echo "Connected successfully";
} catch (Exception $e) {
    echo "Connection failed: " . $e->getMessage();
}
?>