## What your screenshot tells us

Stripe's "Account status → Tasks" panel shows **"No active tasks for your account"** — meaning Stripe isn't asking you for any documents. Yet the API still refuses live charges. That narrows the cause: it's not a missing KYC document, so it's one of:

1. **`charges_enabled = false`** on the account (capability disabled, e.g., `card_payments` or `transfers` capability was revoked or is `inactive` / `pending`).
2. **A `disabled_reason`** set on the account (e.g. `requirements.past_due`, `under_review`, `platform_paused`, `rejected.fraud`, `rejected.other`) that Stripe surfaces via API but not always on the mobile "Tasks" view.
3. The **secret key in Supabase belongs to a different Stripe account** than the one you're viewing in the screenshot (both start with `acct_1S...` — easy to confuse). The failing account is `acct_1Sgpd8J31hV93H57`; the screenshot URL cuts off at `acct_1Sgpd8J31hV93...` so it looks like a match, but we should confirm by asking the API.

The only way to know which one is to ask Stripe directly. I'll add a tiny diagnostic edge function that calls `stripe.accounts.retrieve()` with the same key the checkout function uses and reports back exactly why charges are blocked.

## Plan

1. **Create a new edge function** `supabase/functions/stripe-account-diagnose/index.ts` (admin-only). It:
   - Uses the same `STRIPE_SECRET_KEY` env var.
   - Calls `stripe.accounts.retrieve()` and returns:
     - `id` (which account the key belongs to)
     - `charges_enabled`, `payouts_enabled`, `details_submitted`
     - `requirements.disabled_reason`
     - `requirements.currently_due`, `past_due`, `pending_verification`, `errors`
     - `capabilities.card_payments`, `capabilities.transfers`
   - Add it to `supabase/config.toml` with `verify_jwt = false` so we can hit it from the browser once.

2. **Call it once** and share the JSON back with you. That answer tells us exactly one of:
   - "The key is for a different account" → replace `STRIPE_SECRET_KEY` with the right one.
   - "`disabled_reason = under_review`" → contact Stripe support (there's no other fix).
   - "`capabilities.card_payments = inactive`" → re-enable in Dashboard → Settings → Payment methods, or Stripe support.
   - "`requirements.past_due = [tax_id_provided, ...]`" → fill those in Dashboard even though Tasks looked empty.

3. Once resolved, delete the diagnostic function (it's a debug tool, not a permanent surface).

## Not doing

- Not changing donation, coupon, or webhook logic.
- Not switching payment providers.
- Not rotating your key blindly — we'll only touch it if the diagnosis says the account ID doesn't match.

### Technical detail

The diagnostic response is small and safe (no PII). Example shape:
```json
{
  "account_id": "acct_1Sgpd8J31hV93H57",
  "charges_enabled": false,
  "payouts_enabled": true,
  "disabled_reason": "requirements.past_due",
  "currently_due": [],
  "past_due": ["business_profile.url"],
  "capabilities": { "card_payments": "inactive", "transfers": "active" }
}
```

That single call ends the guessing.
