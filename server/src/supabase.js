/**
 * Supabase admin client (server only).
 * The service_role key NEVER leaves the server. The browser only ever talks
 * to our own Express routes, which enforce ownership on every query.
 */
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing — DB routes will fail until server/.env is filled in.'
  );
}

export const supabaseAdmin = createClient(
  SUPABASE_URL || 'http://127.0.0.1:54321',
  SUPABASE_SERVICE_ROLE_KEY || 'missing-service-role-key',
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Public/anon client — useful for non-privileged reads and for verifying keys.
export const supabaseAnon = createClient(
  SUPABASE_URL || 'http://127.0.0.1:54321',
  SUPABASE_ANON_KEY || 'missing-anon-key',
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
