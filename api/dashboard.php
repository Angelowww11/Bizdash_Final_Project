<?php
require __DIR__ . '/config.php';

require_login();

$pdo = db();

$summary = [
    'total_sales' => 0,
    'total_profit' => 0,
    'product_count' => 0,
    'transaction_count' => 0,
    'low_stock_count' => 0,
    'inventory_value' => 0,
];

$summary['total_sales'] = money_value($pdo->query(
    "SELECT COALESCE(SUM(total_amount), 0) FROM sales"
)->fetchColumn());

$summary['total_profit'] = money_value($pdo->query(
    "SELECT COALESCE(SUM(total_profit), 0) FROM sales"
)->fetchColumn());

$summary['product_count'] = (int) $pdo->query(
    "SELECT COUNT(*) FROM products WHERE status = 'active'"
)->fetchColumn();

$summary['transaction_count'] = (int) $pdo->query(
    "SELECT COUNT(*) FROM sales"
)->fetchColumn();

$summary['low_stock_count'] = (int) $pdo->query(
    "SELECT COUNT(*) FROM products
     WHERE status = 'active' AND stock_quantity <= low_stock_level"
)->fetchColumn();

$summary['inventory_value'] = money_value($pdo->query(
    "SELECT COALESCE(SUM(stock_quantity * cost_price), 0)
     FROM products
     WHERE status = 'active'"
)->fetchColumn());

$recentSales = $pdo->query(
    "SELECT s.invoice_number, s.total_amount, s.total_profit, s.payment_method,
            s.sales_date, u.full_name AS cashier_name
     FROM sales s
     LEFT JOIN users u ON u.user_id = s.user_id
     ORDER BY s.sales_date DESC
     LIMIT 8"
)->fetchAll();

$recentStock = $pdo->query(
    "SELECT l.*, p.product_name, u.full_name AS updated_by_name
     FROM inventory_logs l
     LEFT JOIN products p ON p.product_id = l.product_id
     LEFT JOIN users u ON u.user_id = l.updated_by
     ORDER BY l.date_updated DESC
     LIMIT 8"
)->fetchAll();

$lowStock = $pdo->query(
    "SELECT p.product_id, p.product_name, p.stock_quantity, p.low_stock_level, c.category_name
     FROM products p
     LEFT JOIN categories c ON c.category_id = p.category_id
     WHERE p.status = 'active' AND p.stock_quantity <= p.low_stock_level
     ORDER BY p.stock_quantity ASC"
)->fetchAll();

$salesByDay = $pdo->query(
    "SELECT DATE(sales_date) AS label,
            COALESCE(SUM(total_amount), 0) AS sales,
            COALESCE(SUM(total_profit), 0) AS profit
     FROM sales
     WHERE sales_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
     GROUP BY DATE(sales_date)
     ORDER BY label"
)->fetchAll();

$categoryStock = $pdo->query(
    "SELECT COALESCE(c.category_name, 'Uncategorized') AS label,
            COALESCE(SUM(p.stock_quantity), 0) AS stock
     FROM products p
     LEFT JOIN categories c ON c.category_id = p.category_id
     WHERE p.status = 'active'
     GROUP BY label
     ORDER BY stock DESC"
)->fetchAll();

$topProducts = $pdo->query(
    "SELECT p.product_name AS label,
            COALESCE(SUM(si.quantity), 0) AS quantity,
            COALESCE(SUM(si.subtotal), 0) AS sales
     FROM sales_items si
     LEFT JOIN products p ON p.product_id = si.product_id
     GROUP BY p.product_name
     ORDER BY quantity DESC
     LIMIT 6"
)->fetchAll();

send_json([
    'ok' => true,
    'summary' => $summary,
    'recent_sales' => $recentSales,
    'recent_stock' => $recentStock,
    'low_stock' => $lowStock,
    'sales_by_day' => $salesByDay,
    'category_stock' => $categoryStock,
    'top_products' => $topProducts,
]);

