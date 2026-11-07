import { LEGAL_EMAIL } from '@/lib/legal';

/**
 * The Holiday Giving Drive (founder request, Nov 2026): one place for its facts, so the header bar
 * (gold coins), the sticker on the hero's Donate button ($1,000) and the prizes-and-terms pop-up
 * always agree. Change a prize or a date here and every place follows.
 */
export const DRIVE = {
  id: 'holiday-2026',
  name: 'Holiday Giving Drive',
  /** Gifts and free entries count from this day (Eastern Time). */
  startLabel: 'November 6, 2026',
  /** January 15, 2027, 11:59 PM Eastern Time. */
  endsAt: '2027-01-16T04:59:59Z',
  endLabel: 'January 15, 2027',
  endShort: 'Jan 15',
  minGift: 10,
  /** Residents of these states can't win (sweepstakes registration and bond rules; founder's choice). */
  excludedStates: ['New York', 'Florida'],
  gifts: { count: 100, value: 1000 },
  /** A real (physical) gold coin, founder-confirmed Nov 6, 2026; not the site's Gold Coins points. */
  goldCoins: { count: 5, name: 'real gold coin' },
  giftCards: { count: 5, value: 500 },
  /** Draws happen within this many days after the drive ends; winners hear within as many days again. */
  drawWithinDays: 7,
  replyWithinDays: 14,
  freeEntry: { email: LEGAL_EMAIL, subject: 'Giving Drive entry' },
} as const;

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const driveMoney = (value: number) => money.format(value);

/** Every prize in the drive (100 gifts + 5 real gold coins + 5 gift cards = 110): the bar's "110 chances to win". */
export const DRIVE_PRIZES = DRIVE.gifts.count + DRIVE.goldCoins.count + DRIVE.giftCards.count;

/**
 * True while the drive runs, by the visitor's own clock (decided once per visit). `?drive=1` or
 * `?drive=0` forces it on or off for checks.
 */
export function isDriveLive(now: Date = new Date(), search = ''): boolean {
  const forced = new URLSearchParams(search).get('drive');
  if (forced === '1') return true;
  if (forced === '0') return false;
  return now.getTime() <= Date.parse(DRIVE.endsAt);
}

export const DRIVE_LIVE = typeof window !== 'undefined' && isDriveLive(new Date(), window.location.search);

/** The pop-up with the prizes and the terms is mounted once at app level (DriveTermsHost). */
export const DRIVE_TERMS_EVENT = 'cd:drive-terms';

/** Opens the pop-up; the element that asked gets focus back when it closes. */
export function openDriveTerms(event?: { currentTarget: EventTarget | null }) {
  window.dispatchEvent(new CustomEvent<EventTarget | null>(DRIVE_TERMS_EVENT, { detail: event?.currentTarget ?? null }));
}

let dialogModule: Promise<unknown> | null = null;
/** Loads the pop-up's code ahead of a tap (hover, focus, touch), so it opens at once. */
export function prefetchDriveTerms() {
  dialogModule ??= import('@/components/drive/DriveTermsDialog').catch((error) => { dialogModule = null; throw error; });
  return dialogModule;
}

/** The bar can be closed for the rest of a visit; it comes back on the next visit. */
const CLOSED_KEY = 'cd-drive-bar-closed';
export function driveBarClosed(): boolean {
  try { return sessionStorage.getItem(CLOSED_KEY) === DRIVE.id; } catch { return false; }
}
export function closeDriveBar() {
  try { sessionStorage.setItem(CLOSED_KEY, DRIVE.id); } catch { /* private mode */ }
}
