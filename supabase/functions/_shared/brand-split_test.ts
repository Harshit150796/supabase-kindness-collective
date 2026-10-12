import { assert, assertEquals, assertThrows } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  SQUARE_METADATA_LIMIT, SplitError, brandRows, couponSlots, describeSplit, encodeSplit, normalizeSplit, parseSplit,
} from './brand-split.ts';
import { evenSplit, percentages } from '../../../src/lib/donationSplit.ts';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

Deno.test('the page\'s dollar split is kept exactly, and percentages always add up to 100', () => {
  const shares = normalizeSplit(25, [
    { brand: 'Walmart', brandId: 'walmart', percent: 36, amount: 9 },
    { brand: 'Target', brandId: 'target', percent: 32, amount: 8 },
    { brand: 'Kroger', brandId: 'kroger', percent: 32, amount: 8 },
  ]);
  assertEquals(shares.map((s) => s.amount), [9, 8, 8]);
  assertEquals(shares.map((s) => s.percent), [36, 32, 32]);
  assertEquals(sum(shares.map((s) => s.cents)), 2500);
});

Deno.test('every split the donate page can make passes the server check unchanged', () => {
  for (let total = 5; total <= 500; total += 1) {
    for (let n = 1; n <= 5 && n * 5 <= total; n++) {
      const dollars = evenSplit(total, n);
      const pct = percentages(dollars);
      const sent = dollars.map((a, i) => ({ brand: `Brand ${i}`, brandId: `brand${i}`, percent: pct[i], amount: a }));
      const shares = normalizeSplit(total, sent);
      assertEquals(shares.map((s) => s.amount), dollars);
      assertEquals(sum(shares.map((s) => s.percent)), 100);
      assert(shares.every((s) => s.percent >= 1));
    }
  }
});

Deno.test('amounts a few cents off are settled on the largest share; otherwise they become weights', () => {
  assertEquals(normalizeSplit(50, [{ brand: 'A', amount: 33.33 }, { brand: 'B', amount: 16.66 }]).map((s) => s.cents), [3334, 1666]);
  // Paid $60 but the page said $30/$20: keep the 3:2 proportion of what was actually paid.
  assertEquals(normalizeSplit(60, [{ brand: 'A', amount: 30 }, { brand: 'B', amount: 20 }]).map((s) => s.amount), [36, 24]);
  // Only percentages (older pages): shares come from them, to the cent.
  assertEquals(normalizeSplit(17.5, [{ brand: 'A', percent: 50 }, { brand: 'B', percent: 50 }]).map((s) => s.amount), [8.75, 8.75]);
  // Nothing usable: an even split.
  assertEquals(normalizeSplit(10, [{ brand: 'A' }, { brand: 'B' }, { brand: 'C' }]).map((s) => s.cents), [334, 333, 333]);
});

Deno.test('the checkout refuses splits the page would never send', () => {
  const six = Array.from({ length: 6 }, (_, i) => ({ brand: `B${i}`, amount: 10 }));
  assertThrows(() => normalizeSplit(60, six), SplitError, 'up to 5');
  assertThrows(() => normalizeSplit(100, [{ brand: 'A', amount: 99.5 }, { brand: 'B', amount: 0.5 }]), SplitError, 'at least $1');
  assertThrows(() => normalizeSplit(0, [{ brand: 'A', amount: 0 }]), SplitError);
});

Deno.test('repeated retailers merge, names are trimmed, and a lone brand takes everything', () => {
  const merged = normalizeSplit(30, [{ brand: 'Target', amount: 10 }, { brand: ' target ', amount: 10 }, { brand: 'Kroger', amount: 10 }]);
  assertEquals(merged.map((s) => [s.brand, s.amount]), [['Target', 20], ['Kroger', 10]]);
  assertEquals(normalizeSplit(40, null, { brand: 'Walmart', brandId: 'walmart' }).map((s) => [s.brand, s.amount, s.percent]), [['Walmart', 40, 100]]);
  assertEquals(normalizeSplit(40, [], {}), []);
});

Deno.test('the compact metadata fits Square for five of the longest retailer names', () => {
  const names = ['American Express', 'Panera Bread', 'Whole Foods', 'Home Depot', 'Mastercard'];
  const shares = normalizeSplit(10000, names.map((brand) => ({ brand, amount: 2000 })));
  const encoded = encodeSplit(shares);
  assert(encoded.length <= SQUARE_METADATA_LIMIT, String(encoded.length));
  // Even 28-character names (the longest the server keeps) with cents still fit.
  const long = normalizeSplit(9999.99, Array.from({ length: 5 }, (_, i) => ({ brand: `${'X'.repeat(27)}${i}`, amount: 1999.99 })));
  assert(encodeSplit(long).length <= SQUARE_METADATA_LIMIT, String(encodeSplit(long).length));
});

Deno.test('the webhook reads both the compact and the older long form, and never throws', () => {
  const compact = parseSplit({ brand_allocations: '[{"b":"Walmart","a":32.5},{"b":"Target","a":17.5}]' }, 50);
  assertEquals(compact.map((s) => [s.brand, s.amount, s.percent]), [['Walmart', 32.5, 65], ['Target', 17.5, 35]]);
  const legacy = parseSplit({ brand_allocations: '[{"brand":"Walmart","brandId":"walmart","percent":60,"amount":30},{"brand":"Target","brandId":"target","percent":40,"amount":20}]' }, 50);
  assertEquals(legacy.map((s) => s.amount), [30, 20]);
  // Cut-short JSON from an older Stripe checkout: the first retailer takes the gift rather than losing it.
  assertEquals(parseSplit({ brand_allocations: '[{"brand":"Walmart","perc', brand_name: 'Walmart' }, 25).map((s) => s.amount), [25]);
  assertEquals(parseSplit({}, 25), []);
  const seven = JSON.stringify(Array.from({ length: 7 }, (_, i) => ({ b: `B${i}`, a: 1 })));
  assertEquals(parseSplit({ brand_allocations: seven }, 5).length, 5);
});

Deno.test('each retailer gets one coupon slot for its whole share, nothing lost to rounding', () => {
  // The old rule turned $17.50 into three $5 slots and lost $2.50.
  const shares = parseSplit({ brand_allocations: '[{"b":"Walmart","a":32.5},{"b":"Target","a":17.5}]' }, 50);
  const slots = couponSlots(shares, 'd1', null, '2027-04-12');
  assertEquals(slots.map((s) => [s.store_name, s.value, s.expected_value, s.status, s.code]), [
    ['Walmart', 32.5, 32.5, 'pending_procurement', null],
    ['Target', 17.5, 17.5, 'pending_procurement', null],
  ]);
  assertEquals(sum(slots.map((s) => s.value)), 50);
  const rows = brandRows(shares, 'd1');
  assertEquals(rows.map((r) => [r.brand_name, r.allocation_percent, r.allocated_amount]), [['Walmart', 65, 32.5], ['Target', 35, 17.5]]);
  assertEquals(describeSplit(shares), 'Walmart ($32.50), Target ($17.50)');
  assertEquals(describeSplit(normalizeSplit(30, [{ brand: 'A', amount: 20 }, { brand: 'B', amount: 10 }])), 'A ($20), B ($10)');
});

Deno.test('a tiny share still gets a percentage of at least 1', () => {
  const shares = normalizeSplit(500, [{ brand: 'A', amount: 496 }, { brand: 'B', amount: 1 }, { brand: 'C', amount: 1 }, { brand: 'D', amount: 1 }, { brand: 'E', amount: 1 }]);
  assertEquals(shares.map((s) => s.percent), [96, 1, 1, 1, 1]);
});

Deno.test('checkouts and webhooks use the shared split, not their own arithmetic', async () => {
  for (const fn of ['create-donation-checkout', 'create-stripe-checkout', 'create-square-payment']) {
    const src = await Deno.readTextFile(`supabase/functions/${fn}/index.ts`);
    assert(src.includes("from '../_shared/brand-split.ts'"), fn);
    assert(src.includes('normalizeSplit(') && src.includes('encodeSplit(shares)'), fn);
    assert(!src.includes('.slice(0, 500)') || !src.includes('brand_allocations: JSON.stringify'), fn);
  }
  for (const fn of ['stripe-webhook', 'square-webhook']) {
    const src = await Deno.readTextFile(`supabase/functions/${fn}/index.ts`);
    assert(src.includes('parseSplit(metadata, amount)') && src.includes('couponSlots(') && src.includes('brandRows('), fn);
    assert(!src.includes('allocatedAmount >= 50 ? 10 : 5'), fn);
    assert(src.includes('procure-coupons'), fn);
  }
});
