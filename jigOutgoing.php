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

// ---------------- GET: Auto-fill from masterlist or transactionincoming ----------------
if ($_SERVER["REQUEST_METHOD"] === "GET" && isset($_GET['serial'])) {
    $serial = trim($_GET['serial']);

    try {
        // First, try to get from masterlist
        $stmt = $pdo->prepare("SELECT item_description, customer, area, model FROM masterlist WHERE serial_number = ? LIMIT 1");
        $stmt->execute([$serial]);
        $masterlistRow = $stmt->fetch(PDO::FETCH_ASSOC);

        // Also try to get current usage count from transactionincoming
        $stmt2 = $pdo->prepare("SELECT usage_count FROM transactionincoming WHERE serial_number = ? ORDER BY transaction_date DESC LIMIT 1");
        $stmt2->execute([$serial]);
        $incomingRow = $stmt2->fetch(PDO::FETCH_ASSOC);

        if ($masterlistRow) {
            echo json_encode([
                "status" => "success",
                "found" => true,
                "description" => $masterlistRow['item_description'],
                "customer" => $masterlistRow['customer'],
                "area" => $masterlistRow['area'],
                "model" => $masterlistRow['model'] ?? '',
                "usageCount" => $incomingRow['usage_count'] ?? 0
            ]);
        } else {
            echo json_encode(["status" => "success", "found" => false]);
        }

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// ---------------- POST: Save Outgoing Transaction ----------------
if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $serial = $_POST['serial'] ?? '';
    $description = $_POST['itemDescription'] ?? '';
    $customer = $_POST['customer'] ?? '';
    $model = $_POST['model'] ?? '';
    $area = $_POST['area'] ?? '';
    $line = $_POST['line'] ?? '';
    $usageCount = $_POST['usageCount'] ?? 0;
    $status = $_POST['status'] ?? '';
    $remark = $_POST['remarks'] ?? '';

    // Validate required fields
    if (!$serial || !$description || !$customer || !$model || !$area || !$line || !$status || !$remark) {
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

        // Insert into transactionoutgoing table
        $sql = "INSERT INTO transactionoutgoing 
            (item_id, serial_number, item_description, customer, model, area, line, usage_count, status, remarks, transaction_date)
            VALUES (:item_id, :serial, :description, :customer, :model, :area, :line, :usage_count, :status, :remarks, NOW())
            ON DUPLICATE KEY UPDATE 
                item_description = VALUES(item_description),
                customer         = VALUES(customer),
                model            = VALUES(model),
                area             = VALUES(area),
                line             = VALUES(line),
                usage_count      = VALUES(usage_count),
                status           = VALUES(status),
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
            ':usage_count' => $usageCount,
            ':status' => $status,
            ':remarks' => $remark
        ]);

        // Optional: Update stock control or status in masterlist if needed
        // $updateMasterlist = $pdo->prepare("UPDATE masterlist SET status = :status WHERE serial_number = :serial");
        // $updateMasterlist->execute([':status' => $status, ':serial' => $serial]);

        echo json_encode(["status" => "success", "message" => "Outgoing transaction saved successfully!"]);

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
}
?>