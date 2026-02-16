<?php
header('Content-Type: application/json');

// --- 1. Database Configuration ---
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "jigmonitoring"; // Changed from 'testing' to your actual DB

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

/**
 * --- 2. Summary Logic ---
 * This function calculates totals per Area for a specific Customer.
 * It uses the usage limit logic: < 1000 is Good, >= 1000 is Not Good.
 */
function getSummary($conn, $customer)
{
    // Note: Table changed to 'transactionincoming' to match your previous code
    $stmt = $conn->prepare("
        SELECT 
            area,
            COUNT(*) AS equipment_qty,
            SUM(CASE WHEN usage_count < 1000 THEN 1 ELSE 0 END) AS good,
            SUM(CASE WHEN usage_count >= 1000 THEN 1 ELSE 0 END) AS not_good
        FROM transactionincoming
        WHERE customer = ?
        GROUP BY area
        ORDER BY area
    ");

    $stmt->bind_param("s", $customer);
    $stmt->execute();
    $result = $stmt->get_result();

    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = [
            "area" => $row['area'],
            "equipment_qty" => (int) $row['equipment_qty'],
            "good" => (int) $row['good'],
            "not_good" => (int) $row['not_good']
        ];
    }
    return $data;
}

// --- 3. Execute and Output ---
$trcData = getSummary($conn, 'TRC');
$eppiData = getSummary($conn, 'EPPI');

echo json_encode([
    "trc" => $trcData,
    "eppi" => $eppiData
]);

$conn->close();
?>