import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { monthlyMetadata, monthlyPlanBody } from "./square-recurring.ts";
import { DEFAULT_TIP_PERCENT, readPayment } from "./checkout-total.ts";

Deno.test("tip starts at 15%", () => assertEquals(DEFAULT_TIP_PERCENT, 15));

Deno.test("monthly plan charges the same total as the first payment", () => {
  const charge = { giftCents: 5000, tipCents: 750, feeCents: 214, totalCents: 5964 };
  const plan = monthlyPlanBody(charge, "k");
  const phase = plan.object.subscription_plan_data.subscription_plan_variations[0].subscription_plan_variation_data.phases[0];
  assertEquals(phase.cadence, "MONTHLY");
  assertEquals(phase.pricing.price_money.amount, 5964);
});

Deno.test("each monthly charge records the same gift, tip and fee", () => {
  const md = monthlyMetadata({ gift_cents: 5000, tip_cents: 750, fee_cents: 214, brand_allocations: null, brand_name: "Kroger", user_id: "u", donor_email: null, fundraiser_id: null });
  assertEquals(readPayment(md, 5964), { giftCents: 5000, tipCents: 750, feeCents: 214 });
});
