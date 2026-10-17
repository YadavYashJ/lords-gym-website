const crypto = require('crypto');

const hash = (pw, salt = crypto.randomBytes(16).toString('hex')) =>
  salt + ':' + crypto.scryptSync(pw, salt, 64).toString('hex');

const verify = (pw, stored) => {
  const [salt, key] = String(stored || '').split(':');
  if (!salt || !key) return false;
  const a = Buffer.from(key, 'hex');
  const b = crypto.scryptSync(String(pw), salt, 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports = {
  hash,
  verify,
  uid: (prefix = '') => prefix + crypto.randomBytes(4).toString('hex'),
  randomToken: () => crypto.randomBytes(24).toString('hex'),
};
