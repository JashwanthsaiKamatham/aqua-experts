/**
 * /api/items — full CRUD scoped to the signed-in user.
 * Ownership is enforced here on the server with the service_role client,
 * and again at the database level by RLS policies (see db/schema.sql).
 */
import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth } from '../auth.js';

const router = Router();
const FIELDS = 'id, user_id, title, description, ai_summary, status, created_at, updated_at';

const clean = (v, max) => String(v ?? '').replace(/\s+$/g, '').slice(0, max);

router.use(requireAuth);

// LIST -------------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('items')
      .select(FIELDS)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ items: data ?? [] });
  } catch (e) {
    next(e);
  }
});

// CREATE -----------------------------------------------------------
router.post('/', async (req, res, next) => {
  try {
    const title = clean(req.body?.title, 120);
    const description = clean(req.body?.description, 4000);
    if (!title) return res.status(400).json({ error: 'A title is required.' });

    const { data, error } = await supabaseAdmin
      .from('items')
      .insert({ user_id: req.user.id, title, description })
      .select(FIELDS)
      .single();
    if (error) throw error;
    res.status(201).json({ item: data });
  } catch (e) {
    next(e);
  }
});

// READ ONE ---------------------------------------------------------
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('items')
      .select(FIELDS)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .limit(1);
    if (error) throw error;
    if (!data?.length) return res.status(404).json({ error: 'Request not found.' });
    res.json({ item: data[0] });
  } catch (e) {
    next(e);
  }
});

// UPDATE -----------------------------------------------------------
router.patch('/:id', async (req, res, next) => {
  try {
    const patch = {};
    if (req.body?.title !== undefined) {
      const title = clean(req.body.title, 120);
      if (!title) return res.status(400).json({ error: 'Title cannot be empty.' });
      patch.title = title;
    }
    if (req.body?.description !== undefined) patch.description = clean(req.body.description, 4000);
    if (req.body?.ai_summary !== undefined) patch.ai_summary = clean(req.body.ai_summary, 6000);
    if (req.body?.status !== undefined) patch.status = clean(req.body.status, 30) || 'open';
    if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nothing to update.' });

    const { data, error } = await supabaseAdmin
      .from('items')
      .update(patch)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select(FIELDS);
    if (error) throw error;
    if (!data?.length) return res.status(404).json({ error: 'Request not found.' });
    res.json({ item: data[0] });
  } catch (e) {
    next(e);
  }
});

// DELETE -----------------------------------------------------------
router.delete('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('items')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('id');
    if (error) throw error;
    if (!data?.length) return res.status(404).json({ error: 'Request not found.' });
    res.json({ ok: true, id: data[0].id });
  } catch (e) {
    next(e);
  }
});

export default router;
