import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { HELP_NEEDS, MAX_PREFERRED_STORES, cityState, needLabel, requestNeeds, storesByNeed } from '../../../src/lib/helpNeeds.ts';
import { brandList } from '../../../src/data/brandLogos.ts';

const catalogue = new Set(brandList.map((b) => b.name));

Deno.test('every store a need suggests is one donors can choose', () => {
  for (const need of HELP_NEEDS) {
    assert(need.stores.length >= 4, need.id);
    for (const store of need.stores) assert(catalogue.has(store), `${need.id}: ${store}`);
    assertEquals(new Set(need.stores).size, need.stores.length, `${need.id} repeats a store`);
  }
  assertEquals(new Set(HELP_NEEDS.map((n) => n.id)).size, HELP_NEEDS.length);
});

Deno.test('the picker lists each store once, under the first need that names it', () => {
  const groups = storesByNeed(['food', 'healthcare', 'essentials']);
  const all = groups.flatMap((g) => g.stores);
  assertEquals(new Set(all).size, all.length);
  assert(groups[0].stores.includes('Walmart'));
  assert(!groups[1].stores.includes('Walmart'));
  assertEquals(storesByNeed(['nope']).length, 0);
});

Deno.test('old category ids still read as words', () => {
  assertEquals(needLabel('health'), 'Health & pharmacy');
  assertEquals(needLabel('healthcare'), 'Health & pharmacy');
  assertEquals(needLabel('household'), 'Housing');
  assertEquals(needLabel('food'), 'Food & groceries');
  assertEquals(needLabel('mystery'), 'Mystery');
  assertEquals(requestNeeds([], 'food'), ['food']);
  assertEquals(requestNeeds(['meals', 'food', 'meals'], 'meals'), ['meals', 'food']);
  assertEquals(requestNeeds(null, null), []);
});

Deno.test('donors see city and state, never a bare ZIP code', () => {
  assertEquals(cityState('Syracuse', 'ny'), 'Syracuse, NY');
  assertEquals(cityState(null, null), null);
  const page = Deno.readTextFileSync('src/pages/PublicFundraiser.tsx');
  assert(page.includes('zipPlace?.includes(",") ? zipPlace : null'));
  const card = Deno.readTextFileSync('src/components/stories/FundraiserCard.tsx');
  assert(card.includes("zipLabel?.includes(',') ? zipLabel : null"));
});

Deno.test('the application saves needs and stores, and still saves without those columns', () => {
  const apply = Deno.readTextFileSync('src/pages/ApplyRecipient.tsx');
  assert(apply.includes('help_categories: needs') && apply.includes('preferred_brands: storeNames'));
  assert(apply.includes('first.error.code === "PGRST204" || first.error.code === "42703"'));
  assertEquals(MAX_PREFERRED_STORES, 8);
});
