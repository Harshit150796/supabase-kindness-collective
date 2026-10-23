/**
 * What a donor pays at checkout, kept separate from what families get.
 *
 * The gift goes to families in full (one coupon slot per retailer, brand-split.ts). On top of it the
 * donor may add an optional tip for running CouponDonation, and may cover the card processing fee
 * (ticked by default on the donate page). When they don't cover it, the fee is paid from tips, never
 * from the gift. The donate page imports this same file, so the numbers it shows are the ones charged.
 * No imports: Deno and the browser both load it.
 */
export type Provider = 'square' | 'stripe';

/** Published US online card rates. Estimates only: the real fee is read back from the processor. */
export const CARD_RATES: Record<Provider, { percent: number; fixedCents: number }> = {
  square: { percent: 3.3, fixedCents: 30 },
  stripe: { percent: 2.9, fixedCents: 30 },
};

/** Tip choices on the donate page; DEFAULT_TIP_PERCENT starts selected (founder choice). */
export const TIP_PERCENTS = [5, 10, 15] as const;
/** What we tell donors is usual. */
export const TYPICAL_TIP_PERCENT = 15;
export const DEFAULT_TIP_PERCENT = 15;
export const MAX_TIP_CENTS = 100_000; // $1,000

export class ChargeError extends Error {}

export interface Charge {
  giftCents: number;
  tipCents: number;
  /** The card fee the donor chose to cover (0 when they didn't). */
  feeCents: number;
  totalCents: number;
}

const cents = (dollars: number) => Math.round(dollars * 100);

/** A tip of `percent` of the gift, to the cent. */
export function tipCentsFor(giftCents: number, percent: number): number {
  return Math.round((giftCents * percent) / 100);
}

/**
 * The fee to add so that, after the processor takes its cut of the whole charge, the gift and tip are
 * left intact: total = (base + fixed) / (1 - rate), rounded up to the cent.
 */
export function coveredFeeCents(baseCents: number, provider: Provider): number {
  if (baseCents <= 0) return 0;
  const { percent, fixedCents } = CARD_RATES[provider];
  const gross = Math.ceil((baseCents + fixedCents) / (1 - percent / 100));
  return gross - baseCents;
}

/** Checks what the page sent and works out the charge. Throws ChargeError for anything off. */
export function computeCharge(input: { gift: unknown; tip?: unknown; coverFee?: unknown; provider: Provider }): Charge {
  const gift = Number(input.gift);
  if (!Number.isFinite(gift) || gift <= 0) throw new ChargeError('The donation amount is missing.');
  const giftCents = cents(gift);
  const tip = input.tip === undefined || input.tip === null || input.tip === '' ? 0 : Number(input.tip);
  if (!Number.isFinite(tip) || tip < 0) throw new ChargeError('The tip must be a dollar amount.');
  const tipCents = cents(tip);
  if (tipCents > MAX_TIP_CENTS) throw new ChargeError('The most we can take as a tip is $1,000.');
  const feeCents = input.coverFee === true || input.coverFee === 'true' ? coveredFeeCents(giftCents + tipCents, input.provider) : 0;
  return { giftCents, tipCents, feeCents, totalCents: giftCents + tipCents + feeCents };
}

/** The metadata the webhooks read back: three short keys (Square allows ten in all). */
export function chargeMetadata(charge: Charge): Record<string, string> {
  return {
    amount: (charge.giftCents / 100).toString(), // the gift; older readers treat `amount` as the gift
    tip_amount: (charge.tipCents / 100).toString(),
    fee_covered: (charge.feeCents / 100).toString(),
  };
}

/**
 * Splits what was actually paid back into gift, tip and covered fee. Payments from older checkouts
 * (no tip metadata) or metadata that doesn't match the payment count entirely as the gift, so a
 * family is never short-changed by a bookkeeping mismatch.
 */
export function readPayment(metadata: Record<string, string | null | undefined>, paidCents: number) {
  const whole = { giftCents: paidCents, tipCents: 0, feeCents: 0 };
  if (metadata.tip_amount === undefined && metadata.fee_covered === undefined) return whole;
  const gift = cents(Number(metadata.amount));
  const tip = cents(Number(metadata.tip_amount ?? 0));
  const fee = cents(Number(metadata.fee_covered ?? 0));
  if (![gift, tip, fee].every((n) => Number.isFinite(n) && n >= 0) || gift <= 0) return whole;
  if (Math.abs(gift + tip + fee - paidCents) > 2) return whole;
  return { giftCents: paidCents - tip - fee, tipCents: tip, feeCents: fee };
}
