# Match cursor smoothness over the live tree

## Goal
Keep the current three-dot trail feel from the smoother parts of the website and make the live-tree section match it. Do not tighten the trail everywhere or disguise the issue by removing dots or stopping tree animations.

## What the investigation confirmed
- The following dots use the same JavaScript animation loop everywhere, with smoothing times of **20 / 170 / 340ms**. Movement time is capped at **64ms** per update.
- Over the tree canvas, the lead dot can become a native blue pointer, while the following dots remain JavaScript-driven. This allows the lead and its followers to respond differently when page frames are delayed.
- The tree already has frame pacing, measured quality adaptation, shader warm-up and off-screen suspension. Its draw pacing does not gate every scene-update callback.
- Existing cursor and tree regression tests cover smoothing, native-pointer handoff and frame pacing. Earlier cursor verification explicitly did **not** demonstrate accelerated live-tree performance parity.

**The exact cause and size of this slowdown remain unmeasured.** Shared frame contention, pointer-event processing and long-frame catch-up are candidates, not established diagnoses.

## Implementation
### 1. Establish a repeatable baseline
- Run identical pointer paths over the drawn live tree, its headline/buttons, a neutral homepage section and a non-tree page.
- Record pointer arrival, cursor update intervals, each follower’s distance/settling time, long frames and tree draw/update costs. Separate intentional trailing distance from extra delay and jitter.
- Compare ordinary movement, quick direction changes, stopping, crossing the canvas boundary, hovering a logo and moving while scrolling. Test both day and night scenes.
- Confirm a real tree is drawn before calling a run a live-tree test. Record renderer information; software-rendered results cannot establish accelerated-device parity.

### 2. Fix only the demonstrated bottlenecks
- Preserve the existing smoothing times and appearance. Correct delayed-frame handling if measurements show the current time cap or callback timing makes followers fall further behind under load; retain bounded, predictable recovery from hidden tabs and long pauses.
- Keep pointer capture lightweight and use the freshest available pointer sample. Avoid repeated style reads, cursor-owned observer feedback and unnecessary writes where the trace shows them contributing.
- If tree work is the limiting factor, reduce redundant interaction/update work and coordinate it with drawn frames without changing real-time animation speed, click/hover behavior or the tree’s visuals.
- Preserve the native blue pointer handoff where supported, with seamless entry/exit and no doubled lead dot. Do not claim native-pointer responsiveness proves the trailing dots are smooth.
- Do not introduce a global tree FPS reduction, forced low-quality mode, worker-rendering rewrite or new animation library as a speculative fix.

### 3. Verify the result
- Repeat the same baseline paths before and after; report frame-gap percentiles, extra follower lag and settling behavior rather than relying on one screenshot.
- Add focused numerical regressions for normal and delayed frames, direction changes, settlement and visibility recovery; run the existing cursor/tree tests.
- Verify hover/press, text-entry native cursor, route changes, menus/dialogs, opening handoff and touch devices where the custom cursor stays inactive.
- Confirm normal scrolling and all tree interactions/animations remain intact. Check automatic preview build output and runtime errors.
- If accelerated hardware or physical high-refresh testing is unavailable, state that limitation and leave performance parity unverified rather than claiming it from fallback scenery or synthetic timing alone.

## Technical scope and safeguards
Primary scope: `CursorTrail.tsx`, `cursorBackground.ts` and focused regression tests. Change cursor CSS or tree scheduling/interaction files only when the measured bottleneck requires it; update their scoped architecture rules accordingly.

Preserve all 18 tree logos, geometry, materials, lighting, native-pointer artwork, full motion, opening, cookie bar and page content. No backend/payment changes, deployments or publishing.

Lovable chooses the assistant model automatically; this plan does not promise execution on Opus 5.5.