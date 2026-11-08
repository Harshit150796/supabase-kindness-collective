// Fundraiser order (src/lib/fundraiserRanking.ts): team picks, then momentum, then new ones with no gifts.
import { assert, assertEquals } from 'jsr:@std/assert@1';
import { hasSupport, momentumScore, rankFundraisers, type RankableFundraiser } from '../../../src/lib/fundraiserRanking.ts';

const NOW = Date.parse('2026-11-08T04:00:00Z');
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();
type F = RankableFundraiser & { id: string; is_example?: boolean };
const f = (id: string, o: Partial<F>): F => ({ id, created_at: daysAgo(30), monthly_goal: 1000, live_raised: 0, live_donations_count: 0, latest_donation_at: null, featured_order: null, ...o });

Deno.test('team picks lead, then fundraisers with support, then new ones with no gifts (newest first)', () => {
  const list = [
    f('new-older', { created_at: daysAgo(5) }),
    f('funded', { live_raised: 400, live_donations_count: 8, latest_donation_at: daysAgo(2) }),
    f('new-newest', { created_at: daysAgo(1) }),
    f('pick-2', { featured_order: 2 }),
    f('pick-1', { featured_order: 1, created_at: daysAgo(1) }),
  ];
  assertEquals(rankFundraisers(list, NOW).map((x) => x.id), ['pick-1', 'pick-2', 'funded', 'new-newest', 'new-older']);
});

Deno.test('momentum: recent gifts, money raised, donors and progress all count', () => {
  const base = { live_raised: 500, live_donations_count: 10, latest_donation_at: daysAgo(3) };
  assert(momentumScore(f('a', base), NOW) > momentumScore(f('b', { ...base, latest_donation_at: daysAgo(30) }), NOW), 'a recent gift ranks higher');
  assert(momentumScore(f('a', base), NOW) > momentumScore(f('b', { ...base, live_raised: 100 }), NOW), 'more raised ranks higher');
  assert(momentumScore(f('a', base), NOW) > momentumScore(f('b', { ...base, live_donations_count: 2 }), NOW), 'more donors rank higher');
  assert(momentumScore(f('a', { ...base, monthly_goal: 500 }), NOW) > momentumScore(f('b', { ...base, monthly_goal: 5000 }), NOW), 'closer to goal ranks higher');
  assert(!hasSupport(f('z', {})) && hasSupport(f('y', { live_raised: 10, live_donations_count: 1 })));
});

Deno.test('example campaigns are ranked with everyone else by their numbers (founder choice, Nov 2026)', () => {
  const list = [
    f('real-new', { created_at: daysAgo(2) }),
    f('real-10', { live_raised: 10, live_donations_count: 1, monthly_goal: 150, latest_donation_at: daysAgo(5) }),
    f('example', { is_example: true, live_raised: 3255, live_donations_count: 32, monthly_goal: 5000, latest_donation_at: daysAgo(18) }),
  ];
  assertEquals(rankFundraisers(list, NOW).map((x) => x.id), ['example', 'real-10', 'real-new']);
});

Deno.test('ranking does not change the list it is given', () => {
  const list = [f('b', { created_at: daysAgo(9) }), f('a', { created_at: daysAgo(1) })];
  rankFundraisers(list, NOW);
  assertEquals(list.map((x) => x.id), ['b', 'a']);
});

const read = (p: string) => Deno.readTextFileSync(new URL(`../../../${p}`, import.meta.url));

Deno.test('every public list uses the ranked order', () => {
  const hook = read('src/hooks/useFundraisers.ts');
  assert(hook.includes('rankFundraisers(') && hook.includes('featured_order'), 'the shared loader ranks after live numbers arrive');
  assert(hook.includes('ranked.slice(0, options.limit)'), 'limits apply after ranking');
  const home = read('src/components/landing/ImpactStories.tsx');
  assert(home.includes("useState<Sort>('trending')") && home.includes('<option value="trending">Trending</option>'));
  assert(!home.includes('Real campaigns, completed donations'), 'the subtitle stays true when examples lead');
  assert(home.includes('.map(needKey)'), 'health and healthcare make one filter');
  assert(!read('src/components/seo/HelpSections.tsx').includes('Number(!!a.is_example) - Number(!!b.is_example)'));
});
