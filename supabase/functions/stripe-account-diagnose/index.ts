import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawStripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    const stripeKey = rawStripeKey.trim().replace(/^['"]|['"]$/g, "");

    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!stripeKey.startsWith("sk_")) throw new Error("Invalid STRIPE_SECRET_KEY format");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const account = await stripe.accounts.retrieve();

    // deno-lint-ignore no-explicit-any
    const req_ = (account.requirements ?? {}) as any;
    // deno-lint-ignore no-explicit-any
    const caps = (account.capabilities ?? {}) as any;

    const summary = {
      key_mode: stripeKey.startsWith("sk_live_") ? "live" : "test",
      account_id: account.id,
      country: account.country,
      email: account.email,
      business_profile_name:
        account.business_profile?.name ?? account.settings?.dashboard?.display_name ?? null,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      disabled_reason: req_.disabled_reason ?? null,
      currently_due: req_.currently_due ?? [],
      past_due: req_.past_due ?? [],
      pending_verification: req_.pending_verification ?? [],
      errors: req_.errors ?? [],
      eventually_due: req_.eventually_due ?? [],
      capabilities: {
        card_payments: caps.card_payments ?? null,
        transfers: caps.transfers ?? null,
        us_bank_account_ach_payments: caps.us_bank_account_ach_payments ?? null,
      },
      future_requirements: account.future_requirements ?? null,
    };

    return new Response(JSON.stringify(summary, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    // deno-lint-ignore no-explicit-any
    const raw = (error as any)?.raw ?? null;
    console.error("stripe-account-diagnose error:", error);
    return new Response(JSON.stringify({ error: message, raw }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
