/**
 * Thanksgiving offer (founder request, Nov 17, 2026): every family that starts a fundraiser by
 * Thanksgiving (Nov 26, 2026) gets a free $10 store gift card from CouponDonation, one per fundraiser,
 * added to the fundraiser by the team. The green bar at the top of the site shows it on Nov 17 only
 * (Eastern Time); after that the Holiday Giving Drive bar comes back by itself.
 */
export const THANKSGIVING = {
  id: 'thanksgiving-2026',
  value: 10,
  /** Fundraisers started by this day qualify. */
  byShort: 'Nov 26',
  byLabel: 'November 26, 2026',
  /** The bar shows until Nov 17, 2026, 11:59 PM Eastern Time. */
  barEndsAt: '2026-11-18T04:59:59Z',
  href: '/apply',
} as const;

/** True while the bar shows, by the visitor's clock. `?thanksgiving=1` or `=0` forces it for checks. */
export function isThanksgivingBarLive(now: Date = new Date(), search = ''): boolean {
  const forced = new URLSearchParams(search).get('thanksgiving');
  if (forced === '1') return true;
  if (forced === '0') return false;
  return now.getTime() <= Date.parse(THANKSGIVING.barEndsAt);
}

export const THANKSGIVING_BAR_LIVE = typeof window !== 'undefined' && isThanksgivingBarLive(new Date(), window.location.search);

const CLOSED_KEY = 'cd:offer-bar-closed';
export function thanksgivingBarClosed(): boolean {
  try { return sessionStorage.getItem(CLOSED_KEY) === THANKSGIVING.id; } catch { return false; }
}
export function closeThanksgivingBar() {
  try { sessionStorage.setItem(CLOSED_KEY, THANKSGIVING.id); } catch { /* private mode */ }
}
