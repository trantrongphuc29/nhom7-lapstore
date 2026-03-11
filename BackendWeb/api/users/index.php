<?php
header("Content-Type: application/json; charset=UTF-8");

require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/models/User.php';

$database = new Database();
$db = $database->getConnection();

$user = new User($db);
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

echo json_encode($users_arr);
?>
