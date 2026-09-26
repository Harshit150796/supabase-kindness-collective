const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BrandAllocation { brand: string; brandId: string; percent: number; amount: number }

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function squareBaseUrl(): string {
  const env = (Deno.env.get("SQUARE_ENVIRONMENT") || "production").toLowerCase();
  return env === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
}

function squareErr(data: { errors?: { detail?: string; code?: string }[] }) {
  const e = data?.errors?.[0];
  if (e?.code === "CARD_DECLINED" || e?.code === "GENERIC_DECLINE") return "Your card was declined. Please try another card.";
  if (e?.code === "CVV_FAILURE") return "The security code was incorrect.";
  if (e?.code === "INVALID_EXPIRATION") return "The expiration date is invalid.";
  if (e?.code === "INSUFFICIENT_FUNDS") return "Insufficient funds. Please try another card.";
  return e?.detail || "Payment failed. Please try again.";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const settingsRes = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/rest/v1/payment_settings?id=eq.1&select=square_enabled`,
      { headers: { apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` } },
    );
    const settings = settingsRes.ok ? (await settingsRes.json())?.[0] : null;
    if (settings && settings.square_enabled === false) return json({ error: "Square payments are currently turned off." }, 403);

    const { sourceId, verificationToken, amount, brandName, brandId, brandAllocations, userId, userEmail, fundraiserId } = await req.json();
    const amt = Number(amount);
    if (typeof sourceId !== "string" || !sourceId || sourceId.length > 500) return json({ error: "Missing payment details." }, 400);
    if (!amt || amt < 5 || amt > 10000) return json({ error: "Invalid donation amount. Must be between $5 and $10,000." }, 400);

    const allocations: BrandAllocation[] = Array.isArray(brandAllocations) && brandAllocations.length > 0
      ? brandAllocations
      : brandName ? [{ brand: brandName, brandId: brandId || "", percent: 100, amount: amt }] : [];
    const isMultiBrand = allocations.length > 1;
    const brandNames = allocations.map((a) => a.brand).join(", ");

    const token = (Deno.env.get("SQUARE_ACCESS_TOKEN") ?? "").trim();
    const locationId = (Deno.env.get("SQUARE_LOCATION_ID") ?? "").trim();
    if (!token || !locationId) return json({ error: "Square is not configured." }, 500);
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Square-Version": "2025-01-23" };

    const metadata: Record<string, string> = {
      type: "donation",
      amount: amt.toString(),
      meals_provided: (amt * 2).toString(),
      is_multi_brand: isMultiBrand.toString(),
    };
    if (allocations[0]?.brand) metadata.brand_name = allocations[0].brand;
    if (allocations[0]?.brandId) metadata.brand_id = allocations[0].brandId;
    const allocJson = JSON.stringify(allocations);
    if (allocations.length > 0 && allocJson.length <= 255) metadata.brand_allocations = allocJson;
    if (userId) metadata.donor_id = String(userId);
    if (userEmail) metadata.donor_email = String(userEmail);
    if (fundraiserId) metadata.fundraiser_id = String(fundraiserId);

    // 1) Order carries the metadata the square-webhook reads back.
    const orderRes = await fetch(`${squareBaseUrl()}/v2/orders`, {
      method: "POST", headers,
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        order: {
          location_id: locationId,
          reference_id: `donation_${Date.now()}`,
          line_items: [{
            name: isMultiBrand ? `Multi-Brand Donation (${allocations.length} brands)` : "Donation to Help Families",
            quantity: "1",
            base_price_money: { amount: Math.round(amt * 100), currency: "USD" },
            ...(brandNames ? { note: `Via ${brandNames}`.slice(0, 500) } : {}),
          }],
          metadata,
        },
      }),
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      console.error("Square order error:", JSON.stringify(orderData));
      return json({ error: squareErr(orderData) }, 400);
    }
    const orderId = orderData.order?.id;

    // 2) Charge the tokenized card / wallet against that order.
    const payRes = await fetch(`${squareBaseUrl()}/v2/payments`, {
      method: "POST", headers,
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        source_id: sourceId,
        ...(verificationToken ? { verification_token: verificationToken } : {}),
        amount_money: { amount: Math.round(amt * 100), currency: "USD" },
        order_id: orderId,
        location_id: locationId,
        autocomplete: true,
        ...(userEmail ? { buyer_email_address: userEmail } : {}),
      }),
    });
    const payData = await payRes.json();
    if (!payRes.ok) {
      console.error("Square payment error:", JSON.stringify(payData));
      return json({ error: squareErr(payData) }, 402);
    }

    return json({ ok: true, paymentId: payData.payment?.id, orderId, status: payData.payment?.status });
  } catch (e) {
    console.error("create-square-payment error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
