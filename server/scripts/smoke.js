/**
 * End-to-end API smoke test — run after deployment (or locally):
 *   API_URL=https://your-api.onrender.com node scripts/smoke.js
 * Creates a throwaway user, exercises auth + CRUD + AI + RLS isolation,
 * then cleans up after itself.
 */
const API = (process.env.API_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const stamp = Date.now();
const email = `qa.${stamp}@aqua-experts.test`;
const password = 'AquaTest123!';
const email2 = `qa.b.${stamp}@aqua-experts.test`;

let pass = 0;
const fail = [];
const ok = (name, cond, extra = '') => {
  if (cond) {
    pass += 1;
    console.log(`  ✓ ${name}`);
  } else {
    fail.push(name);
    console.log(`  ✗ ${name} ${extra}`);
  }
};

async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

(async () => {
  console.log(`\n💧 AQUA-EXPERTS API smoke test → ${API}\n`);

  const health = await call('/api/health');
  ok('health endpoint', health.status === 200 && health.json.ok);
  ok('database configured', health.json.database === 'configured', health.json.database);
  ok('ai configured', health.json.ai === 'configured', health.json.ai);

  // ── auth ──
  const badSignup = await call('/api/auth/signup', { method: 'POST', body: { email: 'nope', password: '123' } });
  ok('signup rejects invalid email', badSignup.status === 400);

  const su = await call('/api/auth/signup', { method: 'POST', body: { email, password, fullName: 'QA Bot' } });
  ok('signup creates user + token', su.status === 201 && Boolean(su.json.token), JSON.stringify(su.json).slice(0, 120));
  const token = su.json.token;

  const dup = await call('/api/auth/signup', { method: 'POST', body: { email, password, fullName: 'QA Bot' } });
  ok('duplicate signup rejected', dup.status === 409);

  const badLogin = await call('/api/auth/login', { method: 'POST', body: { email, password: 'wrong-pass' } });
  ok('wrong password rejected', badLogin.status === 401);

  const li = await call('/api/auth/login', { method: 'POST', body: { email, password } });
  ok('login returns token', li.status === 200 && Boolean(li.json.token));
  ok('login never returns password hash', !JSON.stringify(li.json).includes('password_hash'));

  const me = await call('/api/auth/me', { token });
  ok('GET /me works with token', me.status === 200 && me.json.user.email === email);

  const noAuth = await call('/api/auth/me');
  ok('GET /me blocked without token', noAuth.status === 401);

  // ── CRUD ──
  const empty = await call('/api/items', { token });
  ok('items list starts empty', empty.status === 200 && empty.json.items.length === 0);

  const created = await call('/api/items', {
    method: 'POST',
    token,
    body: { title: 'RO flow is low', description: 'Flow dropped after 8 months, TDS 900 ppm.' }
  });
  ok('create item', created.status === 201 && Boolean(created.json.item?.id));
  const itemId = created.json.item.id;

  const noTitle = await call('/api/items', { method: 'POST', token, body: { title: '' } });
  ok('create validates title', noTitle.status === 400);

  const listed = await call('/api/items', { token });
  ok('item persists in list', listed.status === 200 && listed.json.items.some((i) => i.id === itemId));

  const patched = await call(`/api/items/${itemId}`, {
    method: 'PATCH',
    token,
    body: { title: 'RO flow is very low', status: 'in-progress' }
  });
  ok('update item', patched.status === 200 && patched.json.item.title === 'RO flow is very low');

  // ── RLS / ownership ──
  const su2 = await call('/api/auth/signup', { method: 'POST', body: { email: email2, password, fullName: 'QA B' } });
  const token2 = su2.json.token;
  const foreignRead = await call(`/api/items/${itemId}`, { token: token2 });
  ok('other user cannot read item', foreignRead.status === 404);
  const foreignDelete = await call(`/api/items/${itemId}`, { method: 'DELETE', token: token2 });
  ok('other user cannot delete item', foreignDelete.status === 404);

  // ── AI ──
  const ai = await call('/api/ai/generate', {
    method: 'POST',
    token,
    body: { mode: 'assistant', prompt: 'Which purifier for 1200 ppm borewell water in Bengaluru?' }
  });
  ok('AI generate responds', ai.status === 200 && typeof ai.json.text === 'string' && ai.json.text.length > 20,
    JSON.stringify(ai.json).slice(0, 140));

  const summary = await call('/api/ai/generate', {
    method: 'POST',
    token,
    body: { mode: 'item-summary', itemId, prompt: 'Summarise for the technician' }
  });
  ok('AI item summary saved', summary.status === 200 && Boolean(summary.json.item?.ai_summary));

  const afterAi = await call(`/api/items/${itemId}`, { token });
  ok('ai_summary survives a refresh', Boolean(afterAi.json.item?.ai_summary));

  // ── bookings (public) ──
  const booking = await call('/api/bookings', {
    method: 'POST',
    body: {
      name: 'QA Guest',
      phone: '9845012345',
      address: '12, 3rd Cross, Indiranagar, Bengaluru 560038',
      brand: 'Kent',
      issue: 'Leakage',
      preferredDate: new Date().toISOString().slice(0, 10),
      preferredTime: '2 – 4 PM'
    }
  });
  ok('guest booking accepted', booking.status === 201 && Boolean(booking.json.booking?.id),
    JSON.stringify(booking.json).slice(0, 120));

  const badBooking = await call('/api/bookings', { method: 'POST', body: { name: 'QA', phone: '123', address: 'x' } });
  ok('booking validation works', badBooking.status === 400);

  const mine = await call('/api/bookings/mine', { token });
  ok('my bookings endpoint', mine.status === 200 && Array.isArray(mine.json.bookings));

  // ── cleanup ──
  const del = await call(`/api/items/${itemId}`, { method: 'DELETE', token });
  ok('delete item', del.status === 200);
  const after = await call('/api/items', { token });
  ok('item is gone after delete', after.json.items.every((i) => i.id !== itemId));

  console.log(`\n${fail.length ? '❌' : '✅'}  ${pass} passed, ${fail.length} failed`);
  if (fail.length) {
    console.log('Failed:', fail.join(', '));
    process.exitCode = 1;
  }
  console.log('   (test users stay in Supabase: ' + email + ', ' + email2 + ')\n');
})();
