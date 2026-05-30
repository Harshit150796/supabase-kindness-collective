Edit `src/components/landing/hero/HeroHeadline.tsx` only. No other files change.

### Remove
- The "Donate now" and "How it works" buttons (and the unused `Button`, `Link`, `ArrowRight` imports).
- The supporting paragraph "Watch your gift fall, take root, and feed a verified family." (also competes with the tree).

### Keep
- The rotating eyebrow `CouponDonation is Transparent / Trackable / Real-time` — unchanged behavior, kept as the visual anchor at top center.

### Restyle the H1 "Every donation grows into groceries."
Goal: read as a delicate caption sitting above the tree, not a billboard covering it.

- Size: drop from `text-2xl md:text-4xl` → `text-base md:text-xl` (mobile) / `md:text-2xl` max on desktop.
- Weight: `font-bold` → `font-medium`, with `tracking-tight`.
- Color: use a softer emerald token instead of full `text-foreground` — `text-emerald-900/70 dark:text-emerald-100/80`. The word "groceries" gets a single accent span using `text-emerald-700 dark:text-emerald-300 font-semibold` so the sentence still has a focal point without shouting.
- Drop the heavy `textShadow` on the wrapper; replace with a much lighter `0 1px 2px rgba(255,255,255,0.6)` so text reads on the sky without a dark halo over the canopy.
- Tighten the wrapper width: `max-w-2xl` → `max-w-xl`, and reduce top offset slightly (`top-4 md:top-6` → `top-3 md:top-5`) so it stays in the sky band above the foliage.
- Remove the now-unused `mt-3 md:mt-4` button row entirely.

### Result
Top of hero shows: tiny rotating eyebrow, then one short, soft headline. No buttons. The 3D tree below is fully visible and visually dominant.
