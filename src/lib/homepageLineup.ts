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

/** Laptops show the first six campaigns (a big card, four small ones, a second big card); phones show all 24. */
export const LAPTOP_SHOWN = 6;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
type PinAt = readonly [id: string, index: number];
const pinsOf = (list: string[], pinned: ReadonlySet<string>): PinAt[] => list.flatMap((id, index) => (pinned.has(id) ? [[id, index] as const] : []));

/**
 * Puts pinned campaigns at their positions and fills the free positions with `rest`, in order. A pin past
 * the end (the list got shorter) moves to the nearest free position before it.
 */
export function reflow(rest: string[], pins: ReadonlyArray<PinAt>, size = rest.length + pins.length): string[] {
  const slots: (string | undefined)[] = new Array(Math.max(0, size)).fill(undefined);
  for (const [id, index] of pins) {
    let at = Math.min(index, slots.length - 1);
    while (at > 0 && slots[at] !== undefined) at--;
    while (at < slots.length && slots[at] !== undefined) at++;
    if (at >= 0 && at < slots.length) slots[at] = id;
  }
  let next = 0;
  for (let i = 0; i < slots.length; i++) if (slots[i] === undefined) slots[i] = rest[next++];
  return slots.filter((id): id is string => !!id);
}

/**
 * Moves the campaign at `from` to `to`. Pinned campaigns keep their positions and the others flow around
 * them; dropped on a pinned position, a campaign stops next to it. A pinned campaign that is moved takes its
 * pin along (and swaps with another pin it lands on).
 */
export function moveWithPins(list: string[], pinned: ReadonlySet<string>, from: number, to: number): string[] {
  if (from < 0 || from >= list.length) return list;
  to = clamp(to, 0, list.length - 1);
  if (from === to) return list;
  const id = list[from];
  const rest = list.filter((x) => !pinned.has(x) && x !== id);
  if (pinned.has(id)) {
    const pins = pinsOf(list, pinned).filter(([p]) => p !== id).map(([p, i]) => (i === to ? [p, from] as const : [p, i] as const));
    return reflow(rest, [...pins, [id, to]], list.length);
  }
  const pins = pinsOf(list, pinned);
  const taken = new Set(pins.map(([, i]) => i));
  let at = to;
  if (to > from) while (at > from && taken.has(at)) at--;
  else while (at < from && taken.has(at)) at++;
  let slot = 0;
  for (let i = 0; i < at; i++) if (!taken.has(i)) slot++;
  rest.splice(slot, 0, id);
  return reflow(rest, pins, list.length);
}

/** Puts a campaign that isn't in the list yet at `to`; pinned campaigns keep their positions. */
export function insertWithPins(list: string[], pinned: ReadonlySet<string>, id: string, to: number): string[] {
  const base = list.filter((x) => x !== id);
  const pins = pinsOf(base, pinned);
  const taken = new Set(pins.map(([, i]) => i));
  let at = clamp(to, 0, base.length);
  while (at < base.length && taken.has(at)) at++;
  let slot = 0;
  for (let i = 0; i < at; i++) if (!taken.has(i)) slot++;
  const rest = base.filter((x) => !pinned.has(x));
  rest.splice(slot, 0, id);
  return reflow(rest, pins, base.length + 1);
}

/** Takes a campaign out of the list; pinned campaigns keep their positions. */
export function removeWithPins(list: string[], pinned: ReadonlySet<string>, id: string): string[] {
  if (!list.includes(id)) return list;
  return reflow(list.filter((x) => !pinned.has(x) && x !== id), pinsOf(list, pinned).filter(([p]) => p !== id), list.length - 1);
}

/** Moves several campaigns to the top, in the order given; pinned campaigns keep their positions. */
export function moveToTopWithPins(list: string[], pinned: ReadonlySet<string>, ids: string[]): string[] {
  const lead = ids.filter((id, i) => list.includes(id) && !pinned.has(id) && ids.indexOf(id) === i);
  const rest = list.filter((x) => !pinned.has(x) && !lead.includes(x));
  return reflow([...lead, ...rest], pinsOf(list, pinned), list.length);
}

/** Swaps the campaigns at two positions (a pinned one takes its pin along). */
export function swapAt(list: string[], a: number, b: number): string[] {
  if (a === b || a < 0 || b < 0 || a >= list.length || b >= list.length) return list;
  const out = [...list];
  [out[a], out[b]] = [out[b], out[a]];
  return out;
}

/**
 * The lineup to save for a homepage order: every campaign up to the last one that must keep its place (the
 * ones already placed and the ones just moved). Campaigns after it fill in automatically.
 */
export function lineupPrefix(list: string[], keep: ReadonlySet<string>): string[] {
  let last = -1;
  list.forEach((id, index) => { if (keep.has(id)) last = index; });
  return list.slice(0, last + 1);
}

export type LineupDraft = { order: string[]; hidden: string[]; pinned: string[] };

/** What a draft changes compared with the saved lineup, for the save bar. */
export function lineupChanges(saved: LineupDraft, draft: LineupDraft) {
  const was = new Map(saved.order.map((id, i) => [id, i]));
  const now = new Set(draft.order);
  const hiddenBefore = new Set(saved.hidden);
  const hiddenNow = new Set(draft.hidden);
  const pinnedBefore = new Set(saved.pinned);
  const pinnedNow = new Set(draft.pinned);
  return {
    added: draft.order.filter((id) => !was.has(id)).length,
    moved: draft.order.filter((id, i) => was.has(id) && was.get(id) !== i).length,
    removed: saved.order.filter((id) => !now.has(id) && !hiddenNow.has(id)).length,
    hidden: draft.hidden.filter((id) => !hiddenBefore.has(id)).length,
    shown: saved.hidden.filter((id) => !hiddenNow.has(id)).length,
    pinned: draft.pinned.filter((id) => !pinnedBefore.has(id)).length,
    unpinned: saved.pinned.filter((id) => !pinnedNow.has(id) && now.has(id)).length,
  };
}

/**
 * Shuffle in Admin → Homepage: every open campaign that isn't hidden gets a random position, except pinned
 * ones, which keep the position they have. `order` is the current lineup, `pool` the open, not-hidden ids.
 */
export function shuffleLineup(order: string[], pinned: ReadonlySet<string>, pool: string[], random: () => number = Math.random): string[] {
  const kept = pinsOf(order, pinned);
  const keptIds = new Set(kept.map(([id]) => id));
  const rest = [...new Set(pool)].filter((id) => !keptIds.has(id));
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  // Pinned campaigns stay at their position (or the nearest free one before it if the list got shorter).
  return reflow(rest, kept, Math.min(LINEUP_MAX, kept.length + rest.length));
}
