/** SCENE 8 · TRUST — animated counters, badges, testimonial carousel. */
import { useCallback, useEffect, useState } from 'react';
import { CONFIG } from '../lib/config.js';
import { useCounter, useReveal } from '../lib/hooks.js';

function Counter({ value, suffix }) {
  const { ref, value: shown } = useCounter(value);
  return (
    <span ref={ref} className="font-display text-[clamp(1.6rem,4vw,2.6rem)] font-bold text-slate-900 tabular-nums">
      {shown.toLocaleString('en-IN')}
      <span className="text-aqua-600">{suffix}</span>
    </span>
  );
}

export default function Trust() {
  const revealRef = useReveal();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const items = CONFIG.trust.testimonials;

  const go = useCallback(
    (dir) => setIndex((i) => (i + dir + items.length) % items.length),
    [items.length]
  );

  useEffect(() => {
    if (paused) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(id);
  }, [paused, items.length]);

  return (
    <section
      id="trust"
      data-scene="trust"
      className="relative min-h-[110svh] py-24"
      aria-labelledby="trust-title"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={revealRef} className="reveal mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-4">Scene 08 — The Proof</p>
          <h2 id="trust-title" className="display">
            Trusted in
            <br />
            <span className="text-aqua-300">9,800 homes.</span>
          </h2>
        </div>

        {/* counters */}
        <dl className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {CONFIG.trust.counters.map((c) => (
            <div key={c.label} className="glass p-5 text-center transition hover:-translate-y-1 hover:shadow-glow">
              <dd>
                <Counter value={c.value} suffix={c.suffix} />
              </dd>
              <dt className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-slate-500">{c.label}</dt>
            </div>
          ))}
        </dl>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* testimonial carousel */}
          <div
            className="glass-dark relative overflow-hidden p-6 sm:p-8"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
            aria-roledescription="carousel"
            aria-label="Customer testimonials"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-aqua-500/20 blur-3xl" />
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-aqua-400/60" fill="currentColor" aria-hidden="true">
              <path d="M9 7H5a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h2v2H5v2h4a3 3 0 0 0 3-3V10a3 3 0 0 0-3-3zm12 0h-4a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h2v2h-2v2h4a3 3 0 0 0 3-3V10a3 3 0 0 0-3-3z" />
            </svg>

            <blockquote
              className="mt-4 min-h-[104px] text-[15px] leading-relaxed text-slate-100 transition-opacity duration-500"
              aria-live="polite"
            >
              “{items[index].text}”
            </blockquote>

            <footer className="mt-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-aqua-300 to-aqua-600 text-[13px] font-bold text-ink-900">
                  {items[index].name[0]}
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-white">{items[index].name}</p>
                  <p className="text-[11px] text-slate-400">{items[index].area} · Bengaluru</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {items.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    aria-label={`Testimonial ${i + 1}`}
                    aria-current={i === index}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? 'w-6 bg-aqua-300' : 'w-1.5 bg-white/25 hover:bg-white/50'
                    }`}
                  />
                ))}
                <button
                  onClick={() => go(-1)}
                  className="ml-2 grid h-8 w-8 place-items-center rounded-full border border-white/15 text-white transition hover:border-aqua-300/60"
                  aria-label="Previous testimonial"
                >
                  ←
                </button>
                <button
                  onClick={() => go(1)}
                  className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-white transition hover:border-aqua-300/60"
                  aria-label="Next testimonial"
                >
                  →
                </button>
              </div>
            </footer>
          </div>

          {/* badges */}
          <ul className="grid gap-3 sm:grid-cols-2">
            {CONFIG.trust.badges.map((b) => (
              <li key={b.title} className="glass p-4">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <h3 className="font-display text-[13px] font-semibold text-slate-900">{b.title}</h3>
                </div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-600">{b.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
