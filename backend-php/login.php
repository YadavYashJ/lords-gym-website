<?php
/**
 * login.php — Authentication Endpoint
 * LORD'S GYM Backend API
 * Developer: Yadav Yash Jayprakash | En.Roll: 202506101410003
 *
 * Method : POST
 * URL    : http://localhost/lordsgym-api/login.php
 * Body   : { "email": "...", "password": "..." }
 *
 * Returns on success:
 *   { success: true, role: "admin"|"member", user: {...} }
 *
 * Returns on failure:
 *   { success: false, message: "..." }
 */

require_once __DIR__ . '/db.php';

// ── Only accept POST ──────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Method Not Allowed. Use POST.'], 405);
}

// ── Read and validate input ───────────────────────────────────────────────────
$body     = get_json_body();
$email    = trim($body['email']    ?? '');
$password = trim($body['password'] ?? '');

if (empty($email) || empty($password)) {
    json_response(['success' => false, 'message' => 'Email and password are required.'], 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['success' => false, 'message' => 'Invalid email format.'], 422);
}

// ── Fetch user from DB (use prepared statement — no SQL injection possible) ───
$pdo  = get_db();
$stmt = $pdo->prepare(
    "SELECT id, full_name, email, mobile, password_hash, role,
            active_plan_id, subscription_start, subscription_end, is_active
     FROM   users
     WHERE  email = :email
     LIMIT  1"
);
$stmt->execute([':email' => $email]);
$user = $stmt->fetch();

// ── Validate credentials ──────────────────────────────────────────────────────
// password_verify() compares the plain-text password against the stored bcrypt hash.
// This is timing-safe and protects against brute-force fingerprinting.
if (!$user || !password_verify($password, $user['password_hash'])) {
    // Generic message — do NOT reveal whether email exists
    json_response(['success' => false, 'message' => 'Invalid credentials. Please try again.'], 401);
}

if ((int) $user['is_active'] !== 1) {
    json_response(['success' => false, 'message' => 'This account has been deactivated. Contact the gym owner.'], 403);
}

// ── Build the response payload ────────────────────────────────────────────────
// Remove sensitive fields before sending to client
unset($user['password_hash'], $user['is_active']);

// Compute days_left for members who have an active subscription
$user['days_left'] = null;
if (!empty($user['subscription_end'])) {
    $today     = new DateTime('today');
    $end_date  = new DateTime($user['subscription_end']);
    $diff      = $today->diff($end_date);
    // diff->days is always positive; invert flag means end_date is in the past
    $user['days_left'] = $diff->invert ? 0 : (int) $diff->days;
}

// ── Role-based routing flag ───────────────────────────────────────────────────
// The React frontend reads `data.role` to decide which view to render:
//   "admin"  → redirect to Admin Enquiries Pipeline
//   "member" → redirect to Member Portal Dashboard
$response = [
    'success'  => true,
    'role'     => $user['role'],    // "admin" | "member"
    'redirect' => $user['role'] === 'admin' ? '/admin/pipeline' : '/member/dashboard',
    'user'     => $user,
];

json_response($response, 200);
