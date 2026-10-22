/**
 * The visitor's own "Pause animations" choice (WCAG 2.2.2 Pause, Stop, Hide). The site still opens
 * with full motion on every device and never reads the OS reduced-motion setting (founder decision);
 * this is only a switch a visitor presses. While paused, the site runs its existing gentle mode and
 * <html data-motion="paused"> stops looping CSS motion (src/index.css).
 */
const KEY = 'cd_motion_paused';
const EVENT = 'cd:motion-choice';

export function motionPaused(): boolean {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

function apply(paused: boolean) {
  if (typeof document === 'undefined') return;
  if (paused) document.documentElement.dataset.motion = 'paused';
  else delete document.documentElement.dataset.motion;
}

export function setMotionPaused(paused: boolean) {
  try { if (paused) localStorage.setItem(KEY, '1'); else localStorage.removeItem(KEY); } catch { /* private mode */ }
  apply(paused);
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeMotionChoice(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  const onStorage = (event: StorageEvent) => { if (event.key === KEY) { apply(motionPaused()); onChange(); } };
  window.addEventListener('storage', onStorage);
  return () => { window.removeEventListener(EVENT, onChange); window.removeEventListener('storage', onStorage); };
}

// Apply a saved choice as early as the module loads, before any section animates.
if (typeof window !== 'undefined') apply(motionPaused());
