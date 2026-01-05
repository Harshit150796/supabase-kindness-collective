import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse optional parameters
    let params: { limit?: number; created_after?: number } = {};
    try {
      const body = await req.json();
      params = body || {};
    } catch {
      // No body provided, use defaults
    }

    const limit = params.limit || 100;
    const createdAfter = params.created_after;

    console.log(`Starting backfill with limit: ${limit}, created_after: ${createdAfter || 'none'}`);

    // Fetch completed checkout sessions from Stripe
    const sessionParams: Stripe.Checkout.SessionListParams = {
      limit,
      status: "complete",
      expand: ["data.payment_intent"],
    };

    if (createdAfter) {
      sessionParams.created = { gte: createdAfter };
    }

    const sessions = await stripe.checkout.sessions.list(sessionParams);
    console.log(`Found ${sessions.data.length} completed sessions`);

    const results: Array<{ session_id: string; amount: number; status: string; error?: string }> = [];
    let processed = 0;
    let skipped = 0;
    let failed = 0;

    for (const session of sessions.data) {
      try {
        // Check if already exists
        const { data: existing } = await supabase
          .from("donations")
          .select("id")
          .eq("stripe_session_id", session.id)
          .maybeSingle();

        if (existing) {
          console.log(`Skipping session ${session.id} - already exists`);
          skipped++;
          results.push({ session_id: session.id, amount: (session.amount_total || 0) / 100, status: "skipped" });
          continue;
        }

        // Get payment intent details
        const paymentIntent = session.payment_intent as Stripe.PaymentIntent | null;
        let receiptUrl: string | null = null;
        let paymentMethod: string | null = null;
        let stripeFee: number | null = null;
        let netAmount: number | null = null;

        if (paymentIntent && typeof paymentIntent === "object") {
          // Fetch the latest charge to get receipt and fee info
          const charges = await stripe.charges.list({
            payment_intent: paymentIntent.id,
            limit: 1,
          });

          if (charges.data.length > 0) {
            const charge = charges.data[0];
            receiptUrl = charge.receipt_url;

            // Get payment method details
            const pmDetails = charge.payment_method_details;
            if (pmDetails?.card) {
              const brand = pmDetails.card.brand || "card";
              const last4 = pmDetails.card.last4 || "****";
              paymentMethod = `${brand.charAt(0).toUpperCase() + brand.slice(1)} •••• ${last4}`;
            }

            // Get Stripe fee from balance transaction
            if (charge.balance_transaction) {
              const balanceTransaction = await stripe.balanceTransactions.retrieve(
                charge.balance_transaction as string
              );
              stripeFee = balanceTransaction.fee / 100;
              netAmount = balanceTransaction.net / 100;
            }
          }
        }

        const amount = (session.amount_total || 0) / 100;
        const currency = session.currency || "usd";

        // Extract metadata - handle both old (user_id) and new (donor_id) field names
        const metadata = session.metadata || {};
        const rawDonorId = metadata.donor_id || metadata.user_id || null;
        // Treat "anonymous" or empty as null
        const donorId = (rawDonorId && rawDonorId !== "anonymous" && rawDonorId.trim() !== "") ? rawDonorId : null;
        const brandPartner = metadata.brand_partner || metadata.brand_name || null;
        // Prioritize account email from metadata over Stripe receipt email
        const rawMetadataEmail = metadata.donor_email || null;
        const donorEmail = (rawMetadataEmail && rawMetadataEmail.trim() !== "") 
          ? rawMetadataEmail 
          : (session.customer_details?.email || null);

        // Insert into donations table
        const { error: insertError } = await supabase.from("donations").insert({
          donor_id: donorId,
          amount,
          stripe_session_id: session.id,
          stripe_payment_intent_id: paymentIntent?.id || null,
          payment_method: paymentMethod,
          stripe_fee: stripeFee,
          net_amount: netAmount,
          currency,
          receipt_url: receiptUrl,
          donor_email: donorEmail,
          brand_partner: brandPartner,
          status: "completed",
          created_at: new Date(session.created * 1000).toISOString(),
        });

        if (insertError) {
          console.error(`Error inserting session ${session.id}:`, insertError);
          failed++;
          results.push({ session_id: session.id, amount, status: "failed", error: insertError.message });
        } else {
          console.log(`Inserted session ${session.id} - $${amount}`);
          processed++;
          results.push({ session_id: session.id, amount, status: "inserted" });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`Error processing session ${session.id}:`, errorMessage);
        failed++;
        results.push({ session_id: session.id, amount: (session.amount_total || 0) / 100, status: "failed", error: errorMessage });
      }
    }

    const summary = {
      success: true,
      processed,
      skipped,
      failed,
      total: sessions.data.length,
      transactions: results,
    };

    console.log(`Backfill complete: ${processed} inserted, ${skipped} skipped, ${failed} failed`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Backfill error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
