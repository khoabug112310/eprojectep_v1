<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=cinebook_local', 'root', '');
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    $result = $stmt->fetchAll();
    
    if (count($result) > 0) {
        echo "Users table exists";
    } else {
        echo "Users table does not exist";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>