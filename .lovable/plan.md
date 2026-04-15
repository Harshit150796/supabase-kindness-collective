

## Improve Stripe Payment Success Rate & Error Handling

### Root Cause Analysis

The decline is **not a code bug** -- all 12+ recorded donations succeeded. The $50 decline happened at the **card issuer / Stripe Radar level** before your webhook ever fires. Your checkout session was created successfully, but the card was declined during payment.

Common causes for same-card declines:
- **Card issuer velocity limits** (too many online transactions in a short window)
- **Stripe Radar false positive** (metadata like `amount_tier`, trust signals may trigger rules)
- **3D Secure issuer-side rejection**

### What we can improve (code-side)

**1. Reduce Radar friction -- simplify payment_intent metadata**

The current checkout passes heavy metadata (`user_agent`, `ip_address`, `amount_tier`, `under_2000`) that Radar doesn't need from metadata -- Stripe collects IP and user-agent automatically from the Checkout session. Removing redundant/custom metadata reduces the chance of Radar misinterpreting signals.

**2. Add `request_three_d_secure: 'any'` option for retries**

When a payment fails, offering a retry with forced 3D Secure can help -- authenticated payments have higher approval rates with card issuers.

**3. Better decline error messaging**

Currently if Stripe Checkout declines the card, the user gets a generic Stripe error page. We should improve the cancel/failure URL to show helpful guidance (e.g., "Try a different card", "Contact your bank").

**4. Add idempotency key to prevent duplicate charges**

Generate a unique key per checkout attempt so if a user double-clicks or retries, Stripe deduplicates.

**5. Update the `create-donation-checkout` edge function:**
- Remove redundant `user_agent` and `ip_address` from `payment_intent_data.metadata` (Stripe captures these automatically)
- Remove `under_2000` and `amount_tier` fields (these only matter if you have custom Radar rules configured in the Stripe dashboard)
- Add an `idempotency_key` parameter to `stripe.checkout.sessions.create()`
- Simplify `statement_descriptor` to just one field (suffix is sometimes ignored)

**6. Update `DonationCancelled.tsx` page:**
- Add specific guidance for declined cards: "Your card may have been declined by your bank"
- Suggest trying a different card or payment method
- Add a "Try with a different card" button that links back to the donate flow

**7. Update `DonationFlow.tsx`:**
- After checkout opens, if the user returns to the tab, show a "Payment didn't go through?" helper with tips

### Files changed
- `supabase/functions/create-donation-checkout/index.ts` -- Clean up metadata, add idempotency
- `src/pages/DonationCancelled.tsx` -- Better decline guidance and retry options
- `src/components/landing/DonationFlow.tsx` -- Post-checkout helper messaging

### Stripe Dashboard recommendations (manual, not code)
- Check **Stripe Dashboard > Payments > Declined** to see the exact decline reason (e.g., `card_declined`, `insufficient_funds`, `do_not_honor`)
- Review **Stripe Radar rules** -- ensure no overly aggressive block rules exist
- Consider enabling **Adaptive Acceptance** in Stripe settings (auto-retries soft declines)

