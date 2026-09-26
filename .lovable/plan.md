# Switch Payments from Stripe to Square

## What you do in Square (manual steps)

1. **Get your Production credentials** (you're currently on the Sandbox tab):
   - In the Square Developer dashboard, switch the toggle at the top from **Sandbox** to **Production**.
   - Copy the **Production Application ID** and click **Show** on the **Production Access token** — copy it too.
2. **Get your Location ID**:
   - In the left menu click **Locations**, copy your active location's ID (needed to take payments).
3. **Set up a Webhook** (so donations get recorded automatically):
   - Left menu → **Webhooks** → Add subscription.
   - URL: `https://vbnbacowuoeeojjdrzzp.supabase.co/functions/v1/square-webhook` (I'll create this function).
   - Subscribe to the `payment.updated` event.
   - Copy the **Signature Key** it gives you.
4. **Paste 3 secrets into Lovable** when I prompt you with the secure form:
   - `SQUARE_ACCESS_TOKEN` (production access token)
   - `SQUARE_LOCATION_ID`
   - `SQUARE_WEBHOOK_SIGNATURE_KEY`

## What I build in the project

1. **New edge function `create-donation-checkout`** (rewritten for Square):
   - Uses Square's **Checkout API** (`CreatePaymentLink`) — donors get a hosted Square checkout page, same experience as Stripe Checkout.
   - Keeps all existing behavior: $5–$10,000 validation, multi-brand allocations in metadata, idempotency, success/cancel redirect URLs.
2. **New edge function `square-webhook`**:
   - Verifies the Square webhook signature, listens for completed payments, and runs the same donation recording + $5/$10 coupon generation logic the Stripe webhook does today.
3. **Frontend updates**:
   - `DonationFlow` and `DonationSuccess` keep working unchanged in look — only the checkout URL they open changes (still opens in a new tab per your existing rule).
4. **Cleanup**:
   - Stripe edge functions (`stripe-webhook`, `backfill-stripe-donations`, `stripe-account-diagnose`) are left in place but unused for now — nothing is deleted until Square is proven working end-to-end.

## Testing & go-live order

1. First wire it with your **Sandbox** credentials and run a test donation with Square's test card to prove the full loop (checkout → webhook → donation recorded → coupons created).
2. Then swap to **Production** credentials and run one small real donation.
3. Only after that, remove the old Stripe code.

## Notes

- Square checkout supports cards, Apple Pay, and Google Pay out of the box.
- Square's fee is 2.9% + 30¢ per online transaction — same ballpark as Stripe.
- Existing historical donations recorded via Stripe stay in the database untouched; only new payments go through Square.
