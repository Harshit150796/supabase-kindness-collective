import { assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const read = (path: string) => Deno.readTextFile(path);
const DONATE = [
  'src/components/landing/DonationFlow.tsx',
  'src/components/landing/donate/GiftLedger.tsx',
  'src/components/landing/donate/RetailerStep.tsx',
  'src/components/landing/donate/AmountStep.tsx',
  'src/components/landing/donate/ReviewStep.tsx',
  'src/components/landing/donate/tokens.ts',
];

Deno.test('donors never see coupon counts or coupon sizes, only dollars per retailer', async () => {
  for (const path of DONATE) {
    const src = await read(path);
    assert(!/getTotalCoupons|couponValue|coupons Created|Coupon Breakdown|× \$|→ \{coupons\}/i.test(src), path);
    assert(!/>= 50 \? 10 : 5/.test(src), path);
  }
});

Deno.test('the split is in dollars from the shared logic, so it can never stop adding up', async () => {
  const flow = await read('src/components/landing/DonationFlow.tsx');
  assert(flow.includes("from '@/lib/donationSplit'"));
  assert(flow.includes('setShare(shares, i, value)') && flow.includes('resizeShares(custom, amount)') && flow.includes('evenSplit(amount, count)'));
  // The checkout gets each retailer's exact dollars plus percentages that add up to 100 for older readers.
  assert(flow.includes('const pct = percentages(shares);') && flow.includes('percent: pct[i], amount: shares[i]'));
  assert(!flow.includes('Percentages must add up') && !flow.includes('BrandAllocationSliders'));
  const amount = await read('src/components/landing/donate/AmountStep.tsx');
  assert(amount.includes("{m === 'even' ? 'Evenly' : \"I'll choose\"}") && amount.includes('always adds up to'));
  assert(!amount.includes('<Slider'));
});

Deno.test('the review explains what happens next and shows real payment marks', async () => {
  const review = await read('src/components/landing/donate/ReviewStep.tsx');
  assert(review.includes("Our team turns each store's share into coupons sized for what families need"));
  assert(review.includes('`/brand-logos/${card}.svg`') && !review.includes('fontFamily="Arial"'));
  assert(review.includes('Donate ${usd.format(amount)} with ${p.name}'));
  // Same-tab checkout only.
  const flow = await read('src/components/landing/DonationFlow.tsx');
  assert(flow.includes('window.location.assign(data.url)') && !flow.includes('window.open('));
});

Deno.test('the donate card follows the design rules', async () => {
  for (const path of DONATE) {
    const src = await read(path);
    assert(!/bg-gradient|from-verify|text-transparent bg-clip-text|uppercase tracking/.test(src), path);
    assert(!/toLocaleString\(|toFixed\(2\)/.test(src), path); // module-level Intl formatters only
  }
  const ledger = await read('src/components/landing/donate/GiftLedger.tsx');
  assert(ledger.includes('bg-primary-20'));
});
