<?php
header('Content-Type: application/json');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "jigmonitoring";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

// 1. stockControl is now immediately after serial_number
// 2. Added m.line to ensure the 'Line' column works
$sql = "SELECT 
            m.serial_number, 
            m.stockControl,
            m.item_description, 
            m.customer, 
            m.model, 
            m.area, 
            m.line,
            COALESCE(m.remarks, 'NO TRANSACTION') AS remarks,
            COALESCE(m.status, 'NO STATUS') AS status
        FROM masterlist m
        ORDER BY m.item_id DESC";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);
    echo json_encode(["error" => "Query failed"]);
    exit;
}

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = [
        "serial"           => $row["serial_number"],
        "stockControl"    => $row["stockControl"],    // Mapped to 'stock_control' to match common JS patterns
        "item_description" => $row["item_description"],
        "customer"         => $row["customer"],
        "model"            => $row["model"],
        "area"             => $row["area"],
        "line"             => $row["line"],
        "remarks"          => $row["remarks"],
        "status"           => $row["status"]
    ];
}

echo json_encode($data);
$conn->close();
?>