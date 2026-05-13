## Goal
Make the entire 3D tree hero stay sharp after the page finishes loading, with noticeably clearer tree details and hanging coupon text/logos.

## Root cause to fix
The scene is initially sharper, then becomes blurry because runtime rendering changes after load:
- `PerformanceMonitor` can lower DPR from `[1, 1.75]` to `[1, 1]`, so the canvas renders at a lower resolution on the user's DPR 2 preview.
- Post-processing is enabled after load on desktop/tablet and uses bloom with `mipmapBlur`, which softens the whole 3D image.
- The coupon HTML overlay is very large and transformed in 3D, but not centered or configured for crisp browser compositing, so the text can still be resampled poorly.

## Implementation plan
1. Lock the 3D canvas to a high, stable DPR instead of allowing automatic quality downgrade.
   - Use a stable DPR range suitable for DPR 2 screens, e.g. `[1.5, 2]`.
   - Remove/disable the `PerformanceMonitor` quality downgrade path for this hero so clarity does not collapse after load.

2. Remove the blur-heavy post-processing from the hero.
   - Disable `EffectComposer`, `Bloom` with `mipmapBlur`, and `Vignette` for the tree/coupon scene.
   - Preserve lighting/environment so the scene still feels premium, but without a full-frame softening pass.

3. Sharpen coupon rendering.
   - Keep the 3D coupon card mesh as the physical object.
   - Keep the HTML coupon face, but add `center`, `sprite={false}`, and CSS rendering hints (`backfaceVisibility`, `transformStyle`, `willChange`, `imageRendering: auto`) so browser-rendered text remains crisper.
   - Slightly simplify/reduce the coupon face box-shadow/text-shadow if needed because shadows visually read as blur at small 3D sizes.

4. Improve tree texture clarity.
   - Ensure model textures use high anisotropy and stable filtering, and mark them for update after material preparation.
   - Avoid introducing any backdrop or CSS blur over the canvas.

5. Verify the result.
   - Re-open the home route at the user's current viewport size.
   - Check that the scene remains sharp after the full page load instead of degrading after 1–2 seconds.
   - If needed, make one small follow-up tuning pass on DPR/post-processing/coupon overlay sizing.