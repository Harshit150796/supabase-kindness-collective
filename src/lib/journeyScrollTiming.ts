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
  const position = Math.max(0, Math.min(1, progress)) * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(position));
  const from = points[index], to = points[index + 1];
  const fraction = position - index;
  return [from[0] + (to[0] - from[0]) * fraction, from[1] + (to[1] - from[1]) * fraction];
}