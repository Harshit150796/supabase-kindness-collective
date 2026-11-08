/**
 * The order fundraisers are shown in (founder request, Nov 2026), modelled on GoFundMe, which leads with
 * fundraisers that already have support rather than the newest ones:
 *   1. Team picks (Admin → Fundraisers → Feature), lowest number first.
 *   2. Fundraisers with gifts, by momentum: how recent the last gift is, how much was raised, how many
 *      people gave and how close the goal is. Example campaigns are ranked the same way and stay labelled.
 *   3. Fundraisers with no gifts yet ("Be the first to give"), newest first.
 * Used by every public list (homepage, /stories, need pages, More fundraisers) through useFundraisers.
 */
export interface RankableFundraiser {
  created_at: string;
  monthly_goal: number | null;
  live_raised: number;
  live_donations_count: number;
  latest_donation_at?: string | null;
  featured_order?: number | null;
}

const DAY = 86_400_000;
/** A gift counts half as much toward "recent" after a week. */
const RECENCY_HALF_LIFE_DAYS = 7;

export const hasSupport = (f: RankableFundraiser) => f.live_donations_count > 0 || f.live_raised > 0;

/** Momentum of a fundraiser with gifts; higher is shown first. */
export function momentumScore(f: RankableFundraiser, now = Date.now()): number {
  const raised = Math.max(0, f.live_raised);
  const gifts = Math.max(0, f.live_donations_count);
  const goal = f.monthly_goal && f.monthly_goal > 0 ? Math.min(1, raised / f.monthly_goal) : 0;
  const last = f.latest_donation_at ? Date.parse(f.latest_donation_at) : NaN;
  const recency = Number.isFinite(last) ? 0.5 ** (Math.max(0, now - last) / DAY / RECENCY_HALF_LIFE_DAYS) : 0;
  return 3 * Math.log10(1 + raised) + 2 * Math.log10(1 + gifts) + 2 * goal + 4 * recency;
}

const time = (s: string) => { const t = Date.parse(s); return Number.isFinite(t) ? t : 0; };

/** A new array in display order; the input is left as it is. */
export function rankFundraisers<T extends RankableFundraiser>(list: T[], now = Date.now()): T[] {
  const tier = (f: T) => (f.featured_order != null ? 0 : hasSupport(f) ? 1 : 2);
  return [...list].sort((a, b) => {
    const ta = tier(a), tb = tier(b);
    if (ta !== tb) return ta - tb;
    if (ta === 0 && a.featured_order !== b.featured_order) return (a.featured_order ?? 0) - (b.featured_order ?? 0);
    if (ta === 1) {
      const d = momentumScore(b, now) - momentumScore(a, now);
      if (Math.abs(d) > 1e-9) return d;
    }
    return time(b.created_at) - time(a.created_at);
  });
}
