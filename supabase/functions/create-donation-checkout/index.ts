import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SplitError, describeSplit, encodeSplit, normalizeSplit } from '../_shared/brand-split.ts';

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
    const { amount, brandName, brandId, brandAllocations, userId, userEmail, fundraiserId } = await req.json();

    // Validate amount
    if (!amount || amount < 5 || amount > 10000) {
      throw new Error("Invalid donation amount. Must be between $5 and $10,000.");
    }

    // The donor's dollar split, checked again here (each retailer's share becomes one coupon slot).
    let shares;
    try {
      shares = normalizeSplit(amount, brandAllocations, { brand: brandName, brandId });
    } catch (e) {
      if (e instanceof SplitError) {
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
      brandCount: shares.length,
      split: describeSplit(shares),
      userId: userId || 'anonymous',
      userEmail: userEmail ? 'provided' : 'guest',
    });

    // Respect the admin on/off switch
    const settingsRes = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/rest/v1/payment_settings?id=eq.1&select=square_enabled`,
      { headers: { apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` } },
    );
    const settings = settingsRes.ok ? (await settingsRes.json())?.[0] : null;
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
    const metadata: Record<string, string> = {
      type: "donation",
      amount: amount.toString(),
      meals_provided: mealsProvided.toString(),
      is_multi_brand: isMultiBrand.toString(),
    };
    if (shares[0]?.brand) metadata.brand_name = shares[0].brand;
    if (shares[0]?.brandId) metadata.brand_id = shares[0].brandId;
    if (shares.length > 0) metadata.brand_allocations = encodeSplit(shares);
    if (userId) metadata.donor_id = userId;
    if (userEmail) metadata.donor_email = userEmail;
    if (fundraiserId) metadata.fundraiser_id = fundraiserId;

    const idempotencyKey = crypto.randomUUID();

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
              amount: Math.round(amount * 100), // cents
              currency: "USD",
            },
            note: (isMultiBrand
              ? `Shared between ${describeSplit(shares)}`
              : shares.length ? `Gift cards for families, via ${shares[0].brand}` : "Gift cards for families in need").slice(0, 500),
          },
        ],
        metadata,
      },
      checkout_options: {
        redirect_url: `${origin}/donation-success?amount=${amount}&meals=${mealsProvided}`,
        ask_for_shipping_address: false,
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

    console.log("Square payment link created:", data.payment_link?.id, "order:", orderId);

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
