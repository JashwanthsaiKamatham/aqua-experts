/**
 * SCENE 5 · PRODUCT LINEUP — a rotating 3D showroom behind four glass cards.
 * Selecting a model zooms the matching 3D unit and reveals its full spec sheet.
 */
import { CONFIG, inr, waLink } from '../lib/config.js';
import { useReveal } from '../lib/hooks.js';

function TechChip({ tech }) {
  return (
    <span className="rounded-md bg-aqua-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-aqua-700 ring-1 ring-aqua-500/20">
      {tech}
    </span>
  );
}

export default function Lineup({ active, onActive, onBuy }) {
  const ref = useReveal();

  return (
    <section
      id="lineup"
      data-scene="lineup"
      className="relative min-h-[160svh] py-24"
      aria-labelledby="lineup-title"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="reveal max-w-2xl">
          <p className="eyebrow mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-aqua-400/60" />
            Scene 05 — The Lineup
          </p>
          <h2 id="lineup-title" className="display">
            Choose your
            <br />
            pure water.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-300">
            Four machines, one promise. Tap a model to step into the showroom and read the full spec sheet.
            Every unit ships with free installation.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CONFIG.products.map((p, i) => {
            const isActive = i === active;
            return (
              <article
                key={p.id}
                onClick={() => onActive(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onActive(i);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                className={`glass group relative flex cursor-pointer flex-col overflow-hidden p-5 transition-all duration-500 hover:-translate-y-1.5 ${
                  isActive
                    ? '-translate-y-1.5 ring-2 ring-aqua-400/70 shadow-[0_30px_70px_-30px_rgba(34,211,238,0.85)]'
                    : 'hover:shadow-glow'
                }`}
              >
                {/* accent wash */}
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-40 blur-2xl transition group-hover:opacity-70"
                  style={{ background: p.colour }}
                />
                <div className="relative">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-white">
                      {p.badge}
                    </span>
                    <div className="flex gap-1">
                      {p.tech.map((t) => (
                        <TechChip key={t} tech={t} />
                      ))}
                    </div>
                  </div>

                  {/* tiny procedural purifier illustration */}
                  <div className="my-5 flex justify-center">
                    <svg viewBox="0 0 90 120" className="h-28 w-20 drop-shadow-[0_10px_22px_rgba(8,145,178,0.28)]">
                      <defs>
                        <linearGradient id={`body-${p.id}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0" stopColor="#ffffff" />
                          <stop offset="0.5" stopColor="#e2e8f0" />
                          <stop offset="1" stopColor="#cbd5e1" />
                        </linearGradient>
                        <linearGradient id={`water-${p.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor={p.colour} stopOpacity="0.85" />
                          <stop offset="1" stopColor={p.colour} stopOpacity="0.35" />
                        </linearGradient>
                      </defs>
                      <rect x="12" y="26" width="66" height="76" rx="10" fill={`url(#body-${p.id})`} stroke="#94a3b8" strokeWidth="1" />
                      <rect x="20" y="10" width="50" height="30" rx="7" fill={`url(#water-${p.id})`} stroke="#93c5fd" strokeWidth="1" />
                      <rect x="24" y="52" width="42" height="16" rx="3" fill="#0f172a" opacity="0.9" />
                      <text x="45" y="63.5" textAnchor="middle" fontSize="8" fill={p.colour} fontFamily="monospace">
                        018 ppm
                      </text>
                      <rect x="24" y="76" width="42" height="3" rx="1.5" fill={p.colour} opacity="0.9" />
                      <rect x="24" y="84" width="26" height="3" rx="1.5" fill="#cbd5e1" />
                      <path d="M66 46h8a4 4 0 0 1 4 4v6" stroke="#64748b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      <circle cx="45" cy="112" r="4" fill={`url(#water-${p.id})`} />
                    </svg>
                  </div>

                  <h3 className="font-display text-[17px] font-semibold leading-snug text-slate-900">{p.name}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">{p.blurb}</p>

                  <div className="mt-3 flex items-end gap-2">
                    <span className="font-display text-xl font-bold text-slate-900">{inr(p.price)}</span>
                    <span className="pb-0.5 text-[12px] text-slate-400 line-through">{inr(p.mrp)}</span>
                    <span className="mb-0.5 ml-auto rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      {p.storage}
                    </span>
                  </div>

                  {/* spec sheet: space is always reserved so cards stay aligned */}
                  <div
                    className={`mt-4 transition-all duration-500 ${
                      isActive ? 'opacity-100' : 'opacity-35'
                    }`}
                  >
                    <dl className="space-y-1.5 border-t border-slate-200 pt-3">
                      {Object.entries(p.specs).map(([k, v]) => (
                        <div key={k} className="flex items-baseline justify-between gap-3 text-[11.5px]">
                          <dt className="text-slate-500">{k}</dt>
                          <dd className="text-right font-medium text-slate-800">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <div className="mt-auto flex gap-2 pt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onBuy(p);
                      }}
                      className="btn-light flex-1 !px-4 !py-2.5 text-[12.5px]"
                    >
                      Buy Now
                    </button>
                    <a
                      onClick={(e) => e.stopPropagation()}
                      href={waLink(
                        `Hi ${CONFIG.brand.name}, I'm interested in the ${p.name} (${inr(p.price)}). Please share availability.`
                      )}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="btn !border !border-emerald-500/30 !bg-emerald-50 !px-3.5 !py-2.5 text-[12.5px] !text-emerald-700 hover:!bg-emerald-100"
                      aria-label={`Enquire about ${p.name} on WhatsApp`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.5-5.9c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.7 1-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.5-1.1.1-.2 0-.4 0-.5s-.5-1.2-.7-1.7-.3-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2 .6 2.4.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3z" />
                      </svg>
                      WhatsApp
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-center text-[12px] text-slate-400">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-aqua-400" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Free installation · 3 no-cost EMI · Genuine spares · 30-day service warranty
        </p>
      </div>
    </section>
  );
}
