<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require "../../config/db.php";
require "../../config/jwt.php";

// Check if vendor/autoload.php exists, if not use fallback
if (file_exists("../../vendor/autoload.php")) {
    require "../../vendor/autoload.php";
} else {
    // Fallback if composer packages not installed
    error_log("Warning: vendor/autoload.php not found. JWT functionality may be limited.");
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['email']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(["error" => "Email and password are required"]);
    exit;
}

$email = $data['email'];
$password = $data['password'];

$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $conn->error]);
    exit;
}

$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($user = $result->fetch_assoc()) {
    if (password_verify($password, $user['password'])) {
        // Create a simple JWT token
        $header = json_encode(['alg' => 'HS256', 'typ' => 'JWT']);
        $payload = json_encode([
            "iss" => $issuer,
            "aud" => $audience,
            "iat" => time(),
            "exp" => time() + 3600,
            "user_id" => $user['id']
        ]);

        $header_encoded = rtrim(strtr(base64_encode($header), '+/', '-_'), '=');
        $payload_encoded = rtrim(strtr(base64_encode($payload), '+/', '-_'), '=');
        $signature = hash_hmac('sha256', "$header_encoded.$payload_encoded", $secret_key, true);
        $signature_encoded = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');

        $jwt = "$header_encoded.$payload_encoded.$signature_encoded";

        echo json_encode(["token" => $jwt, "user_id" => $user['id']]);
        exit;
    }
}

http_response_code(401);
echo json_encode(["error" => "Invalid credentials"]);
