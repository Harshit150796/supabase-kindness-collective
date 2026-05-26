I found the likely causes of the mobile blur/jank around the hero-to-live-activity area:

1. The Live Activity pill uses `backdrop-blur-sm` directly over an animated WebGL hero. On mobile, `backdrop-filter` is expensive and can make the section look blurred during scrolling.
2. The sticky navbar also uses `backdrop-blur-lg`, which forces the browser to re-sample pixels while scrolling.
3. The 3D hero is still doing heavy mobile work: continuous WebGL rendering, shadows/contact shadows, environment lighting, many animated DOM `<Html>` coupon faces, and a `touchmove` handler that calls `preventDefault` during hero scrolling.
4. Mobile initial load is heavy: the preview measured ~2.6MB of scripts, the 3D dependencies load early, `tree.glb` is ~1.5MB, and `favicon-192.png` is unusually large at ~677KB.
5. The current mobile idle-mount delay leaves the hero blank/white for a while, matching the screenshot where the top section is empty before the live bar appears.

Plan to fix it while preserving the same visible design:

1. Remove mobile scroll blur hotspots
   - Keep the Live Activity pill visually the same, but on mobile replace `backdrop-blur-sm` with an opaque/semi-opaque background and normal shadow.
   - Keep the desktop blur if desired, but disable it on mobile where the issue happens.
   - Do the same for the sticky navbar: no backdrop blur on mobile, keep the same background color and border so it looks unchanged.

2. Make the 3D hero mount smoothly on mobile
   - Stop showing a blank white area before WebGL mounts; use the existing sky gradient fallback immediately.
   - Keep the tree visuals unchanged once loaded.
   - Adjust the mobile mount strategy so loading does not block the first paint or scroll.

3. Reduce mobile WebGL cost without changing the look
   - Lower mobile-only rendering pressure: smaller DPR cap, lower shadow cost, lighter contact shadow resolution, and fewer non-essential animated particles/extra effects on mobile.
   - Remove unused postprocessing imports from the landing bundle since bloom/vignette are disabled.
   - Avoid loading the expensive environment preset on mobile if it is not materially visible.

4. Make scrolling more natural on mobile
   - Change the hero wrapper touch behavior from mostly horizontal pan to normal vertical page scrolling after the intended zoom interaction is complete.
   - Reduce `preventDefault` usage so the browser can keep scrolling on the compositor thread.

5. Fix avoidable loading overhead
   - Replace/resize the huge `favicon-192.png` with a properly optimized 192px icon so it is not 677KB.
   - Fix the React `fetchPriority` warning on the logo image.
   - Add lazy/async hints to brand-logo images that are below desktop-only sections.

6. Validate on mobile
   - Re-run the mobile performance profile.
   - Check the landing page at a phone viewport and confirm the live bar remains sharp while scrolling and the hero no longer shows a long blank loading gap.

Files expected to change:
- `src/components/landing/LiveActivityBar.tsx`
- `src/components/layout/Navbar.tsx`
- `src/components/landing/Tree3DScene.tsx`
- `src/components/landing/tree3d/Ground.tsx`
- `src/components/landing/tree3d/Sky.tsx` if needed for mobile particle reduction
- `index.html` or generated favicon assets if optimizing the icon reference

No visual redesign, no tree shape/animation redesign, and no copy/layout changes.