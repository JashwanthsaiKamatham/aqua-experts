/** /api/bookings — public "Book a Service" form + the user's own history. */
import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { optionalAuth, requireAuth } from '../auth.js';

const router = Router();
const FIELDS =
  'id, user_id, name, phone, address, brand, issue, preferred_date, preferred_time, notes, status, created_at';

router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim().slice(0, 80);
    const phone = String(req.body?.phone || '').replace(/[^\d+]/g, '').slice(0, 15);
    const address = String(req.body?.address || '').trim().slice(0, 300);
    const brand = String(req.body?.brand || '').trim().slice(0, 60);
    const issue = String(req.body?.issue || '').trim().slice(0, 60);
    const date = String(req.body?.preferredDate || '').trim().slice(0, 20);
    const time = String(req.body?.preferredTime || '').trim().slice(0, 20);
    const notes = String(req.body?.notes || '').trim().slice(0, 500);

    if (name.length < 2) return res.status(400).json({ error: 'Please enter your name.' });
    const localPhone = phone.replace(/^\+?91/, '').replace(/^0/, '');
    if (!/^[6-9]\d{9}$/.test(localPhone)) {
      return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number.' });
    }
    if (address.length < 8) return res.status(400).json({ error: 'Please enter your full address.' });
    if (!issue) return res.status(400).json({ error: 'Please choose the service you need.' });
    if (!date) return res.status(400).json({ error: 'Please choose a preferred date.' });

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        user_id: req.user?.id ?? null,
        name,
        phone,
        address,
        brand: brand || null,
        issue,
        preferred_date: date || null,
        preferred_time: time || null,
        notes: notes || null
      })
      .select(FIELDS)
      .single();
    if (error) throw error;
    res.status(201).json({ booking: data });
  } catch (e) {
    next(e);
  }
});

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select(FIELDS)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ bookings: data ?? [] });
  } catch (e) {
    next(e);
  }
});

export default router;
