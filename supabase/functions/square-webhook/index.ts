import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { brandRows, couponSlots, describeSplit, parseSplit, type Share } from '../_shared/brand-split.ts';
import { readPayment } from '../_shared/checkout-total.ts';
import { monthlyMetadata } from '../_shared/square-recurring.ts';
import { cardRow } from '../_shared/saved-card.ts';
import { isExampleFundraiser } from '../_shared/example-guard.ts';
import { timingSafeEqual } from '../_shared/auth.ts';
import { whereEmail } from '../_shared/email-exists.ts';

// The account a guest gift belongs to: same email (matched exactly, no wildcards), and only an
// account that confirmed it owns that address.
// deno-lint-ignore no-explicit-any
async function confirmedUserByEmail(supabase: any, email: string): Promise<string | null> {
  const { data: p } = await whereEmail(supabase.from("profiles").select("user_id"), "email", email).maybeSingle();
  if (!p?.user_id) return null;
  const { data } = await supabase.auth.admin.getUserById(p.user_id);
  return data?.user?.email_confirmed_at ? (p.user_id as string) : null;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-square-hmacsha256-signature",
};

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
  return signature.length > 0 && timingSafeEqual(expected, signature);
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
    } else if (event.type === "invoice.payment_made") {
      const invoice = event.data?.object?.invoice;
      if (invoice?.subscription_id && invoice?.order_id) await handleMonthlyInvoice(supabase, accessToken, invoice);
    } else if (event.type === "invoice.scheduled_charge_failed") {
      const invoice = event.data?.object?.invoice;
      if (invoice?.subscription_id) {
        await supabase.from("recurring_donations").update({ status: "payment_problem", failure_reason: "Square could not charge the saved card" }).eq("square_subscription_id", invoice.subscription_id);
      }
    } else if (event.type === "subscription.created" || event.type === "subscription.updated") {
      const sub = event.data?.object?.subscription;
      if (sub?.id) await syncSubscription(supabase, accessToken, sub);
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
  await recordDonation(supabase, payment, orderId, metadata);
}

// Monthly gifts: Square bills each month through an invoice. Our record is found from the
// subscription's plan variation (one per monthly checkout) and the same split is recorded again.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleMonthlyInvoice(supabase: any, accessToken: string, invoice: any) {
  const headers = { "Authorization": `Bearer ${accessToken}`, "Square-Version": "2025-01-23" };
  const subRes = await fetch(`${squareBaseUrl()}/v2/subscriptions/${invoice.subscription_id}`, { headers });
  const sub = (await subRes.json())?.subscription;
  if (!sub?.plan_variation_id) { console.error("Monthly invoice: subscription not found", invoice.subscription_id); return; }
  const { data: row } = await supabase.from("recurring_donations").select("*").eq("square_plan_variation_id", sub.plan_variation_id).maybeSingle();
  if (!row) { console.log("Invoice is not a CouponDonation monthly gift — skipping"); return; }
  if (!row.square_subscription_id || row.status === "pending") {
    await supabase.from("recurring_donations").update({ square_subscription_id: sub.id, status: "active" }).eq("id", row.id);
  }
  const { data: existing } = await supabase.from("donations").select("id").eq("stripe_session_id", invoice.order_id).maybeSingle();
  if (existing) return;
  if (!row.user_id && row.donor_email) {
    const uid = await confirmedUserByEmail(supabase, row.donor_email);
    if (uid) { row.user_id = uid; await supabase.from("recurring_donations").update({ user_id: uid }).eq("id", row.id); }
  }
  const order = (await (await fetch(`${squareBaseUrl()}/v2/orders/${invoice.order_id}`, { headers })).json())?.order;
  const paymentId = order?.tenders?.[0]?.payment_id;
  if (!paymentId) { console.error("Monthly invoice: no payment on order", invoice.order_id); return; }
  const payment = (await (await fetch(`${squareBaseUrl()}/v2/payments/${paymentId}`, { headers })).json())?.payment;
  if (!payment || payment.status !== "COMPLETED") return;
  await recordDonation(supabase, payment, invoice.order_id, monthlyMetadata(row));
  // Charge history and running totals for the admin Monthly gifts page (unique per invoice).
  const cents = payment.total_money?.amount || 0;
  const { data: don } = await supabase.from("donations").select("id").eq("stripe_session_id", invoice.order_id).maybeSingle();
  const { error: chErr } = await supabase.from("recurring_charges").insert({ recurring_id: row.id, square_invoice_id: invoice.id ?? invoice.order_id, square_order_id: invoice.order_id, donation_id: don?.id ?? null, amount_cents: cents });
  if (!chErr) {
    await supabase.from("recurring_donations").update({
      status: "active", failure_reason: null, last_charge_at: new Date().toISOString(),
      charges_count: (row.charges_count ?? 0) + 1, total_charged_cents: (row.total_charged_cents ?? 0) + cents,
      ...(sub.charged_through_date && { next_charge_on: sub.charged_through_date }),
    }).eq("id", row.id);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function recordDonation(supabase: any, payment: any, orderId: string, metadata: Record<string, string | undefined>) {
  const paidCents = payment.total_money?.amount || 0;
  const paid = paidCents / 100; // everything charged: gift + tip + covered fee
  // The gift (100% to families) apart from the optional tip and the card fee the donor covered.
  const split = readPayment(metadata, paidCents);
  const amount = split.giftCents / 100;
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
  // Fallback estimate: Square online rate, 3.3% + $0.30
  const fee = squareFee ?? Number((paid * 0.033 + 0.30).toFixed(2));
  const netAmount = Number((paid - fee).toFixed(2));

  const rawDonorId = metadata.donor_id || null;
  const donorId = (rawDonorId && rawDonorId.trim() !== "") ? rawDonorId : null;

  const shares = parseSplit(metadata, amount);
  const isMultiBrand = shares.length > 1;
  const brandPartner = isMultiBrand
    ? shares.map(s => s.brand).join(', ')
    : (shares[0]?.brand || null);

  const donorEmail = (metadata.donor_email && metadata.donor_email.trim() !== "")
    ? metadata.donor_email
    : (payment.buyer_email_address || null);

  const rawFundraiserId = metadata.fundraiser_id || null;
  const candidateFundraiser = (rawFundraiserId && rawFundraiserId.trim() !== "") ? rawFundraiserId : null;
  // Never attach a payment to an example campaign; keep it as a general gift instead.
  const fundraiserId = candidateFundraiser && !(await isExampleFundraiser(candidateFundraiser)) ? candidateFundraiser : null;

  console.log(`Processing ${isMultiBrand ? 'multi-brand' : 'single-brand'} Square donation: $${amount}, ${shares.length} brand(s)`);

  const donationData: Record<string, unknown> = {
    amount,
    amount_paid: paid,
    tip_amount: split.tipCents / 100,
    fee_covered_amount: split.feeCents / 100,
    payment_provider: "square",
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

  if (donationId && shares.length > 0) {
    await createCouponSlots(supabase, donationId, donorId, shares);
  } else if (donationId) {
    console.log(`Skipping coupon creation - no brand allocations for donation ${donationId}`);
  }
}

// Each retailer's share becomes ONE coupon slot holding its whole amount, `pending_procurement`
// with `code = NULL`. The team turns each slot into real coupons sized for what families need
// (admin coupon tools); nothing here picks coupon sizes, and no cents are lost to rounding.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createCouponSlots(
  supabase: any,
  donationId: string,
  donorId: string | null,
  shares: Share[]
) {
  console.log(`Creating coupon slots for donation ${donationId}: ${describeSplit(shares)}`);

  // Calculate expiry date (6 months from now)
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 6);
  const expiryDateStr = expiryDate.toISOString().split('T')[0]; // YYYY-MM-DD format

  const slots = couponSlots(shares, donationId, donorId, expiryDateStr);
  const { error: couponError } = await supabase.from("coupons").insert(slots);
  if (couponError) {
    console.error(`Error creating coupons: ${couponError.message}`);
    // Don't throw - donation is already recorded, this is non-critical
  } else {
    console.log(`Created ${slots.length} coupon slot(s)`);

    // Fire-and-forget: kick off auto-procurement.
    // Non-blocking so the webhook responds fast.
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

  // The exact amount each retailer was given; admin coupon tools split against this total.
  const { error: brandError } = await supabase.from("donation_brands").insert(brandRows(shares, donationId));
  if (brandError) {
    console.error(`Error creating donation_brands records: ${brandError.message}`);
    // Don't throw - non-critical for tracking
  } else {
    console.log(`Created ${shares.length} donation_brands record(s)`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleRefund(supabase: any, refund: any) {
  console.log(`Processing Square refund: ${refund.id} for payment ${refund.payment_id}`);

  const { data: donation } = await supabase
    .from("donations")
    .select("id, amount, amount_paid")
    .eq("stripe_payment_intent_id", refund.payment_id)
    .single();

  if (!donation) {
    console.log(`No donation found for Square payment: ${refund.payment_id}`);
    return;
  }

  const refundedAmount = (refund.amount_money?.amount || 0) / 100;
  const status = refundedAmount >= Number(donation.amount_paid ?? donation.amount) ? "refunded" : "partially_refunded";

  await supabase
    .from("donations")
    .update({ status })
    .eq("id", donation.id);

  console.log(`Updated donation ${donation.id} status to ${status}`);
}

// Keeps our monthly-gift record in step with Square's subscription, links guests to an account by
// the email they paid with, and lists the saved card under the donor's payment methods.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncSubscription(supabase: any, accessToken: string, sub: any) {
  const sel = "id, user_id, donor_email, status";
  let { data: row } = await supabase.from("recurring_donations").select(sel).eq("square_subscription_id", sub.id).maybeSingle();
  if (!row && sub.plan_variation_id) {
    ({ data: row } = await supabase.from("recurring_donations").select(sel).eq("square_plan_variation_id", sub.plan_variation_id).maybeSingle());
  }
  if (!row) { console.log("Subscription is not a CouponDonation monthly gift — skipping"); return; }
  const sqHeaders = { "Authorization": `Bearer ${accessToken}`, "Square-Version": "2025-01-23" };
  const patch: Record<string, unknown> = { square_subscription_id: sub.id };
  if (sub.customer_id) patch.square_customer_id = sub.customer_id;
  if (sub.card_id) patch.square_card_id = sub.card_id;
  if (sub.charged_through_date) patch.next_charge_on = sub.charged_through_date;
  const status = String(sub.status || "");
  if (status === "CANCELED" || status === "DEACTIVATED") { patch.status = "canceled"; patch.canceled_at = new Date().toISOString(); }
  else if (status === "PAUSED") { patch.status = "paused"; patch.paused_at = new Date().toISOString(); }
  else if (status === "ACTIVE" && row.status !== "payment_problem") { patch.status = "active"; patch.paused_at = null; }
  let email = row.donor_email as string | null;
  if (!email && sub.customer_id) {
    const c = await (await fetch(`${squareBaseUrl()}/v2/customers/${sub.customer_id}`, { headers: sqHeaders })).json().catch(() => null);
    email = c?.customer?.email_address ?? null;
    if (email) patch.donor_email = email;
  }
  if (!row.user_id && email) {
    const uid = await confirmedUserByEmail(supabase, email);
    if (uid) patch.user_id = uid;
  }
  await supabase.from("recurring_donations").update(patch).eq("id", row.id);
  // The card is saved to an account only when the donor was signed in at checkout. A guest gift is
  // matched to an account by the email typed at checkout, which proves nothing, so it never puts
  // a card or a Square customer on someone's account.
  const uid = row.user_id as string | null;
  if (uid && sub.customer_id && sub.card_id) {
    await supabase.from("donor_payment_profiles").upsert({ user_id: uid, square_customer_id: sub.customer_id }, { onConflict: "user_id", ignoreDuplicates: true });
    const c = await (await fetch(`${squareBaseUrl()}/v2/cards/${encodeURIComponent(sub.card_id)}`, { headers: sqHeaders })).json().catch(() => null);
    if (c?.card?.id) await supabase.from("saved_cards").upsert({ user_id: uid, ...cardRow(c.card) }, { onConflict: "square_card_id", ignoreDuplicates: true });
  }
}
