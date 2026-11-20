/** SCENE 9 · FAQ + CONTACT + end-credits OUTRO. */
import { useState } from 'react';
import { CONFIG, waLink } from '../lib/config.js';
import { useReveal } from '../lib/hooks.js';

function Accordion() {
  const [open, setOpen] = useState(0);

  return (
    <div className="divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
      {CONFIG.faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q}>
            <h3>
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-body-${i}`}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/[0.04]"
              >
                <span className={`text-[13.5px] font-medium ${isOpen ? 'text-white' : 'text-slate-200'}`}>
                  {f.q}
                </span>
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[13px] transition-transform duration-300 ${
                    isOpen
                      ? 'rotate-45 border-aqua-300/60 bg-aqua-400/15 text-aqua-300'
                      : 'border-white/15 text-slate-400'
                  }`}
                  aria-hidden="true"
                >
                  +
                </span>
              </button>
            </h3>
            <div id={`faq-body-${i}`} className={`acc-body ${isOpen ? 'open' : ''}`} role="region">
              <div>
                <p className="px-5 pb-5 text-[13px] leading-relaxed text-slate-400">{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MapCard() {
  return (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONFIG.contact.mapQuery)}`}
      target="_blank"
      rel="noreferrer noopener"
      className="group relative block overflow-hidden rounded-3xl border border-white/10 bg-ink-800"
      aria-label="Open our location in Google Maps"
    >
      {/* procedural map: streets + blocks, no external tiles */}
      <svg viewBox="0 0 400 220" className="h-full w-full" role="img" aria-label="Map of Indiranagar, Bengaluru">
        <rect width="400" height="220" fill="#070C18" />
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 26} x2="400" y2={i * 26 + 8} stroke="#12263a" strokeWidth="1" />
        ))}
        {Array.from({ length: 13 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 33} y1="0" x2={i * 33 + 12} y2="220" stroke="#12263a" strokeWidth="1" />
        ))}
        <path d="M0 140 L400 116" stroke="#0e7490" strokeWidth="5" opacity="0.55" />
        <path d="M170 0 L196 220" stroke="#0e7490" strokeWidth="4" opacity="0.45" />
        <path d="M0 60 L400 44" stroke="#155e75" strokeWidth="3" opacity="0.5" />
        <circle cx="196" cy="112" r="26" fill="#22d3ee" opacity="0.12" />
        <circle cx="196" cy="112" r="14" fill="#22d3ee" opacity="0.2" />
        <circle cx="196" cy="112" r="5" fill="#67e8f9" />
        <text x="196" y="150" textAnchor="middle" fill="#67e8f9" fontSize="10" fontFamily="monospace" letterSpacing="2">
          {CONFIG.brand.name}
        </text>
      </svg>
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-ink-900 to-transparent px-4 py-3">
        <span className="text-[11.5px] text-slate-300">{CONFIG.contact.address}</span>
        <span className="shrink-0 rounded-full bg-aqua-400/15 px-2.5 py-1 text-[10.5px] font-semibold text-aqua-300 transition group-hover:bg-aqua-400/25">
          Open map ↗
        </span>
      </span>
    </a>
  );
}

export default function FaqFooter({ onShop, onBook }) {
  const ref = useReveal();

  return (
    <section
      id="faq"
      data-scene="faq"
      className="relative min-h-[130svh] py-24"
      aria-labelledby="faq-title"
      style={{ paddingBottom: '1rem' }}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div ref={ref} className="reveal">
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-aqua-400/60" />
              Scene 09 — The Questions
            </p>
            <h2 id="faq-title" className="display mb-8">
              Everything you
              <br />
              wanted to ask.
            </h2>
            <Accordion />
          </div>

          <div className="space-y-4">
            <div className="glass p-6">
              <h3 className="font-display text-[15px] font-semibold text-slate-900">Talk to a human</h3>
              <p className="mt-1 text-[12.5px] text-slate-600">{CONFIG.contact.hours}</p>
              <div className="mt-4 space-y-2.5">
                <a
                  href={`tel:${CONFIG.contact.phoneRaw}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-aqua-400/60 hover:bg-aqua-50"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-aqua-50 text-aqua-700">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.9 2.2z" />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold text-slate-900">{CONFIG.contact.phone}</span>
                    <span className="block text-[11px] text-slate-500">Call the service desk</span>
                  </span>
                </a>
                <a
                  href={waLink()}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 transition hover:border-emerald-400"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm4.5 12.1c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.7 1-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.5-1.1.1-.2 0-.4 0-.5s-.5-1.2-.7-1.7-.3-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2 .6 2.4.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3z" />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold text-emerald-900">WhatsApp us</span>
                    <span className="block text-[11px] text-emerald-700">Fastest replies · 9 AM – 8 PM</span>
                  </span>
                </a>
                <a
                  href={`mailto:${CONFIG.contact.email}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-aqua-400/60 hover:bg-aqua-50"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-700">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold text-slate-900">{CONFIG.contact.email}</span>
                    <span className="block text-[11px] text-slate-500">Sales & AMC enquiries</span>
                  </span>
                </a>
              </div>
            </div>

            <div className="h-56 overflow-hidden rounded-3xl border border-white/10">
              <MapCard />
            </div>
          </div>
        </div>

        {/* ── END CREDITS OUTRO ── */}
        <div className="mt-24 text-center">
          <div className="mx-auto mb-8 h-px w-24 glass-panel-line" />
          <p className="eyebrow mb-4">The End · Now Book</p>
          <h2 className="display mx-auto max-w-3xl">
            Your family deserves
            <br />
            <span className="bg-gradient-to-r from-aqua-200 via-aqua-400 to-aqua-600 bg-clip-text text-transparent">
              water you never doubt.
            </span>
          </h2>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button onClick={onShop} className="btn-primary">
              Shop Purifiers · from ₹7,499
            </button>
            <button onClick={onBook} className="btn-outline">
              Book a Service
            </button>
            <a href={waLink()} target="_blank" rel="noreferrer noopener" className="btn-outline">
              WhatsApp us
            </a>
          </div>

          <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 text-[11px] uppercase tracking-[0.18em] text-slate-500 sm:grid-cols-4">
            {[
              ['Directed by', 'AQUA-EXPERTS, Bengaluru'],
              ['Cinematography', 'Procedural WebGL'],
              ['Score', 'Pure water'],
              ['Starring', 'Your family']
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-slate-600">{k}</dt>
                <dd className="mt-1 font-display text-[12px] normal-case tracking-normal text-slate-300">{v}</dd>
              </div>
            ))}
          </dl>

          <footer className="mt-16 border-t border-white/10 pt-8 text-[11.5px] text-slate-500">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p>
                © {new Date().getFullYear()} {CONFIG.brand.name} · {CONFIG.contact.address}
              </p>
              <nav className="flex flex-wrap items-center justify-center gap-4" aria-label="Footer">
                <a href="#lineup" className="transition hover:text-aqua-300">
                  Purifiers
                </a>
                <a href="#services" className="transition hover:text-aqua-300">
                  Services
                </a>
                <a href="#booking" className="transition hover:text-aqua-300">
                  Book
                </a>
                <a href="#faq" className="transition hover:text-aqua-300">
                  FAQ
                </a>
              </nav>
            </div>
          </footer>
        </div>
      </div>
    </section>
  );
}
