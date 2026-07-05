<?php
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    require_login();

    $sales = db()->query(
        "SELECT s.*, u.full_name AS cashier_name
         FROM sales s
         LEFT JOIN users u ON u.user_id = s.user_id
         ORDER BY s.sales_date DESC
         LIMIT 80"
    )->fetchAll();

    $items = db()->query(
        "SELECT si.*, p.product_name
         FROM sales_items si
         LEFT JOIN products p ON p.product_id = si.product_id
         ORDER BY si.sales_item_id DESC
         LIMIT 200"
    )->fetchAll();

    send_json([
        'ok' => true,
        'sales' => $sales,
        'items' => $items,
    ]);
}

if ($method === 'POST') {
    $user = require_login();
    $data = json_input();
    $items = $data['items'] ?? [];
    $paymentMethod = clean_text($data['payment_method'] ?? 'cash');

    if (!in_array($paymentMethod, ['cash', 'gcash', 'card', 'other'], true)) {
        $paymentMethod = 'cash';
    }

    if (!is_array($items) || count($items) === 0) {
        fail('Add at least one product to the sale.');
    }

    // Combine duplicate product rows before checking stock.
    $cart = [];
    foreach ($items as $item) {
        $productId = (int) ($item['product_id'] ?? 0);
        $quantity = (int) ($item['quantity'] ?? 0);

        if ($productId <= 0 || $quantity <= 0) {
            fail('Every sale item must have a valid product and quantity.');
        }

        $cart[$productId] = ($cart[$productId] ?? 0) + $quantity;
    }

    $pdo = db();
    $pdo->beginTransaction();

    try {
        $invoice = 'BD-' . date('Ymd-His') . '-' . random_int(100, 999);
        $totalAmount = 0;
        $totalProfit = 0;
        $resolvedItems = [];

        foreach ($cart as $productId => $quantity) {
            $stmt = $pdo->prepare(
                "SELECT product_id, product_name, cost_price, selling_price, stock_quantity
                 FROM products
                 WHERE product_id = ? AND status = 'active'
                 FOR UPDATE"
            );
            $stmt->execute([$productId]);
            $product = $stmt->fetch();

            if (!$product) {
                throw new RuntimeException('A selected product is inactive or missing.');
            }

            if ((int) $product['stock_quantity'] < $quantity) {
                throw new RuntimeException($product['product_name'] . ' does not have enough stock.');
            }

            $subtotal = $quantity * (float) $product['selling_price'];
            $profit = $quantity * ((float) $product['selling_price'] - (float) $product['cost_price']);
            $totalAmount += $subtotal;
            $totalProfit += $profit;

            $resolvedItems[] = [
                'product' => $product,
                'quantity' => $quantity,
                'subtotal' => $subtotal,
                'profit' => $profit,
            ];
        }

        $insertSale = $pdo->prepare(
            "INSERT INTO sales
                (invoice_number, user_id, total_amount, total_profit, payment_method)
             VALUES (?, ?, ?, ?, ?)"
        );
        $insertSale->execute([$invoice, $user['user_id'], $totalAmount, $totalProfit, $paymentMethod]);
        $salesId = (int) $pdo->lastInsertId();

        foreach ($resolvedItems as $row) {
            $product = $row['product'];
            $quantity = $row['quantity'];
            $previousStock = (int) $product['stock_quantity'];
            $newStock = $previousStock - $quantity;

            $insertItem = $pdo->prepare(
                "INSERT INTO sales_items
                    (sales_id, product_id, quantity, cost_price, selling_price, subtotal, profit)
                 VALUES (?, ?, ?, ?, ?, ?, ?)"
            );
            $insertItem->execute([
                $salesId,
                $product['product_id'],
                $quantity,
                $product['cost_price'],
                $product['selling_price'],
                $row['subtotal'],
                $row['profit'],
            ]);

            $updateStock = $pdo->prepare(
                "UPDATE products
                 SET stock_quantity = ?
                 WHERE product_id = ?"
            );
            $updateStock->execute([$newStock, $product['product_id']]);

            $log = $pdo->prepare(
                "INSERT INTO inventory_logs
                    (product_id, action_type, quantity_changed, previous_stock, new_stock, remarks, updated_by)
                 VALUES (?, 'sale', ?, ?, ?, ?, ?)"
            );
            $log->execute([
                $product['product_id'],
                -$quantity,
                $previousStock,
                $newStock,
                'Invoice ' . $invoice,
                $user['user_id'],
            ]);
        }

        $pdo->commit();

        send_json([
            'ok' => true,
            'message' => 'Sale saved.',
            'invoice_number' => $invoice,
            'total_amount' => money_value($totalAmount),
            'total_profit' => money_value($totalProfit),
        ]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        fail('Unable to save sale: ' . $e->getMessage(), 500);
    }
}

fail('Unsupported request method.', 405);

