<?php
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json; charset=UTF-8");

require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/models/User.php';

$database = new Database();
$db = $database->getConnection();

$user = new User($db);
$data = json_decode(file_get_contents("php://input"));

if(!empty($data->name)) {
    $user->name = $data->name;
    
    if($user->create()) {
        http_response_code(201);
        echo json_encode(array("message" => "User created", "id" => $db->lastInsertId()));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to create user"));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Name required"));
}
?>
