<?php
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];


/*
 * Products Module
 * Status: Under Development
 *
 * Completed:
 * - Database connection
 * - Product listing
 *
 * Pending:
 * - Add product feature
 * - Edit product feature
 * - Delete/deactivate product
 * - Image upload
 * - Inventory synchronization
 */


if ($method === 'GET') {

    require_login();

    $search = '%' . clean_text($_GET['search'] ?? '') . '%';


    $stmt = db()->prepare(
        "SELECT p.product_id,
                p.product_name,
                p.cost_price,
                p.selling_price,
                p.stock_quantity,
                p.status,
                c.category_name
         FROM products p
         LEFT JOIN categories c
         ON c.category_id = p.category_id
         WHERE p.product_name LIKE ?
         ORDER BY p.product_name"
    );

    $stmt->execute([$search]);


    $categories = db()->query(
        "SELECT category_id, category_name
         FROM categories
         ORDER BY category_name"
    )->fetchAll();


    send_json([
        'ok' => true,
        'products' => $stmt->fetchAll(),
        'categories' => $categories,

        'message' => 'Product listing completed. Other functions are still under development.'
    ]);
}



if ($method === 'POST') {

    require_admin();

    $data = json_input();


    /*
     * TODO:
     * - Validate product fields
     * - Insert new product
     * - Add inventory log
     * - Support product images
     */


    send_json([
        'ok' => false,
        'message' => 'Adding products is not finished yet.'
    ]);
}



if ($method === 'PUT') {

    require_admin();

    $data = json_input();


    /*
     * TODO:
     * - Update product information
     * - Update prices
     * - Update stock level
     */


    send_json([
        'ok' => false,
        'message' => 'Product editing is still under development.'
    ]);
}



if ($method === 'DELETE') {

    require_admin();


    /*
     * TODO:
     * - Implement product deactivation
     * - Keep sales records protected
     */


    send_json([
        'ok' => false,
        'message' => 'Product deletion feature is not completed.'
    ]);
}



fail('Unsupported request method.', 405);

?>