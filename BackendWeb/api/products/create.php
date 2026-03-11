<?php
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json; charset=UTF-8");

require_once dirname(__DIR__, 2) . '/config/database.php';
require_once dirname(__DIR__, 2) . '/models/Product.php';


$database = new Database();
$db = $database->getConnection();


$product = new Product($db);

$data = json_decode(file_get_contents("php://input"));

if(
    !empty($data->name) &&
    !empty($data->brand) &&
    !empty($data->price)
) {
    $product->name = $data->name;
    $product->brand = $data->brand;
    $product->cpu = $data->cpu;
    $product->ram = $data->ram;
    $product->storage = $data->storage;
    $product->screen = $data->screen;
    $product->price = $data->price;
    $product->original_price = $data->original_price;
    $product->discount = $data->discount;
    $product->image = $data->image;
    $product->rating = $data->rating ?? 0;
    $product->reviews = $data->reviews ?? 0;

    if($product->create()) {
        http_response_code(201);
        echo json_encode(array("message" => "Product was created."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to create product."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to create product. Data is incomplete."));
}
?>
