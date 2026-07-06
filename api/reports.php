<?php
require __DIR__ . '/config.php';

require_login();

$start = clean_text($_GET['start'] ?? date('Y-m-01'));
$end = clean_text($_GET['end'] ?? date('Y-m-d'));

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $start) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end)) {
    fail('Use valid start and end dates.');
}

$pdo = db();

$summaryStmt = $pdo->prepare(
    "SELECT COALESCE(SUM(total_amount), 0) AS total_sales,
            COALESCE(SUM(total_profit), 0) AS total_profit,
            COUNT(*) AS transaction_count
     FROM sales
     WHERE DATE(sales_date) BETWEEN ? AND ?"
);
$summaryStmt->execute([$start, $end]);
$summary = $summaryStmt->fetch();

$dailyStmt = $pdo->prepare(
    "SELECT DATE(sales_date) AS label,
            COALESCE(SUM(total_amount), 0) AS sales,
            COALESCE(SUM(total_profit), 0) AS profit
     FROM sales
     WHERE DATE(sales_date) BETWEEN ? AND ?
     GROUP BY DATE(sales_date)
     ORDER BY label"
);
$dailyStmt->execute([$start, $end]);

$topStmt = $pdo->prepare(
    "SELECT p.product_name AS label,
            COALESCE(SUM(si.quantity), 0) AS quantity,
            COALESCE(SUM(si.subtotal), 0) AS sales,
            COALESCE(SUM(si.profit), 0) AS profit
     FROM sales_items si
     INNER JOIN sales s ON s.sales_id = si.sales_id
     LEFT JOIN products p ON p.product_id = si.product_id
     WHERE DATE(s.sales_date) BETWEEN ? AND ?
     GROUP BY p.product_name
     ORDER BY quantity DESC
     LIMIT 10"
);
$topStmt->execute([$start, $end]);

$paymentStmt = $pdo->prepare(
    "SELECT payment_method AS label,
            COUNT(*) AS count,
            COALESCE(SUM(total_amount), 0) AS sales
     FROM sales
     WHERE DATE(sales_date) BETWEEN ? AND ?
     GROUP BY payment_method"
);
$paymentStmt->execute([$start, $end]);

$recentStmt = $pdo->prepare(
    "SELECT s.*, u.full_name AS cashier_name
     FROM sales s
     LEFT JOIN users u ON u.user_id = s.user_id
     WHERE DATE(s.sales_date) BETWEEN ? AND ?
     ORDER BY s.sales_date DESC
     LIMIT 40"
);
$recentStmt->execute([$start, $end]);

$lowStock = $pdo->query(
    "SELECT p.product_name, p.stock_quantity, p.low_stock_level, c.category_name
     FROM products p
     LEFT JOIN categories c ON c.category_id = p.category_id
     WHERE p.status = 'active' AND p.stock_quantity <= p.low_stock_level
     ORDER BY p.stock_quantity"
)->fetchAll();

$inventoryValue = money_value($pdo->query(
    "SELECT COALESCE(SUM(stock_quantity * cost_price), 0)
     FROM products
     WHERE status = 'active'"
)->fetchColumn());

send_json([
    'ok' => true,
    'start' => $start,
    'end' => $end,
    'summary' => [
        'total_sales' => money_value($summary['total_sales'] ?? 0),
        'total_profit' => money_value($summary['total_profit'] ?? 0),
        'transaction_count' => (int) ($summary['transaction_count'] ?? 0),
        'inventory_value' => $inventoryValue,
    ],
    'daily' => $dailyStmt->fetchAll(),
    'top_products' => $topStmt->fetchAll(),
    'payment_methods' => $paymentStmt->fetchAll(),
    'recent_sales' => $recentStmt->fetchAll(),
    'low_stock' => $lowStock,
]);

