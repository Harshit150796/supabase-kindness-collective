## Plan: make the tree launch immediately and feel smooth

### Goal
Make the 3D tree start loading and rendering as soon as the landing page opens, with no delayed mount or fade-in wait, while preserving the existing tree detail/leaf counts and visual quality.

### Current confirmed bottlenecks
- `HeroSection.tsx` still lazy-loads `Tree3DScene`, so the browser waits for the main React app to render before requesting the 3D chunk.
- The tree is hidden behind a `500ms` opacity transition, so even after it is ready the user sees a delayed reveal.
- `Tree3DScene.tsx` loads the Drei `Environment preset="forest"`, which can add startup work during the first render.
- The current preload only preloads `/models/tree.glb`; the active tree code does not appear to use that GLB in the files inspected, so it may not help this hero startup.

### Implementation steps
1. **Make the 3D tree part of the first landing bundle**
   - Replace the `React.lazy` import of `Tree3DScene` in `HeroSection.tsx` with a normal static import.
   - Keep the existing WebGL/bot safety check so unsupported browsers still get the fallback.

2. **Remove the visual reveal delay**
   - Remove the `duration-500` fade behavior from the tree wrapper.
   - Show the canvas immediately once WebGL capability is known instead of fading it in slowly.

3. **Start capability detection earlier and avoid extra renders where possible**
   - Initialize the `can3D` state from `canRender3D()` on the client, instead of always starting as `false` and waiting for `useEffect` to flip it.
   - Keep a safe server/SSR fallback path.

4. **Reduce first-frame startup work without reducing quality**
   - Replace or defer the Drei `<Environment preset="forest" />` startup load if it is contributing to the initial pause.
   - Preserve lighting, camera, leaf counts, shadows, DPR, and all visible tree quality settings.

5. **Clean misleading preload if needed**
   - If `/models/tree.glb` is unused by this tree, remove that preload so the browser does not spend early bandwidth on an irrelevant asset.
   - If it is used indirectly, keep it.

6. **Verify on mobile-sized preview**
   - Check the page at the current mobile viewport.
   - Confirm the hero paints immediately, no blank wait/fade occurs, and no tree quality settings were changed.

### Files expected to change
- `src/components/landing/HeroSection.tsx`
- Possibly `src/components/landing/Tree3DScene.tsx`
- Possibly `index.html` only if the existing GLB preload is confirmed unused or counterproductive

### What will not change
- No changes to leaves, tree geometry, coupon behavior, donor label layout, camera framing, or mobile visual quality.