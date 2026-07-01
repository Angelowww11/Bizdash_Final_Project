<?php
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    require_login();

    $products = db()->query(
        "SELECT p.product_id, p.product_name, p.cost_price, p.selling_price,
                p.stock_quantity, p.low_stock_level, p.status, c.category_name
         FROM products p
         LEFT JOIN categories c ON c.category_id = p.category_id
         ORDER BY p.product_name"
    )->fetchAll();

    $logs = db()->query(
        "SELECT l.*, p.product_name, u.full_name AS updated_by_name
         FROM inventory_logs l
         LEFT JOIN products p ON p.product_id = l.product_id
         LEFT JOIN users u ON u.user_id = l.updated_by
         ORDER BY l.date_updated DESC
         LIMIT 80"
    )->fetchAll();

    $stockIn = db()->query(
        "SELECT s.*, p.product_name, u.full_name AS added_by_name
         FROM stock_in s
         LEFT JOIN products p ON p.product_id = s.product_id
         LEFT JOIN users u ON u.user_id = s.added_by
         ORDER BY s.date_added DESC
         LIMIT 80"
    )->fetchAll();

    send_json([
        'ok' => true,
        'products' => $products,
        'logs' => $logs,
        'stock_in' => $stockIn,
    ]);
}

if ($method === 'POST') {
    $user = require_login();
    $data = json_input();

    $productId = (int) ($data['product_id'] ?? 0);
    $quantity = (int) ($data['quantity_added'] ?? 0);
    $costPrice = money_value($data['cost_price'] ?? 0);
    $supplier = clean_text($data['supplier_name'] ?? '');

    if ($productId <= 0 || $quantity <= 0 || $costPrice < 0) {
        fail('Please select a product and enter a valid stock-in quantity.');
    }

    $pdo = db();
    $pdo->beginTransaction();

    try {
        // FOR UPDATE locks this product row until the stock update is finished.
        $stmt = $pdo->prepare(
            "SELECT product_id, stock_quantity
             FROM products
             WHERE product_id = ? AND status = 'active'
             FOR UPDATE"
        );
        $stmt->execute([$productId]);
        $product = $stmt->fetch();

        if (!$product) {
            throw new RuntimeException('Product was not found or is inactive.');
        }

        $previousStock = (int) $product['stock_quantity'];
        $newStock = $previousStock + $quantity;
        $totalCost = $quantity * $costPrice;

        $insert = $pdo->prepare(
            "INSERT INTO stock_in
                (product_id, quantity_added, cost_price, total_cost, supplier_name, added_by)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $insert->execute([$productId, $quantity, $costPrice, $totalCost, $supplier, $user['user_id']]);

        $update = $pdo->prepare(
            "UPDATE products
             SET stock_quantity = ?, cost_price = ?
             WHERE product_id = ?"
        );
        $update->execute([$newStock, $costPrice, $productId]);

        $log = $pdo->prepare(
            "INSERT INTO inventory_logs
                (product_id, action_type, quantity_changed, previous_stock, new_stock, remarks, updated_by)
             VALUES (?, 'stock_in', ?, ?, ?, ?, ?)"
        );
        $log->execute([
            $productId,
            $quantity,
            $previousStock,
            $newStock,
            $supplier ? 'Stock-in from ' . $supplier : 'Stock-in',
            $user['user_id'],
        ]);

        $pdo->commit();
        send_json(['ok' => true, 'message' => 'Inventory updated.']);
    } catch (Throwable $e) {
        $pdo->rollBack();
        fail('Unable to update inventory: ' . $e->getMessage(), 500);
    }
}

fail('Unsupported request method.', 405);

