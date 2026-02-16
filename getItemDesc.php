<?php
header("Content-Type: application/json");

$host = "localhost";
$dbname = "testing"; // Use your actual database name
$username = "root";
$password = "";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Connection failed"]);
    exit;
}

$serial = $_GET['serial'] ?? '';

if ($serial) {
    // We search the table to see if this serial was logged before
    $stmt = $pdo->prepare("SELECT item_description, customer, model FROM in_scan_jig WHERE serial = ? LIMIT 1");
    $stmt->execute([$serial]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        echo json_encode([
            "success" => true,
            "description" => $row['item_description'],
            "customer" => $row['customer'],
            "model" => $row['model']
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "New Serial Number"]);
    }
}
?>