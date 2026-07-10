<?php
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$admin = require_admin();

if ($method === 'GET') {
    $users = db()->query(
        "SELECT user_id, full_name, username, role, status, created_at
         FROM users
         ORDER BY role, full_name"
    )->fetchAll();

    send_json(['ok' => true, 'users' => $users]);
}

if ($method === 'POST') {
    $data = json_input();

    $fullName = clean_text($data['full_name'] ?? '');
    $username = clean_text($data['username'] ?? '');
    $password = (string) ($data['password'] ?? '');
    $role = clean_text($data['role'] ?? 'staff');
    $status = clean_text($data['status'] ?? 'active');

    if ($fullName === '' || $username === '' || strlen($password) < 6) {
        fail('Full name, username, and a 6-character password are required.');
    }

    if (!in_array($role, ['admin', 'staff'], true)) {
        $role = 'staff';
    }

    if (!in_array($status, ['active', 'inactive'], true)) {
        $status = 'active';
    }

    $stmt = db()->prepare(
        "INSERT INTO users (full_name, username, password, role, status)
         VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->execute([$fullName, $username, password_hash($password, PASSWORD_DEFAULT), $role, $status]);

    send_json(['ok' => true, 'message' => 'User account added.']);
}

if ($method === 'PUT') {
    $data = json_input();

    $id = (int) ($data['user_id'] ?? 0);
    $fullName = clean_text($data['full_name'] ?? '');
    $username = clean_text($data['username'] ?? '');
    $password = (string) ($data['password'] ?? '');
    $role = clean_text($data['role'] ?? 'staff');
    $status = clean_text($data['status'] ?? 'active');

    if ($id <= 0 || $fullName === '' || $username === '') {
        fail('Valid user information is required.');
    }

    if (!in_array($role, ['admin', 'staff'], true)) {
        $role = 'staff';
    }

    if (!in_array($status, ['active', 'inactive'], true)) {
        $status = 'active';
    }

    if ($password !== '') {
        $stmt = db()->prepare(
            "UPDATE users
             SET full_name = ?, username = ?, password = ?, role = ?, status = ?
             WHERE user_id = ?"
        );
        $stmt->execute([$fullName, $username, password_hash($password, PASSWORD_DEFAULT), $role, $status, $id]);
    } else {
        $stmt = db()->prepare(
            "UPDATE users
             SET full_name = ?, username = ?, role = ?, status = ?
             WHERE user_id = ?"
        );
        $stmt->execute([$fullName, $username, $role, $status, $id]);
    }

    send_json(['ok' => true, 'message' => 'User account updated.']);
}

if ($method === 'DELETE') {
    $data = json_input();
    $id = (int) ($data['user_id'] ?? 0);

    if ($id <= 0) {
        fail('User ID is required.');
    }

    if ($id === (int) $admin['user_id']) {
        fail('You cannot deactivate your own active session.');
    }

    $stmt = db()->prepare("UPDATE users SET status = 'inactive' WHERE user_id = ?");
    $stmt->execute([$id]);

    send_json(['ok' => true, 'message' => 'User account deactivated.']);
}

fail('Unsupported request method.', 405);

