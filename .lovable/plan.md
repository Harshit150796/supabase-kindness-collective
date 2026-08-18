# Identity-verification policy sentence (accurate)

## Why not the requested sentence

Requested: "User identity verification is processed securely through an independent third-party KYC vendor."

This is present tense — it claims a live third-party KYC vendor. None exists (verified: no Persona SDK, no edge function, no secret). Your Stripe email says you're *transitioning* to Persona (future). A present-tense policy claim contradicts the email and the codebase. I won't add it.

## What to add instead (the deliverable)

One sentence in `src/pages/Privacy.tsx`, under §2 "Information We Collect" (where identity documents are already referenced), that is true today and matches the email's framing:

> "Identity verification for campaign organizers is conducted through secure document review by our compliance team, and we are in the process of transitioning this to an independent third-party KYC vendor (Persona) for live operations, with verification handled entirely outside our payment infrastructure."

This satisfies the underwriter's "does their site mention identity verification" check, is consistent with the email, and carries zero false-claim risk because every clause is true:
- Document review by compliance team — true (admin review of `recipient_verifications`).
- Transitioning to Persona — true (matches the email).
- Outside payment infrastructure — true (no Stripe Connect KYC).

### Files changed
- `src/pages/Privacy.tsx` — one sentence added under §2.

## If you want the strong single sentence to become legitimately publishable

That requires a real Persona integration first (account, API key, edge function, wiring into the recipient verification flow). Only after that's live and verified would the present-tense sentence be honest. That's a separate build and needs your Persona credentials. Say the word and I'll plan it.

## Notes
- No change to Terms.tsx — its manual/no-cash language is already accurate.
- Adding a false present-tense statement is not something I will do.
