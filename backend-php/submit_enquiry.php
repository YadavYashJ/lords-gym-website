<?php
/**
 * submit_enquiry.php — Enquiry Form Submission Endpoint
 * LORD'S GYM Backend API
 * Developer: Yadav Yash Jayprakash | En.Roll: 202506101410003
 *
 * Method : POST
 * URL    : http://localhost/lordsgym-api/submit_enquiry.php
 * Body   : {
 *            "visitor_name": "Rahul Sharma",
 *            "mobile":       "9876543210",
 *            "plan_label":   "Gym with Trainer - ₹4,000/mo",
 *            "message":      "I want to join for weight loss.",
 *            "slot_pref":    "Evening 4PM-7PM"
 *          }
 *
 * Returns on success:
 *   { success: true, message: "...", enquiry_id: 42, ticket_ref: "LG-42" }
 *
 * Returns on failure:
 *   { success: false, message: "...", errors: [...] }
 */

require_once __DIR__ . '/db.php';

// ── Only accept POST ──────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Method Not Allowed. Use POST.'], 405);
}

// ── Read input ────────────────────────────────────────────────────────────────
$body = get_json_body();

$visitor_name = trim($body['visitor_name'] ?? '');
$mobile       = trim($body['mobile']       ?? '');
$plan_label   = trim($body['plan_label']   ?? '');
$message      = trim($body['message']      ?? '');
$slot_pref    = trim($body['slot_pref']    ?? '');

// ── Server-side Validation ────────────────────────────────────────────────────
$errors = [];

// 1. Name: required, 2–120 chars
if (empty($visitor_name)) {
    $errors[] = 'Full name is required.';
} elseif (mb_strlen($visitor_name) < 2 || mb_strlen($visitor_name) > 120) {
    $errors[] = 'Name must be between 2 and 120 characters.';
}

// 2. Mobile: strict 10-digit Indian number regex
//    Must start with 6, 7, 8, or 9 (per TRAI numbering)
$mobile_pattern = '/^[6-9][0-9]{9}$/';
if (empty($mobile)) {
    $errors[] = 'Mobile number is required.';
} elseif (!preg_match($mobile_pattern, $mobile)) {
    $errors[] = 'Mobile must be a valid 10-digit Indian number starting with 6–9.';
}

// 3. Plan label: required
if (empty($plan_label)) {
    $errors[] = 'Please select a plan of interest.';
}

if (!empty($errors)) {
    json_response(['success' => false, 'message' => 'Validation failed.', 'errors' => $errors], 422);
}

// ── Sanitize inputs ───────────────────────────────────────────────────────────
// htmlspecialchars strips XSS vectors from string fields
$visitor_name = htmlspecialchars($visitor_name, ENT_QUOTES, 'UTF-8');
$plan_label   = htmlspecialchars($plan_label,   ENT_QUOTES, 'UTF-8');
$message      = htmlspecialchars($message,      ENT_QUOTES, 'UTF-8');
$slot_pref    = htmlspecialchars($slot_pref,    ENT_QUOTES, 'UTF-8');
// Mobile is already validated numeric — no further sanitization needed

// ── Resolve plan_id from plan_label (optional — for FK integrity) ─────────────
$pdo     = get_db();
$plan_id = null;

// Map UI select value strings to DB plan names
$plan_map = [
    'Normal Gym - ₹1,500/mo'                     => 'Normal Gym',
    'Gym with Trainer - ₹4,000/mo'               => 'Gym with Trainer',
    'Gym with Trainer & Dietician - ₹5,000/mo'   => 'Gym with Trainer & Dietician',
];

$db_plan_name = $plan_map[$plan_label] ?? null;
if ($db_plan_name) {
    $plan_stmt = $pdo->prepare("SELECT id FROM membership_plans WHERE plan_name = :n LIMIT 1");
    $plan_stmt->execute([':n' => $db_plan_name]);
    $plan_row  = $plan_stmt->fetch();
    $plan_id   = $plan_row ? (int) $plan_row['id'] : null;
}

// ── Insert into enquiries table ───────────────────────────────────────────────
try {
    $insert = $pdo->prepare(
        "INSERT INTO enquiries (visitor_name, mobile, plan_id, plan_label, message, slot_pref, status)
         VALUES (:name, :mobile, :plan_id, :plan_label, :message, :slot_pref, 'New')"
    );
    $insert->execute([
        ':name'       => $visitor_name,
        ':mobile'     => $mobile,
        ':plan_id'    => $plan_id,       // NULL if walk-in / general tour
        ':plan_label' => $plan_label,
        ':message'    => $message,
        ':slot_pref'  => $slot_pref ?: null,
    ]);

    $enquiry_id  = (int) $pdo->lastInsertId();
    $ticket_ref  = 'LG-' . str_pad($enquiry_id, 4, '0', STR_PAD_LEFT);

    json_response([
        'success'     => true,
        'message'     => "Enquiry dispatched to Owner Imran Pathan's terminal.",
        'enquiry_id'  => $enquiry_id,
        'ticket_ref'  => $ticket_ref,
    ], 201);

} catch (PDOException $e) {
    json_response(['success' => false, 'message' => 'Could not save enquiry. Please try again.'], 500);
}
