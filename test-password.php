<?php
require "Backend/config/db.php";

// Get user from database
$result = $conn->query("SELECT * FROM users WHERE email = 'user@example.com'");
$user = $result->fetch_assoc();

echo "<h1>Password Verification Test</h1>";
echo "<pre>";

if (!$user) {
    echo "ERROR: User not found in database!\n";
} else {
    echo "User found: " . $user['email'] . "\n";
    echo "Hash in DB: " . $user['password'] . "\n\n";

    $testPassword = "user123";
    echo "Testing password: $testPassword\n";

    $verified = password_verify($testPassword, $user['password']);
    echo "Verification result: " . ($verified ? "SUCCESS ✓" : "FAILED ✗") . "\n\n";

    if (!$verified) {
        echo "Password mismatch! Let's generate a new hash:\n";
        $newHash = password_hash($testPassword, PASSWORD_BCRYPT);
        echo "New hash: $newHash\n\n";

        // Update database with new hash
        $stmt = $conn->prepare("UPDATE users SET password = ? WHERE email = 'user@example.com'");
        $stmt->bind_param("s", $newHash);
        if ($stmt->execute()) {
            echo "✓ Database updated! Try logging in now.\n";
        } else {
            echo "✗ Failed to update database.\n";
        }
    }
}

echo "</pre>";
