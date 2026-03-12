<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once dirname(__DIR__) . '/config/database.php';
require_once dirname(__DIR__) . '/models/User.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(array("message" => "Database connection failed."));
    exit();
}

$user = new User($db);

try {
    // Check if ID is provided (for single user)
    if (isset($_GET['id']) && !empty($_GET['id'])) {
        $user->id = $_GET['id'];
        $stmt = $user->readOne();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($row) {
            $user_arr = array(
                "id" => $row['id'],
                "name" => $row['name']
            );
            http_response_code(200);
            echo json_encode($user_arr);
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "User not found."));
        }
    } else {
        // Get all users
        $stmt = $user->read();
        $users_arr = array();
        $users_arr["records"] = array();

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $user_item = array(
                "id" => $row['id'],
                "name" => $row['name']
            );
            array_push($users_arr["records"], $user_item);
        }

        http_response_code(200);
        echo json_encode($users_arr);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Error: " . $e->getMessage()));
}
?>