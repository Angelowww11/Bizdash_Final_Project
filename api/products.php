<?php
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    require_login();

    $search = '%' . clean_text($_GET['search'] ?? '') . '%';
    $status = clean_text($_GET['status'] ?? 'active');

    $sql = "SELECT p.*, c.category_name
            FROM products p
            LEFT JOIN categories c ON c.category_id = p.category_id
            WHERE (p.product_name LIKE ? OR c.category_name LIKE ?)";
    $params = [$search, $search];

    if ($status !== 'all') {
        $sql .= " AND p.status = ?";
        $params[] = $status;
    }

    $sql .= " ORDER BY p.product_name";
    $stmt = db()->prepare($sql);
    $stmt->execute($params);

    $categories = db()->query(
        "SELECT category_id, category_name
         FROM categories
         ORDER BY category_name"
    )->fetchAll();

    send_json([
        'ok' => true,
        'products' => $stmt->fetchAll(),
        'categories' => $categories,
    ]);
} else {
    fail('Product management controls (Create, Update, Delete) are currently under development.', 405);
}