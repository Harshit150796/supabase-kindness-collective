# Rebuild “What We Do” as a closed-loop donation trace

## Goal
Replace the current card-based section with one premium dark centerpiece that visibly tracks a donation out as money and back as a receipt. Only `src/components/landing/WhatWeDo.tsx` will change; its homepage position and every surrounding section stay untouched.

## Experience
- Use a rounded, near-black green inset panel with only three hues: green-black canvas, warm amber for unresolved money, and the existing emerald primary for locked/confirmed states.
- Lead with the exact eyebrow, oversized fluid headline, and single supporting sentence from the brief.
- Present a telemetry-style trace header marked as an illustrative tracker, with `CD-8842`, status changing from `IN TRANSIT` to `COMPLETE`, and fixed illustrative timestamps.
- Draw one continuous journey: request → funded → locked → redeemed → receipt returned to the origin.
- Keep the four journey stages as an accessible ordered list, visually rendered as compact terminal chips rather than cards.

## Motion and interaction
- Desktop: create a tall scroll scene with a sticky tracker; Motion `useScroll` and `useTransform` scrub the path, moving marker, node confirmations, lock state, return receipt, and final proof panel.
- Mobile/touch: use a separately composed vertical loop and play it once after entering view, avoiding scroll-scrub behavior.
- Reduced motion: immediately render the complete emerald path, all confirmed nodes, returned receipt, complete trace status, and final proof panel.
- Build the stage-three lock as the focal transition: amber orb becomes a compact card, the lock springs into place, a glow blooms and a ring expands once, then everything settles while the downstream/return path turns emerald.
- Give the moving marker a bright core, bloom, and short trail; keep animation transform/opacity/path based for low rendering cost.

## Supporting content
- Replace comparison cards with the three requested paired statements in one hairline-divided horizontal strip, followed by the deliberate-strictness line.
- Add two equal dark entry surfaces linking to `/donate` and `/apply`, with visible keyboard focus and restrained emerald hover glow.
- Finish with the requested quiet prompt and slow downward cue.
- Use semantic HTML, one `h2`, decorative SVG hidden from assistive technology, and no fetched/live data, brands, statistics, fees, or partnership language.

## Technical details
- Use `motion/react`, inline SVG, React hooks, Tailwind semantic tokens, and existing Lucide icons only.
- Keep all section-specific HSL values as local CSS custom properties on the panel so component classes reference named roles rather than scattering raw colors.
- Derive node state thresholds from one progress value; desktop reads scroll progress, while mobile advances that same model with an entry-triggered Motion value animation.
- Use separate desktop and mobile SVG geometry to preserve intentional spacing and readable terminal labels.

## Verification
- Confirm the build reports no errors.
- Check desktop and mobile screenshots for path continuity, headline scale, node readability, lock emphasis, no overlap, and no horizontal overflow.
- Verify desktop scroll progression reaches the complete receipt state; verify mobile auto-play reaches it on entry.
- Emulate reduced motion and confirm the fully resolved state appears immediately.
- Confirm both links are keyboard-focusable and point to `/donate` and `/apply`.
