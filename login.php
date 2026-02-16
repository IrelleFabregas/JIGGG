<?php
session_start();

$mysqli = new mysqli("localhost", "root", "", "jigmonitoring");

if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}

$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

if (!$username || !$password) {
    echo "Please enter both username and password";
    exit;
}

$stmt = $mysqli->prepare("SELECT * FROM `user` WHERE username=? AND password=?");
$stmt->bind_param("ss", $username, $password);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $row = $result->fetch_assoc();
    $_SESSION['user_id'] = $row['id'];
    $_SESSION['username'] = $row['username'];
    echo "success";
} else {
    echo "Invalid username or password";
}

$stmt->close();
$mysqli->close();
?>
