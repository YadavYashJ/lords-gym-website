<?php
/**
 * db.php — Secure PDO Database Connection
 * LORD'S GYM Backend API
 * Developer: Yadav Yash Jayprakash | En.Roll: 202506101410003
 *
 * Place this file in: C:/xampp/htdocs/lordsgym-api/db.php
 * This file is included by all endpoint files. NEVER expose it publicly.
 */

// ─── CORS Headers ────────────────────────────────────────────────────────────
// Allows the React dev server (port 3000 or 5173 for Vite) to call the API.
// In production, replace the origin with your actual domain.
$allowed_origins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
} else {
    // Fallback for direct XAMPP browser testing
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=UTF-8');

// Handle browser pre-flight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// ─── Database Credentials ────────────────────────────────────────────────────
define('DB_HOST', '127.0.0.1');
define('DB_PORT', '3306');
define('DB_NAME', 'lords_gym_db');
define('DB_USER', 'root');        // XAMPP default; change for production
define('DB_PASS', '');            // XAMPP default blank; change for production
define('DB_CHARSET', 'utf8mb4');

// ─── PDO Connection ──────────────────────────────────────────────────────────
function get_db(): PDO
{
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
        DB_HOST, DB_PORT, DB_NAME, DB_CHARSET
    );

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,   // Throw exceptions on errors
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,          // Return arrays by default
        PDO::ATTR_EMULATE_PREPARES   => false,                      // Use real prepared statements
        PDO::ATTR_PERSISTENT         => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        // Never expose raw PDO errors to the client in production
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed. Contact administrator.',
            // 'debug'  => $e->getMessage()  // Uncomment ONLY during local dev
        ]);
        exit();
    }

    return $pdo;
}

// ─── Helper: Send JSON Response ──────────────────────────────────────────────
function json_response(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

// ─── Helper: Get Request Body as JSON ────────────────────────────────────────
function get_json_body(): array
{
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}
