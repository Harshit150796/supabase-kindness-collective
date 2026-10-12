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

export const JOURNEY_TRAVEL_MS = 300;

/** Fractional stop coordinates follow each segment, including stacked layouts. */
export function journeyTravelPoint(points: readonly JourneyPoint[], position: number): JourneyPoint | undefined {
  if (!points.length) return;
  const value = Math.max(0, Math.min(points.length - 1, position));
  const index = Math.floor(value);
  const from = points[index], to = points[Math.min(index + 1, points.length - 1)];
  if (!from || !to) return;
  const progress = value - index;
  return [from[0] + (to[0] - from[0]) * progress, from[1] + (to[1] - from[1]) * progress];
}

export function journeyTravelPosition(from: number, to: number, elapsed: number) {
  const progress = Math.max(0, Math.min(1, elapsed / Math.max(1, Math.abs(to - from) * JOURNEY_TRAVEL_MS)));
  return from + (to - from) * progress;
}

export function journeyWheelStop(stop: number, delta: number, now: number, previousEvent: number) {
  if (now - previousEvent < JOURNEY_GESTURE_GAP || delta === 0) return stop;
  return Math.max(0, Math.min(3, stop + Math.sign(delta)));
}