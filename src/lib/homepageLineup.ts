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

/** The most campaigns a lineup can place (admin_set_homepage_lineup). */
export const LINEUP_MAX = 100;

/**
 * Shuffle in Admin → Homepage: every open campaign that isn't hidden gets a random position, except pinned
 * ones, which keep the position they have. `order` is the current lineup, `pool` the open, not-hidden ids.
 */
export function shuffleLineup(order: string[], pinned: ReadonlySet<string>, pool: string[], random: () => number = Math.random): string[] {
  const kept = order.map((id, index) => ({ id, index })).filter((x) => pinned.has(x.id));
  const keptIds = new Set(kept.map((x) => x.id));
  const rest = [...new Set(pool)].filter((id) => !keptIds.has(id));
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  const size = Math.min(LINEUP_MAX, kept.length + rest.length);
  const slots: (string | undefined)[] = new Array(size).fill(undefined);
  // Pinned campaigns stay at their position (or the nearest free one before it if the list got shorter).
  for (const { id, index } of kept) {
    let at = Math.min(index, size - 1);
    while (at > 0 && slots[at] !== undefined) at--;
    while (at < size && slots[at] !== undefined) at++;
    if (at < size) slots[at] = id;
  }
  let next = 0;
  for (let i = 0; i < size; i++) if (slots[i] === undefined) slots[i] = rest[next++];
  return slots.filter((id): id is string => !!id);
}
