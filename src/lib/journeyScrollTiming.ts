export type JourneyPoint = readonly [number, number];

export function journeyScrollRange(firstIconY: number, lastIconY: number, viewportHeight: number) {
  return { start: firstIconY - viewportHeight * 0.72, end: lastIconY - viewportHeight * 0.32 };
}

export function journeyScrollProgress(scrollY: number, start: number, end: number) {
  return Math.max(0, Math.min(1, (scrollY - start) / Math.max(1, end - start)));
}

export function journeyScrollPoint(points: readonly JourneyPoint[], progress: number): JourneyPoint | undefined {
  if (!points.length) return;
  if (points.length === 1) return points[0];
  return points[journeyScrollStop(progress, points.length)];
}

export function journeyScrollStop(progress: number, count = 4) {
  return Math.min(count - 1, Math.floor(Math.max(0, Math.min(1, progress)) * count));
}

export const JOURNEY_GESTURE_GAP = 180;

export function journeyWheelStop(stop: number, delta: number, now: number, previousEvent: number) {
  if (now - previousEvent < JOURNEY_GESTURE_GAP || delta === 0) return stop;
  return Math.max(0, Math.min(3, stop + Math.sign(delta)));
}