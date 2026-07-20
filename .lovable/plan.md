## Goal
Confirm ambiguous routes stay globally accessible, and ensure the Stripe checkout function has no country restriction so international donors can pay.

## Changes

### 1. Ambiguous routes — no code change
`/donor/*`, `/profile`, `/settings`, `/my-impact` are already NOT wrapped in `<GeoGuard>` in `src/App.tsx`. They remain globally accessible. Nothing to edit.

### 2. `supabase/functions/create-donation-checkout/index.ts`
There is no `allowed_countries: ['US']` parameter in the current code (verified). However, the accompanying comment block claims US-only compliance, and `billing_address_collection: 'required'` currently defaults Stripe's country dropdown to a full list — good — but the comment is misleading given the new global-donor policy.

Edits:
- Remove the "US-only underwriter compliance" comment block above `payment_method_types` and replace it with a short note stating billing address is collected globally for AVS + fraud scoring, and that US-only enforcement lives at the app-route layer (GeoGuard) for write actions only.
- Keep `payment_method_types: ['card']` and `billing_address_collection: 'required'` as-is (both are global-friendly).
- No other logic changes.

### Verification
- `rg "allowed_countries" supabase/functions` → expect zero hits.
- Read the edited file to confirm the comment reflects the global-donor policy.
- Confirm `src/App.tsx` has no `<GeoGuard>` wrapping `/donor`, `/profile`, `/settings`, `/my-impact`.

## Out of scope
- No changes to GeoGuard, route wiring, or any other edge function.
