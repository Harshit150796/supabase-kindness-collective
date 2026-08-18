# Compliance Copy Audit — Fix Contradictions Before Stripe Follows Up

Findings from a pass over the legal/informational pages and shared UI copy. Each item conflicts either with what we told Stripe (US-only, B2B voucher provider, no cash disbursement, no charity/tax-deduction claims) or with what the code actually does.

## 1. Tax-deduction claims (highest risk)

- `src/pages/About.tsx` — an entire "Tax Benefits & Accounting Considerations" card implies donations may be tax-deductible and that we provide donation records for "eligible donation pathways". We are not a 501(c)(3) and told Stripe we are a technology provider.
  - Remove the whole card (and its `FileCheck`/`Calculator` usage if unused after removal).
- `src/pages/Donate.tsx` — SEO description says "Make a tax-deductible donation…".
  - Replace with: "Support verified US families with restricted digital retail vouchers. Choose participating retailers and track your impact."
- `src/pages/About.tsx` partnerships list — "Tax & Accounting — Professionals supporting donation strategy".
  - Replace with a neutral partner category (e.g. "Compliance & Risk — Partners supporting verification and fraud controls").

## 2. Non-US / global language (contradicts the US-only representation)

- `src/pages/About.tsx`:
  - "Global Hunger Relief" headline → "US Hunger Relief".
  - "…children, teens, and adults worldwide" → "…across the United States".
  - "Global Partnerships / Local and international aid" → "US Retail Partnerships / Nationwide retail networks aligned to measurable outcomes and transparent reporting."
  - "scale that same life-saving model globally" → "…nationwide".
  - "strengthen communities worldwide" → "strengthen communities across the US".
- `src/components/landing/DonationFlow.tsx` (~line 812) — "International cards accepted · Your bank handles currency conversion" is fine to keep: donations are accepted globally; only campaign creation and beneficiary onboarding are US-only. However, `create-donation-checkout` currently restricts billing to US addresses, which contradicts this copy.
  - Remove the US-only `billing_address_collection`/allowed-country restriction in `create-donation-checkout` so global donors can pay, and keep the copy as is.

- `index.html` keywords include "charity" — swap for "digital vouchers, retail vouchers, food assistance".

## 3. Charity / nonprofit framing

- `src/pages/About.tsx` — "making charitable giving transparent…" → "making verified giving transparent…"; "Nonprofits — on-the-ground distribution" is acceptable as a partner category but change "distribution" to "recipient referrals" so it does not read as cash/goods handling by us.
- `src/components/apply/steps/BeneficiaryStep.tsx` — "Coupons are distributed through your nonprofit" → "Vouchers are issued to verified recipients referred by your organization" (no third-party fund handling).
- `src/data/impactStories.ts` line ~409 — story text referencing charity is first-person recipient voice; leave as is (no platform claim).

## 4. Statements that must match reality

- `src/pages/FAQ.tsx` — "government ID verification" and "bank-level encryption" claims: soften to what we actually do — "identity document review by our compliance team" and "encryption in transit and at rest via our payment and infrastructure providers".
- `src/pages/FAQ.tsx` — "geographic distribution" in the impact dashboard answer → "regional distribution within the US".
- No changes to `Terms.tsx` §2, §5, §5.1 — the voucher/no-cash/final-sale language already matches the Stripe narrative and should stay.
- No KYC-vendor sentence will be added anywhere (per the earlier decision), so nothing in Privacy claims third-party KYC.

## 5. Verification after edits

- Grep the repo for `tax-deduct`, `501`, `worldwide`, `globally`, `international` to confirm no user-facing hits remain.
- Load `/about`, `/donate`, `/faq`, `/terms` in the preview and screenshot to confirm layout still renders after the card removal.

## Technical notes

Files touched: `src/pages/About.tsx`, `src/pages/Donate.tsx`, `src/pages/FAQ.tsx`, `src/components/landing/DonationFlow.tsx`, `src/components/apply/steps/BeneficiaryStep.tsx`, `index.html`. CMS tables (`cms_faq`, `cms_content`) were queried and contain no tax/charity/global wording, so no data migration is needed. Copy-only changes; no business logic or payment flow changes.
