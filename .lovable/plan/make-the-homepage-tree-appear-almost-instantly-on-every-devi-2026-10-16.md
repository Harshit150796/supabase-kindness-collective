# Make the homepage tree appear almost instantly on every device

## Goal
The tree should show up right away on phones, tablets, laptops and slower computers, while looking exactly the same: same shape, leaves, colours, lighting, sky, camera, logos and every animation.

## What I found
- The tree file is still 1.27 MB, the same size as before the red apples were taken off. The apples are hidden after download, not removed from the file, so every visitor still downloads and unpacks them.
- On most computers the tree starts with a very large shadow map (4096), which takes a lot of preparation before the first picture. It only drops to a smaller size after the tree has already been slow for a few seconds.
- The tree waits for all its graphics programs to be prepared before drawing anything. On slower phones and computers this is the longest wait.
- All 18 opening logos download at the same moment as the tree file, competing with it on slow connections.

## Changes
1. **Smaller tree file.** Remove the apple part from the file itself and pack the shape data more tightly with the same compression, keeping the visible geometry. Target: about 30–40% smaller. If any difference shows in side-by-side screenshots, keep the current file.
2. **Draw first, sharpen right after.** Show the first picture with a 2048 shadow map, then switch to the full 4096 quality within a second once it is on screen. The final look is unchanged.
3. **Prepare graphics in stages.** Prepare the trunk and leaves first and draw them. Prepare the extras (plants, birds, fireflies, sparkles) in the next few frames, before they first appear, so their animations are unchanged.
4. **Tree file downloads first.** Give the tree file and its unpacker top download priority. Download the opening logos straight after, so they are ready before they fade in.
5. **Remember it for return visits.** Keep the tree file and unpacker saved in the browser so the second visit needs no download.
6. **Measure on each device type.** Record the time until the tree first appears, before and after, on a simulated slow phone, a mid-range phone, a tablet and a laptop. Include a slow-connection test.

## Not changing
Tree look, logos, motion, opening animation, cookie bar, every other page. Nothing gets published.

## About using an AI model
GPT-Astra is a model for writing text in the app, so it can't speed up how the site loads. I'll do this work with the strongest reasoning I have and judge it by the device timings in step 6. The tree doesn't need any AI to run.

## Technical details
- Strip `Material.004` primitive offline from `public/models/tree.glb`, re-encode with Draco (higher quantization only where error is below visual threshold), and verify the triangle count and bounding box match minus the apples. Remove the runtime drop in `Tree.tsx`.
- `qualitySettings` initial `shadowMapSize` is 2048, raised to 4096 after the `onReady` frame (live shadow map resize, no Canvas remount).
- Use `gl.compileAsync` / KHR_parallel_shader_compile for the core materials and start the frameloop after the core compiles. Extras compile with deferred `renderer.compile` calls.
- index.html preload: glb/draco `fetchpriority=high`. Logo preloads move after the glb load begins.
- Cache headers: immutable for `/models/*` and `/draco/*` where Lovable hosting allows. Otherwise use a content-hashed filename.
- Add regression tests (no apple primitive, initial shadow 2048 then 4096, preload order) in `supabase/functions/_shared/tree-quality_test.ts`. Then run existing tree tests, compare with Playwright screenshots at 390×844, 768×1024 and 1440×900, and use CPU and network throttling for timings.
