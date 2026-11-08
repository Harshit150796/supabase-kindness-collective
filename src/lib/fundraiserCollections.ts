/**
 * The homepage's fundraiser collections (founder request, Nov 2026), modelled on GoFundMe's homepage
 * switcher ("Nearby ▾": Close to goal, Just launched, Needs momentum, Happening worldwide…). Each
 * collection picks and orders fundraisers and puts one short label on every photo, like GoFundMe's
 * "97% funded", "5 d ago" and "595 donations". Nearby is left out until the site knows where a visitor is.
 * The list passed in is already in the site's ranked order (src/lib/fundraiserRanking.ts).
 */
import { hasSupport, type RankableFundraiser } from './fundraiserRanking';

export type CollectionId = 'trending' | 'close' | 'new' | 'momentum';

export const COLLECTIONS: ReadonlyArray<{ id: CollectionId; label: string; description: string }> = [
  { id: 'trending', label: 'Trending', description: 'Fundraisers with the most recent support' },
  { id: 'close', label: 'Close to goal', description: 'Fundraisers nearest their goal' },
  { id: 'new', label: 'Just launched', description: 'Fundraisers started in the last 30 days' },
  { id: 'momentum', label: 'Needs momentum', description: 'Fundraisers that need a little boost' },
];

const DAY = 86_400_000;
/** "Just launched" covers fundraisers started in the last 30 days. */
export const NEW_DAYS = 30;
/** "Needs momentum" covers fundraisers below half their goal. */
const MOMENTUM_SHARE = 0.5;

const time = (s: string) => { const t = Date.parse(s); return Number.isFinite(t) ? t : 0; };
/** Share of the goal raised (0 when there is no goal). */
export const funded = (f: RankableFundraiser) => (f.monthly_goal && f.monthly_goal > 0 ? Math.max(0, f.live_raised) / f.monthly_goal : 0);

/** The fundraisers in a collection, in the order they are shown. */
export function collect<T extends RankableFundraiser>(list: T[], id: CollectionId, now = Date.now()): T[] {
  switch (id) {
    case 'close':
      return list.filter((f) => hasSupport(f) && funded(f) > 0).sort((a, b) => funded(b) - funded(a) || time(b.created_at) - time(a.created_at));
    case 'new':
      return list.filter((f) => now - time(f.created_at) <= NEW_DAYS * DAY).sort((a, b) => time(b.created_at) - time(a.created_at));
    case 'momentum':
      return list.filter((f) => funded(f) < MOMENTUM_SHARE).sort((a, b) => funded(a) - funded(b) || time(b.created_at) - time(a.created_at));
    default:
      return list;
  }
}

/** 1,234 → "1.2K", like GoFundMe's donation counts. */
export function compactCount(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k >= 10 ? Math.round(k) : Math.round(k * 10) / 10}K`;
}

/** How long ago something started: "Today", "3 d ago", "5 wk ago", "4 mo ago". */
export function launchedAgo(createdAt: string, now = Date.now()): string {
  const days = Math.floor(Math.max(0, now - time(createdAt)) / DAY);
  if (days < 1) return 'Today';
  if (days < 14) return `${days} d ago`;
  if (days < 60) return `${Math.floor(days / 7)} wk ago`;
  return `${Math.floor(days / 30)} mo ago`;
}

/** The label on a fundraiser's photo in a collection. */
export function photoLabel(f: RankableFundraiser, id: CollectionId, now = Date.now()): string {
  const gifts = Math.max(0, f.live_donations_count);
  const donations = gifts ? `${compactCount(gifts)} ${gifts === 1 ? 'donation' : 'donations'}` : 'No donations yet';
  if (id === 'close') return `${Math.floor(funded(f) * 100)}% funded`;
  if (id === 'new') return launchedAgo(f.created_at, now);
  return donations;
}
