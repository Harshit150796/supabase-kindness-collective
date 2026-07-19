
## Goal

Give you a ready-to-send email to Stripe Support that (1) contains every identifier they need to locate your account instantly, (2) proves you're the account owner, (3) references the documents you already submitted, and (4) asks the exact question that unblocks live charges.

## Where to send it

Do NOT email a generic address. Two better routes, in order of speed:

1. **Dashboard → Support → Contact us** (https://support.stripe.com/contact) → pick topic **"Account status / Payments disabled"**. Tickets opened from inside the logged-in Dashboard are auto-authenticated, skip identity verification, and are routed to the Risk/Review team directly.
2. If Dashboard contact is unavailable, email **support@stripe.com** from the email address on file for the account (`admin@coupondonation.com` or whichever address owns `acct_1Sgpd8J31hV93H57`). Sending from any other address adds 24–48h of identity checks.

## What to include (checklist)

Every one of these should be in the email — missing any of them is the #1 reason Stripe replies with "please provide more information" and adds days:

- **Account ID:** `acct_1Sgpd8J31hV93H57`
- **Legal business name** exactly as registered with Stripe
- **DBA / public name:** CouponDonation
- **Website:** https://coupondonation.com
- **Account owner name + email on file**
- **Country / currency:** US / USD
- **Date documents were submitted** (approximate is fine) and **what was submitted** (e.g., EIN letter, 501(c)(3) determination letter, bank statement, ID, business address proof — list each one)
- **How they were submitted** (Dashboard upload vs. emailed to a reviewer)
- **Current symptom** with the exact API error string: `"Your account cannot currently make live charges."`
- **Diagnostic snapshot** from our `stripe-account-diagnose` function:
  - `charges_enabled: false`
  - `payouts_enabled: true` (or whatever it currently returns — re-run before sending)
  - `capabilities.card_payments: inactive`
  - `capabilities.transfers: inactive`
  - `requirements.disabled_reason: null`
  - `requirements.currently_due: []`, `past_due: []`, `pending_verification: []`, `errors: []`
- **Proof of prior successful processing:** mention that live charges worked previously and reference 1–2 recent successful `pi_...` payment intent IDs (I can pull these from the `donations` table if you want)
- **Business context:** nonprofit converting donations into grocery coupons; no physical goods; low-risk model
- **The specific ask** (see template)

## Draft email

> **Subject:** Live charges disabled with no listed requirements — acct_1Sgpd8J31hV93H57
>
> Hi Stripe Support,
>
> Our account is unable to process live charges and I'd like help identifying why so we can resolve it.
>
> **Account details**
> - Account ID: acct_1Sgpd8J31hV93H57
> - Legal name: [YOUR REGISTERED LEGAL NAME]
> - DBA: CouponDonation
> - Website: https://coupondonation.com
> - Country: United States
> - Account email: [EMAIL ON FILE]
>
> **What we're seeing**
> Every Checkout Session creation returns: *"Your account cannot currently make live charges."*
>
> A direct call to `GET /v1/accounts` on our account returns:
> - `charges_enabled`: false
> - `capabilities.card_payments`: inactive
> - `capabilities.transfers`: inactive
> - `requirements.disabled_reason`: null
> - `requirements.currently_due`, `past_due`, `pending_verification`, `errors`: all empty
>
> The Dashboard's Account Status page shows **"No active tasks for your account."** So there are no outstanding requirements listed anywhere — yet capabilities are inactive.
>
> **Documents already submitted**
> On [DATE], we submitted the following documents in response to a prior review request:
> - [Document 1, e.g. EIN confirmation letter]
> - [Document 2, e.g. 501(c)(3) determination letter]
> - [Document 3, e.g. bank statement for the connected account]
> - [Document 4, e.g. government ID for the account representative]
>
> We have not received a follow-up from the reviewing team, and no additional requirements have appeared in the Dashboard since.
>
> **Business context**
> We are a donation platform that converts monetary contributions into grocery coupons for families in need. No physical goods, no subscription billing, no high-risk categories. The account has previously processed live charges successfully (e.g. payment intents `pi_[FILL_IN_1]`, `pi_[FILL_IN_2]`).
>
> **What we're asking**
> 1. Please confirm whether our account is currently under manual review.
> 2. If additional information is needed, please tell us specifically what — nothing is listed in the Dashboard.
> 3. Please re-enable `card_payments` and `transfers` capabilities once review is complete.
>
> Happy to provide any further documentation the reviewing team needs. Thank you for your help.
>
> [Your name]
> [Your role]
> [Phone number on file with Stripe]

## Before you hit send

I'll help with these prep steps once you switch to build mode / ask:
1. Re-run `stripe-account-diagnose` so the JSON snapshot in the email reflects today's state.
2. Pull 2 real successful `payment_intent` IDs from the `donations` table to include as proof of prior processing.
3. Fill in the bracketed `[DATE]`, `[LEGAL NAME]`, and document list with what you actually submitted.

## Not doing

- No code changes — this is a support-communication task.
- Not rotating keys or switching providers.
