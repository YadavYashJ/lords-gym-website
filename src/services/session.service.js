const fs = require('fs');
const path = require('path');
const config = require('../config');
const { randomToken } = require('../utils/hash');

fs.mkdirSync(config.dataDir, { recursive: true });
const SESSION_FILE = path.join(config.dataDir, 'sessions.json');

let store = {};
try {
  if (fs.existsSync(SESSION_FILE)) {
    store = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
  }
} catch (e) {
  store = {};
}

const persist = () => {
  try {
    fs.writeFileSync(SESSION_FILE, JSON.stringify(store, null, 2));
  } catch (e) {
    // ignore
  }
};

const purge = () => {
  const now = Date.now();
  let changed = false;
  for (const [sid, sess] of Object.entries(store)) {
    if (sess.expiresAt < now) {
      delete store[sid];
      changed = true;
    }
  }
  if (changed) persist();
};
setInterval(purge, 300000).unref();

module.exports = {
  create(userId) {
    purge();
    const sid = randomToken();
    store[sid] = {
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + config.sessionTtlMs,
    };
    persist();
    return sid;
  },
  get(sid) {
    if (!sid || !store[sid]) return null;
    if (store[sid].expiresAt < Date.now()) {
      delete store[sid];
      persist();
      return null;
    }
    return store[sid];
  },
  destroy(sid) {
    if (sid && store[sid]) {
      delete store[sid];
      persist();
    }
  },
  destroyUser(userId) {
    let changed = false;
    for (const [sid, sess] of Object.entries(store)) {
      if (sess.userId === userId) {
        delete store[sid];
        changed = true;
      }
    }
    if (changed) persist();
  },
};
