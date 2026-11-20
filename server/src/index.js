/**
 * AQUA-EXPERTS API — Express entrypoint.
 * All secrets live in server/.env (git-ignored). The client only receives
 * the public Render URL via VITE_API_BASE_URL.
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import itemRoutes from './routes/items.js';
import bookingRoutes from './routes/bookings.js';
import aiRoutes from './routes/ai.js';
import { isSupabaseConfigured } from './supabase.js';
import { isGeminiConfigured } from './gemini.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

/** ── CORS ────────────────────────────────────────────────
 * CLIENT_URL may be a comma separated list. Vercel preview URLs
 * (*.vercel.app) and localhost are always allowed so deploys never break.
 */
const explicitOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .concat((process.env.EXTRA_ORIGINS || '').split(','))
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const ALLOW_ANY = explicitOrigins.includes('*') || process.env.CORS_ALLOW_ALL === 'true';

function originAllowed(origin) {
  if (!origin) return true; // curl / server-to-server / same-origin
  if (ALLOW_ANY) return true;
  const clean = origin.replace(/\/$/, '');
  if (explicitOrigins.includes(clean)) return true;
  if (/^http:\/\/localhost(:\d+)?$/.test(clean)) return true;
  if (/^http:\/\/127\.0\.0\.1(:\d+)?$/.test(clean)) return true;
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(clean)) return true;
  if (/^https:\/\/[a-z0-9-]+\.onrender\.com$/i.test(clean)) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  return false;
}

app.use(
  cors({
    origin(origin, cb) {
      if (originAllowed(origin)) return cb(null, true);
      console.warn('[cors] blocked origin:', origin, '| allowed:', explicitOrigins.join(','));
      return cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '1mb' }));

/** Tiny in-memory rate limiter (protects the AI route from abuse). */
function rateLimit({ windowMs = 60_000, max = 30, key = 'rl' } = {}) {
  const hits = new Map();
  return (req, res, next) => {
    const id = `${key}:${req.ip}`;
    const now = Date.now();
    const entry = hits.get(id) || { count: 0, reset: now + windowMs };
    if (now > entry.reset) {
      entry.count = 0;
      entry.reset = now + windowMs;
    }
    entry.count += 1;
    hits.set(id, entry);
    if (hits.size > 5000) hits.clear();
    if (entry.count > max) {
      return res.status(429).json({ error: 'Too many requests. Please slow down a little.' });
    }
    next();
  };
}
app.use(rateLimit({ key: 'api', max: 300 }));

const startedAt = Date.now();

app.get('/', (_req, res) => {
  res.json({ service: 'AQUA-EXPERTS API', status: 'ok', docs: '/api/health' });
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'aqua-experts-api',
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    database: isSupabaseConfigured ? 'configured' : 'missing-keys',
    ai: isGeminiConfigured ? 'configured' : 'missing-key',
    time: new Date().toISOString()
  });
});

app.use('/api/auth', rateLimit({ key: 'auth', max: 40 }), authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/ai', rateLimit({ key: 'ai', max: 25 }), aiRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint not found.' }));

// Central error handler — never leaks stack traces to the browser.
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error('[error]', err.message, err.cause?.message || '');
  const message =
    status >= 500 && !err.status
      ? 'Something went wrong on our side. Please try again.'
      : err.message || 'Unexpected error.';
  res.status(status).json({ error: message });
});

const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`💧 AQUA-EXPERTS API listening on 0.0.0.0:${PORT}`);
  console.log(`   CORS origins: ${explicitOrigins.join(', ') || '(localhost + *.vercel.app + *.onrender.com)'}`);
  console.log(`   Supabase: ${isSupabaseConfigured ? 'ok' : 'MISSING KEYS'} · Gemini: ${isGeminiConfigured ? 'ok' : 'MISSING KEY'}`);
});

process.on('unhandledRejection', (r) => console.error('[unhandledRejection]', r));
