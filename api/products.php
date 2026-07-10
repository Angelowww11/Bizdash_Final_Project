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
}

if ($method === 'POST') {
    $user = require_admin();
    $data = json_input();

    $name = clean_text($data['product_name'] ?? '');
    $categoryId = (int) ($data['category_id'] ?? 0);
    $description = clean_text($data['description'] ?? '');
    $costPrice = money_value($data['cost_price'] ?? 0);
    $sellingPrice = money_value($data['selling_price'] ?? 0);
    $stock = (int) ($data['stock_quantity'] ?? 0);
    $lowStockLevel = (int) ($data['low_stock_level'] ?? 10);
    $image = clean_text($data['product_image'] ?? '');

    if ($name === '' || $costPrice < 0 || $sellingPrice < 0 || $stock < 0) {
        fail('Please enter a valid product name, prices, and stock quantity.');
    }

    $pdo = db();
    $pdo->beginTransaction();

    try {
        $stmt = $pdo->prepare(
            "INSERT INTO products
                (category_id, product_name, description, cost_price, selling_price,
                 stock_quantity, low_stock_level, product_image, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')"
        );
        $stmt->execute([
            $categoryId ?: null,
            $name,
            $description,
            $costPrice,
            $sellingPrice,
            $stock,
            max(0, $lowStockLevel),
            $image,
        ]);

        $productId = (int) $pdo->lastInsertId();

        // When a product starts with stock, record it in the inventory log.
        if ($stock > 0) {
            $log = $pdo->prepare(
                "INSERT INTO inventory_logs
                    (product_id, action_type, quantity_changed, previous_stock, new_stock, remarks, updated_by)
                 VALUES (?, 'adjustment', ?, 0, ?, 'Initial product stock', ?)"
            );
            $log->execute([$productId, $stock, $stock, $user['user_id']]);
        }

        $pdo->commit();
        send_json(['ok' => true, 'message' => 'Product added.']);
    } catch (Throwable $e) {
        $pdo->rollBack();
        fail('Unable to add product: ' . $e->getMessage(), 500);
    }
}

if ($method === 'PUT') {
    require_admin();
    $data = json_input();

    $id = (int) ($data['product_id'] ?? 0);
    $name = clean_text($data['product_name'] ?? '');
    $categoryId = (int) ($data['category_id'] ?? 0);
    $description = clean_text($data['description'] ?? '');
    $costPrice = money_value($data['cost_price'] ?? 0);
    $sellingPrice = money_value($data['selling_price'] ?? 0);
    $lowStockLevel = (int) ($data['low_stock_level'] ?? 10);
    $image = clean_text($data['product_image'] ?? '');
    $status = clean_text($data['status'] ?? 'active');

    if ($id <= 0 || $name === '' || !in_array($status, ['active', 'inactive'], true)) {
        fail('Valid product information is required.');
    }

    $stmt = db()->prepare(
        "UPDATE products
         SET category_id = ?, product_name = ?, description = ?, cost_price = ?,
             selling_price = ?, low_stock_level = ?, product_image = ?, status = ?
         WHERE product_id = ?"
    );
    $stmt->execute([
        $categoryId ?: null,
        $name,
        $description,
        $costPrice,
        $sellingPrice,
        max(0, $lowStockLevel),
        $image,
        $status,
        $id,
    ]);

    send_json(['ok' => true, 'message' => 'Product updated.']);
}

if ($method === 'DELETE') {
    require_admin();
    $data = json_input();
    $id = (int) ($data['product_id'] ?? 0);

    if ($id <= 0) {
        fail('Product ID is required.');
    }

    // Deactivate instead of hard deleting so old sales records stay readable.
    $stmt = db()->prepare("UPDATE products SET status = 'inactive' WHERE product_id = ?");
    $stmt->execute([$id]);

    send_json(['ok' => true, 'message' => 'Product deactivated.']);
}

fail('Unsupported request method.', 405);

