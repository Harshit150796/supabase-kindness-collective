# 3D tree rules
- Tree fruit animations share one transparent WebGL logo path.
- Tree slots stay stable while allowed brands rotate non-repeating; exclude Trader Joe's, eBay, and Postmates.
- Use 18 deterministic, color-balanced canopy slots with front bias, orbit coverage, and no duplicate hanging brand.
- Use official local SVG artwork when available and preserve its colors/proportions; prefer recognizable emblems unless a brand is wordmark-led.
- Tree anchors use slot-specific leaf clearance and vertical correction.
- All 18 opening logos preload at tree-module evaluation and mount together; reveal follows a drawn full-logo frame with a three-second safety timeout, preventing poster/logo pop-in. Replacement logos preload on demand.
- Draco decoder is self-hosted at /draco/ (copied from three's bundled libs) so the tree never depends on a third-party host.
- The 3D tree canvas uses `frameloop='never'` while off-screen or tab-hidden; demand mode kept redrawing and starved page animations on phones.
- Tree quality starts from shared desktop settings except known software renderers; committed visible-frame sampling reduces shadow/DPR costs before ambient density so screen size never selects artwork.
- Preserve context-owned MSAA and leaf alpha-to-coverage during adaptation; changing the antialias method would remount WebGL or alter the leaf silhouette.
- Tree model and appearance are shared across viewport sizes; camera aspect fitting and mobile label placement may vary, but lights, materials, exposure and geometry do not.

- Posters are daytime canvas-only captures at initial zoom with pointer at rest: a wide desktop panorama and a 2x phone image preserve the live framing during handoff.
