<?php
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$host = "localhost";
$user = "root";
$pass = "";
$dbname = "jigmonitoring";

try {
    $conn = new mysqli($host, $user, $pass, $dbname);
    $conn->set_charset("utf8mb4");

    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        $itemDescription = trim($_POST['itemDescription'] ?? '');
        $customer = trim($_POST['customer'] ?? '');
        $serial = trim($_POST['serial'] ?? '');
        $stockControl = trim($_POST['stockControl'] ?? ''); // NEW
        $model = trim($_POST['model'] ?? '');
        $area = trim($_POST['area'] ?? '');
        $line = trim($_POST['line'] ?? '');
        $remarks = trim($_POST['remarks'] ?? '');
        $status = trim($_POST['status'] ?? ''); // NEW
        $itemId = $_POST['id'] ?? null;

        if (empty($itemDescription) || empty($customer) || empty($serial) || empty($stockControl) || empty($model) || empty($area) || empty($line) || empty($remarks) || empty($status)) {
            http_response_code(400);
            exit("Please fill in all required fields.");
        }

        if ($itemId) {
            /* =========================================
               UPDATE RECORD
            ========================================== */
            $conn->begin_transaction();
            try {
                $sql1 = "UPDATE masterlist 
                         SET item_description = ?, customer = ?, serial_number = ?, stockControl = ?, model = ?, area = ?, line = ?, remarks = ?, status = ? 
                         WHERE item_id = ?";
                $stmt1 = $conn->prepare($sql1);
                $stmt1->bind_param("sssssssssi", $itemDescription, $customer, $serial, $stockControl, $model, $area, $line, $remarks, $status, $itemId);
                $stmt1->execute();

                // Sync with transactionincoming table
                $sql2 = "UPDATE transactionincoming 
                         SET model = ?, line = ? 
                         WHERE item_id = ?";
                $stmt2 = $conn->prepare($sql2);
                $stmt2->bind_param("ssi", $model, $line, $itemId);
                $stmt2->execute();

                $conn->commit();
                echo "success";

                $stmt1->close();
                $stmt2->close();
            } catch (Exception $e) {
                $conn->rollback();
                throw $e;
            }

        } else {
            /* =========================================
               INSERT NEW RECORD
            ========================================== */
            $sql = "INSERT INTO masterlist
                    (item_description, customer, serial_number, stockControl, model, area, line, remarks, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("sssssssss", $itemDescription, $customer, $serial, $stockControl, $model, $area, $line, $remarks, $status);
            $stmt->execute();
            echo "success";
            $stmt->close();
        }

    } elseif ($_SERVER["REQUEST_METHOD"] === "GET") {
        if (isset($_GET['delete_id'])) {
            /* =========================================
               DELETE RECORD
            ========================================== */
            $delId = $_GET['delete_id'];
            $stmt = $conn->prepare("DELETE FROM masterlist WHERE item_id = ?");
            $stmt->bind_param("i", $delId);
            $stmt->execute();
            echo "success";
            $stmt->close();
        } else {
            /* =========================================
               FETCH ALL RECORDS
            ========================================== */
            $sql = "SELECT item_id, item_description, customer, serial_number, stockControl, model, area, line, remarks, status 
                    FROM masterlist ORDER BY item_id DESC";
            $result = $conn->query($sql);
            $data = [];
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
            header('Content-Type: application/json');
            echo json_encode($data);
        }
    }

    $conn->close();

} catch (mysqli_sql_exception $e) {
    if ($e->getCode() == 1062) {
        http_response_code(409);
        echo "THE ITEM ALREADY EXISTS";
    } else {
        http_response_code(500);
        echo "Database Error: " . $e->getMessage();
    }
}
?>