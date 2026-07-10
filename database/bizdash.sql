-- BizDash database
-- Import this file in phpMyAdmin or with:
-- mysql -u root -p < database/bizdash.sql

CREATE DATABASE IF NOT EXISTS bizdash_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE bizdash_db;

DROP TABLE IF EXISTS inventory_logs;
DROP TABLE IF EXISTS sales_items;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS stock_in;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(80) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NULL,
  product_name VARCHAR(120) NOT NULL,
  description TEXT,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INT NOT NULL DEFAULT 0,
  low_stock_level INT NOT NULL DEFAULT 10,
  product_image VARCHAR(255),
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
    ON DELETE SET NULL
);

CREATE TABLE stock_in (
  stock_in_id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  quantity_added INT NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  supplier_name VARCHAR(120),
  date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  added_by INT NULL,
  CONSTRAINT fk_stock_product
    FOREIGN KEY (product_id) REFERENCES products(product_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_stock_user
    FOREIGN KEY (added_by) REFERENCES users(user_id)
    ON DELETE SET NULL
);

CREATE TABLE sales (
  sales_id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(40) NOT NULL UNIQUE,
  user_id INT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  total_profit DECIMAL(10,2) NOT NULL,
  payment_method ENUM('cash', 'gcash', 'card', 'other') NOT NULL DEFAULT 'cash',
  sales_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sales_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE SET NULL
);

CREATE TABLE sales_items (
  sales_item_id INT AUTO_INCREMENT PRIMARY KEY,
  sales_id INT NOT NULL,
  product_id INT NULL,
  quantity INT NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  profit DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_item_sale
    FOREIGN KEY (sales_id) REFERENCES sales(sales_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_item_product
    FOREIGN KEY (product_id) REFERENCES products(product_id)
    ON DELETE SET NULL
);

CREATE TABLE inventory_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NULL,
  action_type ENUM('stock_in', 'sale', 'adjustment') NOT NULL,
  quantity_changed INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  remarks VARCHAR(255),
  updated_by INT NULL,
  date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_log_product
    FOREIGN KEY (product_id) REFERENCES products(product_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_log_user
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
    ON DELETE SET NULL
);

-- Demo accounts
-- admin / admin123
-- staff / staff123
INSERT INTO users (full_name, username, password, role, status) VALUES
('BizDash Admin', 'admin', '$2y$10$PNrp1eUc514.QaCcXw1EQeRrd33YGvh950BQxShjC11Ne7DGWY/AK', 'admin', 'active'),
('Sample Staff', 'staff', '$2y$10$NPvgdtW1mDKZJ9C.GXUIPu7k6A9sYYpYFA7KatC0j1UjqEM0Iz9.K', 'staff', 'active');

INSERT INTO categories (category_name, description) VALUES
('Beverages', 'Drinks and refreshments'),
('Meals', 'Ready-to-serve food items'),
('School Supplies', 'Small retail school items'),
('Snacks', 'Packaged snacks and quick bites');

INSERT INTO products
  (category_id, product_name, description, cost_price, selling_price, stock_quantity, low_stock_level, status)
VALUES
  (1, 'Bottled Water', '500ml bottled water', 8.00, 15.00, 91, 20, 'active'),
  (1, 'Iced Tea', 'Ready-to-drink iced tea', 12.00, 25.00, 45, 15, 'active'),
  (2, 'Rice Meal', 'Budget rice meal', 38.00, 65.00, 33, 10, 'active'),
  (4, 'Banana Chips', 'Small pack banana chips', 10.00, 20.00, 58, 15, 'active'),
  (3, 'Ballpen', 'Black ink ballpen', 5.00, 12.00, 96, 25, 'active'),
  (3, 'Notebook', '80 leaves notebook', 22.00, 35.00, 18, 12, 'active');

INSERT INTO stock_in (product_id, quantity_added, cost_price, total_cost, supplier_name, added_by, date_added) VALUES
  (1, 100, 8.00, 800.00, 'Local Grocery Supplier', 1, DATE_SUB(NOW(), INTERVAL 7 DAY)),
  (2, 50, 12.00, 600.00, 'Refresh Hub', 1, DATE_SUB(NOW(), INTERVAL 6 DAY)),
  (3, 35, 38.00, 1330.00, 'Kitchen Prep', 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
  (6, 20, 22.00, 440.00, 'Campus Supplies', 1, DATE_SUB(NOW(), INTERVAL 3 DAY));

INSERT INTO sales (invoice_number, user_id, total_amount, total_profit, payment_method, sales_date) VALUES
  ('BD-20260614-001', 2, 112.00, 55.00, 'cash', DATE_SUB(NOW(), INTERVAL 6 DAY)),
  ('BD-20260615-001', 2, 86.00, 47.00, 'gcash', DATE_SUB(NOW(), INTERVAL 5 DAY)),
  ('BD-20260616-001', 1, 130.00, 54.00, 'cash', DATE_SUB(NOW(), INTERVAL 4 DAY)),
  ('BD-20260617-001', 2, 70.00, 26.00, 'card', DATE_SUB(NOW(), INTERVAL 3 DAY)),
  ('BD-20260618-001', 2, 150.00, 74.00, 'gcash', DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT INTO sales_items (sales_id, product_id, quantity, cost_price, selling_price, subtotal, profit) VALUES
  (1, 1, 4, 8.00, 15.00, 60.00, 28.00),
  (1, 4, 2, 10.00, 20.00, 40.00, 20.00),
  (1, 5, 1, 5.00, 12.00, 12.00, 7.00),
  (2, 2, 2, 12.00, 25.00, 50.00, 26.00),
  (2, 5, 3, 5.00, 12.00, 36.00, 21.00),
  (3, 3, 2, 38.00, 65.00, 130.00, 54.00),
  (4, 6, 2, 22.00, 35.00, 70.00, 26.00),
  (5, 1, 5, 8.00, 15.00, 75.00, 35.00),
  (5, 2, 3, 12.00, 25.00, 75.00, 39.00);

INSERT INTO inventory_logs
  (product_id, action_type, quantity_changed, previous_stock, new_stock, remarks, updated_by, date_updated)
VALUES
  (1, 'stock_in', 100, 0, 100, 'Initial stock from supplier', 1, DATE_SUB(NOW(), INTERVAL 7 DAY)),
  (1, 'sale', -4, 100, 96, 'Invoice BD-20260614-001', 2, DATE_SUB(NOW(), INTERVAL 6 DAY)),
  (4, 'sale', -2, 60, 58, 'Invoice BD-20260614-001', 2, DATE_SUB(NOW(), INTERVAL 6 DAY)),
  (5, 'sale', -1, 100, 99, 'Invoice BD-20260614-001', 2, DATE_SUB(NOW(), INTERVAL 6 DAY)),
  (2, 'stock_in', 50, 0, 50, 'Initial stock from supplier', 1, DATE_SUB(NOW(), INTERVAL 6 DAY)),
  (2, 'sale', -2, 50, 48, 'Invoice BD-20260615-001', 2, DATE_SUB(NOW(), INTERVAL 5 DAY)),
  (5, 'sale', -3, 99, 96, 'Invoice BD-20260615-001', 2, DATE_SUB(NOW(), INTERVAL 5 DAY)),
  (3, 'stock_in', 35, 0, 35, 'Meal inventory added', 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
  (3, 'sale', -2, 35, 33, 'Invoice BD-20260616-001', 1, DATE_SUB(NOW(), INTERVAL 4 DAY)),
  (6, 'stock_in', 20, 0, 20, 'School supplies stock-in', 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
  (6, 'sale', -2, 20, 18, 'Invoice BD-20260617-001', 2, DATE_SUB(NOW(), INTERVAL 3 DAY)),
  (1, 'sale', -5, 96, 91, 'Invoice BD-20260618-001', 2, DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (2, 'sale', -3, 48, 45, 'Invoice BD-20260618-001', 2, DATE_SUB(NOW(), INTERVAL 2 DAY));
