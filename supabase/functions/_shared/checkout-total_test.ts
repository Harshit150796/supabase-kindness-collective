import { assert, assertEquals, assertThrows } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { CARD_RATES, ChargeError, chargeMetadata, computeCharge, coveredFeeCents, readPayment, tipCentsFor } from './checkout-total.ts';

Deno.test('a covered fee leaves the gift and tip whole after the processor takes its cut', () => {
  for (const provider of ['square', 'stripe'] as const) {
    const { percent, fixedCents } = CARD_RATES[provider];
    for (let base = 1000; base <= 1_000_000; base += 997) {
      const fee = coveredFeeCents(base, provider);
      const total = base + fee;
      const processorTakes = Math.round(total * percent / 100 + fixedCents);
      assert(total - processorTakes >= base - 1, `${provider} ${base}: kept ${total - processorTakes}`);
      assert(total - processorTakes <= base + 2, `${provider} ${base}: overcharged`);
    }
  }
  assertEquals(coveredFeeCents(5500, "stripe"), 196); // $50 gift + $5 tip -> $1.96
  assertEquals(coveredFeeCents(5000, 'square'), 202); // $50 on Square -> $2.02
  assertEquals(coveredFeeCents(0, 'stripe'), 0);
});

Deno.test('the charge is gift + optional tip + optional fee, and the gift is never reduced', () => {
  const none = computeCharge({ gift: 50, provider: 'stripe' });
  assertEquals(none, { giftCents: 5000, tipCents: 0, feeCents: 0, totalCents: 5000 });
  const all = computeCharge({ gift: 50, tip: 5, coverFee: true, provider: 'stripe' });
  assertEquals(all, { giftCents: 5000, tipCents: 500, feeCents: 196, totalCents: 5696 });
  assertEquals(computeCharge({ gift: 50, tip: '', coverFee: 'true', provider: 'square' }).feeCents, 202);
  assertEquals(tipCentsFor(5000, 10), 500);
  assertEquals(tipCentsFor(3300, 15), 495);
});

Deno.test('odd tips are refused', () => {
  assertThrows(() => computeCharge({ gift: 50, tip: -1, provider: 'stripe' }), ChargeError);
  assertThrows(() => computeCharge({ gift: 50, tip: 'lots', provider: 'stripe' }), ChargeError);
  assertThrows(() => computeCharge({ gift: 50, tip: 1000.01, provider: 'stripe' }), ChargeError);
  assertThrows(() => computeCharge({ gift: 0, provider: 'stripe' }), ChargeError);
});

Deno.test('the webhook splits what was paid back into gift, tip and fee', () => {
  const charge = computeCharge({ gift: 50, tip: 5, coverFee: true, provider: 'stripe' });
  const meta = chargeMetadata(charge);
  assertEquals(Object.keys(meta).length, 3); // Square allows ten keys in all
  assertEquals(readPayment(meta, charge.totalCents), { giftCents: 5000, tipCents: 500, feeCents: 196 });
  // Older checkouts (no tip keys): everything paid is the gift.
  assertEquals(readPayment({ amount: '50' }, 5000), { giftCents: 5000, tipCents: 0, feeCents: 0 });
  // Metadata that doesn't match the payment: count it all as the gift, never short a family.
  assertEquals(readPayment(meta, 9000), { giftCents: 9000, tipCents: 0, feeCents: 0 });
  // A cent of rounding is absorbed by the gift side.
  assertEquals(readPayment(meta, charge.totalCents + 1).giftCents, 5001);
});

Deno.test('checkouts charge through the shared calculation and webhooks record gift, tip and fee', async () => {
  for (const fn of ['create-donation-checkout', 'create-stripe-checkout', 'create-square-payment']) {
    const src = await Deno.readTextFile(`supabase/functions/${fn}/index.ts`);
    assert(src.includes("from '../_shared/checkout-total.ts'") && src.includes('computeCharge({ gift:') && src.includes('...chargeMetadata(charge)'), fn);
    assert(src.includes('Tip to CouponDonation') && src.includes('Card processing fee (you covered it)'), fn);
  }
  for (const fn of ['stripe-webhook', 'square-webhook']) {
    const src = await Deno.readTextFile(`supabase/functions/${fn}/index.ts`);
    assert(src.includes('readPayment(metadata,') && src.includes('amount_paid: paid,') && src.includes('tip_amount:') && src.includes('fee_covered_amount:'), fn);
  }
  // Square metadata stays within its ten-key limit.
  const square = await Deno.readTextFile('supabase/functions/create-donation-checkout/index.ts');
  assert(!square.includes('meals_provided: mealsProvided') && !square.includes('metadata.brand_id'));
});

Deno.test('Square hosted checkout fee (3.3% + 30c) for common gifts, to the cent', () => {
  assertEquals(coveredFeeCents(1000, 'square'), 66); // $10 -> $0.66
  assertEquals(coveredFeeCents(2500, 'square'), 117); // $25 -> $1.17
  assertEquals(coveredFeeCents(10000, 'square'), 373); // $100 -> $3.73
  assertEquals(computeCharge({ gift: 25, tip: 2.5, coverFee: true, provider: 'square' }).totalCents, 2750 + coveredFeeCents(2750, 'square'));
  assertEquals(computeCharge({ gift: 25, coverFee: false, provider: 'square' }).feeCents, 0);
});
