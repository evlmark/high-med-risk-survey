const crypto = require('crypto');

const COOKIE_NAME = 'admin_session';
const MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

function getSecret() {
  // Stateless signed cookie survives redeploys. Prefer an explicit secret,
  // fall back to the admin password so a value always exists.
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'change-me-insecure-default';
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

// Token format: "<expiryMs>.<hmac>"
function createToken() {
  const expiry = String(Date.now() + MAX_AGE_MS);
  return expiry + '.' + sign(expiry);
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  const dot = token.lastIndexOf('.');
  if (dot < 0) return false;
  const expiry = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = sign(expiry);
  // Constant-time compare.
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const expiryMs = parseInt(expiry, 10);
  if (!expiryMs || Date.now() > expiryMs) return false;
  return true;
}

function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  header.split(';').forEach(function (part) {
    const idx = part.indexOf('=');
    if (idx < 0) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  });
  return out;
}

function isSecureRequest(req) {
  // Behind Railway's proxy, the original scheme is in x-forwarded-proto.
  const xf = (req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  return xf === 'https' || req.secure;
}

function setSessionCookie(req, res) {
  const token = createToken();
  const parts = [
    COOKIE_NAME + '=' + encodeURIComponent(token),
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=' + Math.floor(MAX_AGE_MS / 1000),
  ];
  if (isSecureRequest(req)) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', COOKIE_NAME + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
}

function isAuthenticated(req) {
  const cookies = parseCookies(req);
  return verifyToken(cookies[COOKIE_NAME]);
}

function requireAdmin(req, res, next) {
  if (isAuthenticated(req)) return next();
  res.status(401).json({ error: 'unauthorized' });
}

function checkPassword(password) {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected) return false;
  const a = Buffer.from(String(password || ''));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = {
  requireAdmin,
  isAuthenticated,
  setSessionCookie,
  clearSessionCookie,
  checkPassword,
};
