## Findings

The mobile issues are concentrated around the tree hero, not the normal desktop layout.

1. **Mobile blur is likely from CSS3D overlays inside the WebGL scene**
   - `CouponFruit` renders every coupon with Drei `<Html transform sprite>` on top of the 3D coupon.
   - Mobile Safari/Chrome often rasterizes these 3D-transformed DOM layers at unstable resolutions during scroll, which makes coupon text and nearby scene elements look randomly blurry.
   - The same component also uses `backdropFilter: blur(8px)` for landed donation labels, which is expensive over animated WebGL.

2. **The tree render loop changes while the hero is still partly visible**
   - `Tree3DScene` switches mobile rendering from `always` to `demand` once `scrollY > 25vh`.
   - On a phone, the live tracking bar is directly under the hero, so this threshold can happen while the tree is still visible above the bar, creating pause/resume/jitter/blink perception during swipes.

3. **Mobile color can change by time of day**
   - `InteractionContext` sets `day`, `sunset`, or `night` from the local clock.
   - On mobile, this can make the hero look darker, warmer, or strange depending on when it is opened, while a laptop viewed earlier looked fine.

4. **Mobile GPU cost is still high**
   - The mobile scene still renders: animated tree shader, 16 animated coupons, coupon HTML overlays, falling coupons, plants, bird, ambient bird, contact shadows, fog, sky shader, and DOM overlays.
   - The local browser reported WebGL performance warnings during the mobile audit.

5. **Blur-heavy UI is mostly desktop-hidden, but a few risk points remain**
   - Mobile hero headline already avoids `backdrop-blur`, good.
   - Remaining risky mobile points are inside the 3D coupon labels/popovers and any animated DOM over WebGL.

## Plan to fix

1. **Create a mobile-specific tree rendering mode**
   - Pass `isMobile` down into `CouponFruit` and other expensive tree subcomponents.
   - On mobile, disable CSS3D coupon face overlays and use the existing canvas/texture coupon face only.
   - Remove mobile `backdropFilter` from landed donation labels; replace it with solid background + text shadow/shadow.

2. **Stabilize mobile rendering during scroll**
   - Stop switching the canvas to `demand` while the hero is still close to the viewport.
   - Keep `frameloop="always"` while the hero/live bar region is visible, then pause only after the hero is safely off-screen.
   - Avoid unmount/remount thresholds that can happen during short mobile swipes.

3. **Normalize mobile hero colors**
   - Force mobile tree hero to a clean daylight palette by default.
   - Avoid automatic sunset/night color shifts on first load for mobile so the brand colors stay consistent and premium.

4. **Reduce mobile scene complexity without making the tree feel empty**
   - Disable ambient bird and trunk ripple on mobile.
   - Keep core tree, ground, and limited coupons.
   - Reduce mobile coupon count or animation activity if needed, while preserving the donation/tree concept.

5. **Improve sharpness without overloading phones**
   - Use a slightly higher but stable mobile DPR cap only after removing CSS3D overlays.
   - Keep antialiasing off or selectively enable only if it does not hurt scroll performance.
   - Ensure the canvas size stays stable and does not re-render at different resolutions during viewport toolbar changes.

6. **Polish mobile layout around the live tracking bar**
   - Keep the smaller hero height, but tune tree camera/framing so the tree does not dominate the whole first view.
   - Ensure live tracking sits visibly above the fold and does not get overlapped by hero overlays.
   - Keep live donation text updates paused while the user is actively scrolling.

7. **Validate on real mobile-sized preview**
   - Re-run a phone viewport audit at the current 384px width and high DPR.
   - Check initial load, tree fade-in, scroll past hero, live bar visibility, blur nodes, console warnings, and screenshots before/after scroll.

## Expected result

The mobile landing page should look less blurry, use more consistent premium colors, scroll more smoothly, and keep the tree landscape visually stable without random blur/flicker around the coupons and live tracking bar.