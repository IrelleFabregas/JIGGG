<?php
header("Content-Type: application/json");

$host = "localhost";
$dbname = "jigmonitoring";
$user = "root";
$pass = "";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Connection failed: " . $e->getMessage()]);
    exit;
}

// ---------------- GET: Auto-fill ----------------
if ($_SERVER["REQUEST_METHOD"] === "GET" && isset($_GET['serial'])) {
    $serial = trim($_GET['serial']);

    try {
        $stmt = $pdo->prepare("SELECT item_description, customer, area FROM masterlist WHERE serial_number = ? LIMIT 1");
        $stmt->execute([$serial]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            echo json_encode([
                "status" => "success",
                "found" => true,
                "description" => $row['item_description'],
                "customer" => $row['customer'],
                "area" => $row['area']
            ]);
        } else {
            echo json_encode(["status" => "success", "found" => false]);
        }

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// ---------------- POST: Save Transaction ----------------
if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $serial = $_POST['serial'] ?? '';
    $description = $_POST['itemDescription'] ?? '';
    $customer = $_POST['customer'] ?? '';
    $model = $_POST['model'] ?? '';
    $area = $_POST['area'] ?? '';
    $line = $_POST['line'] ?? '';
    $usage = $_POST['status'] ?? '';
    $remark = $_POST['remarks'] ?? '';

    // Validate required fields
    if (!$serial || !$description || !$customer || !$model || !$area || !$line || !$status || !$remarks) {
        echo json_encode(["status" => "error", "message" => "All fields are required"]);
        exit;
    }

    try {
        // Get item_id from masterlist
        $stmt = $pdo->prepare("SELECT item_id FROM masterlist WHERE serial_number = ?");
        $stmt->execute([$serial]);
        $item = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$item) {
            echo json_encode(["status" => "error", "message" => "Serial number not found in masterlist"]);
            exit;
        }

        $item_id = $item['item_id'];

        // Updated SQL: INSERT or UPDATE if serial_number already exists
        $sql = "INSERT INTO transactionincoming 
            (item_id, serial_number, item_description, customer, model, area, line, status, remarks, transaction_date)
            VALUES (:item_id, :serial, :description, :customer, :model, :area, :line, status, remarks, NOW())
            ON DUPLICATE KEY UPDATE 
                item_description = VALUES(item_description),
                customer         = VALUES(customer),
                model            = VALUES(model),
                area             = VALUES(area),
                line             = VALUES(line),
                status           = VALUES (status),
                remarks          = VALUES(remarks),
                transaction_date = NOW()";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':item_id' => $item_id,
            ':serial' => $serial,
            ':description' => $description,
            ':customer' => $customer,
            ':model' => $model,
            ':area' => $area,
            ':line' => $line,
            ':status' => status,
            ':remarks' => $remark
        ]);

        echo json_encode(["status" => "success", "message" => "Data updated/saved successfully!"]);

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
}
?>