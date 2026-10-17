<?php
/**
 * get_pipeline.php — Admin Enquiries Pipeline Endpoint (Protected)
 * LORD'S GYM Backend API
 * Developer: Yadav Yash Jayprakash | En.Roll: 202506101410003
 *
 * Method : GET
 * URL    : http://localhost/lordsgym-api/get_pipeline.php?admin_id=1
 *
 * Query params (optional filters):
 *   ?status=New            → filter by status (New/Contacted/Converted/Dropped)
 *   ?limit=50              → max rows (default 100)
 *   ?offset=0              → for pagination
 *
 * Returns:
 * {
 *   success: true,
 *   stats: { total, new_count, contacted_count, converted_count },
 *   enquiries: [ { id, visitor_name, mobile, plan_label, message, slot_pref, status, created_at }, ... ]
 * }
 */

require_once __DIR__ . '/db.php';

// ── Only accept GET ───────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['success' => false, 'message' => 'Method Not Allowed. Use GET.'], 405);
}

// ── Admin authorization check ─────────────────────────────────────────────────
// Verify that the requesting user is an active admin in the DB.
// In production: validate a Bearer JWT token in the Authorization header instead.
$admin_id = isset($_GET['admin_id']) ? (int) $_GET['admin_id'] : 0;
if ($admin_id <= 0) {
    json_response(['success' => false, 'message' => 'Unauthorized. admin_id is required.'], 401);
}

$pdo       = get_db();
$auth_stmt = $pdo->prepare(
    "SELECT id FROM users WHERE id = :id AND role = 'admin' AND is_active = 1 LIMIT 1"
);
$auth_stmt->execute([':id' => $admin_id]);
if (!$auth_stmt->fetch()) {
    json_response(['success' => false, 'message' => 'Forbidden. Admin access only.'], 403);
}

// ── Optional filters ──────────────────────────────────────────────────────────
$valid_statuses = ['New', 'Contacted', 'Converted', 'Dropped'];
$status_filter  = $_GET['status'] ?? null;
$limit          = isset($_GET['limit'])  ? max(1, min(500, (int) $_GET['limit']))  : 100;
$offset         = isset($_GET['offset']) ? max(0, (int) $_GET['offset']) : 0;

// ── Build enquiries query ─────────────────────────────────────────────────────
$where_clause = '';
$params       = [];

if ($status_filter && in_array($status_filter, $valid_statuses, true)) {
    $where_clause = 'WHERE e.status = :status';
    $params[':status'] = $status_filter;
}

$sql = "SELECT
            e.id,
            e.visitor_name,
            e.mobile,
            e.plan_label,
            mp.price        AS plan_price,
            e.message,
            e.slot_pref,
            e.status,
            e.created_at
        FROM enquiries e
        LEFT JOIN membership_plans mp ON mp.id = e.plan_id
        {$where_clause}
        ORDER BY
            FIELD(e.status, 'New', 'Contacted', 'Converted', 'Dropped'),
            e.created_at DESC
        LIMIT  :limit
        OFFSET :offset";

$stmt = $pdo->prepare($sql);

// Bind named params + pagination ints separately (PDO requires bindValue for LIMIT/OFFSET)
foreach ($params as $key => $val) {
    $stmt->bindValue($key, $val);
}
$stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();

$enquiries = $stmt->fetchAll();

// Cast id to int for JSON
foreach ($enquiries as &$row) {
    $row['id'] = (int) $row['id'];
    if (isset($row['plan_price'])) {
        $row['plan_price'] = $row['plan_price'] !== null ? (float) $row['plan_price'] : null;
    }
}
unset($row);

// ── Aggregate stats (always unfiltered) ──────────────────────────────────────
$stats_stmt = $pdo->query(
    "SELECT
         COUNT(*)                                           AS total,
         SUM(status = 'New')                               AS new_count,
         SUM(status = 'Contacted')                         AS contacted_count,
         SUM(status = 'Converted')                         AS converted_count,
         SUM(status = 'Dropped')                           AS dropped_count
     FROM enquiries"
);
$stats = $stats_stmt->fetch();

// Cast all stats to int
foreach ($stats as $k => $v) {
    $stats[$k] = (int) $v;
}

// ── Response ──────────────────────────────────────────────────────────────────
json_response([
    'success'    => true,
    'stats'      => $stats,
    'enquiries'  => $enquiries,
    'pagination' => [
        'limit'  => $limit,
        'offset' => $offset,
        'count'  => count($enquiries),
    ],
], 200);
