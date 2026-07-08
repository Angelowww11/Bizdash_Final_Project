<?php
require __DIR__ . '/config.php';

require_login();

$pdo = db();

/*
 * Dashboard Module
 * Status: Under Development
 *
 * Completed:
 * - Database connection
 * - Login authentication
 * - Basic summary structure
 *
 * Pending:
 * - Complete analytics calculations
 * - Connect charts
 * - Add more dashboard widgets
 */

$summary = [
    'total_sales' => 0,
    'total_profit' => 0,
    'product_count' => 0,
    'transaction_count' => 0,
    'low_stock_count' => 0,
    'inventory_value' => 0,
];


// Completed sales summary
$summary['total_sales'] = money_value($pdo->query(
    "SELECT COALESCE(SUM(total_amount), 0) FROM sales"
)->fetchColumn());


// TODO: Complete profit computation
// $summary['total_profit'] = ...


$summary['product_count'] = (int) $pdo->query(
    "SELECT COUNT(*) FROM products"
)->fetchColumn();


// TODO: Add transaction analytics
// TODO: Add daily sales comparison


$recentSales = $pdo->query(
    "SELECT invoice_number, total_amount, payment_method, sales_date
     FROM sales
     ORDER BY sales_date DESC
     LIMIT 5"
)->fetchAll();


// TODO: Add recent inventory activity
$recentStock = [];


// TODO: Add low stock monitoring
$lowStock = [];


// TODO: Add sales chart data
$salesChart = [];


// TODO: Add category performance chart
$categoryChart = [];


// TODO: Add top selling products
$topProducts = [];


send_json([
    'ok' => true,

    'status' => 'Dashboard development in progress',

    'summary' => $summary,

    'recent_sales' => $recentSales,

    'recent_stock' => $recentStock,

    'low_stock' => $lowStock,

    'charts' => [
        'sales' => $salesChart,
        'category' => $categoryChart,
        'top_products' => $topProducts
    ]
]);