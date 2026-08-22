# Recipient Trust & KYC Tiers (before manual KYC exists)

Goal: make every recipient prove they are a real, US-based person, with more scrutiny as the requested amount rises — without adding friction for small, low-risk requests.

## The tiered model (recommended)

Scrutiny scales with the monthly goal. Nothing is gated behind a paid KYC vendor.

```text
Tier 0 — any amount        Tier 1 — goal <= $250      Tier 2 — $251-$1,000       Tier 3 — > $1,000
-------------------        ---------------------      --------------------       -----------------
email OTP (exists)         + US phone SMS verify      + selfie + photo ID        + income/hardship doc
US-only geo check          + attestation checkbox     + address confirmation     + reference contact
duplicate/ZIP checks       + story quality check      + manual admin review      + manual admin review
auto-listed, capped                                   listed after review        listed after review
```

Payout side stays unchanged: vouchers only, no cash, so identity risk is limited to "is this person real and needy".

## Signals we can collect in the wizard (no vendor needed)

1. **US mobile phone verification** — SMS OTP at submission. Blocks most duplicate/bot accounts. Cheap, low friction, strongest single signal.
2. **Sworn attestation** — explicit checkbox: "I confirm I live in the US, the information is true, and I understand vouchers are non-transferable and fraud terminates my account." Captures IP, timestamp, and typed full legal name.
3. **Photo ID + selfie upload** — stored in a private Supabase bucket, visible only to admins. Required from Tier 2 up.
4. **Address confirmation** — full street address (not just ZIP) checked against the ZIP's city/state; flag mismatch.
5. **Income / hardship evidence** — pay stub, benefits letter (SNAP/WIC/SSI/VA), eviction or medical notice. Required for Tier 3; optional trust boost below it.
6. **Household size + monthly income** — sanity-check the goal against stated need; flag goals that exceed a plausible ratio.
7. **Case-worker or organization reference** — name, org, work email/phone for social worker, church, school counselor, shelter. Very strong for Tier 3 and easy to spot-check.
8. **Social proof** — optional link to a public profile or an existing GoFundMe/news mention.

## Automated risk checks (server-side, free)

- Disposable/temporary email domain blocklist.
- One active fundraiser per verified person; duplicate detection on phone, name+ZIP, and ID hash.
- Story checks: minimum length, copy-paste/plagiarism similarity against existing fundraisers, template-text detection.
- Velocity rules: N applications per IP or ZIP per day triggers hold.
- Geo mismatch: detected country != US, or VPN/proxy-looking IP -> hold for review.
- A computed **risk score** stored on the application; anything over threshold goes to a review queue no matter the amount.

## Admin side

- Replace the current auto-approve behaviour for pending verifications with an explicit review queue showing all collected signals, the risk score, and ID/document previews with approve / request-more-info / reject actions.
- "Request more info" emails the applicant a checklist and keeps the fundraiser unlisted.
- Status badges on public fundraiser pages: "Identity verified", "Documents reviewed" — good for donor trust and for the Stripe file.

## Alternatives if you want less build work

- **Option A — Phone + attestation only.** One afternoon of work, catches most abuse, near-zero friction. Cap all goals at $500 until manual review exists.
- **Option B — Tiered as above (recommended).** Friction only where money justifies it.
- **Option C — Review everything.** No fundraiser goes public without admin approval regardless of amount. Highest trust, slowest for recipients, most admin workload.
- **Option D — Vendor later.** Keep the tier structure and swap the Tier 2/3 ID step for Persona/Stripe Identity when budget allows; the data model stays the same.

## Technical notes

- New/reused columns on `recipient_verifications`: phone, phone_verified_at, attestation_name, attestation_ip, attestation_at, address fields, reference contact fields, risk_score, tier. Existing `government_id_url`, `income_document_url`, `household_size`, `annual_income` already cover the document/income fields.
- Add `verification_tier` and `risk_score` to `fundraisers`; keep `status = 'pending_review'` until cleared for Tier 2/3.
- Private storage bucket `verification-docs` with RLS: owner can insert, only admins can read.
- Phone OTP and risk scoring run in edge functions (never trust the client); reuse the existing OTP email pattern.
- Wizard additions appear on the review step only when the goal crosses a tier threshold, so the current 4-step flow stays intact for small requests.

## Decision needed

Which option (A / B / C / D) and, for B, the tier thresholds — the draft uses $250 and $1,000.
