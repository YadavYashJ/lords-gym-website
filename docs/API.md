# LORD'S GYM — REST API Reference

Base URL: `http://localhost:3000/api`

---

## Public Endpoints

### 1. `GET /api/health`
Returns system status and timestamp.

### 2. `GET /api/plans`
Returns the 3 active membership plans:
- Normal Gym (₹1,500/mo)
- Gym with Trainer (₹4,000/mo)
- Gym with Trainer & Dietician (₹5,000/mo)

### 3. `GET /api/amenities`
Returns the 6 core gym amenities.

### 4. `POST /api/enquiry`
Receives public athlete enquiry form submissions.
- **Body**: `{ name, mobile, plan, message, slot }`
- **Validation**: Strict 10-digit Indian mobile regex (`/^[6-9][0-9]{9}$/`).
- **Response**: `{ ok: true, ticket: "LG-0004", enquiry_id: 4 }`

---

## Authentication Endpoints

### 5. `POST /api/login`
- **Body**: `{ user: "thelordsgymsachin@gmail.com", pass: "LordsGym@2025" }`
- **Response**: `{ ok: true, role: "admin"|"member", user: { id, full_name, role } }`
- Sets HTTP-Only cookie `lg_sid`.

### 6. `POST /api/logout`
Destroys session and clears cookie.

---

## Member Endpoints

### 7. `GET /api/dashboard`
Fetches active plan telemetry, days left integer, and progress metrics for the logged-in member.

---

## Admin Protected Endpoints (Admin Session Required)

### 8. `GET /api/admin/pipeline?status=New`
Returns all inbound athlete enquiries, optionally filtered by status (`New`, `Contacted`, `Converted`, `Dropped`), with summary stats.

### 9. `PATCH /api/admin/enquiries/:id`
Updates the status of an enquiry.
- **Body**: `{ status: "Contacted" }`

### 10. `GET /api/admin/stats`
Returns aggregated count metrics for dashboard reporting.
