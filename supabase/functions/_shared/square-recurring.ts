// Monthly gifts through Square Subscriptions. Each monthly checkout gets its own fixed-price plan
// variation, so Square bills the exact same total (gift + tip + covered fee) every month and the
// webhook can find our record from the subscription's plan variation id.
// No imports: Deno tests and edge functions both load it.

export const MONTHLY_CONSENT =
  'I agree that this same amount will be charged to my payment method every month until I cancel. I can cancel any time from my dashboard.';

export interface MonthlyCharge { giftCents: number; tipCents: number; feeCents: number; totalCents: number }

/** Catalog request creating one fixed monthly price plan for this donor's total. */
export function monthlyPlanBody(charge: MonthlyCharge, idempotencyKey: string) {
  const dollars = (charge.totalCents / 100).toFixed(2);
  return {
    idempotency_key: idempotencyKey,
    object: {
      type: 'SUBSCRIPTION_PLAN',
      id: '#plan',
      subscription_plan_data: {
        name: `Monthly gift $${dollars}`,
        subscription_plan_variations: [{
          type: 'SUBSCRIPTION_PLAN_VARIATION',
          id: '#variation',
          subscription_plan_variation_data: {
            name: `Monthly gift $${dollars}`,
            phases: [{
              cadence: 'MONTHLY',
              ordinal: 0,
              pricing: { type: 'STATIC', price_money: { amount: charge.totalCents, currency: 'USD' } },
            }],
          },
        }],
      },
    },
  };
}

/** Metadata the webhook reads for every monthly charge: the same split as the first month. */
export function monthlyMetadata(row: {
  gift_cents: number; tip_cents: number; fee_cents: number;
  brand_allocations: string | null; brand_name: string | null; user_id: string; donor_email: string | null; fundraiser_id: string | null;
}): Record<string, string> {
  const m: Record<string, string> = {
    type: 'donation',
    amount: (row.gift_cents / 100).toString(),
    tip_amount: (row.tip_cents / 100).toString(),
    fee_covered: (row.fee_cents / 100).toString(),
    donor_id: row.user_id,
  };
  if (row.brand_allocations) m.brand_allocations = row.brand_allocations;
  if (row.brand_name) m.brand_name = row.brand_name;
  if (row.donor_email) m.donor_email = row.donor_email;
  if (row.fundraiser_id) m.fundraiser_id = row.fundraiser_id;
  return m;
}
