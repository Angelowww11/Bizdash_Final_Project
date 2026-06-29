<?php
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    send_json([
        'ok' => true,
        'authenticated' => current_user() !== null,
        'user' => current_user(),
    ]);
}

if ($method === 'DELETE' || ($method === 'POST' && ($_GET['action'] ?? '') === 'logout')) {
    $_SESSION = [];
    session_destroy();
    send_json(['ok' => true, 'message' => 'Logged out.']);
}

if ($method === 'POST') {
    $data = json_input();
    $username = clean_text($data['username'] ?? '');
    $password = (string) ($data['password'] ?? '');

    if ($username === '' || $password === '') {
        fail('Username and password are required.');
    }

    // Prepared statements keep the login query safe from SQL injection.
    $stmt = db()->prepare(
        "SELECT user_id, full_name, username, password, role, status
         FROM users
         WHERE username = ?
         LIMIT 1"
    );
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user || $user['status'] !== 'active' || !password_verify($password, $user['password'])) {
        fail('Invalid username or password.', 401);
    }

    $_SESSION['user'] = [
        'user_id' => (int) $user['user_id'],
        'full_name' => $user['full_name'],
        'username' => $user['username'],
        'role' => $user['role'],
    ];

    send_json([
        'ok' => true,
        'message' => 'Login successful.',
        'user' => $_SESSION['user'],
    ]);
}

fail('Unsupported request method.', 405);
