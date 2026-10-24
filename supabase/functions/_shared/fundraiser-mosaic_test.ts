import { assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const root = new URL('../../../', import.meta.url);
const read = (path: string) => Deno.readTextFileSync(new URL(path, root));

Deno.test('On phones the homepage shows fundraisers as a swipeable mosaic with a See all button', () => {
  const section = read('src/components/landing/ImpactStories.tsx');
  assert(section.includes('<FundraiserMosaic'));
  assert(section.includes('md:hidden'));
  assert(section.includes('to="/stories">See all'));
  // The old one-card-per-screen carousel and its dash indicator are gone.
  assert(!section.includes('w-[86vw]'));

  const mosaic = read('src/components/landing/FundraiserMosaic.tsx');
  assert(mosaic.includes('snap-x'));
  assert(mosaic.includes('Example campaign'), 'example fundraisers stay labelled');
  assert(mosaic.includes('to="/stories"') && mosaic.includes('to="/apply"'));
  assert(mosaic.includes('index % 2 ? layout.b : layout.a'), 'panels alternate');
});
