// Auto-procures real gift card codes from Tremendous API for pending coupons.
// Called by the Stripe webhook after coupons are inserted, and by the admin
// "Retry procurement" button. Idempotent per-coupon via `tremendous_order_id`.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PendingCoupon {
  id: string;
  store_name: string;
  value: number;
  donation_id: string | null;
  donor_id: string | null;
  procurement_attempts: number;
}

const TREMENDOUS_BASE =
  (Deno.env.get("TREMENDOUS_ENV") || "sandbox").toLowerCase() === "live"
    ? "https://www.tremendous.com/api/v2"
    : "https://testflight.tremendous.com/api/v2";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const apiKey = Deno.env.get("TREMENDOUS_API_KEY");
  const fundingSourceId = Deno.env.get("TREMENDOUS_FUNDING_SOURCE_ID");
  const campaignId = Deno.env.get("TREMENDOUS_CAMPAIGN_ID");

  if (!apiKey || !fundingSourceId || !campaignId) {
    return json(
      {
        error:
          "Missing Tremendous configuration. Set TREMENDOUS_API_KEY, TREMENDOUS_FUNDING_SOURCE_ID, TREMENDOUS_CAMPAIGN_ID.",
      },
      500,
    );
  }

  let body: { donation_id?: string; coupon_ids?: string[]; limit?: number } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body = sweep all pending */
  }

  // Select pending coupons to process
  let query = supabase
    .from("coupons")
    .select("id, store_name, value, donation_id, donor_id, procurement_attempts")
    .in("status", ["pending_procurement", "procurement_failed"])
    .lt("procurement_attempts", 5);

  if (body.donation_id) query = query.eq("donation_id", body.donation_id);
  if (body.coupon_ids?.length) query = query.in("id", body.coupon_ids);
  query = query.order("created_at", { ascending: true }).limit(body.limit ?? 100);

  const { data: pending, error: fetchErr } = await query;
  if (fetchErr) return json({ error: fetchErr.message }, 500);
  if (!pending || pending.length === 0) return json({ processed: 0, message: "Nothing pending" }, 200);

  // Load brand → tremendous product mapping
  const brandNames = [...new Set(pending.map((c) => c.store_name))];
  const { data: brandMap } = await supabase
    .from("brand_procurement_map")
    .select("brand_name, tremendous_product_id, is_active")
    .in("brand_name", brandNames);

  const productByBrand = new Map<string, string>();
  (brandMap || []).forEach((b) => {
    if (b.is_active) productByBrand.set(b.brand_name.toLowerCase(), b.tremendous_product_id);
  });

  let success = 0;
  let failed = 0;
  const results: unknown[] = [];

  for (const coupon of pending as PendingCoupon[]) {
    const productId = productByBrand.get(coupon.store_name.toLowerCase());
    if (!productId) {
      await markFailed(supabase, coupon, `No Tremendous product mapped for brand '${coupon.store_name}'`);
      failed++;
      continue;
    }

    try {
      const externalId = `coupon_${coupon.id}`; // idempotency key for Tremendous
      const orderRes = await fetch(`${TREMENDOUS_BASE}/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          external_id: externalId,
          payment: { funding_source_id: fundingSourceId },
          rewards: [
            {
              value: { denomination: Number(coupon.value), currency_code: "USD" },
              delivery: { method: "LINK" },
              recipient: { name: "CouponDonation Recipient" },
              products: [productId],
              campaign_id: campaignId,
            },
          ],
        }),
      });

      const orderJson = await orderRes.json();
      if (!orderRes.ok) {
        const msg = orderJson?.errors?.message || orderJson?.error || `HTTP ${orderRes.status}`;
        await markFailed(supabase, coupon, `Tremendous: ${msg}`);
        failed++;
        results.push({ coupon_id: coupon.id, ok: false, error: msg });
        continue;
      }

      const reward = orderJson?.order?.rewards?.[0];
      const rewardId = reward?.id ?? null;
      const redemptionUrl =
        reward?.delivery?.link ??
        reward?.deliveries?.[0]?.link ??
        (rewardId ? `https://reward.tremendous.com/rewards/${rewardId}` : null);

      // Use the reward id as the code the recipient sees (they open the link to redeem).
      const code = redemptionUrl ?? rewardId ?? externalId;

      const { error: updErr } = await supabase
        .from("coupons")
        .update({
          status: "available",
          code,
          redemption_url: redemptionUrl,
          tremendous_order_id: orderJson?.order?.id ?? null,
          tremendous_reward_id: rewardId,
          procurement_attempts: coupon.procurement_attempts + 1,
          last_procurement_at: new Date().toISOString(),
          last_procurement_error: null,
        })
        .eq("id", coupon.id);

      if (updErr) {
        await markFailed(supabase, coupon, `DB update failed: ${updErr.message}`);
        failed++;
      } else {
        success++;
        results.push({ coupon_id: coupon.id, ok: true, reward_id: rewardId });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await markFailed(supabase, coupon, msg);
      failed++;
      results.push({ coupon_id: coupon.id, ok: false, error: msg });
    }
  }

  return json({ processed: pending.length, success, failed, results }, 200);
});

// deno-lint-ignore no-explicit-any
async function markFailed(supabase: any, coupon: PendingCoupon, error: string) {
  await supabase
    .from("coupons")
    .update({
      status: "procurement_failed",
      procurement_attempts: coupon.procurement_attempts + 1,
      last_procurement_at: new Date().toISOString(),
      last_procurement_error: error.slice(0, 500),
    })
    .eq("id", coupon.id);
}

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
