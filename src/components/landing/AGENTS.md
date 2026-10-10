# 3D tree rules
- Tree fruit animations share one transparent WebGL logo path.
- Tree slots stay stable while allowed brands rotate non-repeating; exclude Trader Joe's, eBay, and Postmates.
- Use 18 deterministic, color-balanced canopy slots with front bias, orbit coverage, and no duplicate hanging brand.
- Use official local SVG artwork when available and preserve its colors/proportions; prefer recognizable emblems unless a brand is wordmark-led.
- Tree anchors use slot-specific leaf clearance and vertical correction.
- All 18 opening logos preload at tree-module evaluation (coupons painted ahead, one per task) and mount together; reveal follows a drawn full-logo frame, with a three-second safety timeout only outside the opening. Replacement logos preload on demand.
- Draco decoder is self-hosted at /draco/ (copied from three's bundled libs) so the tree never depends on a third-party host.
- The 3D tree canvas uses `frameloop='never'` while off-screen, tab-hidden, or until ShaderWarmup has compiled the scene (parallel via KHR_parallel_shader_compile, 5s deadline); demand mode starved page animations on phones.
- Production sets `checkShaderErrors` false (each check waits on the GPU). The environment map is built outside Suspense and the ground/leaf textures are drawn ahead, while the model downloads.
- Tree quality starts from shared desktop settings except known software renderers; committed visible-frame sampling reduces shadow/DPR costs before ambient density so screen size never selects artwork.
- Preserve context-owned MSAA and leaf alpha-to-coverage during adaptation; changing the antialias method would remount WebGL or alter the leaf silhouette.
- Tree model and appearance are shared across viewport sizes; camera aspect fitting and mobile label placement may vary, but lights, materials, exposure and geometry do not.
- Two skies only, chosen once per load: night 70%, blue day 30% (`html[data-sky]`, `?time3d=day|night` forces one); tapping the sky toggles them. No sunset/midday palette and no clock.
- There is no still tree picture: without WebGL (or on error) the hero shows the CSS sky-and-hill backdrop for this load's sky and announces ready.

## Homepage opening (also index.html and src/main.tsx)
- The homepage opening is the founder-approved logo-to-navbar lockup: off-white cover, logo mark, two-colour wordmark and "Transforming Giving" rise, one sheen, then the lockup flies onto the nav brand (`[data-nav-brand] img`, /brand/logo-256.webp) while the page settles in. It plays on every homepage load with no skip.
- It holds at least 1.55s and reveals when fonts, the nav brand and the drawn live tree are ready; a progress hairline appears after 1.8s, 8s cap. Only transform/opacity animate.
- The inline script sets the sky before the homepage gate. The vite openingPreloads plugin writes the page and tree chunk lists into it at build time; tree chunks, model, Draco and logos preload only when WebGL works (window.__cdWebGL), which also gates main.tsx's early Tree3DScene import.
- Keep the index.html opening block under 12KiB. Canvas uses offsetSize, never scales.
