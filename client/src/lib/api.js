/**
 * Thin fetch wrapper for the AQUA-EXPERTS API.
 * The browser only knows the public API URL — no keys, ever.
 */
const RAW_BASE = import.meta.env.VITE_API_BASE_URL || '';
export const API_BASE = RAW_BASE.replace(/\/$/, '');

const TOKEN_KEY = 'aqua.session.token';

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  },
  set(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* private mode — session stays in memory only */
    }
  }
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, auth = true, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : {};

  if (!res.ok) {
    if (res.status === 401 && auth) tokenStore.set('');
    throw new ApiError(data.error || `Request failed (${res.status}).`, res.status);
  }
  return data;
}

export const api = {
  health: () => request('/api/health', { auth: false }),

  // ── auth ──────────────────────────────────────────────
  signup: (payload) => request('/api/auth/signup', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/api/auth/me'),
  updateProfile: (payload) => request('/api/auth/me', { method: 'PATCH', body: payload }),
  logout: () => request('/api/auth/logout', { method: 'POST', auth: false }).catch(() => ({})),

  // ── items (CRUD) ──────────────────────────────────────
  listItems: () => request('/api/items'),
  createItem: (payload) => request('/api/items', { method: 'POST', body: payload }),
  updateItem: (id, payload) => request(`/api/items/${id}`, { method: 'PATCH', body: payload }),
  deleteItem: (id) => request(`/api/items/${id}`, { method: 'DELETE' }),

  // ── bookings ──────────────────────────────────────────
  createBooking: (payload) => request('/api/bookings', { method: 'POST', body: payload }),
  myBookings: () => request('/api/bookings/mine'),

  // ── AI (server proxies to Gemini) ─────────────────────
  aiGenerate: (payload, signal) => request('/api/ai/generate', { method: 'POST', body: payload, signal }),
  aiStatus: () => request('/api/ai/status', { auth: false })
};

export default api;
