/**
 * Aqua Assist — floating AI concierge.
 * The browser talks to OUR backend (/api/ai/generate); the Gemini key
 * never reaches the client. Plus the floating WhatsApp / call buttons.
 */
import { useEffect, useRef, useState } from 'react';
import api from '../lib/api.js';
import { CONFIG, waLink } from '../lib/config.js';
import { useScrollLock } from '../lib/hooks.js';

const QUICK = [
  'Which purifier suits 1200 ppm borewell water?',
  'How much is an AMC for one year?',
  'My RO flow dropped — what should I check?'
];

export function FloatingActions({ onOpenAI, aiOpen }) {
  return (
    <div className="fixed bottom-5 right-4 z-[60] flex flex-col items-end gap-2.5 sm:bottom-6 sm:right-6">
      <a
        href={waLink()}
        target="_blank"
        rel="noreferrer noopener"
        aria-label="Chat with us on WhatsApp"
        className="group flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_30px_-8px_rgba(37,211,102,0.8)] transition hover:scale-105"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm4.5 12.1c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.7 1-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.5-1.1.1-.2 0-.4 0-.5s-.5-1.2-.7-1.7-.3-.4-.5-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2 .6 2.4.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3z" />
        </svg>
      </a>

      <a
        href={`tel:${CONFIG.contact.phoneRaw}`}
        aria-label={`Call ${CONFIG.contact.phone}`}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-aqua-400 text-ink-900 shadow-[0_12px_30px_-8px_rgba(34,211,238,0.9)] transition hover:scale-105"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.9 2.2z" />
        </svg>
      </a>

      <button
        onClick={onOpenAI}
        aria-label="Ask Aqua Assist"
        aria-expanded={aiOpen}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-aqua-300 to-aqua-600 text-ink-900 shadow-[0_16px_40px_-10px_rgba(34,211,238,0.95)] transition hover:scale-105"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-aqua-400/30" />
        <svg viewBox="0 0 24 24" className="relative h-6 w-6" fill="currentColor">
          <path d="M12 2l1.9 5.5L19.5 9l-5.6 1.5L12 16l-1.9-5.5L4.5 9l5.6-1.5z" />
          <path d="M18.5 14l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" opacity="0.75" />
        </svg>
      </button>
    </div>
  );
}

export default function Assistant({ open, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: `Namaskara! I'm Aqua Assist. Ask me anything about water quality, which purifier fits your home, or AMC plans — I'm here 24/7.`
    }
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useScrollLock(false);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, busy]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const send = async (text) => {
    const prompt = (text ?? input).trim();
    if (!prompt || busy) return;
    setInput('');
    setError('');
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, { role: 'user', text: prompt }]);
    setBusy(true);
    try {
      const res = await api.aiGenerate({ mode: 'assistant', prompt, history });
      setMessages((m) => [...m, { role: 'model', text: res.text }]);
    } catch (e) {
      setError(e.message || 'Aqua Assist is unavailable right now.');
      setMessages((m) => [
        ...m,
        {
          role: 'model',
          text: `I couldn't reach the AI just now. You can call us on ${CONFIG.contact.phone} or WhatsApp us — a human will help in minutes.`
        }
      ]);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] flex justify-end p-3 sm:inset-auto sm:bottom-24 sm:right-6 sm:p-0">
      <div
        className="flex h-[70svh] w-full flex-col overflow-hidden rounded-3xl border border-white/15 bg-ink-800/95 shadow-2xl backdrop-blur-xl sm:h-[520px] sm:w-[380px]"
        role="dialog"
        aria-modal="false"
        aria-label="Aqua Assist chat"
      >
        <header className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="relative grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-aqua-300 to-aqua-600 text-ink-900">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M12 2l1.9 5.5L19.5 9l-5.6 1.5L12 16l-1.9-5.5L4.5 9l5.6-1.5z" />
              </svg>
            </span>
            <div>
              <p className="text-[13px] font-semibold text-white">Aqua Assist</p>
              <p className="flex items-center gap-1 text-[10.5px] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Powered by Gemini
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close chat"
          >
            ✕
          </button>
        </header>

        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <p
                className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-aqua-400 text-ink-900'
                    : 'border border-white/10 bg-white/[0.06] text-slate-100'
                }`}
              >
                {m.text}
              </p>
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-1.5 px-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-aqua-300"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>
          )}
          {messages.length === 1 && (
            <div className="space-y-1.5 pt-1">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-[11.5px] text-slate-300 transition hover:border-aqua-300/50 hover:text-white"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p className="px-4 pb-1 text-[10.5px] text-rose-300">{error}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2 border-t border-white/10 p-3"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about water, purifiers, AMC…"
            className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-[12.5px] text-white placeholder:text-slate-500 focus:border-aqua-400 focus:outline-none"
            aria-label="Message Aqua Assist"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-aqua-400 text-ink-900 transition hover:bg-aqua-300 disabled:opacity-40"
            aria-label="Send message"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
