<?php
require __DIR__ . '/config.php';

require_login();


/*
 * Reports Module
 * Status: Under Development
 *
 * Completed:
 * - Database connection
 * - Basic date filtering
 *
 * Pending:
 * - Complete sales analytics
 * - Profit reports
 * - Product ranking
 * - Payment analysis
 * - Export functions
 */


$start = clean_text($_GET['start'] ?? date('Y-m-01'));
$end = clean_text($_GET['end'] ?? date('Y-m-d'));



if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $start) ||
    !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end)) {

    fail('Invalid date format.');
}



$pdo = db();



// Basic sales count only
$summaryStmt = $pdo->prepare(
    "SELECT 
        COUNT(*) AS transaction_count,
        COALESCE(SUM(total_amount),0) AS total_sales
     FROM sales
     WHERE DATE(sales_date) BETWEEN ? AND ?"
);


$summaryStmt->execute([$start, $end]);

$summary = $summaryStmt->fetch();





/*
 TODO:
 - Add total profit calculation
 - Add inventory value
 - Add top selling products
 - Add payment method report
 - Add sales chart data
 - Add export to PDF/Excel
*/



$recentSales = $pdo->prepare(
    "SELECT 
        invoice_number,
        total_amount,
        payment_method,
        sales_date
     FROM sales
     WHERE DATE(sales_date) BETWEEN ? AND ?
     ORDER BY sales_date DESC
     LIMIT 10"
);


$recentSales->execute([$start, $end]);




send_json([

    'ok' => true,


    'period' => [
        'start' => $start,
        'end' => $end
    ],


    'summary' => [

        'total_sales' => money_value($summary['total_sales'] ?? 0),

        'transaction_count' =>
            (int) ($summary['transaction_count'] ?? 0)

    ],


    'recent_sales' => $recentSales->fetchAll(),


    'reports' => [

        'profit_report' => 'Not completed',

        'top_products' => 'Not completed',

        'payment_analysis' => 'Not completed',

        'inventory_report' => 'Not completed'

    ],


    'message' =>
        'Report module is still under development.'

]);

?>