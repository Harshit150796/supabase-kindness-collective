import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, brandName, brandId, userId, userEmail } = await req.json();
    
    console.log("Creating donation checkout session:", { amount, brandName, brandId, userId: userId || 'anonymous', userEmail: userEmail || 'guest' });

    // Validate amount
    if (!amount || amount < 5 || amount > 500) {
      throw new Error("Invalid donation amount. Must be between $5 and $500.");
    }

    // Initialize Stripe
    const rawStripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    const stripeKey = rawStripeKey
      .trim()
      // Guard against users pasting quoted values like "sk_live_..."
      .replace(/^['"]|['"]$/g, "");

    if (!stripeKey) {
      throw new Error(
        "Missing STRIPE_SECRET_KEY. Add it in Supabase → Project Settings → Functions → Secrets."
      );
    }

    // Common mistake: copying a masked key from an error message (contains ***).
    if (stripeKey.includes("*")) {
      throw new Error(
        "STRIPE_SECRET_KEY looks masked (contains '*'). Paste the full secret key from Stripe (starts with sk_...)."
      );
    }

    if (!stripeKey.startsWith("sk_")) {
      throw new Error(
        "Invalid STRIPE_SECRET_KEY: must be a Stripe Secret Key (starts with 'sk_'), not a publishable key (pk_...)."
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Calculate impact for metadata
    const mealsProvided = amount * 2;
    
    console.log("Guest checkout mode - no customer prefill for privacy");

    // Create Checkout session - always fresh, no customer prefill for privacy
    const session = await stripe.checkout.sessions.create({
      // Don't set customer or customer_email - Stripe will collect email fresh
      locale: "en",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Donation to Help Families`,
              description: `Your $${amount} USD donation provides ${mealsProvided} meals for families in need${brandName ? ` via ${brandName}` : ""}. International cards accepted - your bank handles currency conversion.`,
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${req.headers.get("origin")}/donation-success?session_id={CHECKOUT_SESSION_ID}&amount=${amount}&meals=${mealsProvided}`,
      cancel_url: `${req.headers.get("origin")}/donation-cancelled`,
      metadata: {
        type: "donation",
        amount: amount.toString(),
        meals_provided: mealsProvided.toString(),
        brand_name: brandName || "",
        brand_id: brandId || "",
        donor_id: userId || "",
        donor_email: userEmail || "",
      },
      payment_intent_data: {
        metadata: {
          type: "donation",
          amount: amount.toString(),
          meals_provided: mealsProvided.toString(),
        },
      },
    });

    console.log("Checkout session created:", session.id, "URL:", session.url);

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error creating checkout session:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
