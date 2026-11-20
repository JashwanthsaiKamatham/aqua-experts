/**
 * /api/ai/generate — the ONLY door to Gemini.
 * Frontend → this route → Google. The key never leaves the server.
 *
 * body: { mode?: 'assistant'|'summarize'|'recommend'|'item-summary',
 *         prompt: string, history?: [{role:'user'|'model', text:string}],
 *         itemId?: string }
 */
import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { optionalAuth, requireAuth } from '../auth.js';
import { generateText, AQUA_SYSTEM_PROMPT, isGeminiConfigured } from '../gemini.js';

const router = Router();

const MODES = new Set(['assistant', 'summarize', 'recommend', 'item-summary']);

const MODE_INSTRUCTIONS = {
  assistant:
    'Answer the customer question helpfully in under 120 words. Offer one clear next step.',
  summarize:
    'Rewrite the customer’s water problem as a crisp service ticket: a one-line summary, likely cause, and the recommended AQUA-EXPERTS service with an indicative price in ₹.',
  recommend:
    'Recommend exactly ONE purifier model from the lineup (₹7,499 Aqua Pure RO · ₹8,999 Aqua Pure RO+UV · ₹10,499 Aqua Shield RO+UV+UF · ₹11,999 Aqua Elite RO+UV+UF+TDS) and give 3 short reasons. Mention the price in ₹.',
  'item-summary':
    'Write a short 2–3 sentence summary of this service request for the technician, then one line of next action.'
};

router.get('/status', (_req, res) => {
  res.json({ configured: isGeminiConfigured(), provider: 'google-gemini' });
});

router.post('/generate', optionalAuth, async (req, res, next) => {
  try {
    const prompt = String(req.body?.prompt || '').trim().slice(0, 4000);
    const mode = MODES.has(String(req.body?.mode)) ? String(req.body.mode) : 'assistant';
    const itemId = req.body?.itemId ? String(req.body.itemId) : null;
    const history = Array.isArray(req.body?.history) ? req.body.history.slice(-6) : [];

    if (!prompt) return res.status(400).json({ error: 'Tell me what you need help with.' });
    if (mode === 'item-summary' && !itemId) {
      return res.status(400).json({ error: 'itemId is required for item-summary mode.' });
    }
    if (mode === 'item-summary' && !req.user) {
      return res.status(401).json({ error: 'Please sign in to summarise a request.' });
    }

    // Ownership check before we ever touch the AI for a stored item.
    let item = null;
    if (mode === 'item-summary') {
      const { data, error } = await supabaseAdmin
        .from('items')
        .select('id, title, description')
        .eq('id', itemId)
        .eq('user_id', req.user.id)
        .limit(1);
      if (error) throw error;
      if (!data?.length) return res.status(404).json({ error: 'Request not found.' });
      item = data[0];
    }

    const transcript = history
      .filter((m) => m && (m.role === 'user' || m.role === 'model') && m.text)
      .map((m) => `${m.role === 'user' ? 'Customer' : 'Aqua Assist'}: ${String(m.text).slice(0, 800)}`)
      .join('\n');

    const composed = [
      `TASK: ${MODE_INSTRUCTIONS[mode]}`,
      item ? `SERVICE REQUEST\nTitle: ${item.title}\nDescription: ${item.description || '(empty)'}` : '',
      transcript ? `CONVERSATION SO FAR\n${transcript}` : '',
      `CUSTOMER MESSAGE:\n${prompt}`
    ]
      .filter(Boolean)
      .join('\n\n');

    const { text, model } = await generateText(composed, {
      system: AQUA_SYSTEM_PROMPT,
      temperature: mode === 'summarize' || mode === 'item-summary' ? 0.4 : 0.75,
      maxTokens: 900
    });

    // Persist the summary so it survives a refresh.
    if (mode === 'item-summary' && item) {
      const { data: updated, error } = await supabaseAdmin
        .from('items')
        .update({ ai_summary: text.slice(0, 6000) })
        .eq('id', item.id)
        .eq('user_id', req.user.id)
        .select('id, ai_summary');
      if (error) throw error;
      return res.json({ text, model, item: updated?.[0] || null });
    }

    res.json({ text, model });
  } catch (e) {
    next(e);
  }
});

export default router;
