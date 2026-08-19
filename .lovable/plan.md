# Moving to Stripe Connect

## The conflict we have to resolve first

Stripe requires crowdfunding platforms to use Connect for one specific reason: **money collected on behalf of someone else must land in that person's own Stripe account**, not in the platform's balance. The platform keeps only a fee (Connect's `application_fee_amount`).

Your answers describe the opposite: CouponDonation receives 100% of every donation, buys vouchers itself, and keeps a tip. That is exactly the "platform collects funds for itself" pattern Stripe just restricted. Enabling Connect without changing the money flow will not fix the underwriting decision — an underwriter reviewing a Connect application with zero connected-account payouts sees the same risk profile as today.

So there are two viable directions, and they are mutually exclusive. Everything below Step 1 depends on which one you pick.

### Direction A — True Connect crowdfunding platform (what Stripe is asking for)
Verified recipients (or fundraiser organizers) onboard as **connected accounts**. Each donation is a destination charge: funds settle into the recipient's connected account, and CouponDonation takes a platform fee/tip via `application_fee_amount`.

- Matches Stripe's crowdfunding guidance; strongest path to approval.
- Requires abandoning "zero cash disbursements" — recipients receive money, which contradicts the compliance email we already sent Stripe and the voucher-only copy across the site.
- Requires KYC on every payee (Stripe handles it in Express onboarding), plus payout UI, tax forms, and dispute handling per account.

### Direction B — Keep voucher-only, stop calling it crowdfunding
No Connect. CouponDonation is a merchant selling/gifting restricted retail vouchers; "fundraisers" are needs listings, not money-raising campaigns.

- Consistent with everything we told Stripe and everything on the site now.
- Needs the site's remaining crowdfunding signals removed (progress bars framed as "raised", "goal", "donate to this campaign", per-campaign donation panels) because those signals are what classify us as crowdfunding.
- Does not resolve the current restriction by itself — it needs a new merchant application (or a different provider) presented as a voucher commerce business, not a donation platform.

You cannot present Direction A to Stripe while the site says zero cash ever reaches recipients, and you cannot present Direction B while campaign pages read like GoFundMe.

## Step 1 — Decide the model (you, not code)
Confirm Direction A or B. If A, also confirm who the payee is: the individual recipient, or the organizer who created the fundraiser.

## Step 2 (Direction A only) — Apply for Connect on a fresh footing
- The restricted account very likely cannot host the platform. Open a Connect platform application for the entity, disclosing the prior restriction and the corrected model (funds flow to verified US recipient accounts; platform keeps a stated fee).
- Do not build integration code before Stripe confirms the platform is approved and `card_payments` plus `transfers` capabilities are active — otherwise we ship dead code again.

## Step 3 (Direction A only) — Technical implementation
Once approved:

1. **Data model** — add `stripe_connect_accounts` (user_id, account_id, charges_enabled, payouts_enabled, details_submitted, requirements JSON), with grants for `authenticated` (own row) and `service_role`, RLS scoped to `auth.uid()`.
2. **Onboarding function** — `connect-onboard`: creates an Express account (`country: 'US'`, `capabilities: card_payments + transfers`) and returns an Account Link URL. Called from the recipient verification flow.
3. **Onboarding status UI** — a card in the recipient dashboard showing "Payouts not set up / pending verification / active", driven by the stored capability flags.
4. **Checkout rewrite** — `create-donation-checkout` becomes a destination charge: `payment_intent_data.transfer_data.destination = <connected account>` plus `application_fee_amount` for the platform tip, and it must refuse to create a session when the target account is not `charges_enabled`. Fundraiser-less general donations either go to the platform account (no Connect) or are disallowed — decide with you.
5. **Webhooks** — extend `stripe-webhook` for `account.updated` (sync capability flags), `transfer.*`, and `charge.dispute.created`; keep existing coupon-generation logic for platform-retained funds only.
6. **Tip disclosure** — the platform fee must be shown to the donor before payment (regulatory requirement for tip-based crowdfunding), so the donation flow needs an explicit "platform tip" line item.
7. **Copy and legal** — Terms and Privacy need payout, KYC, and fee-disclosure sections; the "zero cash disbursements" claim has to be replaced everywhere it appears (`SecurityBadges.tsx`, About, FAQ, Donate SEO).

## Step 3 (Direction B only) — Remove crowdfunding signals
Reframe fundraiser pages as verified need listings: replace "raised / goal / donate to this campaign" language and money progress bars with voucher-coverage language, keep donations flowing to the platform's own checkout, and prepare a merchant application describing voucher commerce.

## Technical notes
- Current code has no Connect surface at all: `create-donation-checkout` creates a plain platform charge, and `stripe-webhook` (504 lines) assumes all funds are platform funds when generating coupons. Direction A touches both.
- Connect Express onboarding replaces the manual `recipient_verifications` document review for payees — that is a meaningful simplification, and it makes the "third-party KYC vendor" statement true without Persona.
- `supabase/config.toml` needs `verify_jwt = false` entries for any new functions that Stripe calls.

## Recommendation
Direction A is the only path that answers Stripe's actual objection, but it changes the product from "voucher gifting" to "peer-to-peer fundraising with payouts". If the voucher-only model is non-negotiable, Connect is the wrong tool and the real task is Direction B plus a new merchant application.
