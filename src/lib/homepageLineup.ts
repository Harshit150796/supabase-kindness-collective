/**
 * The homepage lineup the team sets in Admin → Homepage (founder request, Nov 9, 2026). Placed campaigns
 * lead "Fundraisers open now" in their positions in the Trending view; every other open campaign follows in
 * the site's ranked order; hidden campaigns never show on the homepage. Stored in homepage_placements and
 * saved only through admin_set_homepage_lineup.
 */
export type Placement = { fundraiser_id: string; position: number | null; hidden: boolean };

/** How many campaigns the homepage section shows. */
export const HOMEPAGE_LIMIT = 24;

/** Placed ids in position order, and the hidden ids. */
export function splitLineup(placements: Placement[]): { order: string[]; hidden: Set<string> } {
  const order = placements.filter((p) => !p.hidden && p.position != null).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((p) => p.fundraiser_id);
  return { order, hidden: new Set(placements.filter((p) => p.hidden).map((p) => p.fundraiser_id)) };
}

/**
 * The list without hidden campaigns. With `placeFirst` (the Trending view), placed campaigns come first in
 * their positions and the rest keep the order they arrived in. Placed campaigns that aren't open are skipped.
 */
export function applyLineup<T extends { id: string }>(list: T[], placements: Placement[], placeFirst: boolean): T[] {
  const { order, hidden } = splitLineup(placements);
  const visible = list.filter((f) => !hidden.has(f.id));
  if (!placeFirst || !order.length) return visible;
  const byId = new Map(visible.map((f) => [f.id, f]));
  const placed = order.map((id) => byId.get(id)).filter((f): f is T => !!f);
  const placedIds = new Set(placed.map((f) => f.id));
  return [...placed, ...visible.filter((f) => !placedIds.has(f.id))];
}
