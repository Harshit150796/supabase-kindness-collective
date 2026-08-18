# Correct the compliance-stack statement sent to Stripe

You chose to keep the platform as-is and fix the wording instead. No code changes. The deliverable is an accurate replacement for the three-point "auxiliary compliance stack" paragraph, plus a short clarification note you can send to the underwriter.

## What the code actually does today (verified)

- **Identity verification:** no Persona (or any third-party KYC vendor) integration exists. Recipients submit documents through `recipient_verifications` (government ID and income document uploads) and an admin reviews them in the admin portal before campaign activation.
- **Sanctions screening:** no ComplyAdvantage integration exists. Prohibited-jurisdiction restrictions exist as Terms of Service policy; transactional screening is Stripe's.
- **Geo-fencing:** real but application-level and client-side. `GeoGuard` resolves the visitor's country via an IP lookup and blocks non-US visitors from campaign creation, beneficiary onboarding, recipient management and admin routes, while donations stay globally available. It is not edge middleware and not fail-closed.

## Replacement copy for the Stripe message

Three rewritten points, matching reality, that I will hand you in chat ready to paste:

1. **Beneficiary identity verification** — manual, document-based review of government-issued ID and income documentation by our compliance staff prior to campaign activation; no automated vendor claimed.
2. **Sanctions and watchlist posture** — contractual prohibition of restricted jurisdictions and sanctioned persons in our Terms, with transactional sanctions screening relied upon from Stripe; vendor-based independent screening described as a roadmap item rather than a live control.
3. **Geo-fencing** — application-level US-only restriction on write access (campaign creation, beneficiary onboarding, payout routing, admin) with global read and donate access, described as client-enforced route gating.

## Clarification note

A three-sentence preface acknowledging that the earlier description overstated two controls, stating the corrected position, and naming Persona/ComplyAdvantage as planned additions with no live integration yet. Sending a correction unprompted is safer than having an underwriter discover it.

## Notes

- No files change; nothing to verify in the app.
- If you later want the roadmap items to become real controls, that is a separate build (vendor accounts and API keys required).
