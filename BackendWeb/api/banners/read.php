<?php
// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 86400');
    http_response_code(200);
    exit();
}

// Set CORS headers for all requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

include_once dirname(__DIR__, 2) . '/config/database.php';
include_once dirname(__DIR__, 2) . '/models/Banner.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(array("message" => "Database connection failed."));
    exit();
}

$banner = new Banner($db);

try {
    $stmt = $banner->read();
    
    $banners_arr = array();
    $banners_arr["records"] = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $banner_item = array(
            "id" => $row['id'],
            "title" => $row['title'],
            "image_url" => $row['image_url'],
            "is_active" => $row['is_active']
        );
        array_push($banners_arr["records"], $banner_item);
    }

    http_response_code(200);
    echo json_encode($banners_arr);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Error: " . $e->getMessage()));
}
?>
