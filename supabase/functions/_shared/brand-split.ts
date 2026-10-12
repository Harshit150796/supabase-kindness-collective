/**
 * How a donation is shared between retailers, checked on the server.
 *
 * Donors choose whole-dollar shares on the donate page (src/lib/donationSplit.ts). The checkout
 * functions check those shares again here and carry them to the webhooks in a compact form that fits
 * Square's 255-character metadata values. Each retailer's share becomes ONE coupon slot holding its
 * full amount; the team turns that slot into real coupons by hand, sized for what families need.
 * Nothing here decides coupon sizes.
 */
export const MAX_RETAILERS = 5;
/** Every retailer gets at least $10, the same floor the donate page uses. */
export const MIN_SHARE_CENTS = 1000;
export const SQUARE_METADATA_LIMIT = 255;
const MAX_NAME = 28; // five names of this length, with cents, still fit Square's 255 characters
const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const USD_CENTS = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

export interface Share {
  brand: string;
  brandId: string;
  /** Exact share of the donation, in cents. Shares add up to the donation. */
  cents: number;
  /** The same share in dollars (two decimals). */
  amount: number;
  /** Whole percentage, at least 1, adding up to 100 (donation_brands.allocation_percent). */
  percent: number;
}

export class SplitError extends Error {}

export const brandIdOf = (brand: string) => brand.toLowerCase().replace(/\s+/g, '');

/** Splits `units` by `weights`; leftovers go to the largest remainders, so the sum is exact. */
export function apportion(units: number, weights: number[]): number[] {
  if (!weights.length) return [];
  const safe = weights.map((w) => (Number.isFinite(w) && w > 0 ? w : 0));
  const sum = safe.reduce((a, b) => a + b, 0);
  const use = sum > 0 ? safe : safe.map(() => 1);
  const total = sum > 0 ? sum : use.length;
  const raw = use.map((w) => (units * w) / total);
  const out = raw.map(Math.floor);
  let left = units - out.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; left > 0; k = (k + 1) % order.length, left--) out[order[k][1]]++;
  return out;
}

type Entry = { brand: string; brandId: string; amount: number | null; percent: number | null };

/** Accepts the page's `{brand, brandId, percent, amount}` and the compact `{b, a}`; merges repeats. */
function entries(raw: unknown): Entry[] {
  if (!Array.isArray(raw)) return [];
  const byKey = new Map<string, Entry>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const brand = String(r.brand ?? r.b ?? '').trim().slice(0, MAX_NAME);
    if (!brand) continue;
    const a = Number(r.amount ?? r.a);
    const p = Number(r.percent);
    const amount = r.amount ?? r.a;
    const entry: Entry = {
      brand,
      brandId: typeof r.brandId === 'string' && r.brandId.trim() ? r.brandId.trim().slice(0, MAX_NAME) : brandIdOf(brand),
      amount: amount !== undefined && amount !== null && Number.isFinite(a) && a >= 0 ? a : null,
      percent: r.percent !== undefined && r.percent !== null && Number.isFinite(p) && p >= 0 ? p : null,
    };
    const key = brand.toLowerCase();
    const prev = byKey.get(key);
    if (!prev) { byKey.set(key, entry); continue; }
    prev.amount = prev.amount !== null && entry.amount !== null ? prev.amount + entry.amount : null;
    prev.percent = prev.percent !== null && entry.percent !== null ? prev.percent + entry.percent : null;
  }
  return [...byKey.values()];
}

/** Whole percentages of `cents` that add up to 100, none below 1. */
function percentsOf(cents: number[]): number[] {
  const out = apportion(100, cents);
  for (let i = 0; i < out.length; i++) {
    if (out[i] >= 1) continue;
    const big = out.indexOf(Math.max(...out));
    out[big] -= 1 - out[i];
    out[i] = 1;
  }
  return out;
}

/**
 * Turns what the page sent into exact shares of `total` dollars.
 * Amounts that add up to the total (within 5 cents, settled on the largest share) are kept as sent;
 * otherwise the amounts, then the percentages, are used as weights; with neither the split is even.
 * strict (checkouts): too many retailers or a share under $10 throws SplitError.
 * lenient (webhooks, after the money has moved): never throws, keeps the first five, drops empty shares.
 */
export function normalizeSplit(
  total: number,
  raw: unknown,
  fallback: { brand?: string | null; brandId?: string | null } = {},
  strict = true,
): Share[] {
  const totalCents = Math.round(Number(total) * 100);
  if (!Number.isFinite(totalCents) || totalCents <= 0) {
    if (strict) throw new SplitError('The donation amount is missing.');
    return [];
  }
  let list = entries(raw);
  if (!list.length && fallback.brand && String(fallback.brand).trim()) {
    const brand = String(fallback.brand).trim().slice(0, MAX_NAME);
    list = [{ brand, brandId: fallback.brandId?.trim() || brandIdOf(brand), amount: null, percent: 100 }];
  }
  if (!list.length) return [];
  if (list.length > MAX_RETAILERS) {
    if (strict) throw new SplitError(`Choose up to ${MAX_RETAILERS} retailers.`);
    list = list.slice(0, MAX_RETAILERS);
  }

  let cents: number[];
  const amounts = list.every((e) => e.amount !== null) ? list.map((e) => Math.round((e.amount as number) * 100)) : null;
  const sent = amounts ? amounts.reduce((a, b) => a + b, 0) : 0;
  if (amounts && Math.abs(sent - totalCents) <= 5) {
    cents = amounts.slice();
    cents[cents.indexOf(Math.max(...cents))] += totalCents - sent;
  } else if (amounts && sent > 0) {
    cents = apportion(totalCents, amounts);
  } else if (list.every((e) => e.percent !== null)) {
    cents = apportion(totalCents, list.map((e) => e.percent as number));
  } else {
    cents = apportion(totalCents, list.map(() => 1));
  }

  if (strict && cents.some((c) => c < MIN_SHARE_CENTS)) throw new SplitError('Each retailer needs at least $10 of the donation.');
  const kept = list.map((e, i) => ({ e, c: cents[i] })).filter((x) => x.c > 0);
  const percent = percentsOf(kept.map((x) => x.c));
  return kept.map(({ e, c }, i) => ({ brand: e.brand, brandId: e.brandId, cents: c, amount: c / 100, percent: percent[i] }));
}

/** The compact form the checkouts store in `brand_allocations`: `[{"b":"Walmart","a":32.5}]`. */
export function encodeSplit(shares: Share[]): string {
  return JSON.stringify(shares.map((s) => ({ b: s.brand, a: s.amount })));
}

/** Reads `brand_allocations` (compact or the older long form) back into shares of what was actually paid. */
export function parseSplit(metadata: Record<string, string | null | undefined>, paid: number): Share[] {
  let raw: unknown = null;
  try {
    raw = metadata.brand_allocations ? JSON.parse(metadata.brand_allocations) : null;
  } catch {
    raw = null; // an older checkout could cut this JSON short; fall back to the first retailer
  }
  return normalizeSplit(paid, raw, { brand: metadata.brand_name, brandId: metadata.brand_id }, false);
}

/** One pending coupon slot per retailer, holding that retailer's whole share. */
export function couponSlots(shares: Share[], donationId: string, donorId: string | null, expiryDate: string) {
  return shares.map((s) => ({
    donation_id: donationId,
    donor_id: donorId,
    title: `${s.brand} Gift`,
    store_name: s.brand,
    value: s.amount,
    expected_value: s.amount,
    code: null,
    status: 'pending_procurement',
    expiry_date: expiryDate,
  }));
}

/** donation_brands rows: the exact amount each retailer was given. */
export function brandRows(shares: Share[], donationId: string) {
  return shares.map((s) => ({
    donation_id: donationId,
    brand_name: s.brand,
    allocation_percent: s.percent,
    allocated_amount: s.amount,
  }));
}

/** "Walmart ($30), Target ($20)" for the payment's line-item note. */
export function describeSplit(shares: Share[]): string {
  return shares.map((s) => `${s.brand} (${(s.cents % 100 ? USD_CENTS : USD).format(s.amount)})`).join(', ');
}
