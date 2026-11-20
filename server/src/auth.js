/** JWT auth helpers + ownership guard. */
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'insecure-dev-secret-change-me';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.full_name || '' },
    SECRET,
    { expiresIn: EXPIRES_IN }
  );
}

export function readToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(header.slice(7).trim(), SECRET);
  } catch {
    return null;
  }
}

/** Blocks the request unless a valid Bearer token is present. */
export function requireAuth(req, res, next) {
  const payload = readToken(req);
  if (!payload?.sub) {
    return res.status(401).json({ error: 'Please sign in to continue.' });
  }
  req.user = { id: payload.sub, email: payload.email, name: payload.name };
  next();
}

/** Attaches req.user when a token exists, but never blocks. */
export function optionalAuth(req, _res, next) {
  const payload = readToken(req);
  if (payload?.sub) req.user = { id: payload.sub, email: payload.email, name: payload.name };
  next();
}
