/**
 * MY ACCOUNT — full CRUD on the user's own service requests (Supabase),
 * their bookings, AI summaries, and profile settings.
 */
import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { CONFIG, inr } from '../lib/config.js';
import { BrandMark } from './Nav.jsx';

const TABS = [
  { id: 'requests', label: 'My requests' },
  { id: 'bookings', label: 'My bookings' },
  { id: 'profile', label: 'Profile' }
];

const TEMPLATES = [
  'Filter replacement for Aqua Shield',
  'AMC renewal enquiry',
  'Purifier leaking from the base',
  'Installation at new address'
];

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 rounded-2xl bg-slate-200/70" />
      ))}
    </div>
  );
}

export default function Dashboard({ onBack, onToast, onBook }) {
  const { user, logout, updateProfile } = useAuth();
  const [tab, setTab] = useState('requests');
  const [items, setItems] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const [draft, setDraft] = useState({ title: '', description: '' });
  const [editing, setEditing] = useState(null); // {id, title, description}
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState(user?.fullName || '');

  const loadItems = useCallback(async () => {
    try {
      const res = await api.listItems();
      setItems(res.items || []);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const loadBookings = useCallback(async () => {
    try {
      const res = await api.myBookings();
      setBookings(res.bookings || []);
    } catch (e) {
      /* bookings are optional — do not block the page */
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      await Promise.all([loadItems(), loadBookings()]);
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [loadItems, loadBookings]);

  /* ── CRUD ── */
  const create = async (e) => {
    e.preventDefault();
    if (draft.title.trim().length < 3) {
      setError('Give your request a short title (at least 3 characters).');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const { item } = await api.createItem({
        title: draft.title.trim(),
        description: draft.description.trim()
      });
      setItems((list) => [item, ...list]);
      setDraft({ title: '', description: '' });
      onToast?.('Request created and saved to your account.', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setBusyId(editing.id);
    try {
      const { item } = await api.updateItem(editing.id, {
        title: editing.title.trim(),
        description: editing.description.trim()
      });
      setItems((list) => list.map((it) => (it.id === item.id ? item : it)));
      setEditing(null);
      onToast?.('Request updated.', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this request? This cannot be undone.')) return;
    setBusyId(id);
    try {
      await api.deleteItem(id);
      setItems((list) => list.filter((it) => it.id !== id));
      onToast?.('Request deleted.', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const summarise = async (item) => {
    setBusyId(item.id);
    setError('');
    try {
      const res = await api.aiGenerate({
        mode: 'item-summary',
        itemId: item.id,
        prompt: `Summarise this service request for the technician: ${item.title}. ${item.description || ''}`
      });
      setItems((list) =>
        list.map((it) => (it.id === item.id ? { ...it, ai_summary: res.item?.ai_summary || res.text } : it))
      );
      onToast?.('AI summary added to your request.', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusyId('profile');
    try {
      await updateProfile(name.trim());
      onToast?.('Profile saved.', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="relative z-10 min-h-screen bg-ink-900/60 pb-24 pt-24 backdrop-blur-[2px]">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={onBack} className="btn-ghost !px-2 !text-slate-400 hover:!text-white">
            ← Back to the film
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onBook} className="btn-outline !px-4 !py-2 text-[12.5px]">
              Book a service
            </button>
            <button onClick={logout} className="btn-ghost !px-3 !py-2 text-[12.5px] !text-slate-400">
              Sign out
            </button>
          </div>
        </div>

        <header className="mt-6 flex items-center gap-3">
          <BrandMark className="h-11 w-11" />
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Namaskara, {(user?.fullName || user?.email || 'friend').split(' ')[0]}
            </h1>
            <p className="text-[12.5px] text-slate-400">{user?.email}</p>
          </div>
        </header>

        <div className="mt-6 flex gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/5 p-1 scrollbar-none">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={`shrink-0 rounded-full px-4 py-2 text-[12.5px] font-semibold transition ${
                tab === t.id ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
            >
              {t.label}
              {t.id === 'requests' && items.length > 0 && (
                <span className="ml-1.5 text-[10px] opacity-60">{items.length}</span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-[12.5px] text-rose-200">
            {error}
          </p>
        )}

        {/* ── REQUESTS (CRUD) ── */}
        {tab === 'requests' && (
          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <form onSubmit={create} className="glass h-fit p-5">
              <h2 className="font-display text-[15px] font-semibold text-slate-900">New request</h2>
              <p className="mt-1 text-[11.5px] text-slate-500">
                Saved to your account in Supabase — visible on every device.
              </p>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="label" htmlFor="it-title">
                    Title
                  </label>
                  <input
                    id="it-title"
                    className="field"
                    placeholder="Filter replacement for Aqua Shield"
                    maxLength={120}
                    value={draft.title}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="it-desc">
                    Details
                  </label>
                  <textarea
                    id="it-desc"
                    className="field min-h-[92px] resize-y"
                    placeholder="Model, TDS reading, what is happening…"
                    maxLength={4000}
                    value={draft.description}
                    onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATES.map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setDraft((d) => ({ ...d, title: t }))}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10.5px] text-slate-600 transition hover:border-aqua-400 hover:text-aqua-700"
                    >
                      + {t}
                    </button>
                  ))}
                </div>
                <button type="submit" disabled={creating} className="btn-primary w-full">
                  {creating ? 'Saving…' : 'Add request'}
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {loading ? (
                <Skeleton />
              ) : items.length === 0 ? (
                <div className="glass p-8 text-center">
                  <p className="text-[13.5px] font-medium text-slate-800">No requests yet</p>
                  <p className="mt-1 text-[12px] text-slate-500">
                    Add your first request — or book a service from the main page.
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <article key={item.id} className="glass p-5">
                    {editing?.id === item.id ? (
                      <form onSubmit={saveEdit} className="space-y-3">
                        <input
                          className="field"
                          value={editing.title}
                          onChange={(e) => setEditing((s) => ({ ...s, title: e.target.value }))}
                          maxLength={120}
                        />
                        <textarea
                          className="field min-h-[80px]"
                          value={editing.description}
                          onChange={(e) => setEditing((s) => ({ ...s, description: e.target.value }))}
                          maxLength={4000}
                        />
                        <div className="flex gap-2">
                          <button type="submit" disabled={busyId === item.id} className="btn-light !px-4 !py-2 text-[12px]">
                            Save
                          </button>
                          <button type="button" onClick={() => setEditing(null)} className="btn-ghost !py-2 text-[12px]">
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-display text-[14.5px] font-semibold text-slate-900">
                              {item.title}
                            </h3>
                            <p className="mt-0.5 text-[10.5px] uppercase tracking-[0.12em] text-slate-400">
                              {new Date(item.created_at).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-aqua-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-aqua-700">
                            {item.status || 'open'}
                          </span>
                        </div>

                        {item.description && (
                          <p className="mt-2 whitespace-pre-line text-[12.5px] leading-relaxed text-slate-600">
                            {item.description}
                          </p>
                        )}

                        {item.ai_summary && (
                          <div className="mt-3 rounded-xl border border-aqua-200 bg-aqua-50/70 p-3">
                            <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-aqua-700">
                              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                                <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8z" />
                              </svg>
                              Aqua Assist summary
                            </p>
                            <p className="whitespace-pre-line text-[12px] leading-relaxed text-slate-700">
                              {item.ai_summary}
                            </p>
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <button
                            onClick={() => summarise(item)}
                            disabled={busyId === item.id}
                            className="rounded-full border border-aqua-300 bg-aqua-50 px-3 py-1.5 text-[11px] font-semibold text-aqua-800 transition hover:bg-aqua-100 disabled:opacity-60"
                          >
                            {busyId === item.id ? 'Thinking…' : item.ai_summary ? 'Re-summarise ✨' : 'AI summary ✨'}
                          </button>
                          <button
                            onClick={() =>
                              setEditing({ id: item.id, title: item.title, description: item.description || '' })
                            }
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-slate-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => remove(item.id)}
                            disabled={busyId === item.id}
                            className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </article>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── BOOKINGS ── */}
        {tab === 'bookings' && (
          <div className="mt-6 space-y-3">
            {loading ? (
              <Skeleton />
            ) : bookings.length === 0 ? (
              <div className="glass p-8 text-center">
                <p className="text-[13.5px] font-medium text-slate-800">No bookings on this account yet</p>
                <p className="mt-1 text-[12px] text-slate-500">
                  Bookings made while signed in appear here automatically.
                </p>
                <button onClick={onBook} className="btn-light mt-4 !py-2 text-[12.5px]">
                  Book a service
                </button>
              </div>
            ) : (
              bookings.map((b) => (
                <article key={b.id} className="glass flex flex-wrap items-start justify-between gap-3 p-5">
                  <div>
                    <h3 className="font-display text-[14px] font-semibold text-slate-900">{b.issue}</h3>
                    <p className="mt-0.5 text-[12px] text-slate-600">
                      {b.brand || 'Purifier'} · {b.preferred_date || '—'} · {b.preferred_time || '—'}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">{b.address}</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                      {b.status}
                    </span>
                    <p className="mt-1.5 text-[10.5px] text-slate-400">
                      #{String(b.id).slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {/* ── PROFILE ── */}
        {tab === 'profile' && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <form onSubmit={saveProfile} className="glass p-6">
              <h2 className="font-display text-[15px] font-semibold text-slate-900">Profile</h2>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="label" htmlFor="pf-name">
                    Full name
                  </label>
                  <input id="pf-name" className="field" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="field bg-slate-50 text-slate-500" value={user?.email || ''} readOnly />
                </div>
                <button type="submit" disabled={busyId === 'profile'} className="btn-light w-full">
                  {busyId === 'profile' ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>

            <div className="glass p-6">
              <h2 className="font-display text-[15px] font-semibold text-slate-900">Need a hand?</h2>
              <p className="mt-1 text-[12px] text-slate-600">
                Our service desk answers {CONFIG.contact.hours}.
              </p>
              <div className="mt-4 space-y-2 text-[12.5px]">
                <a
                  href={`tel:${CONFIG.contact.phoneRaw}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 hover:border-aqua-400"
                >
                  <span className="text-slate-600">Call</span>
                  <span className="font-semibold text-slate-900">{CONFIG.contact.phone}</span>
                </a>
                <a
                  href={`mailto:${CONFIG.contact.email}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 hover:border-aqua-400"
                >
                  <span className="text-slate-600">Email</span>
                  <span className="font-semibold text-slate-900">{CONFIG.contact.email}</span>
                </a>
                <div className="rounded-xl border border-aqua-200 bg-aqua-50 px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-aqua-700">Purifiers from</p>
                  <p className="font-display text-lg font-bold text-slate-900">{inr(7499)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
