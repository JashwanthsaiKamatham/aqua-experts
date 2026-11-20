/** Sign in / create account — email + password, validated, accessible modal. */
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useScrollLock } from '../lib/hooks.js';
import { BrandMark } from './Nav.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function AuthModal({ mode: initialMode = 'login', onClose, onSuccess }) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const firstField = useRef(null);
  const cardRef = useRef(null);

  useScrollLock(true);

  useEffect(() => {
    firstField.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const nodes = cardRef.current?.querySelectorAll('button, input, a[href]');
        if (!nodes?.length) return;
        const list = Array.from(nodes).filter((n) => !n.disabled);
        const first = list[0];
        const last = list[list.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
    setServerError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (mode === 'signup' && form.fullName.trim().length < 2) next.fullName = 'Tell us your name.';
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (form.password.length < 8) next.password = 'Use at least 8 characters.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setServerError('');
    try {
      const user =
        mode === 'login'
          ? await login(form.email.trim().toLowerCase(), form.password)
          : await signup({
              email: form.email.trim().toLowerCase(),
              password: form.password,
              fullName: form.fullName.trim()
            });
      onSuccess?.(user);
      onClose();
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="presentation">
      <div
        className="absolute inset-0 bg-ink-900/80 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="glass relative w-full max-w-md p-7 sm:p-8"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-800"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="mb-6 flex items-center gap-3">
          <BrandMark className="h-10 w-10" />
          <div>
            <h2 id="auth-title" className="font-display text-[17px] font-bold text-slate-900">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-[12px] text-slate-500">
              {mode === 'login' ? 'Sign in to track your requests' : 'One account for bookings & AMC'}
            </p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1">
          {['login', 'signup'].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setErrors({});
                setServerError('');
              }}
              className={`rounded-full py-2 text-[12.5px] font-semibold transition ${
                mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
              aria-pressed={mode === m}
            >
              {m === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} noValidate className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="label" htmlFor="au-name">
                Full name
              </label>
              <input
                id="au-name"
                ref={firstField}
                className="field"
                value={form.fullName}
                onChange={set('fullName')}
                autoComplete="name"
                placeholder="Ramesh Kumar"
                aria-invalid={Boolean(errors.fullName)}
              />
              {errors.fullName && <p className="mt-1.5 text-[11.5px] text-rose-600">{errors.fullName}</p>}
            </div>
          )}

          <div>
            <label className="label" htmlFor="au-email">
              Email
            </label>
            <input
              id="au-email"
              ref={mode === 'login' ? firstField : undefined}
              type="email"
              className="field"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && <p className="mt-1.5 text-[11.5px] text-rose-600">{errors.email}</p>}
          </div>

          <div>
            <label className="label" htmlFor="au-pass">
              Password
            </label>
            <div className="relative">
              <input
                id="au-pass"
                type={showPass ? 'text' : 'password'}
                className="field pr-16"
                value={form.password}
                onChange={set('password')}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="At least 8 characters"
                aria-invalid={Boolean(errors.password)}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-900/5"
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 text-[11.5px] text-rose-600">{errors.password}</p>}
          </div>

          {serverError && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
              {serverError}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-light w-full">
            {busy ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Please wait…
              </>
            ) : mode === 'login' ? (
              'Sign in'
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-slate-500">
          Your password is hashed with bcrypt and your session is a signed token — never your password.
        </p>
      </div>
    </div>
  );
}
