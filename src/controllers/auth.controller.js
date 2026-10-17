const db = require('../db');
const sessions = require('../services/session.service');
const { verify, hash } = require('../utils/hash');
const { str } = require('../utils/validate');
const { setCookie, clearCookie, publicUser } = require('../middleware/auth');

module.exports = {
  login: limiter => (req, res) => {
    const userInput = str(req.body?.user || req.body?.email).toLowerCase();
    const pass = String(req.body?.pass || req.body?.password || '');

    if (!userInput || !pass) {
      return res.status(400).json({ ok: false, error: 'Email and password are required' });
    }

    const user = db.findBy('users', u =>
      u.email.toLowerCase() === userInput || (u.mobile && u.mobile === userInput)
    );

    if (user && verify(pass, user.pass)) {
      if (limiter && typeof limiter.reset === 'function') limiter.reset(req);
      const sid = sessions.create(user.id);
      setCookie(req, res, sid);
      return res.json({
        ok: true,
        success: true,
        role: user.role,
        redirect: user.role === 'admin' ? '/admin' : '/member',
        user: publicUser(user)
      });
    }

    res.status(401).json({ ok: false, success: false, error: 'Invalid email or password' });
  },

  register: (req, res) => {
    const { full_name, email, mobile, password } = req.body || {};

    // Validate fields
    if (!full_name || !email || !mobile || !password) {
      return res.status(400).json({ ok: false, error: 'All fields are required' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters' });
    }
    if (!/^[6-9][0-9]{9}$/.test(String(mobile))) {
      return res.status(400).json({ ok: false, error: 'Enter a valid 10-digit Indian mobile number (starts with 6-9)' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return res.status(400).json({ ok: false, error: 'Enter a valid email address' });
    }

    // Check duplicate email
    const existing = db.findBy('users', u => u.email.toLowerCase() === String(email).toLowerCase());
    if (existing) {
      return res.status(409).json({ ok: false, error: 'An account with this email already exists' });
    }

    // Create user (no active plan)
    const user = db.create('users', {
      full_name: String(full_name).trim(),
      email: String(email).toLowerCase().trim(),
      mobile: String(mobile).trim(),
      pass: hash(String(password)),
      role: 'member',
      active_plan_id: null,
      subscription_start: null,
      subscription_end: null,
      isActive: true
    });

    // Auto-login
    const sid = sessions.create(user.id);
    const { pass, ...safeUser } = user;
    const { setCookie: sc } = require('../middleware/auth');
    sc(req, res, sid);

    return res.status(201).json({
      ok: true,
      success: true,
      message: 'Account created successfully',
      user: safeUser,
      role: 'member',
      redirect: '/member'
    });
  },

  logout: (req, res) => {
    const sid = req.headers.cookie?.match(/lg_sid=([^;]+)/)?.[1];
    if (sid) sessions.destroy(decodeURIComponent(sid));
    clearCookie(res);
    res.json({ ok: true });
  },

  me: (req, res) => {
    res.json({ ok: true, user: publicUser(req.user) });
  },

  changePassword: (req, res) => {
    const { oldPass, newPass } = req.body || {};
    if (!verify(oldPass || '', req.user.pass)) {
      return res.status(400).json({ ok: false, error: 'Current password incorrect' });
    }
    if (String(newPass || '').length < 8) {
      return res.status(400).json({ ok: false, error: 'New password must be at least 8 characters' });
    }
    db.update('users', req.user.id, { pass: hash(String(newPass)) });
    res.json({ ok: true, message: 'Password updated successfully' });
  }
};
