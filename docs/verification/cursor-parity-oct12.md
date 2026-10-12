# Cursor delayed-frame correction — October 12, 2026

## Confirmed defect and correction
The cursor previously discarded elapsed time above 64ms twice (frameDt and trailFactor). A 90ms frame therefore advanced the exponential trail by only 64ms, stretching its real-time following delay. The correction preserves elapsed time below one second, then snaps after longer interruptions. The 20/170/340ms normal smoothing times, native blue lead pointer, colours and hover/press appearance are unchanged.

Pointer input is captured before canvas bubbling interaction processing. Hidden native-lead and unchanged settled transforms are not written. Hidden tabs cancel/reset the loop and resume with first-entry positioning rather than replaying stale movement. Tree rendering, quality, artwork, opening, CSS and page content were not changed. Nothing published or deployed.

## Controlled browser comparison
Chromium, 1280×1800, real mouse move from x=350 to x=950 on /about, then stop. Busy test adds 90ms of work each animation frame in the temporary browser script only. Frame gaps stayed unchanged; this fixes catch-up timing, not the browser's ability to produce frames while blocked.

| Measurement | Before | After |
|---|---:|---:|
| Normal frame gap median / p95 | 16.7 / 16.7ms | 16.7 / 16.7ms |
| Busy frame gap median / p95 | 83.4 / 100.07ms | 83.4 / 100.0ms |
| First follower error near 1s, normal | 1.52px | 1.52px |
| Second follower error near 1s, normal | 30.23px | 30.23px |
| First follower error near 1s, busy | 8.66px | 1.48px |
| Second follower error near 1s, busy | 71.72px | 29.62px |
| Second follower error near 2.2s, busy | 5.14px | 0.69px |

Numerical tests additionally prove equal decay over 900ms split into 54 ordinary frames or ten 90ms delayed frames, reversal without overshoot, normal smoothing constants, one-second reset and invalid-time handling.

## Browser checks
- Actual live day-tree canvas drawn, readiness observed, screenshots inspected before/after; followers reached the final tree pointer coordinate after the correction.
- All three dots settle exactly at (800,600) on the non-tree page.
- Cursor remains visible above the opening menu animation.
- Email input restores the text cursor and hides the custom trail; leaving resumes it.
- Touch profile has no fine-hover match and no active custom cursor.
- No page errors in these walkthroughs. Existing React ref warnings are not corrected by this cursor work.
- 24 focused cursor/tree tests pass, including Deno checking with DOM libraries enabled. Automatic preview build OK at 22:36:28 UTC.

## Limits
The sandbox live tree produced multi-second frame gaps (before median about 2.48s, p95 about 3.36s). It is not an accelerated hardware performance benchmark. The shortened after-tree run verifies catch-up, not a comparable speed metric. No accelerated/high-refresh parity claim is established; physical mouse smoothness, both-sky interaction sweep, full orbit/opening/visibility-transition walkthrough and compositor-display jitter remain unverified. Browser screenshots show the live tree, not a fallback picture. Controlled timing and numerical proofs demonstrate the elapsed-time defect independently of the GPU.

Scripts, samples and screenshots: /tmp/browser/cursor-parity/.