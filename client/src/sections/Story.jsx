/**
 * SCENES 1 – 4 · the narrative half of the page.
 * Each <section data-scene> is measured by the shared scroll timeline so
 * the WebGL camera lands on its shot exactly when the copy appears.
 */
import { CONFIG, inr } from '../lib/config.js';
import { useReveal, useMagnetic } from '../lib/hooks.js';
import { STAGES } from '../three/purifier.js';

/* ══════════════ SCENE 1 · HERO ══════════════ */
export function Hero({ onShop, onBook }) {
  const shopRef = useMagnetic(10);
  const bookRef = useMagnetic(10);

  return (
    <section
      id="top"
      data-scene="hero"
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-24"
      aria-label="AQUA-EXPERTS — pure water, zero worry"
    >
      {/* scrim so copy always reads over the 3D */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_50%,rgba(4,7,15,0.92)_0%,rgba(4,7,15,0.55)_45%,transparent_75%)]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow reveal in mb-5 flex items-center gap-3">
            <span className="h-px w-10 bg-aqua-400/70" />
            {CONFIG.brand.city} · RO · UV · UF · TDS
          </p>

          <h1 className="display">
            <span className="block reveal in reveal-line">
              <span>Pure water.</span>
            </span>
            <span className="block reveal in reveal-line" style={{ transitionDelay: '120ms' }}>
              <span className="bg-gradient-to-r from-aqua-200 via-aqua-400 to-aqua-600 bg-clip-text text-transparent">
                Zero worry.
              </span>
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-slate-300 sm:text-base">
            Water purifiers from <strong className="font-semibold text-white">{inr(7499)}</strong> — engineered
            for Bengaluru water, installed by our own certified technicians, and serviced for life. One film.
            One family. Zero compromise.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button ref={shopRef} onClick={onShop} className="btn-primary magnetic">
              Shop Purifiers
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <button ref={bookRef} onClick={onBook} className="btn-outline magnetic">
              Book a Service
            </button>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6">
            {[
              { k: '12,400+', v: 'Purifiers installed' },
              { k: '90 min', v: 'Service response' },
              { k: '4.8/5', v: 'Customer rating' }
            ].map((s) => (
              <div key={s.v}>
                <dt className="font-display text-lg font-semibold text-white">{s.k}</dt>
                <dd className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-400">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* scroll cue */}
      <div className="absolute inset-x-0 bottom-7 flex flex-col items-center gap-2 text-slate-500">
        <span className="text-[10px] uppercase tracking-[0.4em]">Scroll</span>
        <span className="relative h-10 w-px overflow-hidden bg-white/15">
          <span className="absolute inset-x-0 top-0 h-4 animate-[floaty_2.4s_ease-in-out_infinite] bg-aqua-300" />
        </span>
      </div>
    </section>
  );
}

/* ══════════════ SCENE 2 · THE PROBLEM ══════════════ */
const IMPURITIES = [
  { label: 'TDS & hardness', value: 'up to 2000 ppm', note: 'Scaling on taps, white film on utensils.' },
  { label: 'Lead & heavy metals', value: 'invisible', note: 'Pipes and old overhead tanks leak metals.' },
  { label: 'Bacteria & viruses', value: 'colourless', note: 'Storage tanks breed coliform overnight.' },
  { label: 'Chlorine & odour', value: 'every day', note: 'Municipal dosing leaves a chemical taste.' }
];

export function Problem() {
  const ref = useReveal();
  return (
    <section
      id="problem"
      data-scene="problem"
      className="relative flex min-h-[100svh] items-center py-24"
      aria-labelledby="problem-title"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div ref={ref} className="reveal">
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-rose-400/60" />
              Scene 02 — The Problem
            </p>
            <h2 id="problem-title" className="display">
              What is really
              <br />
              in your water?
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-slate-300">
              It looks clear. It smells fine. And yet every glass carries dissolved salts, metals and microbes
              you cannot see — quietly working against your family's health.
            </p>
            <div className="mt-7 inline-flex items-center gap-3 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-rose-500/20 text-rose-300">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v4M12 17h.01M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                </svg>
              </span>
              <p className="text-[13px] text-rose-100">
                <strong className="font-semibold">73% of Bengaluru homes</strong> test above 500 ppm TDS.
              </p>
            </div>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {IMPURITIES.map((item, i) => (
              <li
                key={item.label}
                className="glass group p-5 transition duration-500 hover:-translate-y-1 hover:shadow-glow"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-display text-[15px] font-semibold text-slate-900">{item.label}</h3>
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-600">
                    {item.value}
                  </span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{item.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ══════════════ SCENE 3 · THE PURIFICATION JOURNEY ══════════════ */
export function Journey({ stage = 0 }) {
  return (
    <section
      id="journey"
      data-scene="journey"
      className="relative min-h-[300vh]"
      aria-labelledby="journey-title"
    >
      <div className="sticky top-0 flex min-h-[100svh] items-center py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="max-w-lg">
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-aqua-400/60" />
              Scene 03 — Inside the machine
            </p>
            <h2 id="journey-title" className="display text-[clamp(1.7rem,4.2vw,3.2rem)]">
              Five stages.
              <br />
              One glass of water.
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-300">
              The camera flies through the purifier as your water does. Watch it turn from murky to
              crystal-clear at every stage.
            </p>

            <ol className="mt-6 space-y-2">
              {STAGES.map((s, i) => {
                const active = i === stage;
                const done = i < stage;
                return (
                  <li
                    key={s.key}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-2 transition-all duration-500 ${
                      active
                        ? 'border-aqua-400/50 bg-aqua-500/10 shadow-[0_0_40px_-14px_rgba(34,211,238,0.8)]'
                        : 'border-white/10 bg-white/[0.03]'
                    }`}
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold transition ${
                        active || done ? 'text-ink-900' : 'text-slate-400'
                      }`}
                      style={{
                        background: active || done ? s.colour : 'rgba(255,255,255,0.06)',
                        boxShadow: active ? `0 0 22px ${s.colour}90` : 'none'
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`font-display text-[13.5px] font-semibold transition ${
                          active ? 'text-white' : 'text-slate-300'
                        }`}
                      >
                        {s.label}
                      </p>
                      <p className="truncate text-[11.5px] text-slate-500">{s.note}</p>
                    </div>
                    {active && (
                      <span className="ml-auto shrink-0 rounded-full bg-aqua-400/15 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-aqua-300">
                        you are here
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          {/* the right column stays empty on desktop so the 3D stays visible */}
          <div className="hidden lg:block" />
        </div>
      </div>
    </section>
  );
}

/* ══════════════ SCENE 4 · PURE WATER ══════════════ */
export function Pure() {
  const ref = useReveal();
  return (
    <section
      id="pure"
      data-scene="pure"
      className="relative flex min-h-[100svh] items-center justify-center py-24 text-center"
      aria-labelledby="pure-title"
    >
      <div ref={ref} className="reveal mx-auto max-w-3xl px-4">
        <p className="eyebrow mb-5">Scene 04 — The Reveal</p>
        <h2 id="pure-title" className="display text-glow">
          100% pure.
          <br />
          <span className="text-aqua-300">Zero worry.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-slate-300">
          Every drop is filtered through sediment, carbon, RO, UV and a mineral cartridge before it reaches
          your glass. Safe for your newborn, your parents, and your morning coffee.
        </p>
        <ul className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
          {['TDS under 50', '10-stage purification', '0 bacteria · 0 viruses', 'Mineral balanced'].map((c) => (
            <li
              key={c}
              className="rounded-full border border-aqua-300/30 bg-white/5 px-4 py-2 text-[12px] font-medium text-aqua-100 backdrop-blur"
            >
              {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
