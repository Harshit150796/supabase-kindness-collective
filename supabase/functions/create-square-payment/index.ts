import { SplitError, describeSplit, encodeSplit, normalizeSplit } from '../_shared/brand-split.ts';
import { ChargeError, chargeMetadata, computeCharge } from '../_shared/checkout-total.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { EXAMPLE_CLOSED_MESSAGE, isExampleFundraiser } from '../_shared/example-guard.ts';
import { UUID_RE, requestUser } from '../_shared/auth.ts';
import { HOUR, clientIp, overLimit, recentCount, recordEvent } from '../_shared/rate-limit.ts';
import { isEmail } from '../_shared/email-exists.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function squareBaseUrl(): string {
  const env = (Deno.env.get("SQUARE_ENVIRONMENT") || "production").toLowerCase();
  return env === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
}

// Square marks real card declines with this category. A made-up or reused token is an invalid
// request instead: it counts toward the attempt limit, not as a decline.
const isCardDecline = (data: { errors?: { category?: string }[] }) =>
  (data?.errors ?? []).some((e) => e?.category === "PAYMENT_METHOD_ERROR");

// Square payment tokens and saved-card ids look like cnon:… or ccof:….
const SOURCE_RE = /^[a-z]{4}:[A-Za-z0-9_\-+/=.]{4,450}$/;

function squareErr(data: { errors?: { detail?: string; code?: string }[] }) {
  const e = data?.errors?.[0];
  if (e?.code === "CARD_DECLINED" || e?.code === "GENERIC_DECLINE") return "Your card was declined. Please try another card.";
  if (e?.code === "CVV_FAILURE") return "The security code was incorrect.";
  if (e?.code === "INVALID_EXPIRATION") return "The expiration date is invalid.";
  if (e?.code === "INSUFFICIENT_FUNDS") return "Insufficient funds. Please try another card.";
  return "Payment failed. Please check the card details or try another card.";
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

    const { sourceId: rawSource, savedCardId, verificationToken, amount, tipAmount, coverFee, brandName, brandId, brandAllocations, userEmail, fundraiserId } = await req.json();
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const ip = clientIp(req);
    // Card-testing defence: stolen-card scripts try many cards. 30 attempts an hour per network
    // (room for an event on one Wi-Fi) and five real declines an hour per network.
    if (await overLimit(db, "card-pay-ip", ip, 30, HOUR)) return json({ error: "Too many payment attempts. Please try again in a little while." }, 429);
    if ((await recentCount(db, "card-decline-ip", ip, HOUR)) >= 5) return json({ error: "Too many declined cards. Please try again later or use another payment method." }, 429);
    if (fundraiserId != null && fundraiserId !== "" && (typeof fundraiserId !== "string" || !UUID_RE.test(fundraiserId))) return json({ error: "That fundraiser link isn't valid." }, 400);
    // The donor is whoever is signed in; a user id in the body is ignored.
    const signedUser = await requestUser(req, db);
    const userId = signedUser?.id ?? null;
    // A burst of real declines across the whole site means card testing from many networks: guest
    // card payments pause for a while so the account isn't used to test stolen cards, while
    // signed-in donors and saved cards keep working (nobody can switch payments off for everyone).
    if (!signedUser && (await recentCount(db, "card-decline-all", "all", HOUR)) >= 50) {
      return json({ error: "Card payments without an account are paused for a moment because of unusual activity. Please sign in to donate, or try again shortly.", code: "guest_paused" }, 503);
    }
    const guestEmail = isEmail(userEmail) ? userEmail.trim() : null;
    const donorEmail = signedUser?.email ?? guestEmail;
    if (await isExampleFundraiser(fundraiserId)) return json({ error: EXAMPLE_CLOSED_MESSAGE }, 403);
    const amt = Number(amount);
    // Paying with a saved card: only the signed-in owner may use it, with their Square customer.
    let sourceId = rawSource;
    let customerId: string | null = null;
    if (typeof savedCardId === "string" && savedCardId) {
      if (!signedUser) return json({ error: "Please sign in to use a saved card." }, 401);
      const { data: card } = await db.from("saved_cards").select("square_card_id").eq("user_id", signedUser.id).eq("square_card_id", savedCardId).maybeSingle();
      const { data: prof } = await db.from("donor_payment_profiles").select("square_customer_id").eq("user_id", signedUser.id).maybeSingle();
      if (!card || !prof) return json({ error: "That saved card was not found." }, 404);
      sourceId = card.square_card_id; customerId = prof.square_customer_id;
    }
    if (typeof sourceId !== "string" || !SOURCE_RE.test(sourceId)) return json({ error: "Missing payment details." }, 400);
    if (!amt || amt < 5 || amt > 10000) return json({ error: "Invalid donation amount. Must be between $5 and $10,000." }, 400);

    // The donor's dollar split, checked again here (each retailer's share becomes one coupon slot).
    let shares, charge;
    try {
      shares = normalizeSplit(amt, brandAllocations, { brand: brandName, brandId });
      charge = computeCharge({ gift: amt, tip: tipAmount, coverFee, provider: "square" });
    } catch (e) {
      if (e instanceof SplitError || e instanceof ChargeError) return json({ error: e.message }, 400);
      throw e;
    }
    const isMultiBrand = shares.length > 1;

    const token = (Deno.env.get("SQUARE_ACCESS_TOKEN") ?? "").trim();
    const locationId = (Deno.env.get("SQUARE_LOCATION_ID") ?? "").trim();
    if (!token || !locationId) return json({ error: "Square is not configured." }, 500);
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Square-Version": "2025-01-23" };

    // Square allows ten metadata keys; these are nine at most.
    const metadata: Record<string, string> = { type: "donation", ...chargeMetadata(charge) };
    if (shares[0]?.brand) metadata.brand_name = shares[0].brand;
    if (shares.length > 0) metadata.brand_allocations = encodeSplit(shares);
    if (userId) metadata.donor_id = userId;
    if (donorEmail) metadata.donor_email = donorEmail;
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
            name: isMultiBrand ? `Donation for families (${shares.length} retailers)` : "Donation to Help Families",
            quantity: "1",
            base_price_money: { amount: charge.giftCents, currency: "USD" },
            ...(shares.length ? { note: (isMultiBrand ? `100% to families, shared between ${describeSplit(shares)}` : `100% to families, via ${shares[0].brand}`).slice(0, 500) } : {}),
          },
          // The order total must match the charge, so the tip and covered fee are their own lines.
          ...(charge.tipCents > 0 ? [{ name: "Tip to CouponDonation", quantity: "1", base_price_money: { amount: charge.tipCents, currency: "USD" } }] : []),
          ...(charge.feeCents > 0 ? [{ name: "Card processing fee (you covered it)", quantity: "1", base_price_money: { amount: charge.feeCents, currency: "USD" } }] : [])],
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
        ...(customerId ? { customer_id: customerId } : {}),
        amount_money: { amount: charge.totalCents, currency: "USD" },
        order_id: orderId,
        location_id: locationId,
        autocomplete: true,
        ...(donorEmail ? { buyer_email_address: donorEmail } : {}),
      }),
    });
    const payData = await payRes.json();
    if (!payRes.ok) {
      console.error("Square payment error:", JSON.stringify(payData));
      if (isCardDecline(payData)) {
        await recordEvent(db, "card-decline-ip", ip);
        await recordEvent(db, "card-decline-all", "all");
      }
      return json({ error: squareErr(payData) }, 402);
    }

    return json({ ok: true, paymentId: payData.payment?.id, orderId, status: payData.payment?.status });
  } catch (e) {
    console.error("create-square-payment error:", e);
    return json({ error: "The payment could not be completed. Please try again in a moment." }, 500);
  }
});
