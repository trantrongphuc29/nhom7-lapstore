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

require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/models/Product.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(array("message" => "Database connection failed."));
    exit();
}

$product = new Product($db);

$brands = isset($_GET['brand']) ? $_GET['brand'] : null;
$cpu = isset($_GET['cpu']) ? $_GET['cpu'] : null;
$ram = isset($_GET['ram']) ? $_GET['ram'] : null;
$minPrice = isset($_GET['minPrice']) ? $_GET['minPrice'] : null;
$maxPrice = isset($_GET['maxPrice']) ? $_GET['maxPrice'] : null;
$keyword = isset($_GET['keyword']) ? $_GET['keyword'] : null;

try {
    if ($keyword || $brands || $cpu || $ram || $minPrice || $maxPrice) {
        $stmt = $product->search($keyword, $brands, $cpu, $ram, $minPrice, $maxPrice);
    } else {
        $stmt = $product->read();
    }

    $num = $stmt->rowCount();

    if($num > 0) {
        $products_arr = array();
        $products_arr["records"] = array();

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $product_item = array(
                "id" => $row['id'],
                "name" => $row['name'],
                "brand" => $row['brand'],
                "cpu" => $row['cpu'],
                "ram" => $row['ram'],
                "storage" => $row['storage'],
                "screen" => $row['screen'],
                "price" => $row['price'],
                "original_price" => $row['original_price'],
                "discount" => $row['discount'],
                "image" => $row['image'],
                "rating" => $row['rating'],
                "reviews" => $row['reviews']
            );
            array_push($products_arr["records"], $product_item);
        }

        http_response_code(200);
        echo json_encode($products_arr);
    } else {
        http_response_code(200);
        echo json_encode(array("records" => array()));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Error: " . $e->getMessage()));
}
?>
