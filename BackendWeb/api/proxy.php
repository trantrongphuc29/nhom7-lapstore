<?php
// Proxy endpoint to handle CORS issues
header('Access-Control-Allow-Origin: https://nhom7-web-frontend.gt.tc');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the requested endpoint
$endpoint = $_GET['endpoint'] ?? '';

switch($endpoint) {
    case 'products':
        include_once 'products/read.php';
        break;
    case 'banners':
        include_once 'banners/read.php';
        break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
}
?>