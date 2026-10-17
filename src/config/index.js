const path = require('path');

module.exports = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  trustProxy: Boolean(process.env.TRUST_PROXY),
  dataDir: process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data'),
  publicDir: path.join(__dirname, '..', '..', 'public'),
  sessionCookie: 'lg_sid',
  sessionTtlMs: 7 * 24 * 3600 * 1000, // 7 days
};
