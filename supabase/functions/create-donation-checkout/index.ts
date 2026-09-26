import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BrandAllocation {
  brand: string;
  brandId: string;
  percent: number;
  amount: number;
}

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

    // Process brand allocations (multi-brand support)
    const allocations: BrandAllocation[] = brandAllocations && Array.isArray(brandAllocations) && brandAllocations.length > 0
      ? brandAllocations
      : brandName
        ? [{ brand: brandName, brandId: brandId || '', percent: 100, amount }]
        : [];

    const brandNames = allocations.map(a => a.brand).join(', ');
    const isMultiBrand = allocations.length > 1;

    console.log("Creating Square donation checkout:", {
      amount,
      brandCount: allocations.length,
      brandNames,
      isMultiBrand,
      userId: userId || 'anonymous',
      userEmail: userEmail || 'guest',
    });

    // Validate amount
    if (!amount || amount < 5 || amount > 10000) {
      throw new Error("Invalid donation amount. Must be between $5 and $10,000.");
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
    const metadata: Record<string, string> = {
      type: "donation",
      amount: amount.toString(),
      meals_provided: mealsProvided.toString(),
      brand_name: allocations[0]?.brand || "",
      brand_id: allocations[0]?.brandId || "",
      brand_allocations: JSON.stringify(allocations),
      is_multi_brand: isMultiBrand.toString(),
      donor_id: userId || "",
      donor_email: userEmail || "",
      fundraiser_id: fundraiserId || "",
    };

    const idempotencyKey = crypto.randomUUID();

    const paymentLinkBody = {
      idempotency_key: idempotencyKey,
      order: {
        location_id: locationId,
        reference_id: `donation_${Date.now()}`,
        line_items: [
          {
            name: isMultiBrand
              ? `Multi-Brand Donation (${allocations.length} brands)`
              : `Donation to Help Families`,
            quantity: "1",
            base_price_money: {
              amount: Math.round(amount * 100), // cents
              currency: "USD",
            },
            note: isMultiBrand
              ? `Split across ${allocations.length} brands: ${brandNames}`
              : `Provides ${mealsProvided} meals for families in need${brandName ? ` via ${brandName}` : ""}`,
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
      const detail = data?.errors?.map((e: { detail?: string }) => e.detail).join("; ") || JSON.stringify(data);
      console.error("Square API error:", res.status, detail);
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
