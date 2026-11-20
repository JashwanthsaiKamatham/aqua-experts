/** Cinematic loading screen: black, light beam, logo reveal, percentage. */
import { useEffect, useState } from 'react';
import { CONFIG } from '../lib/config.js';

export default function Preloader({ onDone }) {
  const [pct, setPct] = useState(0);
  const [out, setOut] = useState(false);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const min = 1500; // keep it short — nobody waits for a spinner in 2026

    const tick = (now) => {
      const k = Math.min(1, (now - start) / min);
      const eased = 1 - Math.pow(1 - k, 2);
      setPct(Math.round(eased * 100));
      if (k < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setOut(true);
        setTimeout(onDone, 700);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[90] flex flex-col items-center justify-center bg-ink-900 transition-opacity duration-700 ${
        out ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      role="status"
      aria-live="polite"
      aria-label="Loading AQUA-EXPERTS"
    >
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-aqua-500/10 blur-[120px]" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-aqua-300/50 to-transparent" />
      </div>

      <div className="relative overflow-hidden px-6 beam-sweep">
        <p className="eyebrow mb-3 text-center">Bengaluru · Since {CONFIG.brand.established}</p>
        <h1 className="font-display text-[clamp(1.9rem,8vw,3.4rem)] font-extrabold tracking-[0.16em] text-white">
          {CONFIG.brand.name}
        </h1>
        <p className="mt-2 text-center text-xs uppercase tracking-[0.5em] text-aqua-300/70">Pure Water</p>
      </div>

      <div className="mt-10 w-56">
        <div className="h-[2px] w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-aqua-300 to-aqua-600 transition-[width] duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-[10px] uppercase tracking-[0.3em] text-slate-500">
          <span>Purifying</span>
          <span className="tabular-nums text-aqua-300">{pct}%</span>
        </div>
      </div>
    </div>
  );
}
