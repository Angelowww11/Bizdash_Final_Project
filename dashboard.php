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

$summary['product_count'] = (int) $pdo->query(
    "SELECT COUNT(*) FROM products WHERE status = 'active'"
)->fetchColumn();

$recentSales = [];
$lowStockProducts = [];
$salesByDay = [];
$categoryStock = [];
$topProducts = [];

send_json([
    'ok' => true,
    'summary' => $summary,
    'recentSales' => $recentSales,
    'lowStockProducts' => $lowStockProducts,
    'graphs' => [
        'salesByDay' => $salesByDay,
        'categoryStock' => $categoryStock,
        'topProducts' => $topProducts,
    ]
]);