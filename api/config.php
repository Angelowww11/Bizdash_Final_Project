<?php
// Central settings and helper functions used by every API file.
// Keep this file simple so the database connection is easy to explain.

declare(strict_types=1);

$sessionPath = dirname(__DIR__) . '/storage/sessions';

if (!is_dir($sessionPath)) {
    mkdir($sessionPath, 0775, true);
}

session_save_path($sessionPath);
session_start();

define('DB_HOST', getenv('BIZDASH_DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('BIZDASH_DB_PORT') ?: '');
define('DB_NAME', 'bizdash_progress_4');
define('DB_USER', getenv('BIZDASH_DB_USER') ?: 'root');
define('DB_PASS', getenv('BIZDASH_DB_PASS') ?: '');

header('Content-Type: application/json; charset=utf-8');

function db(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST
            . (DB_PORT !== '' ? ';port=' . DB_PORT : '')
            . ';dbname=' . DB_NAME
            . ';charset=utf8mb4';

        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }

    return $pdo;
}

function json_input(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);

    return is_array($data) ? $data : [];
}

function send_json(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function fail(string $message, int $status = 400): void
{
    send_json(['ok' => false, 'message' => $message], $status);
}

function current_user(): ?array
{
    return $_SESSION['user'] ?? null;
}

function require_login(): array
{
    $user = current_user();

    if (!$user) {
        fail('Please log in first.', 401);
    }

    return $user;
}

function require_admin(): array
{
    $user = require_login();

    if ($user['role'] !== 'admin') {
        fail('Admin access is required for this action.', 403);
    }

    return $user;
}

function money_value(mixed $value): float
{
    return round((float) $value, 2);
}

function clean_text(mixed $value): string
{
    return trim((string) $value);
}
