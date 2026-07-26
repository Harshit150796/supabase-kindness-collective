## Problem

Two mobile issues in the hero tree scene, both from `src/components/landing/tree3d/CouponFruit.tsx`:

1. **Scatter is too wide.** `scatterTarget` uses a fixed radius of `1.8 + rand*3.7` (up to ~5.5 world units) regardless of device. On the narrow mobile camera framing, coupons land far outside the tree, sometimes past the horizon/viewport edge (visible in screenshot 3, where the card sits half off-screen at the left).
2. **The donor label doesn't fit.** The landed-donor `<Html distanceFactor={8}>` card is a fixed ~220px-wide nowrap pill with a 28px avatar. At mobile DPR/zoom it renders large relative to a 384px viewport and gets clipped at the edges ("arah M. / onated $25"), and it can also overlap the "Ask Coupon" button and the LIVE bar.

## Fix

All changes are presentation-only, inside the 3D hero components.

### 1. Mobile scatter radius (`CouponFruit.tsx`)
- Pass the existing `isMobile` prop into the `scatterTarget` memo.
- Mobile: radius `1.3 + rand * 1.3` (max ~2.6) so coupons land in a tight ring around the trunk, well inside frame.
- Desktop: unchanged (`1.8 + rand * 3.7`).
- Reduce mobile horizontal fall velocity jitter slightly so the arc stays inside the tight ring.

### 2. Compact, on-screen donor label (`CouponFruit.tsx`)
- Give the label a mobile variant:
  - `distanceFactor` 8 → ~5.5 on mobile (smaller apparent size).
  - Avatar 28px → 22px, name font 13px → 11px, amount line 11px → 10px, padding tightened.
  - `maxWidth` 220 → 150 on mobile; name truncation length 18 → 12 chars.
- Anchor label slightly higher above the coupon on mobile so it clears the grass and the "Ask Coupon" pill.
- Keep the existing `center` + ellipsis truncation so long names never wrap awkwardly.

### 3. Keep labels inside the viewport
- Clamp the label's world X/Z toward the scene center on mobile (pull the anchor ~30% toward `x=0`) so a card that lands at the ring edge still renders fully within the canvas instead of being cut off at the screen border.

### 4. One label at a time on mobile
- Currently multiple coupons can land within the 2.8s label window and stack overlapping cards on a narrow screen. On mobile, show the label only for the most recently landed coupon (track a "latest landed index" in `Tree3DScene`'s `handleLanded` and pass it down; desktop keeps current behavior).

## Verification

- Run Playwright at 384×673 (mobile UA/viewport), let the scene auto-drop coupons for ~15s, and capture screenshots at intervals to confirm: coupons land in a tight ring near the trunk, and every donor card renders fully inside the canvas with no clipping or overlap.
- Capture a desktop 1280-wide screenshot to confirm no regression to the existing wide scatter and label size.

## Out of scope

No changes to donation data, the `useFallingDonations` hook, or any business logic.
