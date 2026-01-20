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
    
    // Determine trust level for Radar
    const isAuthenticated = !!userId;
    const isVerifiedDonor = !!(userEmail && userId); // Has account with verified email
    
    console.log("Creating donation checkout session:", { 
      amount, 
      brandName, 
      brandId, 
      userId: userId || 'anonymous', 
      userEmail: userEmail || 'guest',
      isAuthenticated,
      isVerifiedDonor
    });

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
    
    // Extract fraud prevention data from request headers
    const userAgent = req.headers.get("user-agent") || "unknown";
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || req.headers.get("cf-connecting-ip") 
      || req.headers.get("x-real-ip") 
      || "unknown";
    
    console.log("Creating checkout with fraud metadata:", { userAgent: userAgent.substring(0, 50), ipAddress });

    // Create Checkout session with full payment hardening
    const session = await stripe.checkout.sessions.create({
      locale: "en",
      
      // CRITICAL: Full billing address for AVS checks (prevents US bank declines)
      billing_address_collection: 'required',
      
      // Phone collection improves bank trust score
      phone_number_collection: {
        enabled: true,
      },
      
      // Enable modern payment methods for better conversion
      // Note: Apple Pay & Google Pay are enabled automatically with 'card' when configured in Stripe Dashboard
      payment_method_types: ['card', 'link'],
      
      // 3D Secure configuration for international cards (SCA compliance)
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
      
      // Prefill email for logged-in users (reduces friction)
      ...(userEmail && { customer_email: userEmail }),
      
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
      success_url: `${req.headers.get("origin")}/donation-success?session_id={CHECKOUT_SESSION_ID}&amount=${amount}&meals=${mealsProvided}`,
      cancel_url: `${req.headers.get("origin")}/donation-cancelled`,
      
      // Session metadata for our records
      metadata: {
        type: "donation",
        amount: amount.toString(),
        meals_provided: mealsProvided.toString(),
        brand_name: brandName || "",
        brand_id: brandId || "",
        donor_id: userId || "",
        donor_email: userEmail || "",
      },
      
      // Payment intent configuration for better tracking and fraud prevention
      payment_intent_data: {
        // Clear statement descriptor so donors recognize the charge (max 22 chars)
        statement_descriptor: 'COUPONDONATION',
        statement_descriptor_suffix: 'DONATE',
        metadata: {
          type: "donation",
          amount: amount.toString(),
          meals_provided: mealsProvided.toString(),
          brand_name: brandName || "",
          // Trust signals for Stripe Radar - reduces false positives for known users
          is_authenticated: isAuthenticated.toString(),
          is_verified_donor: isVerifiedDonor.toString(),
          donor_account_id: userId || "guest",
          // Fraud prevention: attach client info for Stripe Radar
          user_agent: userAgent.substring(0, 500), // Stripe has metadata value limits
          ip_address: ipAddress,
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
