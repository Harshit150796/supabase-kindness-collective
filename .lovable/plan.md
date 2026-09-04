# Add the “What We Do” landing section

## Goal
Give first-time visitors an immediate, plain-language explanation of CouponDonation directly after the live activity bar, without changing the hero, tree, live bar, or existing sections.

## Implementation
- Create an eagerly loaded `WhatWeDo` landing component using only React, Tailwind/CSS, Lucide icons, and lightweight SVG/CSS shapes.
- Build the four requested beats in order: anchor copy, animated mechanism rail, two-column contrast, and equal-weight donor/recipient doorways, followed by the open-loop cue into stories.
- Use the exact supplied wording, with no added statistics, percentages, fees, brands, partnership claims, or competitor references.
- Animate the mechanism once when it enters view: coin travel, card transformation, and a pronounced lock snap at the third stage. On small screens the same sequence follows a vertical rail.
- Respect reduced-motion preferences by rendering every stage and the final locked-card state immediately.
- Match the current landing page’s semantic colors, container sizing, card treatment, focus states, and staggered fade-rise reveal style.
- Insert `<WhatWeDo />` immediately after `<LiveActivityBar />` in the homepage source, outside `LazyOnView` and without `lazy()`/`Suspense`.

## Verification
- Confirm the project builds without errors.
- Check desktop and mobile screenshots for hierarchy, spacing, rail alignment, readable copy, and no overlaps.
- Verify both links work with keyboard focus and point to `/donate` and `/apply`.
- Emulate reduced motion and confirm the final mechanism state appears without animation.
