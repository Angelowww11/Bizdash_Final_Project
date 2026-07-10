# BizDash

BizDash is a React, native PHP, and MySQL business dashboard for micro and small businesses. It follows the submitted initial project idea: product CRUD, inventory stock-in, sales transactions, profit tracking, low-stock alerts, reports, admin/staff login, and FEU-inspired green/gold styling.

## Demo Accounts

After importing `database/bizdash.sql`, you can log in with:

 Admin  `admin`  `admin123` 
 Staff  `staff`  `staff123` 

## Features

- Landing and login page with connected BizDash logo and mascot assets
- Admin and staff role checking with PHP sessions
- Dashboard cards for sales, profit, products, transactions, low stock, and inventory value
- Interactive Plotly charts for sales, profit, stock categories, payments, and top products
- Product CRUD with categories and product status
- Inventory stock-in form that updates stock and writes inventory logs
- Sales/POS cart that checks stock, computes totals/profit, saves sales items, and deducts inventory
- Reports with date filters and printable report view
- Admin user management for adding/editing/deactivating staff and admin accounts

## Setup With XAMPP

1. Copy the `bizdash` folder into your XAMPP web folder:

   ```text
   C:\xampp\htdocs\bizdash
   ```

2. Start Apache and MySQL from the XAMPP Control Panel.

3. Open phpMyAdmin:

   ```text
   http://localhost/phpmyadmin
   ```

4. Import the database file:

   ```text
   database/bizdash.sql
   ```

5. Check the database settings in:

   ```text
   api/config.php
   ```

   Default XAMPP values are already used:

   ```php
   define('DB_HOST', getenv('BIZDASH_DB_HOST') ?: 'localhost');
   define('DB_NAME', getenv('BIZDASH_DB_NAME') ?: 'bizdash_db');
   define('DB_USER', getenv('BIZDASH_DB_USER') ?: 'root');
   define('DB_PASS', getenv('BIZDASH_DB_PASS') ?: '');
   ```

   For normal XAMPP use, you do not need to change anything.

6. Open the website:

   ```text
   http://localhost/bizdash
   ```

If you need offline use, download these libraries and change the script paths in `index.php`:

- React
- ReactDOM
- Babel Standalone
- Plotly

## Main Files

```text
index.php                  React page host
assets/css/styles.css      FEU-inspired interface styling
assets/js/app.jsx          React screens and frontend logic
api/config.php             Database connection, session, and API helpers
api/auth.php               Login, session check, logout
api/products.php           Product CRUD
api/categories.php         Category CRUD
api/inventory.php          Stock-in and inventory logs
api/sales.php              Sales transaction processing
api/dashboard.php          Dashboard totals and chart data
api/reports.php            Date-filtered report data
api/users.php              Admin user management
database/bizdash.sql       MySQL schema and sample data
storage/sessions/          Local PHP session storage
```

## Code Explanation Guide

- `api/config.php` creates one reusable PDO database connection and helper functions.
- `storage/sessions/` stores PHP session files inside the project so login works consistently in XAMPP and local PHP servers.
- `api/auth.php` checks username/password with `password_verify()` and stores the logged-in user in `$_SESSION`.
- `api/products.php` demonstrates CREATE, READ, UPDATE, and soft DELETE for products.
- `api/inventory.php` uses a database transaction so the stock-in record, product stock, and inventory log update together.
- `api/sales.php` uses a database transaction, checks stock before saving, inserts a sale, inserts sale items, deducts stock, and writes inventory logs.
- `api/reports.php` uses `SELECT`, `SUM`, `COUNT`, `GROUP BY`, and date filters for analysis.

```