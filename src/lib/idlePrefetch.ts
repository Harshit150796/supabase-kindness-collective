/**
 * Loads below-the-fold section code one module per idle period once the homepage
 * has settled (after the opening), so scrolling never waits on a chunk download or
 * its first evaluation. Nothing renders early: sections still mount as they come
 * into view. Skipped when the visitor asked to save data.
 */
export function prefetchWhenIdle(loaders: Array<() => Promise<unknown>>): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '')) return () => undefined;

  const queue = [...loaders];
  let cancelled = false;
  let idleHandle = 0;
  let timerHandle = 0;
  // Some browsers (older Safari) have no requestIdleCallback.
  const hasIdle = typeof window.requestIdleCallback === 'function';
  const idle = (fn: () => void) => {
    if (hasIdle) idleHandle = window.requestIdleCallback(fn, { timeout: 2500 });
    else timerHandle = window.setTimeout(fn, 200);
  };
  const next = () => {
    if (cancelled) return;
    const load = queue.shift();
    if (!load) return;
    load().catch(() => undefined).finally(() => idle(next));
  };
  const start = () => idle(next);

  // The opening owns the network and main thread until it ends.
  if (document.documentElement.classList.contains('cd-intro')) window.addEventListener('cd:intro-end', start, { once: true });
  else start();

  return () => {
    cancelled = true;
    window.removeEventListener('cd:intro-end', start);
    if (idleHandle && hasIdle) window.cancelIdleCallback(idleHandle);
    window.clearTimeout(timerHandle);
  };
}
