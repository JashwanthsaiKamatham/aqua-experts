/** /api/auth — email + password with bcrypt hashing and JWT sessions. */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../supabase.js';
import { signToken, requireAuth } from '../auth.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const publicUser = (row) => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name || '',
  createdAt: row.created_at
});

router.post('/signup', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const fullName = String(req.body?.fullName || '').trim().slice(0, 80);

    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    if (password.length > 100) return res.status(400).json({ error: 'Password is too long.' });

    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .limit(1);
    if (existing?.length) return res.status(409).json({ error: 'This email is already registered. Try logging in.' });

    const passwordHash = await bcrypt.hash(password, 10);

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert({ email, full_name: fullName, password_hash: passwordHash })
      .select('id, email, full_name, created_at')
      .single();

    if (error) {
      if (error.code === '23505' || /duplicate key/i.test(error.message)) {
        return res.status(409).json({ error: 'This email is already registered. Try logging in.' });
      }
      if (error.code === '42P01') {
        return res.status(503).json({ error: 'Database tables are not created yet. Run npm run db:setup.' });
      }
      throw error;
    }

    return res.status(201).json({ token: signToken(data), user: publicUser(data) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!EMAIL_RE.test(email) || !password) {
      return res.status(400).json({ error: 'Enter your email and password.' });
    }

    const { data: rows, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, created_at, password_hash')
      .eq('email', email)
      .limit(1);

    if (error) throw error;
    const data = rows?.[0];

    // Constant-ish response regardless of which part failed.
    if (!data?.password_hash) return res.status(401).json({ error: 'Incorrect email or password.' });

    const okPw = await bcrypt.compare(password, data.password_hash);
    if (!okPw) return res.status(401).json({ error: 'Incorrect email or password.' });

    return res.json({ token: signToken(data), user: publicUser(data) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, created_at')
      .eq('id', req.user.id)
      .limit(1);
    if (error) throw error;
    if (!data?.length) return res.status(401).json({ error: 'Session no longer valid. Please sign in again.' });
    return res.json({ user: publicUser(data[0]) });
  } catch (err) {
    next(err);
  }
});

router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const fullName = String(req.body?.fullName ?? '').trim().slice(0, 80);
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', req.user.id)
      .select('id, email, full_name, created_at')
      .single();
    if (error) throw error;
    return res.json({ user: publicUser(data) });
  } catch (err) {
    next(err);
  }
});

// JWT sessions are stateless — logging out simply drops the token on the client.
router.post('/logout', (_req, res) => res.json({ ok: true }));

export default router;
