/**
 * How a donation is shared between retailers, in whole dollars that always add up to the total.
 * Every retailer keeps at least MIN_SHARE; moving one share takes from (or gives to) the others in
 * proportion, so there is never a "must add up to 100%" state to get stuck in. The server checks the
 * same rules again (supabase/functions/_shared/brand-split.ts).
 */
export const MIN_SHARE = 5;
export const MAX_RETAILERS = 5;

/** The smallest donation that still gives every retailer its minimum share. */
export const minTotal = (retailers: number) => MIN_SHARE * Math.max(1, retailers);

/** Splits `amount` whole dollars by `weights`; leftovers go to the largest remainders, so the sum is exact. */
export function distribute(amount: number, weights: number[]): number[] {
  if (!weights.length) return [];
  const sum = weights.reduce((a, b) => a + Math.max(0, b), 0);
  const safe = sum > 0 ? weights.map((w) => Math.max(0, w)) : weights.map(() => 1);
  const total = sum > 0 ? sum : safe.length;
  const raw = safe.map((w) => (amount * w) / total);
  const out = raw.map(Math.floor);
  let left = amount - out.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; left > 0; k = (k + 1) % order.length, left--) out[order[k][1]]++;
  return out;
}

/** Equal shares; the first retailers take any spare dollar ($25 over three is 9, 8, 8). */
export function evenSplit(total: number, retailers: number): number[] {
  if (retailers <= 0) return [];
  return distribute(total, Array.from({ length: retailers }, () => 1));
}

/**
 * Sets one retailer's share and rebalances the rest so the total stays exact. A larger share is taken
 * from the others in proportion to what they have above the minimum; a smaller one is given back in
 * proportion to their shares.
 */
export function setShare(shares: number[], index: number, value: number, min = MIN_SHARE): number[] {
  const n = shares.length;
  const total = shares.reduce((a, b) => a + b, 0);
  if (n <= 1) return [total];
  const target = Math.round(Math.min(Math.max(value, min), total - min * (n - 1)));
  const delta = target - shares[index];
  if (!delta) return shares.slice();
  const others = shares.map((s, i) => (i === index ? 0 : s));
  const next = shares.slice();
  next[index] = target;
  if (delta > 0) {
    const room = others.map((s, i) => (i === index ? 0 : s - min));
    const taken = distribute(delta, room);
    taken.forEach((t, i) => { if (i !== index) next[i] -= t; });
  } else {
    const given = distribute(-delta, others);
    given.forEach((g, i) => { if (i !== index) next[i] += g; });
  }
  return next;
}

/** Keeps the shares' proportions when the total changes; each stays at or above the minimum. */
export function resizeShares(shares: number[], total: number, min = MIN_SHARE): number[] {
  const n = shares.length;
  if (!n) return [];
  if (n === 1) return [total];
  if (total <= min * n) return evenSplit(total, n);
  const out = distribute(total, shares);
  // Lift anyone under the minimum, taking the difference from those above it.
  const short = out.reduce((a, s) => a + Math.max(0, min - s), 0);
  if (!short) return out;
  const lifted = out.map((s) => Math.max(s, min));
  const taken = distribute(short, out.map((s) => Math.max(0, s - min)));
  return lifted.map((s, i) => s - taken[i]);
}

/** Whole percentages that add up to exactly 100, for systems that still read percentages. */
export function percentages(shares: number[]): number[] {
  return distribute(100, shares);
}
