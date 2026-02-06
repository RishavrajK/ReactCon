<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require "../../middleware/auth.php";
require "../../config/db.php";

$result = $conn->query("SELECT * FROM leads ORDER BY id DESC");
if (!$result) {
    http_response_code(500);
    echo json_encode(["error" => "Database query failed"]);
    exit;
}

$leads = [];
while ($row = $result->fetch_assoc()) {
    $leads[] = $row;
}

echo json_encode(["leads" => $leads]);
