<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=cinebook_local', 'root', '');
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "Number of users: " . $result['count'];
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>