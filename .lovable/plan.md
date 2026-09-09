# Rebuild “What We Do” as a four-act visual story

## Goal
Replace the abstract branch scene with one light, responsive stage where a donation visibly becomes a coupon, groceries, and permanent proof. Keep the section in its current homepage position and preserve the privacy statement, two doorways, and closing prompt.

## Experience
- Keep the warm ivory canvas, short eyebrow, oversized headline, and exact supporting line from the brief.
- Build one stable illustration stage with one active object at a time; place the changing title and body directly below it.
- Show four concrete acts: donate button and `$10` chip; locked grocery coupon; coupon redemption into a grocery bag; verified receipt notification.
- Treat the coupon morph and lock as the central transformation, then make the final proof state the emotional payoff.
- Reveal the 2036 statement only after act four resolves, with the notification year rolling from 2026 through 2036 while its verification seal remains lit.

## Motion and interaction
- Start once when the section enters view, auto-advance about every 3.5 seconds, and stop permanently after act four.
- Add four accessible step controls with labels, active progress bars, keyboard support, and `aria-current`.
- Pause progression while a pointer hovers over the stage; resume from the remaining act time when hover ends.
- Support deliberate horizontal swipe gestures on touch devices without page scroll hijacking.
- Use Motion spring transitions for the chip pop, coupon morph, lock overshoot, grocery entrance, notification arrival, and verification stamp.
- Reduced motion opens on the fully resolved 2036 proof and presents all four act descriptions as static readable content.

## Visual implementation
- Use inline SVG for the coupon, barcode, bread, milk, apple, grocery bag, notification, check, and seal; decorative graphics stay hidden from assistive technology.
- Use existing semantic tokens for canvas, text, surfaces, borders, gold money, and emerald fulfillment.
- Add only `--verify` and `--verify-foreground` to both light and dark themes, reserving them for the proof check, seal, and permanent-verification accent.
- Maintain one `h2`, an ordered list for the acts, a stable mobile-friendly stage ratio, and no monospace, dark panels, raster assets, or invented business claims.

## Supporting content
- Keep “We don’t track the person. We track the money.” isolated with generous spacing.
- Preserve the equal `/donate` and `/apply` doorways with light card surfaces, hairline borders, visible focus, and restrained emerald hover glow.
- Preserve the final “Real people are asking right now. Here’s who.” cue.

## Files
- Rewrite `src/components/landing/WhatWeDo.tsx` from scratch.
- Add the two verification color roles in `src/index.css`; change nothing else.

## Verification
- Confirm the preview build is clean and the section auto-advances once, pauses on hover, supports step selection and swipe, and holds on act four.
- Check 320, 360, 390, 430, 768, 1024, and 1440 widths for no overflow, overlap, clipped art, or undersized controls.
- Confirm the final year reaches 2036, the seal remains verified, and the climax copy appears after resolution.
- Emulate reduced motion and confirm the complete proof plus all four readable act descriptions are immediately available.
- Verify one `h2`, ordered-list semantics, `aria-current`, 44px controls, and correct doorway links.
