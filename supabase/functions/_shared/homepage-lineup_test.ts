// Admin → Homepage lineup (src/lib/homepageLineup.ts, AdminHomepage, ImpactStories).
import { assert, assertEquals } from 'jsr:@std/assert@1';
import { applyLineup, HOMEPAGE_LIMIT, LINEUP_MAX, shuffleLineup, splitLineup, type Placement } from '../../../src/lib/homepageLineup.ts';

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
  assert(page.includes('<Shuffle ') && page.includes('aria-pressed={pinned.includes(id)}'), 'a Shuffle button and a pin on every placed row');
  assert(page.includes('draggable={canWrite}') && page.includes('aria-label={`Move ${title(id)} up`}'), 'drag and drop, with arrows for keyboards and touch');
  assert(read('src/pages/admin/adminPages.ts').includes("'/admin/homepage': () => import('./AdminHomepage')"));
  assert(read('src/App.tsx').includes("['/admin/homepage', adminPage('/admin/homepage')]"));
  assert(read('src/components/admin/AdminLayout.tsx').includes("{ label: 'Homepage', path: '/admin/homepage', icon: LayoutTemplate }"));
  // Visitors read the lineup; nothing in the browser writes it.
  assert(!/from\('homepage_placements'\)\s*\.(insert|update|upsert|delete)/.test(page + read('src/hooks/useHomepageLineup.ts')));
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
