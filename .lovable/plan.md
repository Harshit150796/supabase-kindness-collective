# Let Donors Choose: Square or Stripe

## What donors will see
On the final donate step, the single checkout button becomes two clear options:
- **Pay with Square**: card, Apple Pay, Google Pay
- **Pay with Stripe**: card, Link, wallets

Both open the secure checkout in a new tab, as they do today. Everything else stays the same: the amount, the chosen retailers, the success page, and coupon creation.

## What you control
A small **Payment processors** card in the admin panel with two on/off switches:
- Both on: donors pick one.
- One on: donors see a single button, with no choice to make.
- If Stripe gets paused again, switch it off and donors only see Square.

## What I build
1. **Restore Stripe checkout**: a separate Stripe checkout function, so the working Square one is left alone. It carries the same donation details, so the existing Stripe webhook records the donation and creates coupons the same way it did before.
2. **Processor setting**: a small settings record that the public can read and only admins can change. It is enforced on the server too, so a switched-off processor can't be used even by calling it directly.
3. **Donation flow update**: shows one or two buttons based on the setting, then sends the donor to the checkout they picked.
4. **Records**: each donation stores which processor handled it, and the admin Donations page shows it.

## Checks before calling it done
- Create a live checkout link through each processor and confirm both pages load.
- Turn each switch off and confirm the matching button disappears and the server refuses that checkout.
- Screenshots of the donate step at 390px and 1280px with both options showing.
- Recommended: one real $5 donation through each processor, to confirm the donation and its coupons appear.

## Technical details
- New edge function `create-stripe-checkout` (verify_jwt=false). It uses STRIPE_SECRET_KEY and the Stripe Checkout Session with the same metadata keys that `stripe-webhook` already reads. The success URL is the same.
- Migration: a `payment_settings` single-row table (`square_enabled`, `stripe_enabled`), with grants, RLS (anon/auth select, admin update via has_role), and seeded with both set to true. Also add `donations.payment_provider text` (square/stripe). Both webhooks set it, and older rows are backfilled as `stripe`.
- Both checkout functions read `payment_settings` with the service role and return a 403 if their processor is disabled.
- Stripe webhook endpoint in the Stripe dashboard must stay enabled (STRIPE_WEBHOOK_SECRET is already saved).
