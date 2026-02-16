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

/**
 * UPDATED QUERY:
 * 1. Uses m.item_id DESC to ensure newest masterlist entries are on top.
 * 2. Note: If you have multiple transactions for one serial, 
 * this JOIN might create duplicate rows. If you only want the 
 * absolute latest transaction, consider a GROUP BY or Subquery.
 */
$sql = "SELECT 
            m.serial_number, 
            m.item_description, 
            m.customer, 
            m.model, 
            m.area, 
            COALESCE(t.usage_count, 0) as usage_count, 
            COALESCE(t.remarks, 'NO TRANSACTION') as remarks
        FROM masterlist m
        LEFT JOIN transactionincoming t ON m.serial_number = t.serial_number
        ORDER BY m.item_id DESC"; // Changed from serial_number ASC to item_id DESC

$result = $conn->query($sql);
$data = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $data[] = [
            "serial" => $row["serial_number"],
            "item_description" => $row["item_description"],
            "customer" => $row["customer"],
            "model" => $row["model"],
            "area" => $row["area"],
            "usage_count" => (int) $row["usage_count"],
            "limit" => 1000,
            "remarks" => $row["remarks"]
        ];
    }
}

echo json_encode($data);
$conn->close();
?>