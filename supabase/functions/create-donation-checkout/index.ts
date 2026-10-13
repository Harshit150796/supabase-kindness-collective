import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SplitError, describeSplit, encodeSplit, normalizeSplit } from '../_shared/brand-split.ts';
import { ChargeError, chargeMetadata, computeCharge } from '../_shared/checkout-total.ts';
import { SQUARE_PAYMENT_METHODS } from '../_shared/square-payment-methods.ts';
import { MONTHLY_CONSENT, monthlyPlanBody } from '../_shared/square-recurring.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};


// Square API base URL — sandbox tokens only work against the sandbox host.
function squareBaseUrl(): string {
  const env = (Deno.env.get("SQUARE_ENVIRONMENT") || "production").toLowerCase();
  return env === "sandbox"
    ? "https://connect.squareupsandbox.com"
    : "https://connect.squareup.com";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    // Warm-up ping from the review step, so the donor's real click doesn't wait for a cold start.
    if (body?.warm === true) {
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    // Read the admin on/off switch alongside validation instead of before it.
    const settingsPromise = fetch(
      `${Deno.env.get("SUPABASE_URL")}/rest/v1/payment_settings?id=eq.1&select=square_enabled`,
      { headers: { apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` } },
    ).catch(() => null);
    const { amount, tipAmount, coverFee, brandName, brandId, brandAllocations, userId, userEmail, fundraiserId } = body;

    // Validate amount
    if (!amount || amount < 5 || amount > 10000) {
      throw new Error("Invalid donation amount. Must be between $5 and $10,000.");
    }

    // The donor's dollar split, checked again here (each retailer's share becomes one coupon slot).
    // The gift goes to families in full; an optional tip and the covered card fee are added on top.
    let shares, charge;
    try {
      shares = normalizeSplit(amount, brandAllocations, { brand: brandName, brandId });
      charge = computeCharge({ gift: amount, tip: tipAmount, coverFee, provider: "square" });
    } catch (e) {
      if (e instanceof SplitError || e instanceof ChargeError) {
        return new Response(JSON.stringify({ error: e.message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      throw e;
    }
    const isMultiBrand = shares.length > 1;

    console.log("Creating Square donation checkout:", {
      amount,
      tipCents: charge.tipCents,
      feeCents: charge.feeCents,
      brandCount: shares.length,
      split: describeSplit(shares),
      userId: userId || 'anonymous',
      userEmail: userEmail ? 'provided' : 'guest',
    });

    // Respect the admin on/off switch
    const settingsRes = await settingsPromise;
    const settings = settingsRes?.ok ? (await settingsRes.json())?.[0] : null;
    if (settings && settings.square_enabled === false) {
      return new Response(JSON.stringify({ error: "Square payments are currently turned off." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const accessToken = (Deno.env.get("SQUARE_ACCESS_TOKEN") ?? "").trim();
    const locationId = (Deno.env.get("SQUARE_LOCATION_ID") ?? "").trim();

    if (!accessToken) {
      throw new Error("Missing SQUARE_ACCESS_TOKEN. Add it in Supabase → Project Settings → Functions → Secrets.");
    }
    if (!locationId) {
      throw new Error("Missing SQUARE_LOCATION_ID. Add it in Supabase → Project Settings → Functions → Secrets.");
    }

    const origin = req.headers.get("origin") || "https://coupondonation.com";
    const mealsProvided = amount * 2;

    // Metadata carried on the Square order — the square-webhook function reads
    // it back to record the donation and create coupons.
    // NOTE: Square rejects empty-string metadata values, so only include
    // keys that actually have a value.
    // Square allows ten metadata keys; these are nine at most.
    const metadata: Record<string, string> = { type: "donation", ...chargeMetadata(charge) };
    if (shares[0]?.brand) metadata.brand_name = shares[0].brand;
    if (shares.length > 0) metadata.brand_allocations = encodeSplit(shares);
    if (userId) metadata.donor_id = userId;
    if (userEmail) metadata.donor_email = userEmail;
    if (fundraiserId) metadata.fundraiser_id = fundraiserId;

    const idempotencyKey = crypto.randomUUID();
    const squareHeaders = { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json", "Square-Version": "2025-01-23" };

    // Monthly gift: only when the donor ticked the box themselves, and only signed in (so they can cancel).
    if (body.recurring === true) {
      const jwt = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
      const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: who } = await admin.auth.getUser(jwt);
      if (!who?.user) {
        return new Response(JSON.stringify({ error: "Please sign in to set up a monthly gift." }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
      }
      const planRes = await fetch(`${squareBaseUrl()}/v2/catalog/object`, { method: "POST", headers: squareHeaders, body: JSON.stringify(monthlyPlanBody(charge, crypto.randomUUID())) });
      const plan = await planRes.json();
      const variationId = plan?.id_mappings?.find((m: { client_object_id: string }) => m.client_object_id === "#variation")?.object_id;
      if (!planRes.ok || !variationId) {
        console.error("Square plan error:", planRes.status, JSON.stringify(plan?.errors ?? plan));
        throw new Error("Could not set up the monthly gift. Please try again or give once.");
      }
      const { error: rowErr } = await admin.from("recurring_donations").insert({
        user_id: who.user.id, donor_email: who.user.email ?? null, square_plan_variation_id: variationId,
        gift_cents: charge.giftCents, tip_cents: charge.tipCents, fee_cents: charge.feeCents,
        brand_allocations: shares.length ? encodeSplit(shares) : null, brand_name: shares[0]?.brand ?? null,
        fundraiser_id: fundraiserId || null, consent_text: MONTHLY_CONSENT,
      });
      if (rowErr) throw new Error("Could not save the monthly gift.");
      const linkRes = await fetch(`${squareBaseUrl()}/v2/online-checkout/payment-links`, {
        method: "POST", headers: squareHeaders,
        body: JSON.stringify({
          idempotency_key: idempotencyKey,
          quick_pay: { name: "Monthly gift for families", price_money: { amount: charge.totalCents, currency: "USD" }, location_id: locationId },
          checkout_options: { subscription_plan_id: variationId, redirect_url: `${origin}/donation-success?amount=${amount}&monthly=1`, ask_for_shipping_address: false, accepted_payment_methods: SQUARE_PAYMENT_METHODS },
          ...(who.user.email && { pre_populated_data: { buyer_email: who.user.email } }),
        }),
      });
      const link = await linkRes.json();
      if (!linkRes.ok || !link.payment_link?.url) {
        console.error("Square monthly link error:", linkRes.status, JSON.stringify(link?.errors ?? link));
        throw new Error("Could not open the monthly gift checkout. Please try again or give once.");
      }
      console.log("Square monthly link created:", link.payment_link.id, "methods:", JSON.stringify(link.payment_link.checkout_options?.accepted_payment_methods));
      return new Response(JSON.stringify({ url: link.payment_link.url }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    const paymentLinkBody = {
      idempotency_key: idempotencyKey,
      order: {
        location_id: locationId,
        reference_id: `donation_${Date.now()}`,
        line_items: [
          {
            name: isMultiBrand
              ? `Donation for families (${shares.length} retailers)`
              : `Donation to Help Families`,
            quantity: "1",
            base_price_money: {
              amount: charge.giftCents,
              currency: "USD",
            },
            note: (isMultiBrand
              ? `100% to families, shared between ${describeSplit(shares)}`
              : shares.length ? `100% to families, via ${shares[0].brand}` : "100% to families").slice(0, 500),
          },
          ...(charge.tipCents > 0 ? [{
            name: "Tip to CouponDonation",
            quantity: "1",
            base_price_money: { amount: charge.tipCents, currency: "USD" },
            note: "Optional. Keeps the platform running.",
          }] : []),
          ...(charge.feeCents > 0 ? [{
            name: "Card processing fee (you covered it)",
            quantity: "1",
            base_price_money: { amount: charge.feeCents, currency: "USD" },
          }] : []),
        ],
        metadata,
      },
      checkout_options: {
        redirect_url: `${origin}/donation-success?amount=${amount}&meals=${mealsProvided}`,
        ask_for_shipping_address: false,
        accepted_payment_methods: SQUARE_PAYMENT_METHODS,
      },
      ...(userEmail && {
        pre_populated_data: { buyer_email: userEmail },
      }),
    };

    const res = await fetch(`${squareBaseUrl()}/v2/online-checkout/payment-links`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Square-Version": "2025-01-23",
      },
      body: JSON.stringify(paymentLinkBody),
    });

    const data = await res.json();

    if (!res.ok) {
      const detail = data?.errors?.map((e: { detail?: string; code?: string; field?: string }) =>
        `${e.detail} (code=${e.code}, field=${e.field})`
      ).join("; ") || JSON.stringify(data);
      console.error("Square API error:", res.status, detail, JSON.stringify(data));
      throw new Error(`Square checkout failed: ${detail}`);
    }

    const url = data.payment_link?.url;
    const orderId = data.payment_link?.order_id;

    if (!url) {
      throw new Error("Square did not return a checkout URL.");
    }

    // Shows which wallets Square actually allowed on this page (Apple Pay / Google Pay diagnosis).
    console.log("Square payment link created:", data.payment_link?.id, "order:", orderId, "methods:", JSON.stringify(data.payment_link?.checkout_options?.accepted_payment_methods));

    return new Response(JSON.stringify({ url, sessionId: orderId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error creating Square checkout:", error);

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
