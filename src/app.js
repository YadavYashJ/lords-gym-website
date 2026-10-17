const express = require('express');
const config = require('./config');
const security = require('./middleware/security');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');
const sessions = require('./services/session.service');
const db = require('./db');
const { cookies } = require('./middleware/auth');

const app = express();
app.disable('x-powered-by');

if (config.trustProxy) app.set('trust proxy', 1);

app.use(security);
app.use(express.json({ limit: '100kb' }));

// API Router
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
}, routes);

// ── Server-Level Page Guards for Protected HTML Routes ─────────────────────────
app.get(['/admin', '/admin.html'], (req, res, next) => {
  const sid = cookies(req)[config.sessionCookie];
  const sess = sessions.get(sid);
  const user = sess ? db.find('users', sess.userId) : null;
  if (!user || user.role !== 'admin' || user.isActive === false) {
    return res.redirect('/login');
  }
  next();
});

app.get(['/member', '/member.html'], (req, res, next) => {
  const sid = cookies(req)[config.sessionCookie];
  const sess = sessions.get(sid);
  const user = sess ? db.find('users', sess.userId) : null;
  if (!user || user.isActive === false) {
    return res.redirect('/login');
  }
  // Admin / Owner always belongs in the Admin Command Center
  if (user.role === 'admin') {
    return res.redirect('/admin');
  }
  next();
});

// Static frontend delivery with auto-HTML extension resolution
app.use(express.static(config.publicDir, {
  dotfiles: 'ignore',
  extensions: ['html'],
  setHeaders: (res, path) => {
    if (path.endsWith('admin.html') || path.endsWith('member.html')) {
      res.set('Cache-Control', 'no-store');
    }
  }
}));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
