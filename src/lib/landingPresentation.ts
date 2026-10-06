/** Small totals must be truthful immediately, rather than counting up from zero. */
export function figureDisplay(value: number, animated: number, reducedMotion: boolean, visible: boolean): number {
  return value < 10 || reducedMotion || !visible ? value : Math.max(value > 0 ? 1 : 0, Math.round(animated));
}

export const fundraiserRetryPolicy = {
  attemptTimeout: 30_000,
  retry: 2,
  retryDelay: (attempt: number) => Math.min(2_000 * 2 ** attempt, 8_000),
};