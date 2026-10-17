<?php
/**
 * get_dashboard.php — Member Portal Dashboard Data Endpoint
 * LORD'S GYM Backend API
 * Developer: Yadav Yash Jayprakash | En.Roll: 202506101410003
 *
 * Method : GET
 * URL    : http://localhost/lordsgym-api/get_dashboard.php?user_id=2
 *
 * In a production app you would verify a session token / JWT instead of
 * a bare user_id query param. For XAMPP dev, user_id from localStorage is
 * acceptable; see the React integration section for the full pattern.
 *
 * Returns:
 * {
 *   success: true,
 *   member: {
 *     full_name, email, mobile, role,
 *     plan_name, plan_price, inclusions,
 *     subscription_start, subscription_end,
 *     days_left,          ← exact integer, calculated server-side
 *     days_elapsed,
 *     cycle_percent       ← % of plan period elapsed (for the progress ring)
 *   }
 * }
 */

require_once __DIR__ . '/db.php';

// ── Only accept GET ───────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['success' => false, 'message' => 'Method Not Allowed. Use GET.'], 405);
}

// ── Validate user_id param ────────────────────────────────────────────────────
$user_id = isset($_GET['user_id']) ? (int) $_GET['user_id'] : 0;
if ($user_id <= 0) {
    json_response(['success' => false, 'message' => 'A valid user_id is required.'], 422);
}

// ── Fetch member + plan data in a single JOIN query ───────────────────────────
$pdo  = get_db();
$stmt = $pdo->prepare(
    "SELECT
        u.id,
        u.full_name,
        u.email,
        u.mobile,
        u.role,
        u.subscription_start,
        u.subscription_end,
        mp.id        AS plan_id,
        mp.plan_name,
        mp.price     AS plan_price,
        mp.duration  AS plan_duration_days,
        mp.inclusions
     FROM   users u
     LEFT JOIN membership_plans mp ON mp.id = u.active_plan_id
     WHERE  u.id        = :uid
       AND  u.is_active = 1
       AND  u.role      = 'member'
     LIMIT  1"
);
$stmt->execute([':uid' => $user_id]);
$member = $stmt->fetch();

if (!$member) {
    json_response(['success' => false, 'message' => 'Member not found or account inactive.'], 404);
}

// ── Days-Left Calculation ─────────────────────────────────────────────────────
// Uses PHP DateInterval for exact integer days — no floating-point rounding errors.
$today          = new DateTime('today');    // midnight today in server timezone
$days_left      = 0;
$days_elapsed   = 0;
$cycle_percent  = 0;

if (!empty($member['subscription_end'])) {
    $end_date = new DateTime($member['subscription_end']);
    $diff_end = $today->diff($end_date);
    // diff->invert = 1 means end_date has already passed
    $days_left = $diff_end->invert ? 0 : (int) $diff_end->days;
}

if (!empty($member['subscription_start'])) {
    $start_date   = new DateTime($member['subscription_start']);
    $diff_start   = $start_date->diff($today);
    $days_elapsed = (int) $diff_start->days;

    $total_days = $days_elapsed + $days_left;
    if ($total_days > 0) {
        // Percentage of the subscription period that has been USED (for UI ring)
        $cycle_percent = (int) round(($days_elapsed / $total_days) * 100);
        // Clamp between 0 and 100
        $cycle_percent = max(0, min(100, $cycle_percent));
    }
}

// ── Build response ────────────────────────────────────────────────────────────
json_response([
    'success' => true,
    'member'  => [
        'id'                 => (int) $member['id'],
        'full_name'          => $member['full_name'],
        'email'              => $member['email'],
        'mobile'             => $member['mobile'],
        'role'               => $member['role'],
        'plan_id'            => $member['plan_id'] ? (int) $member['plan_id'] : null,
        'plan_name'          => $member['plan_name']      ?? 'No Active Plan',
        'plan_price'         => $member['plan_price']     ? (float) $member['plan_price'] : null,
        'plan_duration_days' => $member['plan_duration_days'] ? (int) $member['plan_duration_days'] : null,
        'inclusions'         => $member['inclusions']     ?? '',
        'subscription_start' => $member['subscription_start'],
        'subscription_end'   => $member['subscription_end'],
        'days_left'          => $days_left,       // ← exact integer displayed on the dial
        'days_elapsed'       => $days_elapsed,
        'cycle_percent'      => $cycle_percent,   // ← used to draw the SVG ring (0–100)
    ],
], 200);
