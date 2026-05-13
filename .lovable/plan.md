## Root cause

Two separate bugs combine to produce the broken visual in image 2:

1. **"Connect coupondonation." donor name.** Almost every recent completed donation in the database belongs to the internal account `connect.coupondonation@gmail.com` (admin/test account). `useFallingDonations` runs `nameFromEmail()` on the email's local part, which converts `connect.coupondonation` → `Connect coupondonation.`. So the live data feeds a real-looking but wrong donor name into every falling coupon.

2. **Labels look huge and stack on top of each other.** In `CouponFruit.tsx`, the landed-state donor label is rendered with `distanceFactor={6}` and `whiteSpace: 'nowrap'`. When the donor name is long ("Connect coupondonation."), the pill stretches very wide, and because many donations land in roughly the same spot in quick succession, several oversized labels overlap — exactly what image 2 shows. Image 1 is the same component working correctly with a short name (e.g. "James K.").

Image 1 is the intended look. We are not changing that visual; we only want to make sure every donation reliably renders the same way.

## Implementation plan

Scope is purely frontend/presentation. No DB, no backend.

### 1. Filter internal/admin emails out of the public donor-name display
File: `src/hooks/useFallingDonations.ts`

- Add an `INTERNAL_EMAILS` set containing the known internal accounts:
  - `connect.coupondonation@gmail.com`
  - `connect@coupondonation.com`
  - `admin@coupondonation.com`
- Also treat any email whose domain is `coupondonation.com` as internal.
- For internal emails, render the donor name as `"A generous donor"` instead of running `nameFromEmail()`. Keep the real amount and id so impact stats stay accurate.
- Apply this in both the initial fetch mapping and the realtime INSERT subscription.

This single fix removes the "Connect coupondonation." text everywhere on the tree, including for the historical data already in the database, without touching any donation rows.

### 2. Make the on-canvas donor label robust to any future long name
File: `src/components/landing/tree3d/CouponFruit.tsx` (the landed-state `<Html>` label only — the coupon face itself is unchanged)

- Cap donor name length at ~18 chars with an ellipsis before rendering inside the label.
- Replace `whiteSpace: 'nowrap'` with a fixed `maxWidth` (≈ 180px) plus `whiteSpace: 'nowrap'` + `overflow: 'hidden'` + `textOverflow: 'ellipsis'` on the name span so the pill can never balloon horizontally.
- Lower `distanceFactor` slightly (e.g. `6` → `8`) so the pill is visually consistent with image 1 even when the camera is close.

### 3. Prevent label pile-up when many coupons land at once
File: `src/components/landing/tree3d/CouponFruit.tsx`

- Keep the existing 5-second auto-hide, but only show the label for the first ~3 most recently landed coupons. Implement by tracking `landTime` and only rendering the label when `now - landTime < 2.5s` (shorter window) — this matches image 1 (one or two pills visible at a time) and avoids the stacked wall of pills in image 2.

### 4. Verification

- Reload `/`, watch the tree for ~30 seconds, confirm:
  - No coupon ever shows "Connect coupondonation." — internal donations show "A generous donor".
  - Landed labels match image 1 in size and never overlap into a wall of giant text.
  - The hanging coupon faces themselves are unchanged.

## Out of scope

- No changes to the coupon face design, the 3D tree, DPR, or post-processing.
- No DB migrations or edits to donation rows.
- No changes to any non-tree surface that legitimately shows the real donor email/name (admin pages, etc.).
