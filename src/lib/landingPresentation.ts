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
 * or a genuine fling (over 6 screens per second) finishes instantly. Speed is
 * time-based so a janky frame on a busy phone is never mistaken for a fling.
 */
export function revealMode(top: number, bottom: number, viewport: number, screensPerSecond: number): RevealMode {
  if (top > viewport * 1.2) return 'wait';
  if (bottom < 0 || screensPerSecond > 6) return 'instant';
  if (top < viewport * 0.9) return 'late';
  return 'animate';
}
