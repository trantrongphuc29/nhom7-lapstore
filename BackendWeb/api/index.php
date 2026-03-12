<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

echo json_encode([
    "message" => "API is working",
    "timestamp" => date("Y-m-d H:i:s"),
    "endpoints" => [
        "products" => "/api/products/read.php",
        "banners" => "/api/banners/read.php",
        "users" => "/api/users/"
    ]
]);
?>