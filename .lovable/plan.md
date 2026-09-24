# Restore tree glow and rebuild mobile How It Works motion

## Confirmed diagnosis
- The tree has direct lights and ACES tone mapping, but no `scene.environment`; removing the downloaded forest HDR also removed image-based reflections from every standard material.
- Mobile and desktop exposure is currently 1.05, while low-tier mobile alone uses no tone mapping at exposure 1.
- The How It Works section does not currently use `overflow-hidden`, but it does use `overflow-x-clip` on the section itself. No higher homepage wrapper shown in the current source adds overflow, transforms, filters, containment, or a fixed height. Remove section-level clipping entirely and isolate decorative washes in their own clipped layer.
- The current mobile experience is four absolutely overlaid scenes cross-fading. It is scroll-driven, but it is not one continuous transforming object.

## Part 1 — Restore no-download environment lighting
- Add a small scene helper using Three.js `RoomEnvironment` and the existing renderer.
- Generate one PMREM texture on mount, assign only `scene.environment`, and restore the prior environment reference while disposing both PMREM generator and texture on unmount.
- Add conservative `envMapIntensity` values to the existing tree materials without changing leaf, bark, light, fog, Sky, or CSS colors.
- Raise exposure within the requested 1.15–1.35 range, selecting the lowest value that visibly restores the earlier bright, alive foliage consistently on mobile and desktop.
- Capture 390px and 1440px before/after images and compare loaded network URLs to prove no new environment asset is fetched.

## Part 2 — Continuous mobile transformation
- Remove `overflow-x-clip` from the section and place the existing decorative radial washes inside an absolute `inset-0 overflow-hidden` layer behind all content.
- Preserve the `240svh` journey and `sticky top-0 h-[100svh]` stage, with native page scrolling and no wheel/touch cancellation.
- Replace the four mobile illustration swaps with one large centered transformation scene driven continuously by the existing mobile `useScroll` value:
  1. coins converge into the coupon;
  2. the coupon is scanned and reshapes into a grocery bag;
  3. groceries fill the bag;
  4. the bag resolves into the verified receipt/notification.
- Keep a permanent visual anchor through every handoff so the object never disappears. Add a subtle token-colored radial aura and small parallax between art and copy.
- Animate each step's existing number, title, and body with reversible spring motion while preserving every word.
- Keep four 44px-minimum tappable progress segments with band-local fill and native scrolling to each band.
- Keep the approved desktop four-column layout and its scroll/idle behavior unchanged.
- Keep reduced motion unpinned, unscrubbed, stacked, static, and fully readable.

## Verification
- Record baseline screenshots before edits, then post-change screenshots at several 390px scroll depths plus 390px and 1440px tree views.
- At 390px, verify the sticky top remains fixed while document scroll changes, all morph phases are visible, reverse scrolling retraces continuously, and computed stage height follows `100svh` after viewport-height changes.
- Audit computed styles for every sticky ancestor and confirm no overflow, transform, filter, backdrop-filter, perspective, containment, or fixed-height blocker remains.
- Confirm no `preventDefault` exists in What We Do, no horizontal overflow at 320, 360, 390, 430, 768, 1024, and 1440px, reduced-motion behavior, the 2036 resting receipt, and the unchanged desktop grid.
- Confirm the environment adds no network request, and finish with clean typecheck/build, console, and runtime results.