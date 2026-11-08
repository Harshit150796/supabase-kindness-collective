// Homepage collections like GoFundMe's switcher (src/lib/fundraiserCollections.ts, ImpactStories).
import { assert, assertEquals } from 'jsr:@std/assert@1';
import { collect, COLLECTIONS, compactCount, launchedAgo, photoLabel } from '../../../src/lib/fundraiserCollections.ts';
import type { RankableFundraiser } from '../../../src/lib/fundraiserRanking.ts';

const NOW = Date.parse('2026-11-08T12:00:00Z');
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();
type F = RankableFundraiser & { id: string };
const f = (id: string, o: Partial<F>): F => ({ id, created_at: daysAgo(90), monthly_goal: 1000, live_raised: 0, live_donations_count: 0, latest_donation_at: null, featured_order: null, ...o });

const list = [
  f('busy', { live_raised: 900, live_donations_count: 40, latest_donation_at: daysAgo(1) }),
  f('half', { live_raised: 500, live_donations_count: 12, latest_donation_at: daysAgo(3) }),
  f('little', { live_raised: 20, live_donations_count: 2, created_at: daysAgo(10), latest_donation_at: daysAgo(4) }),
  f('new', { created_at: daysAgo(2) }),
  f('old-empty', { created_at: daysAgo(200) }),
];

Deno.test('four collections, like GoFundMe: Trending, Close to goal, Just launched, Needs momentum', () => {
  assertEquals(COLLECTIONS.map((c) => c.label), ['Trending', 'Close to goal', 'Just launched', 'Needs momentum']);
  for (const c of COLLECTIONS) assert(c.description.length > 10, c.id);
});

Deno.test('Trending keeps the ranked order it is given', () => {
  assertEquals(collect(list, 'trending', NOW).map((x) => x.id), list.map((x) => x.id));
});

Deno.test('Close to goal: only fundraisers with gifts, nearest the goal first', () => {
  assertEquals(collect(list, 'close', NOW).map((x) => x.id), ['busy', 'half', 'little']);
  assertEquals(photoLabel(list[0], 'close', NOW), '90% funded');
});

Deno.test('Just launched: started in the last 30 days, newest first, labelled by age', () => {
  assertEquals(collect(list, 'new', NOW).map((x) => x.id), ['new', 'little']);
  assertEquals(photoLabel(list[3], 'new', NOW), '2 d ago');
  assertEquals(launchedAgo(daysAgo(0.2), NOW), 'Today');
  assertEquals(launchedAgo(daysAgo(20), NOW), '2 wk ago');
  assertEquals(launchedAgo(daysAgo(200), NOW), '6 mo ago');
});

Deno.test('Needs momentum: below half the goal, furthest from it first, labelled with donations', () => {
  assertEquals(collect(list, 'momentum', NOW).map((x) => x.id), ['new', 'old-empty', 'little']);
  assertEquals(photoLabel(list[3], 'momentum', NOW), 'No donations yet');
  assertEquals(photoLabel(list[2], 'momentum', NOW), '2 donations');
  assertEquals(photoLabel(f('one', { live_raised: 5, live_donations_count: 1 }), 'trending', NOW), '1 donation');
});

Deno.test('donation counts are short, like GoFundMe ("1.1K donations")', () => {
  assertEquals([compactCount(595), compactCount(1100), compactCount(17_841), compactCount(25_700)], ['595', '1.1K', '18K', '26K']);
});

const read = (p: string) => Deno.readTextFileSync(new URL(`../../../${p}`, import.meta.url));

Deno.test('example campaigns stay marked on every photo label (their numbers are samples)', () => {
  const card = read('src/components/stories/FundraiserCard.tsx');
  assert(card.includes('{fundraiser.is_example && <span') && card.includes('>Example campaign</span>'), 'cards mark examples on the photo');
  const mosaic = read('src/components/landing/FundraiserMosaic.tsx');
  assert(mosaic.includes("fundraiser.is_example ? `${kind === 'wide' ? 'Example campaign' : 'Example'}"), 'phone tiles mark examples too');
});

Deno.test('the homepage switch is smooth, announced, and instant when the visitor presses Pause', () => {
  const home = read('src/components/landing/ImpactStories.tsx');
  assert(home.includes('data-collection-phase={phase}') && home.includes('aria-live="polite"'));
  assert(home.includes("if (motion !== 'full') { setView(target); setPhase('idle'); return; }"), 'Pause swaps at once (the OS setting is not read; tree-quality_test)');
  const css = read('src/index.css');
  assert(css.includes("[data-collection-phase='out'] .collection-item") && css.includes('@keyframes collection-in'));
  assert(css.indexOf('@keyframes collection-in') < css.indexOf('/* ---------- Site menu'), 'kept out of the site menu block (site-navigation_test)');
  const switcher = read('src/components/landing/CollectionSwitcher.tsx');
  assert(switcher.includes('<DrawerTitle>Filter by</DrawerTitle>') && switcher.includes('role="radiogroup"'), 'phones get a "Filter by" sheet');
});
