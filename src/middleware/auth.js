const sessions = require('../services/session.service');
const db = require('../db');
const config = require('../config');

const cookies = req => {
  const h = req.headers.cookie;
  if (!h) return {};
  return Object.fromEntries(
    h.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, decodeURIComponent(v.join('='))];
    })
  );
};

const setCookie = (req, res, sid) => {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.setHeader(
    'Set-Cookie',
    `${config.sessionCookie}=${encodeURIComponent(sid)}; Path=/; HttpOnly; SameSite=Lax${
      secure ? '; Secure' : ''
    }; Max-Age=${Math.floor(config.sessionTtlMs / 1000)}`
  );
};

const clearCookie = res => {
  res.setHeader('Set-Cookie', `${config.sessionCookie}=; Path=/; HttpOnly; Max-Age=0`);
};

const publicUser = u => {
  if (!u) return null;
  const { pass, password_hash, ...safe } = u;
  return safe;
};

const requireAuth = (req, res, next) => {
  const sid = cookies(req)[config.sessionCookie] || req.headers['authorization']?.replace('Bearer ', '');
  const sess = sessions.get(sid);
  if (!sess) return res.status(401).json({ ok: false, error: 'Authentication required' });
  const user = db.find('users', sess.userId);
  if (!user || user.isActive === false) {
    sessions.destroy(sid);
    clearCookie(res);
    return res.status(401).json({ ok: false, error: 'User account disabled or not found' });
  }
  req.user = user;
  req.session = sess;
  next();
};

const requireRole = role => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ ok: false, error: `Forbidden: requires ${role} privileges` });
  }
  next();
};

module.exports = {
  cookies,
  setCookie,
  clearCookie,
  publicUser,
  requireAuth,
  requireRole,
};
