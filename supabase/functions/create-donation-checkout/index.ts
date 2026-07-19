import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

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

    console.log("Creating donation checkout session:", { 
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

    // Initialize Stripe
    const rawStripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    const stripeKey = rawStripeKey.trim().replace(/^['"]|['"]$/g, "");

    if (!stripeKey) {
      throw new Error("Missing STRIPE_SECRET_KEY. Add it in Supabase → Project Settings → Functions → Secrets.");
    }
    if (stripeKey.includes("*")) {
      throw new Error("STRIPE_SECRET_KEY looks masked (contains '*'). Paste the full secret key from Stripe.");
    }
    if (!stripeKey.startsWith("sk_")) {
      throw new Error("Invalid STRIPE_SECRET_KEY: must start with 'sk_'.");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    const mealsProvided = amount * 2;

    // Build product description
    const productDescription = isMultiBrand
      ? `Your $${amount} USD donation is split across ${allocations.length} brands: ${brandNames}. Each brand will provide coupons for families in need.`
      : `Your $${amount} USD donation provides ${mealsProvided} meals for families in need${brandName ? ` via ${brandName}` : ""}. International cards accepted.`;

    // Generate idempotency key to prevent duplicate charges
    const idempotencyKey = `checkout_${userId || 'anon'}_${amount}_${Date.now()}`;

    // Create Checkout session with optimized settings for higher approval rates
    const session = await stripe.checkout.sessions.create({
      locale: "en",
      
      // Full billing address for AVS checks
      billing_address_collection: 'required',
      
      // Phone collection improves bank trust score
      phone_number_collection: {
        enabled: true,
      },
      
      // 3D Secure: 'automatic' lets Stripe decide when it's needed
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
      
      // Prefill email for logged-in users
      ...(userEmail && { customer_email: userEmail }),
      
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: isMultiBrand 
                ? `Multi-Brand Donation (${allocations.length} brands)`
                : `Donation to Help Families`,
              description: productDescription,
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/donation-success?session_id={CHECKOUT_SESSION_ID}&amount=${amount}&meals=${mealsProvided}`,
      cancel_url: `${req.headers.get("origin")}/donation-cancelled`,
      
      // Session metadata
      metadata: {
        type: "donation",
        amount: amount.toString(),
        meals_provided: mealsProvided.toString(),
        brand_name: allocations[0]?.brand || "",
        brand_id: allocations[0]?.brandId || "",
        brand_allocations: JSON.stringify(allocations),
        is_multi_brand: isMultiBrand.toString(),
        brand_count: allocations.length.toString(),
        donor_id: userId || "",
        donor_email: userEmail || "",
        fundraiser_id: fundraiserId || "",
      },
      
      // Simplified payment_intent metadata — removed redundant fields
      // Stripe automatically captures IP, user-agent, and device info via Checkout
      payment_intent_data: {
        statement_descriptor: 'COUPONDONATION',
        metadata: {
          type: "donation",
          amount: amount.toString(),
          meals_provided: mealsProvided.toString(),
          brand_name: allocations[0]?.brand || "",
          brand_allocations: JSON.stringify(allocations),
          is_multi_brand: isMultiBrand.toString(),
          donor_account_id: userId || "guest",
        },
      },
    }, {
      idempotencyKey,
    });

    console.log("Checkout session created:", session.id, "URL:", session.url, "Brands:", allocations.length);

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error creating checkout session:", error);

    // Detect Stripe account restriction and return a friendly, non-alarming message.
    const isAccountRestricted =
      /cannot currently make live charges|account.*(restricted|disabled|inactive)/i.test(errorMessage);

    if (isAccountRestricted) {
      return new Response(
        JSON.stringify({
          error: "Payments are temporarily unavailable. Our team has been notified — please try again shortly.",
          code: "payments_unavailable",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 503,
        },
      );
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

