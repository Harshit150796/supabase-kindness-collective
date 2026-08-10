# Payment Provider Alternatives Plan

## Context

Stripe has not responded after documents were submitted and the account may be restricted. The current stack uses a BYOK Stripe integration (`STRIPE_SECRET_KEY`) called through a Supabase Edge Function (`create-donation-checkout`) from `DonationFlow.tsx`. The site must keep the multi-brand coupon selection experience (Walmart, Target, Amazon, etc.) and accept donations from anywhere in the world.

## Short answer

**Donorbox is not a good fit for this project.** Donorbox is designed for registered nonprofits, charges an extra 1.5% platform fee on top of processor fees, and it still runs on Stripe or PayPal as the underlying processor. Since the goal is to replace Stripe entirely, Donorbox connected to Stripe does not solve the problem.

## Providers evaluated

| Provider | Fits for-profit? | Depends on Stripe? | Best for | Notes |
|---|---|---|---|---|
| **PayPal** | Yes | No | Direct replacement | Nonprofit discounts unavailable, but standard rates apply. Has donation buttons and Checkout. Strong buyer trust. |
| **Square** | Yes | No | Retail + donations | Good for card payments, but international coverage is weaker than PayPal. |
| **Lovable Payments (built-in Stripe)** | Yes | Yes (Stripe account) | Managed setup | Requires Lovable Cloud. This project uses an external Supabase instance, so it is likely not available. |
| **Lovable Payments (Paddle)** | Yes | No | Digital products/SaaS | Not designed for donations; product classification may reject charity/donation model. |
| **Donorbox** | No | Yes (Stripe/PayPal) | Nonprofits | 1.5% platform fee + processor fees. Not suitable for for-profit. |
| **Authorize.net** | Yes | No | High-volume custom setup | Higher complexity, monthly gateway fee, needs merchant account. |
| **GoFundMe/YouCaring** | N/A | N/A | Hosted fundraising | Would move donors off-site; breaks the multi-brand coupon experience. |

## Recommended path

Replace Stripe with **PayPal** as the primary payment processor because:

1. It does not depend on Stripe at all.
2. It accepts cards, PayPal balances, and PayPal Credit globally.
3. It has a hosted checkout flow that can be opened in a new tab (matching the current UX pattern).
4. It supports webhooks for payment confirmation, so coupon generation and donor history can still be automated.
5. It is one of the most trusted donation payment options among US donors.

Square is a secondary option if PayPal approval is slow, but it has less global donor reach.

## What changes to build

### 1. PayPal account and credentials
- Create a PayPal Business account.
- Generate Sandbox and Live API credentials (`PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` or `PAYPAL_SECRET`).
- Store the live secret in Supabase Edge Function secrets via the secure secret form.

### 2. New edge function: `create-paypal-donation-checkout`
- Receives the same payload as the current Stripe function: `amount`, `brandName`, `brandId`, `brandAllocations`, `userId`, `userEmail`, `fundraiserId`.
- Validates amount ($5–$10,000) and brand allocations.
- Creates a PayPal order with the same product description and metadata.
- Returns an `approvalUrl` so the frontend can open it in a new tab.
- Uses the same `idempotency`-style key or a PayPal `invoice_id` to prevent duplicates.

### 3. New edge function: `paypal-webhook`
- Receives PayPal `CHECKOUT.ORDER.APPROVED` or `PAYMENT.CAPTURE.COMPLETED` events.
- Verifies the webhook signature using PayPal's certificates/API.
- Inserts the donation record into the `donations` table.
- Triggers the same coupon generation logic currently used by `stripe-webhook` (reuse the coupon logic rather than duplicating it).

### 4. Frontend updates
- `DonationFlow.tsx`: add a "Pay with PayPal" path in the final step.
- Replace the Stripe card icons with PayPal + card icons (or keep both if a fallback is wanted).
- Keep the multi-brand selection and allocation UI exactly as it is; only the checkout handler changes.
- Keep the `window.open(url, '_blank')` pattern for the new checkout URL.
- Update `SecurityBadges.tsx` to remove "PCI Compliant" if it was only referencing Stripe, or replace with PayPal's verified messaging.

### 5. Donation success / cancellation pages
- `DonationSuccess.tsx` currently reads `amount` and `coupons` from query params. Update it to also accept PayPal's `token`/`PayerID` and verify the order server-side if needed, or keep it as a static thank-you page while the webhook records the donation.
- `DonationCancelled.tsx` can remain unchanged.

### 6. Webhook infrastructure
- Expose the new `paypal-webhook` function as the PayPal webhook URL in the PayPal dashboard.
- Ensure the function is set to `verify_jwt = false` in `supabase/config.toml` so PayPal can call it without authentication.

### 7. Admin and reporting
- Donor history and admin dashboards read from the `donations` table, which already stores provider metadata. Add a `provider` column (or use existing metadata) to distinguish Stripe vs PayPal donations.
- No UI changes needed unless the admin wants to filter by payment provider.

### 8. Fallback / hybrid strategy
- If the Stripe restriction is temporary, the Stripe function can remain in place and the frontend can present both options. Once PayPal is live, Stripe can be disabled by removing the Stripe option from the UI.

## Migration sequence

1. Set up PayPal Business account and store credentials.
2. Build the `create-paypal-donation-checkout` edge function and test it in Sandbox.
3. Build the `paypal-webhook` edge function and verify coupon generation logic is triggered correctly.
4. Update `DonationFlow.tsx` to call the new function and display PayPal branding.
5. Update the donation success/cancel flow and run end-to-end tests.
6. Update `SecurityBadges.tsx` and any trust language referencing Stripe.
7. After live testing, remove Stripe as the primary option (or keep it as a hidden backup if desired).

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| PayPal account also gets restricted | Apply the same compliance cleanup already done (US-only admin, no cash-transfer language, real campaign data). Use a fresh PayPal Business account with the company EIN. |
| PayPal fees are higher than Stripe nonprofit | This is unavoidable for a for-profit entity. Build the fee into the model or ask donors to cover processing fees (PayPal supports donor-covered fees). |
| Multi-brand metadata not preserved in PayPal | Store the same `brandAllocations` JSON in the PayPal order `purchase_units[].custom_id` or `description` fields, and read it back in the webhook. |
| Webhook reliability | PayPal webhooks can be slower or retry. Add idempotency checks and a reconciliation job similar to the existing `backfill-stripe-donations` function. |
| Donor does not have PayPal | PayPal Checkout accepts cards without a PayPal account, so this is rarely a blocker. |

## Open decision before building

1. Should Stripe remain as a backup option in the UI while PayPal is being tested, or be removed immediately? Removing it is cleaner but leaves no fallback if PayPal review is also slow.
2. Is the business open to applying for a 501(c)(3) or fiscal sponsorship? This would unlock Donorbox, PayPal nonprofit rates, and other charity-specific platforms in the future.
3. Should we add a "cover processing fees" checkbox to the donation flow? This is a common pattern on donation sites and can offset the higher PayPal for-profit rate.
