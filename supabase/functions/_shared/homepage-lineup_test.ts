// Admin → Homepage lineup (src/lib/homepageLineup.ts, AdminHomepage, ImpactStories).
import { assert, assertEquals } from 'jsr:@std/assert@1';
import { applyLineup, HOMEPAGE_LIMIT, splitLineup, type Placement } from '../../../src/lib/homepageLineup.ts';

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
  assert(page.includes("rpc('admin_set_homepage_lineup', { _order: order, _hidden: hidden })"));
  assert(page.includes('draggable={canWrite}') && page.includes('aria-label={`Move ${title(id)} up`}'), 'drag and drop, with arrows for keyboards and touch');
  assert(read('src/pages/admin/adminPages.ts').includes("'/admin/homepage': () => import('./AdminHomepage')"));
  assert(read('src/App.tsx').includes("['/admin/homepage', adminPage('/admin/homepage')]"));
  assert(read('src/components/admin/AdminLayout.tsx').includes("{ label: 'Homepage', path: '/admin/homepage', icon: LayoutTemplate }"));
  // Visitors read the lineup; nothing in the browser writes it.
  assert(!/from\('homepage_placements'\)\s*\.(insert|update|upsert|delete)/.test(page + read('src/hooks/useHomepageLineup.ts')));
});
