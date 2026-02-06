<?php
// Simple password hasher utility
// Use this to generate correct bcrypt hashes

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
    $password = $_POST['password'];
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $result = "Password: " . $password . "\n\nHash: " . $hash;
} else {
    $result = null;
}
?>
<!DOCTYPE html>
<html>

<head>
    <title>Password Hasher</title>
    <style>
        body {
            font-family: Arial;
            padding: 20px;
            background: #f5f5f5;
        }

        .container {
            background: white;
            padding: 20px;
            border-radius: 5px;
            max-width: 500px;
        }

        input,
        button {
            padding: 10px;
            margin: 10px 0;
            width: 100%;
            box-sizing: border-box;
        }

        button {
            background: #667eea;
            color: white;
            border: none;
            cursor: pointer;
        }

        pre {
            background: #f0f0f0;
            padding: 10px;
            border-radius: 5px;
            word-break: break-all;
        }
    </style>
</head>

<body>
    <div class="container">
        <h2>Bcrypt Password Hasher</h2>
        <form method="POST">
            <input type="password" name="password" placeholder="Enter password" required>
            <button type="submit">Generate Hash</button>
        </form>

        <?php if ($result): ?>
            <pre><?php echo $result; ?></pre>
            <p><strong>Instructions:</strong></p>
            <ol>
                <li>Copy the hash above</li>
                <li>Go to phpMyAdmin → lms database → users table</li>
                <li>Edit the user record</li>
                <li>Paste the hash in the password field</li>
                <li>Click Save</li>
            </ol>
        <?php endif; ?>
    </div>
</body>

</html>