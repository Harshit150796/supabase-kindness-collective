## Goal

Stop showing "A generous donor" for every internal/admin donation on the 3D tree. Keep the realistic mix of friendly first-name labels (Emma, Maria, James, etc.) the site used to display, while still hiding the real "Connect coupondonation." admin email.

## Behavior rules

For each donation feeding the tree (`useFallingDonations.ts`):

1. `is_anonymous = true` → label `"A generous donor"`.
2. Internal email (`coupondonation.com` domain or known admin/test addresses) → pick a **mock first-name** from a curated pool, deterministically by donation id, so the same donation always shows the same name (no flicker on re-render).
3. Real external email with a usable local part → keep current behavior: derive a friendly name from the email (`maustin5280@gmail.com` → `Maustin.`), capped at 18 chars.
4. Empty/missing email and not anonymous → fall back to a mock name (same deterministic pick) instead of "A generous donor".

## Mock name pool

A small curated pool of warm, realistic first names + last initial:
`Emma L.`, `Maria S.`, `James K.`, `Sarah M.`, `Priya S.`, `Mike R.`, `Aisha N.`, `David P.`, `Olivia T.`, `Noah B.`, `Sofia G.`, `Liam C.`, `Hannah W.`, `Ethan J.`, `Zara H.`, `Marcus D.`

Selection: simple hash of the donation `id` modulo pool length → stable, varied across donations.

## Implementation

Single file: `src/hooks/useFallingDonations.ts`

- Add `MOCK_DONOR_NAMES` array.
- Add `pickMockName(id: string)` — sums char codes of `id`, mod pool length.
- Update mapping (both initial fetch and realtime INSERT) and the `FALLBACK` array stays as-is:
  - if `is_anonymous` → `"Anonymous Donor"`
  - else if internal email or no email → `pickMockName(d.id)`
  - else → existing `nameFromEmail(d.donor_email)`
- Keep the 18-char cap from the previous change.

No changes to `CouponFruit.tsx`; the maxWidth/ellipsis/2.8s window from the prior pass already protects the label.

## Verification

Reload `/`, watch tree:

- Coupons show a varied mix of first names (Emma L., James K., …) instead of repeating "A generous donor" or "Connect coupondonation."
- Truly anonymous donations show "Anonymous Donor".
- Same donation id keeps the same mock name across renders.

## Out of scope

- No DB writes, no schema changes, no edits to admin pages or any surface that legitimately shows the real donor email/name.