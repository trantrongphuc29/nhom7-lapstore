<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/models/User.php';

$database = new Database();
$db = $database->getConnection();

$user = new User($db);

// Lấy ID từ URL path hoặc query string
if(isset($_GET['id'])) {
    $user->id = $_GET['id'];
} else {
    $request_uri = $_SERVER['REQUEST_URI'];
    preg_match('/\/users\/(\d+)/', $request_uri, $matches);
    $user->id = isset($matches[1]) ? $matches[1] : die(json_encode(array("message" => "ID required")));
}

$stmt = $user->readOne();
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if($row) {
    $user_item = array(
        "id" => $row['id'],
        "name" => $row['name']
    );
    echo json_encode($user_item);
} else {
    echo json_encode(array("message" => "User not found"));
}
?>
