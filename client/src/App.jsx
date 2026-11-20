/**
 * AQUA-EXPERTS — application shell.
 * One continuous 3D scene behind nine DOM "shots", plus auth, CRUD
 * dashboard, AI concierge and the booking flow.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import CinematicScene from './three/CinematicScene.jsx';
import Preloader from './components/Preloader.jsx';
import Cursor from './components/Cursor.jsx';
import Nav from './components/Nav.jsx';
import AuthModal from './components/AuthModal.jsx';
import Dashboard from './components/Dashboard.jsx';
import Assistant, { FloatingActions } from './components/Assistant.jsx';
import { Hero, Problem, Journey, Pure } from './sections/Story.jsx';
import Lineup from './sections/Lineup.jsx';
import Services from './sections/Services.jsx';
import Booking from './sections/Booking.jsx';
import Trust from './sections/Trust.jsx';
import FaqFooter from './sections/FaqFooter.jsx';
import { AuthProvider, useAuth } from './lib/auth.jsx';
import { measureProgress, activeStage } from './lib/scroll.js';
import { CONFIG, inr } from './lib/config.js';
import api from './lib/api.js';

/* ── toasts ─────────────────────────────────────────────────── */
function Toasts({ items }) {
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[85] flex -translate-x-1/2 flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto rounded-full border px-4 py-2.5 text-[12.5px] font-medium shadow-xl backdrop-blur-xl ${
            t.type === 'error'
              ? 'border-rose-400/40 bg-rose-500/15 text-rose-100'
              : 'border-aqua-300/40 bg-aqua-400/15 text-aqua-50'
          }`}
          style={{ animation: 'floaty 0.4s ease-out' }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

function Site() {
  const { user, isAuthed } = useAuth();
  const [view, setView] = useState('home'); // 'home' | 'app'
  const [booting, setBooting] = useState(true);
  const [auth, setAuth] = useState(null); // null | 'login' | 'signup'
  const [activeModel, setActiveModel] = useState(1);
  const [stage, setStage] = useState(0);
  const [bookingIssue, setBookingIssue] = useState('');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const progressRef = useRef(0);
  const pendingBuy = useRef(null);

  const toast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const scrollTo = useCallback((selector) => {
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /* ── scroll → camera progress ── */
  useEffect(() => {
    if (view !== 'home') return undefined;
    let raf = 0;
    let nodes = [];
    const collect = () => {
      nodes = Array.from(document.querySelectorAll('[data-scene]'));
    };
    collect();
    const t = setTimeout(collect, 400);

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!nodes.length) collect();
        const p = measureProgress(nodes);
        progressRef.current = p;
        const s = activeStage(p).index;
        setStage((prev) => (prev === s ? prev : s));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      clearTimeout(t);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [view]);

  /* ── buy flow ── */
  const createOrderIntent = useCallback(
    async (product) => {
      try {
        await api.createItem({
          title: `${product.name} — purchase enquiry (${inr(product.price)})`,
          description: `Interested in ${product.name} (${product.storage}, ${product.tech.join(
            '+'
          )}) at ${inr(product.price)}. Please call to confirm availability, EMI options and installation slot.`
        });
        toast(`${product.name} added to your requests — we'll call you shortly.`, 'success');
        setView('app');
        window.scrollTo({ top: 0 });
      } catch (e) {
        toast(e.message, 'error');
      }
    },
    [toast]
  );

  const onBuy = useCallback(
    async (product) => {
      if (!isAuthed) {
        pendingBuy.current = product;
        setAuth('login');
        toast('Sign in (or create an account) to place this order — takes 20 seconds.', 'success');
        return;
      }
      await createOrderIntent(product);
    },
    [isAuthed, createOrderIntent, toast]
  );

  const onAuthSuccess = useCallback(() => {
    const product = pendingBuy.current;
    pendingBuy.current = null;
    if (product) {
      // the context user updates on the next tick
      setTimeout(() => createOrderIntent(product), 250);
    } else {
      toast('Signed in. Your requests are saved to your account.', 'success');
    }
  }, [createOrderIntent, toast]);

  const onBook = useCallback(
    (issue) => {
      if (issue) setBookingIssue(issue);
      if (view !== 'home') setView('home');
      setTimeout(() => scrollTo('#booking'), view !== 'home' ? 120 : 0);
    },
    [scrollTo, view]
  );

  /* switch between the cinematic site and the account dashboard */
  const goDashboard = () => {
    setView('app');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  const goHome = () => {
    setView('home');
    window.scrollTo({ top: 0 });
  };

  if (view === 'app') {
    return (
      <>
        <Cursor />
        <Toasts items={toasts} />
        <Nav onAuth={setAuth} onDashboard={goDashboard} onHome={goHome} />
        <Dashboard onBack={goHome} onToast={toast} onBook={() => onBook()} />
        <FloatingActions onOpenAI={() => setAssistantOpen((v) => !v)} aiOpen={assistantOpen} />
        <Assistant open={assistantOpen} onClose={() => setAssistantOpen(false)} />
        {auth && (
          <AuthModal mode={auth} onClose={() => setAuth(null)} onSuccess={onAuthSuccess} />
        )}
      </>
    );
  }

  return (
    <>
      {booting && <Preloader onDone={() => setBooting(false)} />}
      <div className={`letterbox-bar top ${booting ? 'show' : ''}`} aria-hidden="true" />
      <div className={`letterbox-bar bottom ${booting ? 'show' : ''}`} aria-hidden="true" />

      <Cursor />

      {/* the film */}
      <CinematicScene progressRef={progressRef} activeModel={activeModel} />

      {/* readability scrim over the WebGL */}
      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(4,7,15,0.35) 0%, rgba(4,7,15,0.08) 22%, rgba(4,7,15,0.1) 70%, rgba(4,7,15,0.75) 100%)'
        }}
        aria-hidden="true"
      />

      <Nav onAuth={setAuth} onDashboard={goDashboard} onHome={goHome} />

      <a
        href="#lineup"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-20 focus:z-[100] focus:rounded-full focus:bg-aqua-400 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-900"
      >
        Skip to purifiers
      </a>

      <main className="relative z-10">
        <Hero onShop={() => scrollTo('#lineup')} onBook={() => onBook()} />
        <Problem />
        <Journey stage={stage} />
        <Pure />
        <Lineup active={activeModel} onActive={setActiveModel} onBuy={onBuy} />
        <Services onBook={onBook} />
        <Booking initialIssue={bookingIssue} onToast={toast} />
        <Trust />
        <FaqFooter onShop={() => scrollTo('#lineup')} onBook={() => onBook()} />
      </main>

      <FloatingActions onOpenAI={() => setAssistantOpen((v) => !v)} aiOpen={assistantOpen} />
      <Assistant open={assistantOpen} onClose={() => setAssistantOpen(false)} />
      <Toasts items={toasts} />

      {auth && <AuthModal mode={auth} onClose={() => setAuth(null)} onSuccess={onAuthSuccess} />}

      {/* SEO / no-JS fallback copy */}
      <noscript>
        <div className="p-8 text-slate-200">
          <h1>{CONFIG.brand.name}</h1>
          <p>
            Water purifiers from {inr(7499)} in {CONFIG.brand.city}. Call {CONFIG.contact.phone}.
          </p>
        </div>
      </noscript>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Site />
    </AuthProvider>
  );
}
