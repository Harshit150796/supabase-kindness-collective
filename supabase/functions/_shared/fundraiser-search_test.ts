// Fundraiser search (src/lib/fundraiserSearch.ts): words, needs, places, stores, filters and the address.
import { assert, assertEquals } from 'jsr:@std/assert@1';
import {
  indexFundraisers, needsForWord, normalizeText, parseQuery, readSearchParams, searchFundraisers, writeSearchParams,
  type SearchableFundraiser, type SearchParamsState,
} from '../../../src/lib/fundraiserSearch.ts';

type F = SearchableFundraiser & { slug: string };
const f = (slug: string, o: Partial<F>): F => ({
  slug, id: slug, title: '', story: '', category: 'food', help_categories: [], preferred_brands: [], city: null, state_code: null,
  monthly_goal: 500, live_raised: 0, created_at: '2026-11-01T00:00:00Z', ...o,
});

// Shaped like the live list on Nov 17, 2026 (titles, needs and places as organizers wrote them).
const LIST: F[] = [
  f('gary', { title: 'Help Gary Cooper With Rent and Groceries', help_categories: ['food', 'healthcare'], city: 'Duncanville', state_code: 'TX', preferred_brands: ['Walmart', 'Kroger'], story: 'Our light bill is due and the pantry is empty.', created_at: '2026-11-15T00:00:00Z' }),
  f('meals', { title: 'Warm Meals for My Family', help_categories: ['meals'], city: 'Hesperia', state_code: 'CA', preferred_brands: ['DoorDash'], created_at: '2026-11-14T00:00:00Z' }),
  f('medical', { title: 'Help Cover My Medical Expenses', help_categories: ['healthcare'], city: 'Richmond', state_code: 'VA', preferred_brands: ['CVS', 'Walgreens'], live_raised: 400, created_at: '2026-11-10T00:00:00Z' }),
  f('bronx', { title: 'Help My Family with Essential Needs', help_categories: ['essentials', 'transportation', 'childcare'], city: 'Bronx', state_code: 'NY', created_at: '2026-11-12T00:00:00Z' }),
  f('ella', { title: 'Help Ella go the distance after her SDR surgery', category: 'health', story: 'Physical therapy five days a week.', live_raised: 100, created_at: '2026-10-01T00:00:00Z' }),
  f('fire', { title: 'Help the Miller family after a devastating house fire', category: 'food', created_at: '2026-10-02T00:00:00Z' }),
  f('katie', { title: 'A safe home for Katie and her toddler', category: 'utilities', organizer_name: 'Katie R.', created_at: '2026-10-03T00:00:00Z' }),
];
const index = indexFundraisers(LIST);
const run = (o: Partial<SearchParamsState>) => searchFundraisers(index, { q: '', need: 'all', state: 'all', sort: 'best', ...o });
const slugs = (o: Partial<SearchParamsState>) => run(o).results.map((x) => x.slug);

Deno.test('an empty search lists every open fundraiser in the site order', () => {
  assertEquals(slugs({}), LIST.map((x) => x.slug));
  assertEquals(run({}).needCounts.all, LIST.length);
});

Deno.test('a kind of help finds every request for that need, including old category ids', () => {
  // "medical" → Health & pharmacy: the request asking for it, the old "health" one and Gary's (food + healthcare).
  assertEquals(new Set(slugs({ q: 'medical' })), new Set(['medical', 'ella', 'gary']));
  assertEquals(slugs({ q: 'medical' })[0], 'medical', 'the title match leads');
  assertEquals(parseQuery('medical').needs, ['healthcare']);
  assertEquals(new Set(slugs({ q: 'rent' })), new Set(['gary', 'katie']));
  assertEquals(slugs({ q: 'diapers' }), ['bronx']);
  assertEquals(new Set(slugs({ q: 'groceries' })), new Set(['gary', 'fire']));
  assert(needsForWord('med').includes('healthcare') && needsForWord('rides').includes('transportation'));
});

Deno.test('titles, stories, organizers, places and stores are all searchable', () => {
  assertEquals(slugs({ q: 'fire' })[0], 'fire');
  // A need word in the story leads; other requests for that need follow.
  assertEquals(slugs({ q: 'therapy' })[0], 'ella');
  assertEquals(new Set(slugs({ q: 'therapy' })), new Set(['ella', 'gary', 'medical']));
  assertEquals(slugs({ q: 'katie' }), ['katie']);
  assertEquals(slugs({ q: 'Richmond' }), ['medical']);
  assertEquals(slugs({ q: 'texas' }), ['gary']);
  assertEquals(slugs({ q: 'new york' }), ['bronx']);
  assertEquals(slugs({ q: 'TX' }), ['gary']);
  assertEquals(new Set(slugs({ q: 'walgreens' })), new Set(['medical']));
  assertEquals(slugs({ q: 'doordash' }), ['meals']);
});

Deno.test('every word must match; prefixes, plurals and one-letter typos still count', () => {
  assertEquals(slugs({ q: 'rent texas' }), ['gary']);
  assertEquals(slugs({ q: 'groc' })[0], 'gary');
  assertEquals(slugs({ q: 'meal' }), ['meals']);
  assertEquals(new Set(slugs({ q: 'medcal' })), new Set(['medical', 'ella', 'gary']));
  assertEquals(slugs({ q: 'surgey' })[0], 'ella');
  assertEquals(slugs({ q: 'distanse' }), ['ella']);
  // Stopwords and punctuation are ignored: "help" alone is no search at all.
  assertEquals(slugs({ q: 'help' }).length, LIST.length);
  assertEquals(slugs({ q: '  Help, my family with RENT!! ' })[0], 'gary');
});

Deno.test('with no fundraiser having every word, ones with some of them are shown and marked partial', () => {
  const r = run({ q: 'distance bronx' });
  assert(r.partial);
  assertEquals(new Set(r.results.map((x) => x.slug)), new Set(['ella', 'bronx']));
  const none = run({ q: 'zzzz qqqq' });
  assertEquals(none.results.length, 0);
  assert(!none.partial);
});

Deno.test('need and state filters, need counts for the chips, and the three sorts', () => {
  assertEquals(new Set(slugs({ need: 'healthcare' })), new Set(['gary', 'medical', 'ella']));
  assertEquals(slugs({ need: 'health' }).length, 3, 'old ids read as the new need');
  assertEquals(slugs({ state: 'CA' }), ['meals']);
  const counts = run({ q: 'family' }).needCounts;
  assertEquals(counts.all, 3);
  assertEquals(counts.meals, 1);
  assertEquals(counts.food, 1);
  assertEquals(slugs({ sort: 'newest' }).slice(0, 3), ['gary', 'meals', 'bronx']);
  assertEquals(slugs({ sort: 'goal' }).slice(0, 2), ['medical', 'ella']);
});

Deno.test('a state found from the ZIP code counts when state_code is empty', () => {
  const zipIndex = indexFundraisers(LIST, (x) => (x.slug === 'fire' ? 'oh' : null));
  assertEquals(searchFundraisers(zipIndex, { q: 'ohio', need: 'all', state: 'all', sort: 'best' }).results.map((x) => x.slug), ['fire']);
  assertEquals(searchFundraisers(zipIndex, { q: '', need: 'all', state: 'OH', sort: 'best' }).results.map((x) => x.slug), ['fire']);
});

Deno.test('the address keeps only known values and drops defaults', () => {
  assertEquals(readSearchParams(new URLSearchParams('q=rent&need=health&state=tx&sort=goal')), { q: 'rent', need: 'healthcare', state: 'TX', sort: 'goal' });
  assertEquals(readSearchParams(new URLSearchParams('need=<x>&state=ZZ&sort=hack')), { q: '', need: 'all', state: 'all', sort: 'best' });
  assertEquals(writeSearchParams({ q: ' rent ', need: 'all', state: 'all', sort: 'best' }).toString(), 'q=rent');
  assertEquals(writeSearchParams({ q: '', need: 'food', state: 'NY', sort: 'newest' }).toString(), 'need=food&state=NY&sort=newest');
  assertEquals(normalizeText('Café  Ñandú’s, #1!'), 'cafe nandus 1');
});
