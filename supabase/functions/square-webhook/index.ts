import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-square-hmacsha256-signature",
};

interface BrandAllocation {
  brand: string;
  brandId: string;
  percent: number;
  amount: number;
}

function squareBaseUrl(): string {
  const env = (Deno.env.get("SQUARE_ENVIRONMENT") || "production").toLowerCase();
  return env === "sandbox"
    ? "https://connect.squareupsandbox.com"
    : "https://connect.squareup.com";
}

// Verify Square webhook signature: base64 HMAC-SHA256 of (notificationUrl + rawBody)
async function verifySquareSignature(
  rawBody: string,
  signature: string,
  signatureKey: string,
  notificationUrl: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signatureKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(notificationUrl + rawBody)
  );
  const expected = btoa(String.fromCharCode(...new Uint8Array(signed)));
  return expected === signature;
}

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const accessToken = (Deno.env.get("SQUARE_ACCESS_TOKEN") ?? "").trim();
  const signatureKey = (Deno.env.get("SQUARE_WEBHOOK_SIGNATURE_KEY") ?? "").trim();

  if (!accessToken || !signatureKey) {
    console.error("Missing Square configuration");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature") || "";

  // The notification URL must exactly match the URL configured in the Square
  // Developer dashboard webhook subscription.
  const notificationUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/square-webhook`;

  const valid = await verifySquareSignature(rawBody, signature, signatureKey, notificationUrl);
  if (!valid) {
    console.error("Square webhook signature verification failed");
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const event = JSON.parse(rawBody);
    console.log(`Received Square event: ${event.type}`);

    if (event.type === "payment.updated") {
      const payment = event.data?.object?.payment;
      if (payment && payment.status === "COMPLETED") {
        await handleCompletedPayment(supabase, accessToken, payment);
      } else if (payment && (payment.status === "FAILED" || payment.status === "CANCELED")) {
        console.log(`Payment ${payment.id} ${payment.status} — no action needed`);
      }
    } else if (event.type === "refund.updated") {
      const refund = event.data?.object?.refund;
      if (refund && refund.status === "COMPLETED") {
        await handleRefund(supabase, refund);
      }
    } else {
      console.log(`Unhandled Square event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Error processing Square webhook: ${errorMessage}`);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCompletedPayment(supabase: any, accessToken: string, payment: any) {
  const orderId = payment.order_id;
  console.log(`Processing completed Square payment: ${payment.id}, order: ${orderId}`);

  if (!orderId) {
    console.log("Payment has no order_id — skipping");
    return;
  }

  // Idempotency: the Square order id is stored in stripe_session_id (reused column)
  const { data: existing } = await supabase
    .from("donations")
    .select("id")
    .eq("stripe_session_id", orderId)
    .single();

  if (existing) {
    console.log(`Donation already exists for order ${orderId}`);
    return;
  }

  // Fetch the order to recover the metadata set at checkout time
  const orderRes = await fetch(`${squareBaseUrl()}/v2/orders/${orderId}`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Square-Version": "2025-01-23",
    },
  });
  const orderData = await orderRes.json();
  const order = orderData.order;

  if (!order) {
    console.error("Could not retrieve Square order:", orderId, JSON.stringify(orderData));
    return;
  }

  const metadata: Record<string, string | undefined> = order.metadata || {};
  if (metadata.type !== "donation") {
    console.log(`Order ${orderId} is not a donation — skipping`);
    return;
  }

  const amount = (payment.total_money?.amount || 0) / 100; // cents → dollars
  const currency = (payment.total_money?.currency || "USD").toLowerCase();

  // Card details + actual Square processing fee
  let paymentMethod: string | null = null;
  if (payment.card_details?.card) {
    const card = payment.card_details.card;
    paymentMethod = `${card.card_brand || 'CARD'} •••• ${card.last_4 || ''}`;
  }

  let squareFee: number | null = null;
  if (Array.isArray(payment.processing_fee)) {
    const feeCents = payment.processing_fee.reduce(
      (sum: number, f: { amount_money?: { amount?: number } }) => sum + (f.amount_money?.amount || 0),
      0
    );
    if (feeCents > 0) squareFee = feeCents / 100;
  }
  // Fallback estimate: 2.9% + $0.30
  const fee = squareFee ?? Number((amount * 0.029 + 0.30).toFixed(2));
  const netAmount = Number((amount - fee).toFixed(2));

  const rawDonorId = metadata.donor_id || null;
  const donorId = (rawDonorId && rawDonorId.trim() !== "") ? rawDonorId : null;

  const brandAllocations = parseBrandAllocations(metadata);
  const isMultiBrand = brandAllocations.length > 1;
  const brandPartner = isMultiBrand
    ? brandAllocations.map(a => a.brand).join(', ')
    : (brandAllocations[0]?.brand || null);

  const donorEmail = (metadata.donor_email && metadata.donor_email.trim() !== "")
    ? metadata.donor_email
    : (payment.buyer_email_address || null);

  const rawFundraiserId = metadata.fundraiser_id || null;
  const fundraiserId = (rawFundraiserId && rawFundraiserId.trim() !== "") ? rawFundraiserId : null;

  console.log(`Processing ${isMultiBrand ? 'multi-brand' : 'single-brand'} Square donation: $${amount}, ${brandAllocations.length} brand(s)`);

  const donationData: Record<string, unknown> = {
    amount,
    stripe_session_id: orderId,          // reused column: holds the Square order id
    stripe_payment_intent_id: payment.id, // reused column: holds the Square payment id
    payment_method: paymentMethod,
    stripe_fee: fee,
    net_amount: netAmount,
    currency,
    receipt_url: payment.receipt_url || null,
    donor_email: donorEmail,
    donor_name: null,
    brand_partner: brandPartner,
    status: "completed",
  };

  if (donorId) donationData.donor_id = donorId;
  if (fundraiserId) donationData.fundraiser_id = fundraiserId;

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
  console.log(`Donation recorded for Square order ${orderId}, id: ${donationId}, fee: $${fee}, net: $${netAmount}`);

  if (fundraiserId) {
    const { error: rpcErr } = await supabase.rpc("apply_donation_to_fundraiser", {
      _fundraiser_id: fundraiserId,
      _amount: amount,
      _donor_email: donorEmail,
      _donor_id: donorId,
    });
    if (rpcErr) {
      console.error(`Error updating fundraiser totals: ${rpcErr.message}`);
    } else {
      console.log(`Fundraiser ${fundraiserId} totals updated (+$${amount})`);
    }
  }

  if (donationId && brandAllocations.length > 0) {
    await createCouponsFromMultiBrandDonation(supabase, donationId, donorId, amount, brandAllocations);
  } else if (donationId) {
    console.log(`Skipping coupon creation - no brand allocations for donation ${donationId}`);
  }
}

// Coupons are created as `pending_procurement` with code = NULL.
// Admin attaches real gift card codes later via `attach_procured_codes`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createCouponsFromMultiBrandDonation(
  supabase: any,
  donationId: string,
  donorId: string | null,
  totalAmount: number,
  brandAllocations: BrandAllocation[]
) {
  console.log(`Creating coupons for donation ${donationId}: $${totalAmount} across ${brandAllocations.length} brand(s)`);

  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 6);
  const expiryDateStr = expiryDate.toISOString().split('T')[0];

  const allCoupons: Record<string, unknown>[] = [];
  const brandRecords: Record<string, unknown>[] = [];

  for (const allocation of brandAllocations) {
    const allocatedAmount = (totalAmount * allocation.percent) / 100;
    const couponValue = allocatedAmount >= 50 ? 10 : 5;
    const couponCount = Math.floor(allocatedAmount / couponValue);

    console.log(`Brand ${allocation.brand}: $${allocatedAmount.toFixed(2)} (${allocation.percent}%) → ${couponCount} x $${couponValue} coupon slot(s)`);

    for (let i = 0; i < couponCount; i++) {
      allCoupons.push({
        donation_id: donationId,
        donor_id: donorId,
        title: `${allocation.brand} Gift`,
        store_name: allocation.brand,
        value: couponValue,
        expected_value: couponValue,
        code: null,
        status: 'pending_procurement',
        expiry_date: expiryDateStr,
      });
    }

    brandRecords.push({
      donation_id: donationId,
      brand_name: allocation.brand,
      allocation_percent: allocation.percent,
      allocated_amount: allocatedAmount,
    });
  }

  if (allCoupons.length > 0) {
    const { error: couponError } = await supabase.from("coupons").insert(allCoupons);
    if (couponError) {
      console.error(`Error creating coupons: ${couponError.message}`);
    } else {
      console.log(`Created ${allCoupons.length} total coupons across ${brandAllocations.length} brand(s)`);

      // Fire-and-forget: kick off auto-procurement
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        fetch(`${supabaseUrl}/functions/v1/procure-coupons`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ donation_id: donationId }),
        }).catch((e) => console.error("procure-coupons kickoff failed:", e));
      } catch (e) {
        console.error("Could not kick off procure-coupons:", e);
      }
    }
  } else {
    console.log(`No coupons created - allocated amounts too small`);
  }

  if (brandRecords.length > 0) {
    const { error: brandError } = await supabase.from("donation_brands").insert(brandRecords);
    if (brandError) {
      console.error(`Error creating donation_brands records: ${brandError.message}`);
    } else {
      console.log(`Created ${brandRecords.length} donation_brands record(s)`);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleRefund(supabase: any, refund: any) {
  console.log(`Processing Square refund: ${refund.id} for payment ${refund.payment_id}`);

  const { data: donation } = await supabase
    .from("donations")
    .select("id, amount")
    .eq("stripe_payment_intent_id", refund.payment_id)
    .single();

  if (!donation) {
    console.log(`No donation found for Square payment: ${refund.payment_id}`);
    return;
  }

  const refundedAmount = (refund.amount_money?.amount || 0) / 100;
  const status = refundedAmount >= donation.amount ? "refunded" : "partially_refunded";

  await supabase
    .from("donations")
    .update({ status })
    .eq("id", donation.id);

  console.log(`Updated donation ${donation.id} status to ${status}`);
}
