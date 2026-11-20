/** Custom cursor: a soft aqua ring that lags behind a small dot. Desktop only. */
import { useEffect, useRef } from 'react';

export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return undefined;

    document.body.classList.add('custom-cursor');
    const dot = dotRef.current;
    const ring = ringRef.current;
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;
    let hot = false;

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      const t = e.target;
      hot = Boolean(t.closest?.('a, button, input, textarea, select, [role="button"], .cursor-hot'));
      ring.dataset.hot = hot ? '1' : '0';
      dot.style.opacity = '1';
      ring.style.opacity = '1';
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      dot.style.transform = `translate3d(${mx - 3}px, ${my - 3}px, 0)`;
      const scale = hot ? 1.9 : 1;
      ring.style.transform = `translate3d(${rx - 18}px, ${ry - 18}px, 0) scale(${scale})`;
      ring.style.borderColor = hot ? 'rgba(34,211,238,0.95)' : 'rgba(103,232,249,0.5)';
      ring.style.backgroundColor = hot ? 'rgba(34,211,238,0.10)' : 'transparent';
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', () => {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    });
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.body.classList.remove('custom-cursor');
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[95] hidden md:block">
      <div
        ref={ringRef}
        className="absolute left-0 top-0 h-9 w-9 rounded-full border opacity-0 transition-[border-color,background-color] duration-200"
        style={{ borderColor: 'rgba(103,232,249,0.5)' }}
      />
      <div
        ref={dotRef}
        className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-aqua-300 opacity-0"
        style={{ boxShadow: '0 0 12px rgba(34,211,238,0.9)' }}
      />
    </div>
  );
}
