// In-memory sliding window rate limiter
const rateLimit = ({ windowMs = 60000, max = 60, message = 'Too many requests' } = {}) => {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (now - v.start > windowMs) hits.delete(k);
  }, Math.max(30000, windowMs)).unref();

  const limiter = (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'ip';
    const now = Date.now();
    let record = hits.get(ip);
    if (!record || now - record.start > windowMs) {
      record = { count: 1, start: now };
      hits.set(ip, record);
    } else {
      record.count += 1;
    }
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    if (record.count > max) {
      return res.status(429).json({ ok: false, error: message });
    }
    next();
  };
  limiter.reset = req => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'ip';
    hits.delete(ip);
  };
  return limiter;
};

module.exports = { rateLimit };
