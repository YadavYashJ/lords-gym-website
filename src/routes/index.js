const express = require('express');
const { rateLimit } = require('../middleware/rateLimit');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ah } = require('../middleware/errorHandler');

const pub = require('../controllers/public.controller');
const auth = require('../controllers/auth.controller');
const member = require('../controllers/member.controller');
const admin = require('../controllers/admin.controller');

const router = express.Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60000, max: 15, message: 'Too many login attempts. Try again in 15 minutes.' });
const formLimiter = rateLimit({ windowMs: 60 * 60000, max: 30, message: 'Too many enquiry submissions. Please call us directly.' });

// ── Public Routes ───────────────────────────────────────────────────────────
router.get('/health', pub.health);
router.get('/plans', pub.plans);
router.get('/amenities', pub.amenities);
router.post('/enquiry', formLimiter, ah(pub.submitEnquiry));

// ── Auth Routes (no login required) ────────────────────────────────────────
router.post('/login', loginLimiter, auth.login(loginLimiter));
router.post('/logout', auth.logout);
router.post('/register', formLimiter, ah(auth.register));

// ── All routes below REQUIRE authentication ──────────────────────────────────
router.use(requireAuth);
router.get('/me', auth.me);
router.post('/change-password', ah(auth.changePassword));

// ── Member Routes (any authenticated user) ──────────────────────────────────
router.get('/dashboard', ah(member.dashboard));

// ── Admin Protected Routes ──────────────────────────────────────────────────
router.use(requireRole('admin'));
router.get('/admin/pipeline', ah(admin.pipeline));
router.get('/admin/stats', ah(admin.stats));
router.patch('/admin/enquiries/:id', ah(admin.updateEnquiryStatus));
router.get('/admin/users', ah(admin.listUsers));
router.patch('/admin/users/:id/plan', ah(admin.activatePlan));

module.exports = router;
