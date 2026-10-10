# 3D tree rules
- Tree fruit animations share one transparent WebGL logo path.
- Tree slots stay stable while allowed brands rotate non-repeating; exclude Trader Joe's, eBay, and Postmates.
- Use 18 deterministic, color-balanced canopy slots with front bias, orbit coverage, and no duplicate hanging brand.
- Use official local SVG artwork when available and preserve its colors/proportions; prefer recognizable emblems unless a brand is wordmark-led.
- Tree anchors use slot-specific leaf clearance and vertical correction.
- All 18 opening logos preload at tree-module evaluation and mount together; reveal follows a drawn full-logo frame with a three-second safety timeout, preventing poster/logo pop-in. Replacement logos preload on demand.
- Draco decoder is self-hosted at /draco/ (copied from three's bundled libs) so the tree never depends on a third-party host.
- The 3D tree canvas uses `frameloop='never'` while off-screen (except under the opening) or tab-hidden; demand mode starved page animations on phones.
- Tree quality starts from shared desktop settings except known software renderers; committed visible-frame sampling reduces shadow/DPR costs before ambient density so screen size never selects artwork.
- Preserve context-owned MSAA and leaf alpha-to-coverage during adaptation; changing the antialias method would remount WebGL or alter the leaf silhouette.
- Tree model and appearance are shared across viewport sizes; camera aspect fitting and mobile label placement may vary, but lights, materials, exposure and geometry do not.

- Posters are daytime canvas-only captures at initial zoom with pointer at rest: a wide desktop panorama and a 2x phone image preserve the live framing during handoff.

## Homepage opening (also index.html and src/main.tsx)
- Inline opening preloads the shared live tree; covered loads defer posters and start at clock palette. Canvas uses offsetSize, never scales.
- The homepage opening is the founder-approved line-art seed-to-tree (off-white #F6F5EF, ground line, seed drop, green strokes, outlined canopy circles, coupon tickets, iris from the canopy). Keep that look; it plays on every homepage load with no skip and opens only onto the live tree (8s cap).
- The opening clips #root, which IntersectionObserver reports as hidden, so Tree3DScene keeps rendering while html.cd-intro is set; otherwise the tree can't draw before the reveal and every load waits for the 8s cap.
- Opening logos rasterise one per normal-priority task (no multi-second long task); the early Tree3DScene import runs only when the opening found a usable WebGL context (window.__cdWebGL); a hero without the live tree announces ready only after its picture has loaded.
