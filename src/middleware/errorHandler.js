// Centralized async error wrapper and handlers
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const notFound = (req, res) => {
  if (req.accepts('html')) {
    return res.status(404).sendFile('index.html', { root: require('../config').publicDir });
  }
  res.status(404).json({ ok: false, error: 'Endpoint not found' });
};

const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    ok: false,
    error: err.message || 'Internal server error',
  });
};

module.exports = { ah, notFound, errorHandler };
