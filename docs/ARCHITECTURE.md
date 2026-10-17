# LORD'S GYM — Backend Architecture Documentation

**Type: Monolithic REST API (Node.js + Express) serving the multi-page Stitch frontend**  
**Lead Developer:** Yadav Yash Jayprakash | **Enrollment:** 202506101410003  
**Facility:** LORD'S GYM, Sachin, Surat (Head Coach Imran Pathan)

---

## Directory Architecture

```text
LORDSGYM WEBSITE/
├── server.js                  Entry point (`npm start`, `npm run dev`)
├── public/                    Website pages & interactive UI
│   ├── index.html             Public storefront & facility hero
│   ├── amenities.html         Equipment fleet & 6 core amenities
│   ├── plans.html             Membership plans (Normal, Trainer, Dietician)
│   ├── gallery.html           Facility floor photo gallery & lightbox
│   ├── contact.html           Athlete intake enquiry desk
│   ├── login.html             Member & staff authentication portal
│   ├── member.html            Member telemetry command & workout split
│   ├── admin.html             Owner Imran Pathan command center & pipeline
│   ├── css/style.css          Custom styling enhancements
│   └── js/
│       ├── main.js            Form submit, dashboard telemetry & client logic
│       └── api.js             API fetch wrapper
├── src/                       Backend application tier
│   ├── config/index.js        Environment variables & configuration
│   ├── routes/index.js        URL mapping, rate limits, role guards
│   ├── controllers/           Public, auth, member & admin request handlers
│   ├── services/              Enquiry intake, member calculation & sessions
│   ├── middleware/            Security headers, rate limiting, auth & error handlers
│   ├── db/index.js            Repository datastore with seed data
│   └── utils/                 Timing-safe crypto hashing & regex validation
├── tests/api.test.js          Automated end-to-end test suite (`npm test`)
├── docs/                      Architecture & API documentation
├── backend-php/               Original PHP 8.x + MySQL backend for XAMPP evaluation
└── frontend-react/            Complete React CRA application
```

---

## Key Design Decisions

1. **Unified Process Deployment**: Static HTML/CSS/JS frontend and REST API are served from a single lightweight Node.js Express process on port 3000.
2. **Layered Separation of Concerns**:
   - `routes` &rarr; `middleware` (rate limiting, security, auth) &rarr; `controllers` &rarr; `services` &rarr; `db`.
3. **Session Security**: Session tokens are cryptographically generated via `crypto.randomBytes(24)`, stored as `HttpOnly`, `SameSite=Lax`, and persisted to disk in `data/sessions.json`.
4. **Timing-Safe Password Hashing**: Passwords use native `crypto.scryptSync` with 16-byte random salts and `crypto.timingSafeEqual`.
5. **Strict Input Validation**: Indian mobile numbers are validated strictly on the server using `/^[6-9][0-9]{9}$/` before saving.
6. **Dual-Stack Support**: Both the Node.js monolithic architecture AND the XAMPP PHP/MySQL architecture are maintained and runnable.
