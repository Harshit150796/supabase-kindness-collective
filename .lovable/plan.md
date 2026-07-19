## Diagnosis (verified against your data)

The error is not from our code. Stripe's API is returning HTTP 400 with:

> `"Your account cannot currently make live charges."` — `type: invalid_request_error`, account `acct_1Sgpd8J31hV93H57`.

I confirmed by querying the `donations` table: every past successful donation (most recent June 12, 2026 — `pi_3ThNz6J31hV93H57...`) was on the **same account** `J31hV93H57`. So:

- The key is correct.
- The code path (`create-donation-checkout`) is unchanged and works — Stripe accepted the session request, evaluated the account, and rejected it.
- Between June 12, 2026 and now (July 19, 2026), Stripe placed a restriction on this specific account. This is a common Stripe action triggered by:
  - A new information request (updated KYC, beneficial ownership, tax ID re-verification)
  - A chargeback / dispute threshold
  - Bank account verification failure or payout hold
  - Elevated fraud/risk review
  - Expired identity document

Our code cannot bypass this — Stripe blocks the charge server-side before a PaymentIntent is created.

## What needs to happen (you, in Stripe Dashboard)

1. Log in to https://dashboard.stripe.com/ with the account that owns `acct_1Sgpd8J31hV93H57`.
2. Check the **red banner at the top of the Dashboard home** and the **Notifications bell** — Stripe always states exactly what it needs (document, bank re-verify, tax form, etc.).
3. Open https://dashboard.stripe.com/settings/account and https://dashboard.stripe.com/account/status to see "Requirements" / "Restrictions".
4. Submit whatever Stripe requests. Reactivation is typically minutes to 24h after Stripe verifies.
5. Once the banner clears, our checkout will work again with zero code changes — the same key stays valid.

## Optional code hardening (I can do after you confirm)

To improve the user experience while Stripe is restricted (and for any future restriction), I can update `supabase/functions/create-donation-checkout/index.ts` to:

- Detect the specific Stripe error string `cannot currently make live charges` and return a friendly 503 response like *"Payments are temporarily unavailable — please try again shortly."* instead of a raw 500.
- Show the same friendly message in `DonationFlow.tsx` toast instead of the technical error.

This does not fix the Stripe block — only masks it gracefully. The real fix is Step 1–4 above.

## Not doing

- Swapping to a test key (you confirmed live must stay).
- Switching payment providers.
- Touching any donation, coupon, or webhook logic — none of that is implicated.

### Technical detail

Error object from Stripe (from edge logs):
```
type: StripeInvalidRequestError
statusCode: 400
requestId: req_vE2c9wsQQpytFr
account: acct_1Sgpd8J31hV93H57
message: "Your account cannot currently make live charges."
```

Stripe's request log for direct debugging:
https://dashboard.stripe.com/acct_1Sgpd8J31hV93H57/workbench/logs?object=req_vE2c9wsQQpytFr
