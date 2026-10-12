import { assertEquals, assertAlmostEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { journeyScrollPoint, journeyScrollProgress, journeyScrollRange } from '../../../src/lib/journeyScrollTiming.ts';

Deno.test('journey reaches all four icons at equal scroll checkpoints', () => {
  const points = [[10, 20], [150, 20], [500, 20], [900, 20]] as const;
  for (let i = 0; i < 4; i++) assertEquals(journeyScrollPoint(points, i / 3), points[i]);
  assertEquals(journeyScrollPoint(points, 0.5), [325, 20]);
});
Deno.test('journey uses first and last icons for visible entry and finish', () => {
  assertEquals(journeyScrollRange(2000, 2000, 800), { start: 1424, end: 1744 });
  assertEquals(journeyScrollRange(2000, 2360, 800), { start: 1424, end: 2104 });
});
Deno.test('journey clamps endpoints and follows reverse scroll without elapsed time', () => {
  assertEquals(journeyScrollProgress(50, 100, 400), 0);
  assertEquals(journeyScrollProgress(450, 100, 400), 1);
  assertEquals([400, 300, 200, 100].map(y => journeyScrollProgress(y, 100, 400)), [1, 2 / 3, 1 / 3, 0]);
  assertAlmostEquals(journeyScrollProgress(250, 100, 400), 0.5);
});