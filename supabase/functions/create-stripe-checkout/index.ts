import Stripe from "npm:stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BrandAllocation { brand: string; brandId: string; percent: number; amount: number }

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

    const { amount, brandName, brandId, brandAllocations, userId, userEmail, fundraiserId } = await req.json();
    const amt = Number(amount);
    if (!amt || amt < 5 || amt > 10000) return json({ error: "Invalid donation amount. Must be between $5 and $10,000." }, 400);

    const allocations: BrandAllocation[] = Array.isArray(brandAllocations) && brandAllocations.length > 0
      ? brandAllocations
      : brandName ? [{ brand: brandName, brandId: brandId || "", percent: 100, amount: amt }] : [];
    const isMultiBrand = allocations.length > 1;
    const brandNames = allocations.map((a) => a.brand).join(", ");

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
          unit_amount: Math.round(amt * 100),
          product_data: {
            name: isMultiBrand ? `Multi-Brand Donation (${allocations.length} brands)` : "Donation to Help Families",
            description: isMultiBrand ? `Split across: ${brandNames}` : (brandName ? `Via ${brandName}` : undefined),
          },
        },
      }],
      metadata: {
        type: "donation",
        amount: amt.toString(),
        meals_provided: mealsProvided.toString(),
        is_multi_brand: isMultiBrand.toString(),
        brand_name: allocations[0]?.brand || "",
        brand_id: allocations[0]?.brandId || "",
        brand_allocations: JSON.stringify(allocations).slice(0, 500),
        donor_id: userId || "",
        donor_email: userEmail || "",
        fundraiser_id: fundraiserId || "",
      },
      success_url: `${origin}/donation-success?amount=${amt}&meals=${mealsProvided}`,
      cancel_url: `${origin}/donation-cancelled`,
    });

    return json({ url: session.url, sessionId: session.id });
  } catch (e) {
    console.error("Stripe checkout error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
