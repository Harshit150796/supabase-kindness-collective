/**
 * Frame pacing for the live tree. On 120Hz-and-up screens the browser asks for a frame on every
 * refresh. Drawing the whole tree each time can leave the GPU no room for the rest of the page, so the
 * cursor trail and scrolling stutter while the hero is on screen. The tree therefore draws on every
 * second (or third) refresh, close to 60 times a second, while the page keeps the screen's full rate.
 * Its animations still advance by real time, so nothing moves faster or slower.
 */
export const TREE_TARGET_FPS = 60;
const WINDOW = 60;

/** Refreshes per tree frame: 1 at 60–100Hz, 2 at 120–165Hz, 4 at 240Hz. */
export function pacingDivisor(refreshMs: number) {
  if (!Number.isFinite(refreshMs) || refreshMs <= 0) return 1;
  return Math.max(1, Math.floor(1000 / TREE_TARGET_FPS / refreshMs + 0.05));
}

/**
 * The screen's refresh interval is the shortest gap between animation frames: a busy GPU only ever
 * makes gaps longer, so the minimum over the last second stays true even while the tree is slow.
 */
export function createRefreshTracker() {
  const gaps: number[] = [];
  let last = 0;
  return {
    /** Feed each animation-frame timestamp; returns the current refresh estimate in ms. */
    push(timestamp: number) {
      const gap = timestamp - last;
      last = timestamp;
      if (gap > 3 && gap < 40) { gaps.push(gap); if (gaps.length > WINDOW) gaps.shift(); }
      return gaps.length >= 8 ? Math.min(...gaps) : 1000 / TREE_TARGET_FPS;
    },
  };
}
