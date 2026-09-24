# Make home page animations play on phones

## What was found
Every moving part on the home page has a single shared off-switch: the phone's "reduce motion" preference.
- Retailer logo rail: only moves when reduce motion is off (`motion-safe:animate-marquee`).
- What We Do steps: `useReducedMotion()` switches all four steps to still, finished pictures.
- 3D tree: reduce motion forces the lowest quality tier.

This preference is turned on silently by many phones: Android Battery Saver / "Remove animations", iPhone "Reduce Motion", and some accessibility or developer settings. Laptops almost never have it on — which matches "works on laptop, nothing moves on phone". In headless testing with no such setting, the mobile animations do play, so the code paths themselves work; the switch is the likely cause. This is not yet confirmed on your specific phone — step 1 confirms it.

## Changes
1. Add a small hidden diagnostic readout (only when the page URL has `?motiondebug=1`) showing whether the phone reports reduce motion, screen width and 3D tier. You open it once on your phone to confirm the cause.
2. Replace the all-or-nothing switch with a "gentle motion" mode shared by the whole home page:
   - Default: full animations on every device.
   - When the phone asks for reduced motion: animations still play, but calmer — no large movement or parallax, shorter fades, slower logo rail. Nothing is frozen.
   - Keep an easy full stop only for the genuinely jarring parts (bouncing/springing), not for fades and illustration sequences.
3. Retailer rail: always scrolls; slower in gentle mode; pauses on touch/hover.
4. What We Do mobile steps: always play their sequences when scrolled into view; gentle mode uses fades instead of slide-ups.
5. 3D tree: stop forcing the lowest tier from the reduce-motion setting; choose tier from device capability only.
6. Audit other home page sections (leaderboard cycling, fade-ins, floating/pulse effects) for the same switch and apply the same rule.

## Technical details
- New `useMotionPreference()` hook returning `'full' | 'gentle'`, used instead of `useReducedMotion()` in WhatWeDo; remove `motion-safe:`/`motion-reduce:` gating in LiveActivityBar; remove the reduced-motion line in `useDeviceTier.ts`.
- No new packages, no color/copy/layout changes, no scroll hijacking, desktop grid unchanged.

## Verification
- Playwright at 390px in both normal and `reduced_motion="reduce"` modes: two captures a moment apart of the logo rail and a What We Do step must visibly differ in both modes.
- No horizontal overflow at 320–1440px, no console errors, clean build.
- Final confirmation on your real phone via `?motiondebug=1`; reported honestly if it can't be confirmed.
