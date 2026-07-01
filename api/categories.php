<?php
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    require_login();

    $rows = db()->query(
        "SELECT category_id, category_name, description, created_at
         FROM categories
         ORDER BY category_name"
    )->fetchAll();

    send_json(['ok' => true, 'categories' => $rows]);
}

if ($method === 'POST') {
    require_admin();
    $data = json_input();

    $name = clean_text($data['category_name'] ?? '');
    $description = clean_text($data['description'] ?? '');

    if ($name === '') {
        fail('Category name is required.');
    }

    $stmt = db()->prepare(
        "INSERT INTO categories (category_name, description)
         VALUES (?, ?)"
    );
    $stmt->execute([$name, $description]);

    send_json(['ok' => true, 'message' => 'Category added.']);
}

if ($method === 'PUT') {
    require_admin();
    $data = json_input();

    $id = (int) ($data['category_id'] ?? 0);
    $name = clean_text($data['category_name'] ?? '');
    $description = clean_text($data['description'] ?? '');

    if ($id <= 0 || $name === '') {
        fail('Valid category information is required.');
    }

    $stmt = db()->prepare(
        "UPDATE categories
         SET category_name = ?, description = ?
         WHERE category_id = ?"
    );
    $stmt->execute([$name, $description, $id]);

    send_json(['ok' => true, 'message' => 'Category updated.']);
}

if ($method === 'DELETE') {
    require_admin();
    $data = json_input();
    $id = (int) ($data['category_id'] ?? 0);

    if ($id <= 0) {
        fail('Category ID is required.');
    }

    $stmt = db()->prepare("DELETE FROM categories WHERE category_id = ?");
    $stmt->execute([$id]);

    send_json(['ok' => true, 'message' => 'Category deleted.']);
}

fail('Unsupported request method.', 405);

