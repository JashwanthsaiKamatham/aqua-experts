/** Fixed navigation: brand, sections, session state, scroll progress bar. */
import { useEffect, useState } from 'react';
import { CONFIG } from '../lib/config.js';
import { useAuth } from '../lib/auth.jsx';

const LINKS = [
  { href: '#journey', label: 'Journey' },
  { href: '#lineup', label: 'Purifiers' },
  { href: '#services', label: 'Services' },
  { href: '#booking', label: 'Book' },
  { href: '#faq', label: 'FAQ' }
];

export function BrandMark({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="bm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#A5F3FC" />
          <stop offset="0.55" stopColor="#22D3EE" />
          <stop offset="1" stopColor="#0E7490" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="#070C18" stroke="rgba(34,211,238,0.35)" />
      <path d="M16 5c4.5 5.6 7 9.2 7 12.4A7 7 0 0 1 9 17.4C9 14.2 11.5 10.6 16 5z" fill="url(#bm)" />
      <circle cx="13.4" cy="16.6" r="1.5" fill="#04070F" opacity="0.45" />
    </svg>
  );
}

export default function Nav({ onAuth, onDashboard, onHome }) {
  const { user, logout } = useAuth();
  const [progress, setProgress] = useState(0);
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
        setSolid(window.scrollY > 40);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          solid ? 'border-b border-white/10 bg-ink-900/80 backdrop-blur-xl' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={onHome}
            className="group flex items-center gap-2.5 rounded-xl focus-visible:outline-none"
            aria-label={`${CONFIG.brand.name} home`}
          >
            <BrandMark className="h-9 w-9 transition group-hover:scale-105" />
            <span className="font-display text-[13px] font-bold tracking-[0.22em] text-white sm:text-sm">
              {CONFIG.brand.name}
            </span>
          </button>

          <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-3.5 py-2 text-[13px] font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${CONFIG.contact.phoneRaw}`}
              className="hidden items-center gap-2 rounded-full border border-white/15 px-3.5 py-2 text-[12.5px] font-semibold text-slate-200 transition hover:border-aqua-300/60 hover:text-white sm:flex"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.9 2.2z" />
              </svg>
              {CONFIG.contact.phone}
            </a>

            {user ? (
              <div className="flex items-center gap-2">
                <button onClick={onDashboard} className="btn-primary !px-4 !py-2 text-[13px]">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-ink-900/15 text-[10px] font-bold">
                    {(user.fullName || user.email)[0].toUpperCase()}
                  </span>
                  <span className="hidden sm:inline">My account</span>
                </button>
                <button
                  onClick={logout}
                  className="hidden rounded-full px-3 py-2 text-[13px] text-slate-400 transition hover:text-white sm:block"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button onClick={() => onAuth('login')} className="btn-primary !px-4 !py-2 text-[13px]">
                Sign in
              </button>
            )}

            <button
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white md:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* scroll progress indicator */}
        <div className="h-px w-full bg-white/5">
          <div
            className="h-px bg-gradient-to-r from-aqua-300 via-aqua-400 to-aqua-600 transition-[width] duration-150"
            style={{ width: `${progress * 100}%`, boxShadow: '0 0 12px rgba(34,211,238,0.9)' }}
          />
        </div>
      </header>

      {/* mobile sheet */}
      <div
        className={`fixed inset-x-0 top-16 z-40 origin-top border-b border-white/10 bg-ink-900/95 backdrop-blur-xl transition-all duration-300 md:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
        }`}
      >
        <nav className="flex flex-col p-4" aria-label="Mobile sections">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/5"
            >
              {l.label}
            </a>
          ))}
          <a
            href={`tel:${CONFIG.contact.phoneRaw}`}
            className="mt-2 rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-aqua-300"
          >
            Call {CONFIG.contact.phone}
          </a>
        </nav>
      </div>
    </>
  );
}
