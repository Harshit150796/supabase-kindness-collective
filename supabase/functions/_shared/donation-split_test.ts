import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { MIN_SHARE, distribute, evenSplit, minTotal, percentages, resizeShares, setShare } from '../../../src/lib/donationSplit.ts';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

Deno.test('an even split always adds up, spare dollars go to the first retailers', () => {
  assertEquals(evenSplit(25, 3), [9, 8, 8]);
  assertEquals(evenSplit(50, 2), [25, 25]);
  assertEquals(evenSplit(10, 1), [10]);
  assertEquals(evenSplit(101, 4), [26, 25, 25, 25]);
  for (let total = 5; total <= 500; total++) for (let n = 1; n <= 5; n++) assertEquals(sum(evenSplit(total, n)), total);
});

Deno.test('the smallest donation still gives each retailer its minimum', () => {
  assertEquals(minTotal(1), 5);
  assertEquals(minTotal(3), 15);
  assertEquals(minTotal(0), 5);
});

Deno.test('distribute splits by weight and keeps the exact sum', () => {
  assertEquals(distribute(10, [1, 1, 1]), [4, 3, 3]);
  assertEquals(distribute(7, [0, 0]), [4, 3]);
  assertEquals(distribute(100, [50, 30, 20]), [50, 30, 20]);
  assertEquals(sum(distribute(97, [3, 7, 11, 13])), 97);
});

Deno.test('moving one share rebalances the rest so the total never changes', () => {
  const start = evenSplit(100, 3); // 34, 33, 33
  const up = setShare(start, 0, 60);
  assertEquals(up[0], 60);
  assertEquals(sum(up), 100);
  assert(up.every((s) => s >= MIN_SHARE));

  // No share can push the others below the minimum.
  const max = setShare(start, 1, 1000);
  assertEquals(max, [5, 90, 5]);
  const min = setShare(start, 2, 0);
  assertEquals(min[2], MIN_SHARE);
  assertEquals(sum(min), 100);

  // Lowering a share gives the dollars back to the others.
  const down = setShare([60, 20, 20], 0, 40);
  assertEquals(down, [40, 30, 30]);

  // Exhaustive: every value on every row of several splits keeps the total and the minimum.
  for (const shares of [[25, 25], [9, 8, 8], [40, 30, 20, 5, 5], [5, 5, 5, 5, 80]]) {
    const total = sum(shares);
    for (let i = 0; i < shares.length; i++) {
      for (let v = -5; v <= total + 5; v++) {
        const next = setShare(shares, i, v);
        assertEquals(sum(next), total, `${shares} @${i}=${v}`);
        assert(next.every((s) => s >= MIN_SHARE && Number.isInteger(s)), `${shares} @${i}=${v} -> ${next}`);
      }
    }
  }
});

Deno.test('a single retailer always takes the whole donation', () => {
  assertEquals(setShare([50], 0, 10), [50]);
  assertEquals(resizeShares([50], 75), [75]);
});

Deno.test('changing the amount keeps the chosen proportions', () => {
  assertEquals(resizeShares([60, 20, 20], 100), [60, 20, 20]);
  assertEquals(resizeShares([60, 20, 20], 50), [30, 10, 10]);
  assertEquals(resizeShares([60, 20, 20], 15), [5, 5, 5]);
  for (let total = 15; total <= 500; total += 7) {
    const next = resizeShares([70, 20, 10], total);
    assertEquals(sum(next), total);
    assert(next.every((s) => s >= MIN_SHARE));
  }
});

Deno.test('percentages for older readers add up to exactly 100', () => {
  assertEquals(percentages([9, 8, 8]), [36, 32, 32]);
  assertEquals(sum(percentages([1, 1, 1])), 100);
  for (const shares of [[5, 5, 5, 5, 5], [7, 11, 13], [499, 1], [33, 33, 34]]) assertEquals(sum(percentages(shares)), 100);
});
