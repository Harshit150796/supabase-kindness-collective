# Square only, with more ways to pay

## What changes
1. **Stripe off.** Switch Stripe off in payment settings, so donors only see the Square Donate button. Remove the Stripe toggle from Admin > Settings > Payment processors and leave a note there saying "Square handles all payments". The old Stripe donation records and history stay as they are.
2. **More ways to pay on Square's payment page.** Ask Square to offer every option it supports for this kind of checkout:
   - Card (already on)
   - Apple Pay
   - Google Pay
   - Cash App Pay
3. **Not possible on Square's hosted payment page:**
   - **Venmo:** Square doesn't offer it on this kind of payment page.
   - **Afterpay (buy now, pay later):** Square allows it only for goods, with a minimum order amount, so it doesn't fit donations. I'll leave it off.

## Things you need to check in Square
Square shows Apple Pay, Google Pay and Cash App Pay only when they're turned on for your account. In the Square Dashboard, go to Settings > Payment methods (online) and make sure each one is on. I can't change that setting from here.

## Not changing
- Gift amounts, tip and card-fee math
- How webhooks record donations
- Coupon creation

## Technical details
- Run an additive data update: `payment_settings.stripe_enabled = false`. The column stays in place.
- In `create-donation-checkout`, add these to `checkout_options`: `accepted_payment_methods: { apple_pay: true, google_pay: true, cash_app_pay: true, afterpay_clearpay: false }`. Then deploy that function.
- In `DonationFlow.tsx`, default to `['square']` and stop falling back to Stripe.
- `create-stripe-checkout` and the Stripe webhook stay deployed but go unused. They'll refuse new checkouts because `stripe_enabled` is false.
- `PaymentProcessorsCard.tsx` shows Square only.
- Add a small test that checks the Square checkout request turns on Apple Pay, Google Pay and Cash App Pay.
