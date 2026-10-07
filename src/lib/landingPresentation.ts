/** Small totals must be truthful immediately, rather than counting up from zero. */
export function figureDisplay(value: number, animated: number, reducedMotion: boolean, visible: boolean): number {
  return value < 10 || reducedMotion || !visible ? value : Math.max(value > 0 ? 1 : 0, Math.round(animated));
}

export const fundraiserRetryPolicy = {
  attemptTimeout: 30_000,
  retry: 2,
  retryDelay: (attempt: number) => Math.min(2_000 * 2 ** attempt, 8_000),
};
export type RevealMode = 'wait' | 'animate' | 'late' | 'instant';
/**
 * Scroll reveal decision. Pre-triggers 20% below the viewport; content already
 * on screen when it mounts still animates ("late"); only content scrolled past
 * or content already scrolled completely past finishes instantly. Visible
 * content always animates so browser throttling can never erase the reveal.
 */
export function revealMode(top: number, bottom: number, viewport: number, _screensPerSecond: number): RevealMode {
  if (top > viewport * 1.2) return 'wait';
  if (bottom < 0) return 'instant';
  if (top < viewport * 0.9) return 'late';
  return 'animate';
}
