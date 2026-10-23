import Stripe from "npm:stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SplitError, describeSplit, encodeSplit, normalizeSplit } from '../_shared/brand-split.ts';
import { ChargeError, chargeMetadata, computeCharge } from '../_shared/checkout-total.ts';
import { EXAMPLE_CLOSED_MESSAGE, isExampleFundraiser } from '../_shared/example-guard.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: settings } = await admin.from("payment_settings").select("stripe_enabled").eq("id", 1).maybeSingle();
    if (settings && settings.stripe_enabled === false) {
      return json({ error: "Stripe payments are currently turned off." }, 403);
    }

    const { amount, tipAmount, coverFee, brandName, brandId, brandAllocations, userId, userEmail, fundraiserId, embedded } = await req.json();
    if (await isExampleFundraiser(fundraiserId)) return json({ error: EXAMPLE_CLOSED_MESSAGE }, 403);
    const amt = Number(amount);
    if (!amt || amt < 5 || amt > 10000) return json({ error: "Invalid donation amount. Must be between $5 and $10,000." }, 400);

    // The donor's dollar split, checked again here (each retailer's share becomes one coupon slot).
    // The gift goes to families in full; an optional tip and the covered card fee are added on top.
    let shares, charge;
    try {
      shares = normalizeSplit(amt, brandAllocations, { brand: brandName, brandId });
      charge = computeCharge({ gift: amt, tip: tipAmount, coverFee, provider: "stripe" });
    } catch (e) {
      if (e instanceof SplitError || e instanceof ChargeError) return json({ error: e.message }, 400);
      throw e;
    }
    const isMultiBrand = shares.length > 1;

    const key = Deno.env.get("STRIPE_SECRET_KEY");
    if (!key) return json({ error: "Missing STRIPE_SECRET_KEY." }, 500);
    const stripe = new Stripe(key, { apiVersion: "2023-10-16" });

    const origin = req.headers.get("origin") || "https://coupondonation.com";
    const mealsProvided = amt * 2;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ...(userEmail ? { customer_email: userEmail } : {}),
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: charge.giftCents,
          product_data: {
            name: isMultiBrand ? `Donation for families (${shares.length} retailers)` : "Donation to Help Families",
            description: isMultiBrand ? `100% to families, shared between ${describeSplit(shares)}` : (shares[0] ? `100% to families, via ${shares[0].brand}` : "100% to families"),
          },
        },
      },
      ...(charge.tipCents > 0 ? [{
        quantity: 1,
        price_data: { currency: "usd", unit_amount: charge.tipCents, product_data: { name: "Tip to CouponDonation", description: "Optional. Keeps the platform running." } },
      }] : []),
      ...(charge.feeCents > 0 ? [{
        quantity: 1,
        price_data: { currency: "usd", unit_amount: charge.feeCents, product_data: { name: "Card processing fee (you covered it)" } },
      }] : [])],
      metadata: {
        type: "donation",
        ...chargeMetadata(charge),
        meals_provided: mealsProvided.toString(),
        is_multi_brand: isMultiBrand.toString(),
        brand_name: shares[0]?.brand || "",
        brand_id: shares[0]?.brandId || "",
        brand_allocations: shares.length ? encodeSplit(shares) : "",
        donor_id: userId || "",
        donor_email: userEmail || "",
        fundraiser_id: fundraiserId || "",
      },
      ...(embedded
        ? { ui_mode: "embedded" as const, return_url: `${origin}/donation-success?amount=${amt}&meals=${mealsProvided}` }
        : { success_url: `${origin}/donation-success?amount=${amt}&meals=${mealsProvided}`, cancel_url: `${origin}/donation-cancelled` }),
    });

    return json({ url: session.url, sessionId: session.id, clientSecret: session.client_secret });
  } catch (e) {
    console.error("Stripe checkout error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
