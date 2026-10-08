# Poster handoff verification — October 8, 2026

## Changes
- Daytime canvas-only posters: desktop 2880×828 (86,352 bytes), phone 780×978 (51,874 bytes).
- All 18 opening logos begin decoding at module evaluation alongside model loading; they mount together. Reveal follows the second committed frame, proving the prior full-logo frame rendered. Three-second Scene-mount safety escape remains.
- Sky/light/fog easing is capped at 0.05; settled palettes, live camera, geometry, materials, quality and motion remain unchanged.
- Orbit listeners wait for the actual controls; canvas azimuth changed from 0.0000 to -0.8030 in a drag.

## Overlay measurements
Frozen performance time, stationary pointer, initial zoom, forced high tier/day. These are settled opening-state captures, not literal GPU first-frame captures.
Scale uses affine image registration of the central tree. Logo displacement uses template matching of four separated marks (Walgreens, DoorDash, Instacart, CVS); it is not a measurement of every partly occluded logo.
Positive poster scale excess is reported below; image registration returns the inverse scale mapping.

| Viewport | Poster scale excess | Sampled maximum logo offset |
|---|---:|---:|
| 1280×800 | -0.02% | 0.0 px |
| 1366×768 | -0.02% | 0.0 px |
| 1440×900 | +0.01% | 1.0 px |
| 1536×864 | -0.03% | 1.0 px |
| 1920×1080 | +0.00% | 1.0 px |
| 2560×1440 | -0.07% | 1.0 px |
| 820×1180 | +5.71% | Not individually measured |
| 390×664 | +5.26% | Not individually measured |
| 412×839 | +0.55% | Not individually measured |

All six desktop samples pass the 2% scale / 4px sampled-logo limits. The iPad portrait and short phone retain about 5–6% excess scale: a single panorama/mobile cover image cannot exactly reproduce the existing aspect-fit camera at every portrait ratio. No camera or live-tree adjustment was made.

## Cold 4G timing
Chromium, 390×664, cache disabled, 150ms RTT, 2Mbps download / 750Kbps upload, no CPU throttle. Navigation to observed fade onset:
- Local Vite before: 82.04s; after: 92.85s.
- Published control (unchanged code): 37.50s then 43.00s.
Single-run measurements under software graphics, dominated by unbundled Vite module transfer and sandbox variability. They do not establish a speed improvement; bundled post-change production timing remains unverified. The local logo-complete reveal was around 5.0–5.4s in unthrottled profiles.

## Browser checks
- Chromium Android and WebKit iPhone: one canvas, 18-logo readiness, no logo failures, live frames visibly changed (6.98% / 6.62% pixels >10 levels between captures), no page errors, OS Reduce Motion enabled. Software rendering is not physical-phone performance.
- /draco/ wrapper and WASM only; application/wasm confirmed; no gstatic requests.
- Initial tree load reaches Supabase. Full-page traversal also reaches images.unsplash.com and api.zippopotam.us. Empty data/blob host entries excluded. Third-party origins are observations, not a privacy audit.
- Stepped top/bottom/back: Chromium 412 and 1024 had no height decreases; WebKit 390 had one decrease. No sideways overflow in any. The WebKit scroll-stability acceptance is not passed; a longer repeat timed out, so the exact source/size of the decrease was not isolated.
- Aborted Costco SVG: fallback rendered, all 18 drawn, reveal reason logos; poster was not stuck. The timeout branch is source-tested, not exercised with a permanently hanging fetch.
- All 70 available Deno function tests passed. SQL tests not run (no database changes). Automatic preview build OK.

## Limits
Literal first GPU frame, all 18 individual logo pixel offsets, current published post-change behavior, physical-device smoothness, and repeatable bundled 4G performance are unverified. No publishing, cookie-bar changes, package.json changes, tree-model changes or animation reductions.
