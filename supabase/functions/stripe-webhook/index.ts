import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

interface BrandAllocation {
  brand: string;
  brandId: string;
  percent: number;
  amount: number;
}

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

  // Use aligned API version across all functions
  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-08-27.basil" });

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
    // CRITICAL: Use async version for Deno environment
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
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

// Generate a unique coupon code
function generateCouponCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Parse brand allocations from metadata
function parseBrandAllocations(metadata: Record<string, string | undefined>): BrandAllocation[] {
  try {
    const allocationsJson = metadata.brand_allocations;
    if (allocationsJson) {
      const parsed = JSON.parse(allocationsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to parse brand_allocations:", e);
  }
  
  // Fallback to legacy single brand
  const brandName = metadata.brand_name;
  if (brandName) {
    return [{
      brand: brandName,
      brandId: metadata.brand_id || '',
      percent: 100,
      amount: parseFloat(metadata.amount || '0'),
    }];
  }
  
  return [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Get payment method details and ACTUAL Stripe fee from balance transaction
  let paymentMethod = null;
  let receiptUrl = null;
  let actualStripeFee: number | null = null;

  if (session.payment_intent) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent as string,
        { expand: ["latest_charge"] }
      );

      const charge = paymentIntent.latest_charge as Stripe.Charge;
      if (charge) {
        receiptUrl = charge.receipt_url;
        
        // Get payment method details
        if (charge.payment_method_details?.card) {
          const card = charge.payment_method_details.card;
          paymentMethod = `${card.brand?.toUpperCase() || 'CARD'} •••• ${card.last4}`;
        }
        
        // IMPORTANT: Get ACTUAL Stripe fee from balance transaction (not hardcoded estimate)
        // This is more accurate for international cards with higher fees
        if (charge.balance_transaction) {
          try {
            const balanceTransaction = await stripe.balanceTransactions.retrieve(
              charge.balance_transaction as string
            );
            // Fee is in cents, convert to dollars
            actualStripeFee = balanceTransaction.fee / 100;
            console.log(`Actual Stripe fee from balance transaction: $${actualStripeFee}`);
          } catch (btErr) {
            console.error("Could not fetch balance transaction:", btErr);
          }
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error(`Error fetching payment details: ${errorMessage}`);
    }
  }

  // Fallback to estimated fee if we couldn't get actual (2.9% + $0.30 for US cards)
  const stripeFee = actualStripeFee ?? Number((amount * 0.029 + 0.30).toFixed(2));
  const netAmount = Number((amount - stripeFee).toFixed(2));

  // Extract metadata
  const metadata = session.metadata || {};
  const rawDonorId = metadata.donor_id || null;
  // Treat empty string as null
  const donorId = (rawDonorId && rawDonorId.trim() !== "") ? rawDonorId : null;
  
  // Parse brand allocations (multi-brand support)
  const brandAllocations = parseBrandAllocations(metadata);
  const isMultiBrand = brandAllocations.length > 1;
  
  // For backward compatibility, store primary brand or comma-separated list
  const brandPartner = isMultiBrand 
    ? brandAllocations.map(a => a.brand).join(', ')
    : (brandAllocations[0]?.brand || null);
  
  // Prioritize account email from metadata over Stripe receipt email
  const donorEmail = (metadata.donor_email && metadata.donor_email.trim() !== "") 
    ? metadata.donor_email 
    : (session.customer_details?.email || null);

  console.log(`Processing ${isMultiBrand ? 'multi-brand' : 'single-brand'} donation with ${brandAllocations.length} brand(s)`);

  // Insert donation record
  const donationData: Record<string, unknown> = {
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

  const { data: insertedDonation, error } = await supabase
    .from("donations")
    .insert(donationData)
    .select("id")
    .single();

  if (error) {
    console.error(`Error inserting donation: ${error.message}`);
    throw error;
  }

  const donationId = insertedDonation?.id;
  console.log(`Donation recorded successfully for session ${session.id}, id: ${donationId}, fee: $${stripeFee}, net: $${netAmount}`);

  // Create coupons from this donation (multi-brand support)
  if (donationId && brandAllocations.length > 0) {
    await createCouponsFromMultiBrandDonation(supabase, donationId, amount, brandAllocations);
  } else if (donationId) {
    console.log(`Skipping coupon creation - no brand allocations for donation ${donationId}`);
  }
}

// NEW: Multi-brand coupon creation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createCouponsFromMultiBrandDonation(
  supabase: any,
  donationId: string,
  totalAmount: number,
  brandAllocations: BrandAllocation[]
) {
  console.log(`Creating coupons for donation ${donationId}: $${totalAmount} across ${brandAllocations.length} brand(s)`);

  // Calculate expiry date (6 months from now)
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 6);
  const expiryDateStr = expiryDate.toISOString().split('T')[0]; // YYYY-MM-DD format

  const allCoupons: Record<string, unknown>[] = [];
  const brandRecords: Record<string, unknown>[] = [];

  for (const allocation of brandAllocations) {
    // Calculate allocated amount for this brand
    const allocatedAmount = (totalAmount * allocation.percent) / 100;
    
    // Determine coupon value and count based on allocated amount
    // $50+ allocations get $10 coupons, smaller allocations get $5 coupons
    const couponValue = allocatedAmount >= 50 ? 10 : 5;
    const couponCount = Math.floor(allocatedAmount / couponValue);

    console.log(`Brand ${allocation.brand}: $${allocatedAmount.toFixed(2)} (${allocation.percent}%) → ${couponCount} x $${couponValue} coupons`);

    // Create coupons for this brand
    for (let i = 0; i < couponCount; i++) {
      allCoupons.push({
        donation_id: donationId,
        title: `${allocation.brand} Gift`,
        store_name: allocation.brand,
        value: couponValue,
        code: generateCouponCode(),
        status: 'available',
        expiry_date: expiryDateStr,
      });
    }

    // Create brand allocation record
    brandRecords.push({
      donation_id: donationId,
      brand_name: allocation.brand,
      allocation_percent: allocation.percent,
      allocated_amount: allocatedAmount,
    });
  }

  // Insert all coupons in batch
  if (allCoupons.length > 0) {
    const { error: couponError } = await supabase.from("coupons").insert(allCoupons);
    if (couponError) {
      console.error(`Error creating coupons: ${couponError.message}`);
      // Don't throw - donation is already recorded, this is non-critical
    } else {
      console.log(`Created ${allCoupons.length} total coupons across ${brandAllocations.length} brand(s)`);
    }
  } else {
    console.log(`No coupons created - allocated amounts too small`);
  }

  // Insert brand allocation records
  if (brandRecords.length > 0) {
    const { error: brandError } = await supabase.from("donation_brands").insert(brandRecords);
    if (brandError) {
      console.error(`Error creating donation_brands records: ${brandError.message}`);
      // Don't throw - non-critical for tracking
    } else {
      console.log(`Created ${brandRecords.length} donation_brands record(s)`);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentIntentFailed(
  supabase: any,
  paymentIntent: Stripe.PaymentIntent
) {
  console.log(`Processing failed payment intent: ${paymentIntent.id}`);

  // Extract detailed decline reason for analytics
  const lastError = paymentIntent.last_payment_error;
  const declineCode = lastError?.decline_code || lastError?.code || 'unknown';
  const declineMessage = lastError?.message || 'Payment declined';
  
  console.log(`Decline details - Code: ${declineCode}, Message: ${declineMessage}`);

  // Update any existing donation with this payment intent
  const { data: donation } = await supabase
    .from("donations")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .single();

  if (donation) {
    await supabase
      .from("donations")
      .update({ 
        status: "failed",
        decline_reason: `${declineCode}: ${declineMessage}`,
      })
      .eq("id", donation.id);
    console.log(`Updated donation ${donation.id} status to failed with decline reason`);
  } else {
    // Log for analytics even if no donation record exists yet
    console.log(`No donation record found for failed payment intent ${paymentIntent.id}. Decline: ${declineCode}`);
  }
}
