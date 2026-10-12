import { MIN_SHARE } from '@/lib/donationSplit';
import { usd } from './retailers';

/** Shared spring for everything in the donate card, so steps, bars and numbers move as one. */
export const SPRING = { type: 'spring', stiffness: 380, damping: 36, mass: 0.9 } as const;
export const SOFT_SPRING = { type: 'spring', stiffness: 170, damping: 26 } as const;
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const PRESET_AMOUNTS = [10, 25, 50, 100, 250] as const;
export const MAX_AMOUNT = 10000;

export type SplitMode = 'even' | 'custom';

export function amountProblem(amount: number, minimum: number, retailers: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return 'Enter an amount in whole dollars.';
  if (amount < minimum) return retailers > 1 ? `Enter at least ${usd.format(minimum)}, so each retailer gets ${usd.format(MIN_SHARE)} or more.` : `Enter at least ${usd.format(minimum)}.`;
  if (amount > MAX_AMOUNT) return `The most we can take online in one gift is ${usd.format(MAX_AMOUNT)}.`;
  return null;
}
