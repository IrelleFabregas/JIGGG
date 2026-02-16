<?php
// mcbMasterlist.php - Backend API for MCB Masterlist Management

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Database configuration
$host = 'localhost';
$dbname = 'jigmonitoring';
$username = 'root';
$password = '';

// Create database connection
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit();
}

// Get action from request
$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : '');

// Route to appropriate function
switch($action) {
    case 'create':
        createItem();
        break;
    case 'read':
        readItems();
        break;
    case 'update':
        updateItem();
        break;
    case 'delete':
        deleteItem();
        break;
    default:
        echo json_encode([
            'success' => false,
            'message' => 'Invalid action'
        ]);
}

// CREATE - Add new item to masterlist
function createItem() {
    global $pdo;
    
    try {
        // Get data from POST request
        $data = $_POST;
        
        // Validate required fields (matching HTML form IDs)
        $required_fields = [
            'mcbBarcode' => 'MCB Barcode',
            'mechaBarcode' => 'Mecha Barcode',
            'itemDescription' => 'Item Description',
            'stockControl' => 'Stock Control',
            'customer' => 'Customer',
            'model' => 'Model',
            'remarks' => 'Remarks',
            'status' => 'Status'
        ];
        
        foreach($required_fields as $field => $label) {
            if (!isset($data[$field]) || trim($data[$field]) === '') {
                echo json_encode([
                    'success' => false,
                    'message' => $label . ' is required'
                ]);
                return;
            }
        }
        
        // Check if MCB Barcode already exists
        $checkStmt = $pdo->prepare("SELECT id FROM mcb_masterlist WHERE mcb_barcode = ?");
        $checkStmt->execute([trim($data['mcbBarcode'])]);
        
        if ($checkStmt->fetch()) {
            echo json_encode([
                'success' => false,
                'message' => 'MCB Barcode already exists in the system'
            ]);
            return;
        }
        
        // Insert new record with matching database columns
        $sql = "INSERT INTO mcb_masterlist 
                (mcb_barcode, mecha_barcode, item_description, stock_control, customer, 
                 model, remarks, status, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([
            trim($data['mcbBarcode']),
            trim($data['mechaBarcode']),
            trim($data['itemDescription']),
            trim($data['stockControl']),
            trim($data['customer']),
            trim($data['model']),
            trim($data['remarks']),
            trim($data['status'])
        ]);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Item added successfully to masterlist',
                'id' => $pdo->lastInsertId()
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to add item'
            ]);
        }
        
    } catch(PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
}

// READ - Get all items from masterlist
function readItems() {
    global $pdo;
    
    try {
        $sql = "SELECT 
                    id,
                    mcb_barcode,
                    mecha_barcode,
                    item_description,
                    stock_control,
                    customer,
                    model,
                    remarks,
                    status,
                    created_at,
                    updated_at
                FROM mcb_masterlist 
                ORDER BY created_at DESC";
        
        $stmt = $pdo->query($sql);
        $records = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'records' => $records,
            'count' => count($records)
        ]);
        
    } catch(PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage(),
            'records' => []
        ]);
    }
}

// UPDATE - Update existing item
function updateItem() {
    global $pdo;
    
    try {
        // Get data from POST request
        $data = $_POST;
        
        // Validate ID
        if (!isset($data['id']) || trim($data['id']) === '') {
            echo json_encode([
                'success' => false,
                'message' => 'Item ID is required'
            ]);
            return;
        }
        
        // Validate required fields
        $required_fields = [
            'mcbBarcode' => 'MCB Barcode',
            'mechaBarcode' => 'Mecha Barcode',
            'itemDescription' => 'Item Description',
            'stockControl' => 'Stock Control',
            'customer' => 'Customer',
            'model' => 'Model',
            'remarks' => 'Remarks',
            'status' => 'Status'
        ];
        
        foreach($required_fields as $field => $label) {
            if (!isset($data[$field]) || trim($data[$field]) === '') {
                echo json_encode([
                    'success' => false,
                    'message' => $label . ' is required'
                ]);
                return;
            }
        }
        
        // Check if item exists
        $checkStmt = $pdo->prepare("SELECT id FROM mcb_masterlist WHERE id = ?");
        $checkStmt->execute([$data['id']]);
        
        if (!$checkStmt->fetch()) {
            echo json_encode([
                'success' => false,
                'message' => 'Item not found'
            ]);
            return;
        }
        
        // Check if MCB Barcode already exists for another item
        $checkStmt = $pdo->prepare("SELECT id FROM mcb_masterlist WHERE mcb_barcode = ? AND id != ?");
        $checkStmt->execute([trim($data['mcbBarcode']), $data['id']]);
        
        if ($checkStmt->fetch()) {
            echo json_encode([
                'success' => false,
                'message' => 'MCB Barcode already exists for another item'
            ]);
            return;
        }
        
        // Update record
        $sql = "UPDATE mcb_masterlist SET 
                mcb_barcode = ?, 
                mecha_barcode = ?, 
                item_description = ?, 
                stock_control = ?, 
                customer = ?, 
                model = ?, 
                remarks = ?, 
                status = ?, 
                updated_at = NOW() 
                WHERE id = ?";
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([
            trim($data['mcbBarcode']),
            trim($data['mechaBarcode']),
            trim($data['itemDescription']),
            trim($data['stockControl']),
            trim($data['customer']),
            trim($data['model']),
            trim($data['remarks']),
            trim($data['status']),
            $data['id']
        ]);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Item updated successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update item'
            ]);
        }
        
    } catch(PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
}

// DELETE - Delete item from masterlist
function deleteItem() {
    global $pdo;
    
    try {
        $data = $_POST;
        
        if (!isset($data['id']) || trim($data['id']) === '') {
            echo json_encode([
                'success' => false,
                'message' => 'Item ID is required'
            ]);
            return;
        }
        
        // Check if item exists
        $checkStmt = $pdo->prepare("SELECT id, mcb_barcode FROM mcb_masterlist WHERE id = ?");
        $checkStmt->execute([$data['id']]);
        $item = $checkStmt->fetch();
        
        if (!$item) {
            echo json_encode([
                'success' => false,
                'message' => 'Item not found'
            ]);
            return;
        }
        
        // Delete record
        $sql = "DELETE FROM mcb_masterlist WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([$data['id']]);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Item deleted successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete item'
            ]);
        }
        
    } catch(PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
}

// Close database connection
$pdo = null;
?>