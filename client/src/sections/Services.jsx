/** SCENE 6 · SERVICES — floating glass cards with animated icons. */
import { CONFIG, inr } from '../lib/config.js';
import { useReveal } from '../lib/hooks.js';

const ICONS = {
  install: (
    <g>
      <path d="M12 3v10" className="origin-center animate-[floaty_3s_ease-in-out_infinite]" />
      <path d="m8 9 4 4 4-4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </g>
  ),
  repair: (
    <g>
      <path d="m14.5 5.5 4 4" className="animate-[pulseGlow_2.6s_ease-in-out_infinite]" />
      <path d="M17.5 2.5a5 5 0 0 0-6.4 6.4l-7.6 7.6a2.1 2.1 0 0 0 3 3l7.6-7.6a5 5 0 0 0 6.4-6.4l-3 3-2.4-.6-.6-2.4z" />
    </g>
  ),
  filter: (
    <g>
      <path d="M5 4h14l-5 7v7l-4 3v-10z" />
      <circle cx="12" cy="8" r="1" className="animate-[pulseGlow_2s_ease-in-out_infinite]" />
    </g>
  ),
  amc: (
    <g>
      <path d="M12 2 4 6v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6z" />
      <path d="m9 12 2 2 4-4" className="animate-[pulseGlow_2.4s_ease-in-out_infinite]" />
    </g>
  )
};

export default function Services({ onBook }) {
  const ref = useReveal();

  return (
    <section
      id="services"
      data-scene="services"
      className="relative min-h-[120svh] py-24"
      aria-labelledby="services-title"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="reveal max-w-2xl">
          <p className="eyebrow mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-aqua-400/60" />
            Scene 06 — The Care
          </p>
          <h2 id="services-title" className="display">
            We stay after
            <br />
            the sale.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-300">
            Installation, repair, filter changes and annual maintenance — all by our own certified
            technicians, with prices fixed before we start.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CONFIG.services.map((s, i) => (
            <article
              key={s.id}
              className="glass group relative overflow-hidden p-6 transition-transform duration-500 hover:-translate-y-2 hover:rotate-[-0.6deg]"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* glass sheen */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-aqua-100/50" />
              <div
                className="pointer-events-none absolute -bottom-14 -right-10 h-32 w-32 rounded-full bg-aqua-400/25 blur-2xl transition group-hover:bg-aqua-400/40"
              />

              <div className="relative">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-aqua-100 to-aqua-300 text-aqua-800 shadow-inner ring-1 ring-white/70">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {ICONS[s.icon]}
                  </svg>
                </span>

                <h3 className="mt-5 font-display text-[16px] font-semibold text-slate-900">{s.name}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-slate-600">{s.desc}</p>

                <p className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">starting from</span>
                  <span className="font-display text-lg font-bold text-slate-900">{inr(s.from)}</span>
                </p>

                <button
                  onClick={() => onBook(s.name)}
                  className="mt-4 w-full rounded-xl border border-slate-900/10 bg-white/70 py-2.5 text-[12.5px] font-semibold text-slate-800 transition hover:border-aqua-400/60 hover:bg-aqua-50 hover:text-aqua-800"
                >
                  Book {s.name.toLowerCase()}
                </button>
              </div>

              <span className="absolute right-4 top-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
                0{i + 1}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
