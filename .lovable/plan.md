# Identity-verification policy statement (accurate version)

## The problem

The requested sentence — "User identity verification is processed securely through an independent third-party KYC vendor" — is not true today. Persona is not integrated (verified: no SDK, no edge function, no secret, no dependency). Current identity verification is manual document review by admins. The Stripe email already says the Persona move is a *transition*, not a live control. Publishing a present-tense claim that contradicts both reality and the email is the opposite of bulletproof.

## What I will NOT do

- Add any policy sentence asserting a third-party KYC vendor is live when none is.

## Option A — Accurate policy sentence (recommended, zero risk)

Add a truthful sentence to the Privacy Policy (§2 Information We Collect, where identity documents are already mentioned) that describes what actually happens, with the vendor move framed as a roadmap item:

> "Recipient identity verification is performed through document-based review by our compliance team prior to campaign activation. We are in the process of integrating an independent third-party KYC vendor (Persona) to handle this verification for live operations, entirely separate from our payment processor."

This is consistent with the email, consistent with the codebase, and survives any underwriter check — because every clause is true.

### Files changed
- `src/pages/Privacy.tsx` — one sentence added under §2.

## Option B — Strong statement made true by actually building it

If you want the strong single sentence ("processed securely through an independent third-party KYC vendor") to be legitimately publishable, that requires a real Persona integration first:

1. Create a Persona account and obtain an API key + template ID.
2. Store credentials via the secrets tool.
3. Add a Supabase edge function that mints a Persona inquiry and verifies its completion status.
4. Wire the recipient verification flow to launch a Persona inquiry instead of the manual upload.
5. Add the policy sentence only after step 4 is live and verified end-to-end.

This is a multi-step build requiring your Persona account credentials. It is the only path that makes the strong sentence honest.

## Option C — Add a Privacy Policy sentence that is true now and future-proofs the strong wording

Add to Privacy §2:

> "Identity verification for campaign organizers is conducted through secure document review by our compliance team. We are transitioning this process to an independent third-party KYC vendor (Persona) for live operations, with verification handled entirely outside our payment infrastructure."

Then, once the Persona integration from Option B is live, update the sentence to present tense.

## Recommendation

Option A. It closes the underwriter's "does their site mention identity verification" check with a true statement, matches the email, and carries no false-claim risk. Option B is the real fix if you want the strong wording to be literally true.

## Notes
- No changes to Terms.tsx — the manual/no-cash language there is already accurate and doesn't reference KYC vendors.
- Adding a false statement would be flagged by a competent underwriter and is not something I will do.
