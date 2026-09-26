# Go Live with Square Payments — Final Checks

## Where things stand

Already done and confirmed:
- Square checkout function (`create-donation-checkout`) and webhook (`square-webhook`) are built and deployed.
- The donate flow on the website calls the Square checkout — donors get a hosted Square payment page.
- Your secrets are saved: `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_WEBHOOK_SIGNATURE_KEY`.
- Your webhook subscription is enabled and points to the correct URL.
- No sandbox flag is set, so the system uses your live production keys automatically.

## What remains before we say "fully live"

1. **Confirm the webhook event types** (10 seconds, in your Square dashboard):
   - Open the `payment-update` subscription → Edit → make sure **`payment.updated`** is checked (optionally also `refund.updated`).
   - Your screenshot shows the subscription exists but the event list is cut off — this is the one thing I can't see.

2. **Run one small real donation end-to-end** (I guide, you click):
   - You make a small donation (e.g. $5) on the live site with a real card.
   - I verify: checkout opens → payment completes → donation appears in your records → coupons are created → fundraiser totals update.
   - If anything fails, I read the Square webhook logs and fix it.

3. **Optional cleanup (later, not blocking)**: remove the old Stripe code once Square has processed a few real donations successfully.

## If the test passes

You're fully live on Square — donors can pay by card, Apple Pay, and Google Pay, and every donation is recorded and converted to coupons automatically. Stripe stays dormant as a fallback until you decide to remove it.
