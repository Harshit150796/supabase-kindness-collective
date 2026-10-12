import { assertEquals, assertAlmostEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { journeyTravelPoint, journeyTravelPosition, journeyScrollPoint, journeyScrollProgress, journeyScrollRange, journeyScrollStop, journeyWheelStop } from '../../../src/lib/journeyScrollTiming.ts';

Deno.test('journey reaches all four icons at equal scroll checkpoints', () => {
  const points = [[10, 20], [150, 20], [500, 20], [900, 20]] as const;
  for (let i = 0; i < 4; i++) assertEquals(journeyScrollPoint(points, i / 3), points[i]);
  assertEquals(journeyScrollPoint(points, 0.5), points[2]);
  for (let i = 0; i <= 100; i++) {
    assertEquals(points.includes(journeyScrollPoint(points, i / 100) as typeof points[number]), true);
  }
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

Deno.test('four stages snap to Donation Allocation Coupon and Use without intermediate positions', () => {
  assertEquals([0, 0.24, 0.25, 0.49, 0.5, 0.74, 0.75, 1].map(p => journeyScrollStop(p)), [0, 0, 1, 1, 2, 2, 3, 3]);
});

Deno.test('three separate downward gestures advance from Donation to the cart and hold there', () => {
  let stop = 0;
  const stops = [stop];
  for (const time of [200, 400, 600, 800]) {
    stop = journeyWheelStop(stop, 100, time, time - 200);
    stops.push(stop);
  }
  assertEquals(stops, [0, 1, 2, 3, 3]);
});

Deno.test('wheel momentum is one gesture and upward gestures return one icon at a time', () => {
  assertEquals(journeyWheelStop(1, 80, 250, 200), 1);
  assertEquals(journeyWheelStop(1, 2, 400, 300), 1);
  assertEquals(journeyWheelStop(3, -100, 600, 400), 2);
  assertEquals(journeyWheelStop(0, -100, 600, 400), 0);
});

Deno.test('travel visibly crosses the line and lands exactly after 300ms per stop', () => {
  assertEquals(journeyTravelPosition(0, 1, 150), 0.5);
  assertEquals(journeyTravelPosition(0, 1, 300), 1);
  assertEquals(journeyTravelPosition(0, 1, 900), 1);
  assertEquals(journeyTravelPoint([[10, 20], [150, 20]], 0.5), [80, 20]);
});

Deno.test('reverse and retargeted travel follow intervening icons on stacked paths', () => {
  assertEquals(journeyTravelPosition(3, 2, 150), 2.5);
  const current = journeyTravelPosition(0, 1, 210);
  assertEquals(journeyTravelPosition(current, 2, 0), current);
  assertEquals(journeyTravelPosition(current, 2, 390), 2);
  assertEquals(journeyTravelPoint([[10, 20], [10, 100], [30, 200]], 1), [10, 100]);
  assertEquals(journeyTravelPoint([[10, 20], [10, 100], [30, 200]], 1.5), [20, 150]);
});