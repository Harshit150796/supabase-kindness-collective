import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeSecretKey || !webhookSecret) {
    console.error("Missing Stripe configuration");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

  // Get the signature from headers
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    console.error("No stripe-signature header");
    return new Response(JSON.stringify({ error: "No signature" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Get raw body for signature verification
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`Received event: ${event.type}`);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Initialize Supabase with service role for database operations
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSuccessfulPayment(stripe, supabase, session);
        break;
      }

      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleFailedPayment(supabase, session, event.type);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(supabase, charge);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment intent succeeded: ${paymentIntent.id}`);
        // Backup confirmation - checkout.session.completed is primary
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment intent failed: ${paymentIntent.id}`);
        await handlePaymentIntentFailed(supabase, paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Error processing webhook: ${errorMessage}`);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleSuccessfulPayment(
  stripe: Stripe,
  supabase: any,
  session: Stripe.Checkout.Session
) {
  console.log(`Processing successful payment for session: ${session.id}`);

  // Check if donation already exists (idempotency)
  const { data: existing } = await supabase
    .from("donations")
    .select("id")
    .eq("stripe_session_id", session.id)
    .single();

  if (existing) {
    console.log(`Donation already exists for session ${session.id}`);
    return;
  }

  // Get payment details
  const amount = (session.amount_total || 0) / 100; // Convert from cents
  const currency = session.currency || "usd";

  // Calculate Stripe fee (2.9% + $0.30 for US)
  const stripeFee = Number((amount * 0.029 + 0.30).toFixed(2));
  const netAmount = Number((amount - stripeFee).toFixed(2));

  // Get payment method details if available
  let paymentMethod = null;
  let receiptUrl = null;

  if (session.payment_intent) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent as string,
        { expand: ["latest_charge"] }
      );

      const charge = paymentIntent.latest_charge as Stripe.Charge;
      if (charge) {
        receiptUrl = charge.receipt_url;
        if (charge.payment_method_details?.card) {
          const card = charge.payment_method_details.card;
          paymentMethod = `${card.brand?.toUpperCase() || 'CARD'} •••• ${card.last4}`;
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error(`Error fetching payment details: ${errorMessage}`);
    }
  }

  // Extract metadata
  const metadata = session.metadata || {};
  const rawDonorId = metadata.donor_id || null;
  // Treat empty string as null
  const donorId = (rawDonorId && rawDonorId.trim() !== "") ? rawDonorId : null;
  const brandPartner = metadata.brand_name || null;
  // Prioritize account email from metadata over Stripe receipt email
  const donorEmail = (metadata.donor_email && metadata.donor_email.trim() !== "") 
    ? metadata.donor_email 
    : (session.customer_details?.email || null);

  // Insert donation record
  const donationData: any = {
    amount,
    stripe_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent as string,
    payment_method: paymentMethod,
    stripe_fee: stripeFee,
    net_amount: netAmount,
    currency,
    receipt_url: receiptUrl,
    donor_email: donorEmail,
    brand_partner: brandPartner,
    status: "completed",
  };

  // Only add donor_id if we have one (authenticated user)
  if (donorId) {
    donationData.donor_id = donorId;
  }

  const { error } = await supabase.from("donations").insert(donationData);

  if (error) {
    console.error(`Error inserting donation: ${error.message}`);
    throw error;
  }

  console.log(`Donation recorded successfully for session ${session.id}`);
}

async function handleFailedPayment(
  supabase: any,
  session: Stripe.Checkout.Session,
  eventType: string
) {
  console.log(`Processing failed/expired payment for session: ${session.id}`);

  const status = eventType === "checkout.session.expired" ? "expired" : "failed";

  // Check if we have a record to update
  const { data: existing } = await supabase
    .from("donations")
    .select("id")
    .eq("stripe_session_id", session.id)
    .single();

  if (existing) {
    await supabase
      .from("donations")
      .update({ status })
      .eq("stripe_session_id", session.id);
    console.log(`Updated donation status to ${status}`);
  } else {
    console.log(`No existing donation record for session ${session.id}`);
  }
}

async function handleRefund(supabase: any, charge: Stripe.Charge) {
  console.log(`Processing refund for charge: ${charge.id}`);

  // Find donation by payment intent
  const { data: donation } = await supabase
    .from("donations")
    .select("id, amount")
    .eq("stripe_payment_intent_id", charge.payment_intent)
    .single();

  if (!donation) {
    console.log(`No donation found for payment intent: ${charge.payment_intent}`);
    return;
  }

  // Check if fully or partially refunded
  const refundedAmount = (charge.amount_refunded || 0) / 100;
  const status = refundedAmount >= donation.amount ? "refunded" : "partially_refunded";

  await supabase
    .from("donations")
    .update({ status })
    .eq("id", donation.id);

  console.log(`Updated donation ${donation.id} status to ${status}`);
}

async function handlePaymentIntentFailed(
  supabase: any,
  paymentIntent: Stripe.PaymentIntent
) {
  console.log(`Processing failed payment intent: ${paymentIntent.id}`);

  // Update any existing donation with this payment intent
  const { data: donation } = await supabase
    .from("donations")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .single();

  if (donation) {
    await supabase
      .from("donations")
      .update({ status: "failed" })
      .eq("id", donation.id);
    console.log(`Updated donation ${donation.id} status to failed`);
  }
}
