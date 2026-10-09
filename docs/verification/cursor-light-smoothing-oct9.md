# Cursor light smoothing — October 9, 2026

Only cursor motion, move-target/background caching, hover transitions, tests and related rules/documentation changed. Tree probe, rendering, artwork, intro, photos, cookie bar and retailer rail are unchanged. Nothing published.

## Changes
- All dots use exponential smoothing with τ = 20/170/340ms, measured from `performance.now()` at callback entry; first dt is 16ms and smoothing clamps dt to 0–64ms.
- First entry snaps all dots; all three participate in the 0.3px settlement check.
- Pointer moves use `event.target`; cursor hit tests run only on explicit rechecks. Flat-background samples cache the element/value for 150ms.
- Ring width/height/margin ease over 250ms; fill/border ease over 200ms. Wrappers still have no transitions.

## Verification
Chromium homepage, 1280×1800, WebGL disabled to avoid sandbox software-renderer stalls:
- 120 real pointer moves: **0 `Document.prototype.elementFromPoint` calls**, 375 wrapper style mutations while moving.
- All three settled at `matrix(1, 0, 0, 1, 1139.92, 996.86)`; **0 wrapper style mutations in the following second**.
- Explicit scroll event caused exactly one recheck hit test.
- Hover width measured 36.8125px during transition and 44px after completion; screenshot confirms ring above navbar.
- No runtime/page errors or non-warning console errors. The preview emitted 47 React ref warnings unrelated to cursor code; these remain, so the console is not completely silent.
- 20 cursor/opening regression tests passed, including τ list, clamp, callback execution clock and all-dot settlement. Automatic preview build OK at 02:21:13 UTC.

Scripts, results and screenshot: `/tmp/browser/cursor3/`.

## Limits
The zero-hit count verifies the cursor move path on the real homepage DOM/poster, not live GPU rendering. The unchanged tree probe retains its existing rate-limited hit test; canvas interval rechecks are intentional. Physical 125Hz mouse / headed 60Hz display and accelerated homepage callback cost were not measured. No new speed-variation claim is made.