/**
 * Shared scroll timeline.
 * Each <section> of the page owns a weighted slice of the 0 → 1 camera
 * timeline, so the 3D shot list stays perfectly in sync with the DOM
 * no matter how tall a section renders on a given device.
 *
 * The nine sections, in order:
 *  0 HERO · 1 PROBLEM · 2 JOURNEY · 3 PURE · 4 LINEUP
 *  5 SERVICES · 6 BOOKING · 7 TRUST · 8 FAQ/FOOTER
 */
export const SECTION_WEIGHTS = [1.2, 1.0, 3.2, 1.0, 1.4, 1.2, 1.3, 1.0, 1.2];

const TOTAL = SECTION_WEIGHTS.reduce((a, b) => a + b, 0);

export const SECTION_BOUNDS = SECTION_WEIGHTS.reduce((acc, w) => {
  const start = acc.length ? acc[acc.length - 1].end : 0;
  acc.push({ start, end: start + w / TOTAL });
  return acc;
}, []);

export const SECTION_COUNT = SECTION_BOUNDS.length;

/** Progress of a single section, mapped into its global slice. */
export function globalProgress(sectionIndex, local) {
  const b = SECTION_BOUNDS[Math.min(sectionIndex, SECTION_COUNT - 1)];
  return b.start + (b.end - b.start) * Math.min(1, Math.max(0, local));
}

/**
 * Reads the DOM once per animation frame and returns the global progress.
 * `nodes` = array of section elements in order.
 */
export function measureProgress(nodes) {
  if (!nodes.length) return 0;
  const y = window.scrollY + window.innerHeight * 0.42;
  let index = 0;
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i];
    if (!el) continue;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (y >= top && y < bottom) {
      index = i;
      const local = (y - top) / Math.max(1, bottom - top);
      return globalProgress(i, local);
    }
    if (y >= bottom) index = Math.min(i + 1, nodes.length - 1);
  }
  const last = nodes[Math.min(index, nodes.length - 1)];
  if (!last) return 1;
  return globalProgress(index, 1);
}

export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const smooth = (t) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};
export const range = (p, a, b) => clamp01((p - a) / Math.max(0.0001, b - a));

/** Which of the five purification stages the camera is inside right now. */
export function activeStage(p) {
  const b = SECTION_BOUNDS[2];
  const info = { index: -1, local: 0 };
  if (p < b.start || p > b.end) return info;
  const raw = (p - b.start) / (b.end - b.start);
  // stages occupy the middle 86% of the journey section
  const stageT = clamp01((raw - 0.1) / 0.78);
  return { index: Math.min(4, Math.floor(stageT * 5)), local: stageT, raw };
}
