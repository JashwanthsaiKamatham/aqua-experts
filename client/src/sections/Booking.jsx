/**
 * SCENE 7 · BOOK A SERVICE — glassmorphism multi-step form.
 * Validates on every step, posts to /api/bookings, then plays a
 * cinematic water-ripple success burst.
 */
import { useEffect, useMemo, useState } from 'react';
import { CONFIG, waLink } from '../lib/config.js';
import { useReveal } from '../lib/hooks.js';
import { useAuth } from '../lib/auth.jsx';
import api from '../lib/api.js';

const BRANDS = ['AQUA-EXPERTS', 'Kent', 'Aquaguard', 'Pureit', 'Livpure', 'Other / not sure'];
const SLOTS = ['9 – 11 AM', '11 AM – 1 PM', '2 – 4 PM', '4 – 6 PM', '6 – 8 PM'];
const STEPS = ['Your details', 'The problem', 'Schedule'];

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function Booking({ initialIssue, onToast }) {
  const revealRef = useReveal();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [serverError, setServerError] = useState('');
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: user?.fullName || '',
    phone: '',
    address: '',
    brand: 'AQUA-EXPERTS',
    issue: CONFIG.issueOptions[0],
    preferredDate: '',
    preferredTime: SLOTS[0],
    notes: ''
  });

  // a service card can pre-select the issue
  useEffect(() => {
    if (initialIssue) setForm((f) => ({ ...f, issue: initialIssue }));
  }, [initialIssue]);

  useEffect(() => {
    if (user?.fullName) setForm((f) => (f.name ? f : { ...f, name: user.fullName }));
  }, [user]);

  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setServerError('');
  };

  const digits = form.phone.replace(/\D/g, '');
  const phoneOk = digits.length === 10 ? /^[6-9]/.test(digits) : /^91[6-9]\d{9}$/.test(digits);

  const validateStep = (index) => {
    const e = {};
    if (index === 0) {
      if (form.name.trim().length < 2) e.name = 'Please tell us your name.';
      if (!phoneOk) e.phone = 'Enter a valid 10-digit Indian mobile number.';
      if (form.address.trim().length < 8) e.address = 'Add your full address so we reach the right door.';
    }
    if (index === 1) {
      if (!form.issue) e.issue = 'Choose the service you need.';
    }
    if (index === 2) {
      if (!form.preferredDate) e.preferredDate = 'Pick a date.';
      else if (form.preferredDate < todayISO()) e.preferredDate = 'That date has passed — pick today or later.';
      if (!form.preferredTime) e.preferredTime = 'Pick a time slot.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(2, s + 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    for (let i = 0; i < 3; i++) if (!validateStep(i)) return setStep(i);

    setBusy(true);
    try {
      const { booking } = await api.createBooking({
        name: form.name.trim(),
        phone: digits,
        address: form.address.trim(),
        brand: form.brand,
        issue: form.issue,
        preferredDate: form.preferredDate,
        preferredTime: form.preferredTime,
        notes: form.notes.trim()
      });
      setDone(booking);
      onToast?.('Booking received — our technician will call you shortly.', 'success');
    } catch (err) {
      setServerError(err.message || 'Could not save your booking. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setDone(null);
    setStep(0);
    setForm((f) => ({ ...f, issue: CONFIG.issueOptions[0], preferredDate: '', notes: '' }));
  };

  const summary = useMemo(
    () => [form.issue, form.brand, form.preferredDate, form.preferredTime].filter(Boolean).join(' · '),
    [form]
  );

  /* ── success state: cinematic ripple burst ── */
  if (done) {
    return (
      <section
        id="booking"
        data-scene="booking"
        className="relative flex min-h-[120svh] items-center py-24"
        aria-labelledby="booking-title"
      >
        <div className="mx-auto w-full max-w-2xl px-4">
          <div className="glass relative overflow-hidden p-8 text-center sm:p-12">
            {/* ripple burst */}
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="absolute h-40 w-40 rounded-full border-2 border-aqua-400/60 animate-ripple"
                  style={{ animationDelay: `${i * 0.45}s` }}
                />
              ))}
              <span className="absolute h-24 w-24 rounded-full bg-aqua-300/30 blur-2xl animate-pulseGlow" />
            </div>

            <div className="relative">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-aqua-200 to-aqua-500 text-white shadow-glow">
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <h2 id="booking-title" className="display-dark mt-6">
                Booking confirmed
              </h2>
              <p className="mt-2 text-[14px] text-slate-600">
                Thank you, {done.name.split(' ')[0]}. Your request is in — we call to confirm within 15 minutes
                during working hours.
              </p>

              <dl className="mx-auto mt-6 max-w-sm space-y-2 rounded-2xl border border-slate-200 bg-white/80 p-4 text-left text-[12.5px]">
                {[
                  ['Reference', `#${String(done.id).slice(0, 8).toUpperCase()}`],
                  ['Service', done.issue],
                  ['When', `${done.preferred_date || '—'} · ${done.preferred_time || '—'}`],
                  ['Phone', done.phone]
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="font-medium text-slate-900">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <a
                  href={waLink(
                    `Hi ${CONFIG.brand.name}, I just booked a service (ref #${String(done.id)
                      .slice(0, 8)
                      .toUpperCase()}) for ${done.issue}.`
                  )}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn-primary"
                >
                  Message us on WhatsApp
                </a>
                <button onClick={reset} className="btn-ghost !text-slate-600">
                  Book another service
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="booking"
      data-scene="booking"
      className="relative min-h-[130svh] py-24"
      aria-labelledby="booking-title"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div ref={revealRef} className="reveal lg:sticky lg:top-24">
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-aqua-400/60" />
              Scene 07 — The Call
            </p>
            <h2 id="booking-title" className="display">
              Book a
              <br />
              service.
            </h2>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-slate-300">
              Tell us three things and a certified technician is on the way. No call centres, no waiting
              music — a real person replies.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                ['90-minute response inside Bengaluru', 'Mon–Sat, 9 AM – 8 PM'],
                ['Fixed price before work starts', 'You approve, then we begin'],
                ['30-day service warranty', 'Not fixed? We return free']
              ].map(([title, note]) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-aqua-500/15 text-aqua-300">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-[13.5px] font-medium text-white">{title}</p>
                    <p className="text-[12px] text-slate-400">{note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={submit} className="glass p-6 sm:p-8" noValidate>
            {/* stepper */}
            <ol className="mb-6 flex items-center gap-2">
              {STEPS.map((label, i) => {
                const state = i === step ? 'current' : i < step ? 'done' : 'todo';
                return (
                  <li key={label} className="flex flex-1 items-center gap-2">
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold transition ${
                        state === 'current'
                          ? 'bg-slate-900 text-white'
                          : state === 'done'
                            ? 'bg-aqua-400 text-ink-900'
                            : 'bg-slate-200 text-slate-500'
                      }`}
                      aria-hidden="true"
                    >
                      {state === 'done' ? '✓' : i + 1}
                    </span>
                    <span
                      className={`hidden text-[11.5px] font-medium sm:block ${
                        state === 'todo' ? 'text-slate-400' : 'text-slate-700'
                      }`}
                    >
                      {label}
                    </span>
                    {i < STEPS.length - 1 && <span className="h-px flex-1 bg-slate-200" />}
                  </li>
                );
              })}
            </ol>

            {/* ── STEP 1 ── */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="label" htmlFor="bk-name">
                    Full name
                  </label>
                  <input
                    id="bk-name"
                    className="field"
                    placeholder="Ramesh Kumar"
                    autoComplete="name"
                    value={form.name}
                    onChange={set('name')}
                    aria-invalid={Boolean(errors.name)}
                  />
                  {errors.name && <p className="mt-1.5 text-[11.5px] text-rose-600">{errors.name}</p>}
                </div>
                <div>
                  <label className="label" htmlFor="bk-phone">
                    Mobile number
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-[14px] text-slate-500">
                      +91
                    </span>
                    <input
                      id="bk-phone"
                      className="field"
                      placeholder="98450 12345"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={14}
                      value={form.phone}
                      onChange={set('phone')}
                      aria-invalid={Boolean(errors.phone)}
                    />
                  </div>
                  {errors.phone && <p className="mt-1.5 text-[11.5px] text-rose-600">{errors.phone}</p>}
                </div>
                <div>
                  <label className="label" htmlFor="bk-address">
                    Address
                  </label>
                  <textarea
                    id="bk-address"
                    className="field min-h-[86px] resize-y"
                    placeholder="Flat / house no, street, area, landmark, pincode"
                    autoComplete="street-address"
                    value={form.address}
                    onChange={set('address')}
                    aria-invalid={Boolean(errors.address)}
                  />
                  {errors.address && <p className="mt-1.5 text-[11.5px] text-rose-600">{errors.address}</p>}
                </div>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="label" htmlFor="bk-service">
                    What do you need?
                  </label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {CONFIG.issueOptions.map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => {
                          setForm((f) => ({ ...f, issue: opt }));
                          setErrors((e) => ({ ...e, issue: undefined }));
                        }}
                        className={`rounded-xl border px-3 py-2.5 text-left text-[12.5px] font-medium transition ${
                          form.issue === opt
                            ? 'border-aqua-400 bg-aqua-50 text-aqua-800 ring-2 ring-aqua-400/25'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                        aria-pressed={form.issue === opt}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {errors.issue && <p className="mt-1.5 text-[11.5px] text-rose-600">{errors.issue}</p>}
                </div>

                <div>
                  <label className="label" htmlFor="bk-brand">
                    Purifier brand
                  </label>
                  <select id="bk-brand" className="field" value={form.brand} onChange={set('brand')}>
                    {BRANDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label" htmlFor="bk-notes">
                    Anything else? <span className="normal-case text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    id="bk-notes"
                    className="field min-h-[70px] resize-y"
                    placeholder="e.g. RO pump is noisy and water flow dropped last week"
                    maxLength={500}
                    value={form.notes}
                    onChange={set('notes')}
                  />
                </div>
              </div>
            )}

            {/* ── STEP 3 ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="bk-date">
                      Preferred date
                    </label>
                    <input
                      id="bk-date"
                      type="date"
                      className="field"
                      min={todayISO()}
                      value={form.preferredDate}
                      onChange={set('preferredDate')}
                      aria-invalid={Boolean(errors.preferredDate)}
                    />
                    {errors.preferredDate && (
                      <p className="mt-1.5 text-[11.5px] text-rose-600">{errors.preferredDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="label" htmlFor="bk-time">
                      Time slot
                    </label>
                    <select id="bk-time" className="field" value={form.preferredTime} onChange={set('preferredTime')}>
                      {SLOTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {errors.preferredTime && (
                      <p className="mt-1.5 text-[11.5px] text-rose-600">{errors.preferredTime}</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="label !mb-2">Review</p>
                  <p className="text-[13px] font-medium text-slate-900">{form.name || 'Your name'}</p>
                  <p className="text-[12px] text-slate-600">
                    {form.phone ? `+91 ${digits}` : 'Phone'} · {form.address || 'Address'}
                  </p>
                  <p className="mt-2 text-[12px] text-aqua-700">{summary || 'Service details'}</p>
                </div>

                {serverError && (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
                    {serverError}
                  </p>
                )}
              </div>
            )}

            {/* nav buttons */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={back}
                disabled={step === 0}
                className="btn-ghost !px-3 !text-slate-500"
              >
                ← Back
              </button>
              {step < 2 ? (
                <button type="button" onClick={next} className="btn-light">
                  Continue →
                </button>
              ) : (
                <button type="submit" disabled={busy} className="btn-primary">
                  {busy ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-900/30 border-t-ink-900" />
                      Sending…
                    </>
                  ) : (
                    'Confirm booking'
                  )}
                </button>
              )}
            </div>
            <p className="mt-3 text-center text-[10.5px] text-slate-400">
              By booking you agree to be contacted on WhatsApp or phone about this request.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
