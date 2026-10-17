# LORD'S GYM Management Portal

> Single-process, high-performance web platform and REST API for **LORD'S GYM**, Sachin, Surat.

**Lead Developer:** Yadav Yash Jayprakash  
**Enrollment:** 202506101410003  
**Managing Owner:** Imran Pathan (Head Coach)

---

## Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Test Suite
```bash
npm test
```
*Executes all 9 automated end-to-end endpoint tests using Node.js native test runner.*

### 3. Start Development Server
```bash
npm run dev
# or
npm start
```
Open **`http://localhost:3000`** in your browser.

---

## Application Navigation Links

| Page | URL | Description |
| :--- | :--- | :--- |
| **Home Storefront** | `http://localhost:3000/` | Public hero, highlights, and gym introduction |
| **Amenities** | `http://localhost:3000/amenities` | 6 core gym facilities & equipment fleet |
| **Membership Plans** | `http://localhost:3000/plans` | Normal Gym (₹1,500), Trainer (₹4,000), Dietician (₹5,000) |
| **Photo Gallery** | `http://localhost:3000/gallery` | Floor photos, workout zones, and lightbox |
| **Athlete Enquiry Desk** | `http://localhost:3000/contact` | Inbound intake form with 10-digit Indian mobile validation |
| **Portal Login** | `http://localhost:3000/login` | Member & Staff sign-in |
| **Member Dashboard** | `http://localhost:3000/member` | Live telemetry, dynamic days-left dial, and splits |
| **Admin Command Center**| `http://localhost:3000/admin` | Owner pipeline, lead statuses, and audit controls |

---

## Default Credentials

- **Admin Account (Owner Imran Pathan):**
  - Email: `thelordsgymsachin@gmail.com`
  - Password: `LordsGym@2025`
  - Role: `admin`

- **Member Account (Yash Jayprakash):**
  - Email: `yash@example.com`
  - Password: `Member@123`
  - Role: `member` (Gym with Trainer, 18 Days Left)

---

## Directory Layout

```text
LORDSGYM WEBSITE/
├── server.js            # Server entry point
├── package.json         # Scripts & dependencies
├── .env.example         # Environment template
├── .gitignore           # Git ignore patterns
├── Dockerfile           # Docker configuration
├── README.md            # Project guide
├── docs/                # Architecture and REST API specs
│   ├── API.md
│   └── ARCHITECTURE.md
├── public/              # Complete static multi-page frontend
│   ├── index.html
│   ├── amenities.html
│   ├── plans.html
│   ├── gallery.html
│   ├── contact.html
│   ├── login.html
│   ├── member.html
│   ├── admin.html
│   ├── css/
│   └── js/
├── src/                 # Application backend logic
│   ├── app.js
│   ├── config/
│   ├── controllers/
│   ├── db/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── utils/
├── tests/               # Automated test suite
│   └── api.test.js
├── backend-php/         # Preserved XAMPP PHP 8.x + MySQL backend
└── frontend-react/      # Preserved React CRA application
```
