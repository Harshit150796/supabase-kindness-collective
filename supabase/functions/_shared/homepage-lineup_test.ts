// Admin → Homepage lineup (src/lib/homepageLineup.ts, AdminHomepage, ImpactStories).
import { assert, assertEquals } from 'jsr:@std/assert@1';
import {
  applyLineup, HOMEPAGE_LIMIT, insertWithPins, LAPTOP_SHOWN, lineupChanges, lineupPrefix, LINEUP_MAX, moveToTopWithPins, moveWithPins, reflow, removeWithPins,
  shuffleLineup, splitLineup, swapAt, type Placement,
} from '../../../src/lib/homepageLineup.ts';

const ranked = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id }));
const lineup: Placement[] = [
  { fundraiser_id: 'd', position: 1, hidden: false },
  { fundraiser_id: 'b', position: 2, hidden: false },
  { fundraiser_id: 'c', position: null, hidden: true },
  { fundraiser_id: 'gone', position: 3, hidden: false },
];

Deno.test('Trending: placed campaigns first in their positions, then the rest in ranked order; hidden ones never', () => {
  assertEquals(applyLineup(ranked, lineup, true).map((f) => f.id), ['d', 'b', 'a', 'e']);
});

Deno.test('other views keep their own order but still leave hidden campaigns out', () => {
  assertEquals(applyLineup(ranked, lineup, false).map((f) => f.id), ['a', 'b', 'd', 'e']);
});

Deno.test('no lineup saved: the homepage keeps its automatic order', () => {
  assertEquals(applyLineup(ranked, [], true).map((f) => f.id), ['a', 'b', 'c', 'd', 'e']);
  assertEquals(splitLineup(lineup).order, ['d', 'b', 'gone']);
  assert(splitLineup(lineup).hidden.has('c'));
  assertEquals(HOMEPAGE_LIMIT, 24);
});

const read = (p: string) => Deno.readTextFileSync(new URL(`../../../${p}`, import.meta.url));

Deno.test('the homepage applies the lineup: positions in Trending only, hidden everywhere on the homepage', () => {
  const home = read('src/components/landing/ImpactStories.tsx');
  assert(home.includes('useHomepageLineup()'));
  assert(home.includes("lineup.data ?? [], view.collection === 'trending')"), 'positions apply to the Trending view');
  assert(home.includes('applyLineup(open, lineup.data ?? [], false)'), 'need filters come from the visible campaigns');
  assert(home.includes('.slice(0, HOMEPAGE_LIMIT)'));
});

Deno.test('Admin → Homepage is a portal page that saves through the audited staff-only function', () => {
  const page = read('src/pages/admin/AdminHomepage.tsx');
  assert(page.includes("rpc('admin_set_homepage_lineup', { _order: order, _hidden: hidden, _pinned: pinned })"));
  assert(read('src/pages/admin/adminPages.ts').includes("'/admin/homepage': () => import('./AdminHomepage')"));
  assert(read('src/App.tsx').includes("['/admin/homepage', adminPage('/admin/homepage')]"));
  assert(read('src/components/admin/AdminLayout.tsx').includes("{ label: 'Homepage', path: '/admin/homepage', icon: LayoutTemplate }"));
  // Visitors read the lineup; nothing in the browser writes it.
  const parts = ['LineupList', 'LineupPreview', 'CampaignShelf', 'parts'].map((f) => read(`src/components/admin/homepage/${f}.tsx`)).join('\n');
  assert(!/from\('homepage_placements'\)\s*\.(insert|update|upsert|delete)/.test(page + parts + read('src/hooks/useHomepageLineup.ts')));
});

Deno.test('the editor: one homepage list that drags by mouse, touch and keyboard, with a preview, undo and the other controls', () => {
  const page = read('src/pages/admin/AdminHomepage.tsx');
  const row = read('src/components/admin/homepage/LineupList.tsx');
  // Placed campaigns, then the automatic ones up to position 24, all in one sortable list.
  assert(page.includes('const list = useMemo(() => [...order, ...autoShown.map((f) => f.id)]'));
  assert(page.includes('<SortableContext items={list.map((id) => `row:${id}`)} strategy={strategy}>'));
  assert(page.includes('useSensor(MouseSensor') && page.includes('useSensor(TouchSensor') && page.includes('useSensor(KeyboardSensor'), 'mouse, touch and keyboard');
  assert(page.includes('moveWithPins(list, pinSet, activeIndex, overIndex)'), 'rows make room around pinned ones while dragging');
  assert(page.includes('<LineupPreview ') && page.includes("dispatch({ type: 'undo' })") && page.includes("event.key.toLowerCase() === 's'"));
  assert(page.includes('<Shuffle ') && page.includes('shuffleLineup(order, pinSet,'));
  assert(row.includes('aria-pressed={row.pinned}') && row.includes('<PositionField ') && row.includes('Swap with'));
  for (const kind of ['laptop', 'phone', 'off', 'auto']) assert(page.includes(`<Boundary kind="${kind}" />`));
  assertEquals(LAPTOP_SHOWN, 6);
});

Deno.test('moving a campaign: pinned ones keep their positions and the rest flow around them', () => {
  const list = ['a', 'b', 'p', 'c', 'd'];
  const pins = new Set(['p']);
  assertEquals(moveWithPins(list, pins, 0, 4), ['b', 'c', 'p', 'd', 'a']);
  assertEquals(moveWithPins(list, pins, 4, 0), ['d', 'a', 'p', 'b', 'c']);
  // Dropped on a pinned position, it stops next to it on the side it came from.
  assertEquals(moveWithPins(list, pins, 0, 2), ['b', 'a', 'p', 'c', 'd']);
  assertEquals(moveWithPins(list, pins, 4, 2), ['a', 'b', 'p', 'd', 'c']);
  // A pinned campaign that is moved takes its pin along; landing on another pin swaps the two.
  assertEquals(moveWithPins(list, pins, 2, 0), ['p', 'a', 'b', 'c', 'd']);
  assertEquals(moveWithPins(['q', 'a', 'p'], new Set(['p', 'q']), 2, 0), ['p', 'a', 'q']);
  assertEquals(moveWithPins(list, new Set(), 1, 3), ['a', 'p', 'c', 'b', 'd']);
  assertEquals(moveWithPins(list, pins, 3, 3), list);
});

Deno.test('adding, taking out, moving to the top and swapping keep pins in place', () => {
  const pins = new Set(['p']);
  assertEquals(insertWithPins(['a', 'p', 'b'], pins, 'n', 0), ['n', 'p', 'a', 'b']);
  assertEquals(insertWithPins(['p', 'a'], pins, 'n', 0), ['p', 'n', 'a'], 'a pin at the top stays at the top');
  assertEquals(insertWithPins(['a', 'p'], pins, 'n', 9), ['a', 'p', 'n']);
  assertEquals(removeWithPins(['a', 'b', 'p', 'c'], pins, 'a'), ['b', 'c', 'p']);
  assertEquals(removeWithPins(['a', 'p'], pins, 'a'), ['p'], 'a pin past the end moves to the nearest position');
  assertEquals(moveToTopWithPins(['a', 'p', 'b', 'c'], pins, ['c', 'b']), ['c', 'p', 'b', 'a']);
  assertEquals(swapAt(['a', 'b', 'c'], 0, 2), ['c', 'b', 'a']);
  assertEquals(reflow(['x', 'y'], [['p', 0]]), ['p', 'x', 'y']);
});

Deno.test('the saved lineup runs to the last campaign that must keep its place; the rest fill in automatically', () => {
  assertEquals(lineupPrefix(['a', 'b', 'c', 'd'], new Set(['b'])), ['a', 'b']);
  assertEquals(lineupPrefix(['a', 'b'], new Set()), []);
  const saved = { order: ['a', 'b', 'c'], hidden: ['h'], pinned: ['a'] };
  assertEquals(lineupChanges(saved, { order: ['b', 'a', 'c', 'n'], hidden: [], pinned: ['a', 'b'] }), { added: 1, moved: 2, removed: 0, hidden: 0, shown: 1, pinned: 1, unpinned: 0 });
  assertEquals(lineupChanges(saved, { order: ['a'], hidden: ['h', 'b'], pinned: [] }), { added: 0, moved: 0, removed: 1, hidden: 1, shown: 0, pinned: 0, unpinned: 1 });
});

/** A repeatable stand-in for Math.random. */
const seeded = (seed: number) => () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };

Deno.test('Shuffle: every open, not-hidden campaign gets a random position; pinned ones keep theirs', () => {
  const pool = ['a', 'b', 'c', 'd', 'e', 'f'];
  const order = ['c', 'a', 'f'];
  for (let seed = 1; seed < 40; seed++) {
    const out = shuffleLineup(order, new Set(['a']), pool, seeded(seed));
    assertEquals(out.length, 6);
    assertEquals(new Set(out).size, 6);
    assertEquals(out[1], 'a', 'pinned at position 2 stays at position 2');
  }
  const orders = new Set(Array.from({ length: 30 }, (_, i) => shuffleLineup(order, new Set(), pool, seeded(i + 1)).join('')));
  assert(orders.size > 10, 'different shuffles give different orders');
});

Deno.test('Shuffle keeps several pins, skips hidden ones and respects the 100-campaign cap', () => {
  const out = shuffleLineup(['x', 'a', 'y', 'b'], new Set(['x', 'y']), ['a', 'b', 'c', 'x', 'y'], seeded(7));
  assertEquals([out[0], out[2]], ['x', 'y']);
  assertEquals(new Set(out), new Set(['a', 'b', 'c', 'x', 'y']));
  // A pinned campaign whose position is now past the end moves to the last free spot.
  assertEquals(shuffleLineup(['p', 'q', 'r', 's', 'z'], new Set(['z']), ['z', 'a'], seeded(3)).indexOf('z'), 1);
  const many = Array.from({ length: 150 }, (_, i) => `f${i}`);
  assertEquals(shuffleLineup([], new Set(), many, seeded(5)).length, LINEUP_MAX);
});
