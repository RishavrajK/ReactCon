<?php
require_once __DIR__ . "/../config/jwt.php";

$headers = getallheaders();
if (!isset($headers['Authorization'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$token = str_replace("Bearer ", "", $headers['Authorization']);

// Manually verify JWT token
function verifyJWT($token, $secret_key)
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }

    list($header_encoded, $payload_encoded, $signature_encoded) = $parts;

    $signature = hash_hmac('sha256', "$header_encoded.$payload_encoded", $secret_key, true);
    $signature_encoded_expected = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');

    if ($signature_encoded !== $signature_encoded_expected) {
        return false;
    }

    $payload = json_decode(base64_decode(strtr($payload_encoded, '-_', '+/')), true);

    if ($payload['exp'] < time()) {
        return false;
    }

    return $payload;
}

$payload = verifyJWT($token, $secret_key);
if (!$payload) {
    http_response_code(401);
    echo json_encode(["error" => "Invalid token"]);
    exit;
}
