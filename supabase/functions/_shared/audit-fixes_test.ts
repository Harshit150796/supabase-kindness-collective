// Fixes from the Duck.Design website audit (founder request, Nov 10, 2026).
import { assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const root = new URL('../../../', import.meta.url);
const read = (path: string) => Deno.readTextFileSync(new URL(path, root));

Deno.test('heading reveals leave no second copy of the words: the painted lines go once they land, and crawlers get none', () => {
  const src = read('src/components/PageChoreography.tsx');
  assert(src.includes('clear(heading); settled.add(heading);'));
  assert(src.includes('!BOT_UA.test(navigator.userAgent) && !saved.has(heading) && !settled.has(heading)'));
});

Deno.test('the four steps are in the page once: the laptop cards or the phone list, never both', () => {
  const src = read('src/components/landing/WhatWeDo.tsx');
  assert(src.includes('const laptop = useMinWidth(1024);'));
  assert(src.includes('{!laptop && (') && src.includes('{laptop && <DesktopDeal still={still} />}'));
});

Deno.test('every homepage block has a heading', () => {
  assert(read('src/pages/Index.tsx').includes("<h2>We don't track the person. We track the money.</h2>"));
});

Deno.test('unknown addresses and missing fundraisers tell search engines they are not pages', () => {
  assert(read('src/pages/NotFound.tsx').includes('noindex status={404}'));
  assert(read('src/pages/PublicFundraiser.tsx').includes('noindex status={404}'));
  assert(read('src/components/SEO.tsx').includes('<meta name="prerender-status-code" content={String(status)} />'));
});

Deno.test('the plain facts sit where the decision is made: beside the donate button and the 100% promise', () => {
  const facts = 'CouponDonation Inc. is a company, not a registered charity, so gifts aren’t tax-deductible.';
  assert(read('src/components/landing/donate/ReviewStep.tsx').includes(facts));
  assert(read('src/components/landing/TrustTransparency.tsx').includes(facts));
  assert(read('src/components/landing/LiveActivityBar.tsx').includes('These stores aren’t partners or sponsors of CouponDonation.'));
});

Deno.test('the numbers block shows three plain numbers and only claims full conversion when the numbers show it', () => {
  const src = read('src/components/landing/ImpactDashboard.tsx');
  for (const label of ["label:'Donated'", "label:'Delivered as coupons'", "label:'Coupons used'"]) assert(src.includes(label), label);
  assert(!src.includes('not interchangeable'));
  assert(src.includes("stats.issued_value_total >= stats.total_raised && stats.total_raised > 0 ? 'Every completed donation has been turned into coupons. '"));
});

Deno.test('the cookie notice is one compact row and waits for the homepage opening to finish', () => {
  const src = read('src/components/PrivacyConsentBanner.tsx');
  assert(src.includes("window.addEventListener('cd:intro-end', show, { once: true })"));
  assert(!src.includes('Privacy Information'));
  assert(src.includes('Essential only') && src.includes('Okay'));
});

Deno.test('accessible names start with the words shown, and the logo isn’t named twice', () => {
  assert(read('src/components/landing/hero/HeroHeadline.tsx').includes('aria-label={`Win ${driveMoney(DRIVE.gifts.value)}*:'));
  assert(read('src/components/navigation/BrandLockup.tsx').includes('<img src={logo} alt="" '));
  assert(read('src/components/fundraiser/FundraiserGallery.tsx').includes('fetchPriority="high"'));
});
