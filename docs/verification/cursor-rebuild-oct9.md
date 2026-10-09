# Cursor rebuild — October 9, 2026

Nothing published. Only cursor code/styles, the read-only tree probe, tests and documentation changed. Intro, tree settings/materials/camera/artwork, posters, scroll effects, images, retailer rail and cookie bar remain unchanged.

## Implementation

- Body portal at z-index 2147483646; native cursor hidden only during active fine-pointer tracking. Text entry, iframe, intro, blur and admin restore native handling.
- One-shot pointer-event frame batching uses the last coalesced point. No lerp/render loop. CSS transforms chase at 70/300/600ms; colour layers fade over 200ms; hover ring 44px; press scale .85.
- First entry snaps all dots into place before enabling transitions. Dot centres use pointer coordinates.
- DOM opaque-background walk, bounded cached poster bitmap with centred cover mapping, and lazy-tree addAfterEffect default-framebuffer pixel read. Probe does not render, invalidate, bind a framebuffer, change DPR or request preserved buffers.
- Sampling prioritizes luminance below .20, then green/blue hue, then photo, then fallback. **Dark foliage and dark brand-green buttons therefore return white**, as required by the first mapping rule, not blue. This precedence conflicts with the blanket “foliage/grass → blue” spot expectation.

## Measurements and observations

Controlled Chromium benchmark, 1280×1800, 200px circular radius, approximately 1500px/s, five seconds, 12ms busy work each animation frame; first 15 samples excluded:

| Metric | Original | New |
|---|---:|---:|
| Samples retained | 287 | 287 |
| Position-step standard deviation | 0.0666px | 0.0912px |
| Mean position step | 24.0065px | 24.8940px |

**No jitter improvement demonstrated.** This controlled comparison used /about because forced homepage software WebGL produced fewer than 15 frames in five seconds. It is not the requested accelerated homepage comparison. Computed transform samples are DOM-observed frame positions, not independent compositor-display captures. CSS allows interpolation between input writes but cannot generate new pointer targets during a blocked thread.

Verified in Chromium:
- Computed body/link/button cursor: `none`; input: `text`, trail opacity 0.
- Native cursor restored during intro and blur. Intro fallback check exposed and fixed repeated class-removal notifications.
- Hover ring 44px, transparent fill, trailing-dot opacity 0; visible over navbar.
- Actual project Dialog and Dropdown primitives mounted in a temporary browser-only QA host: cursor opacity 1, body cursor none; screenshots visibly above both portals. No QA host added to app code.
- Dark panel white; mint panel blue; day-tree sky green (pixel examples 117/168/220 through 141/188/228).
- One tree canvas. Twelve pixel events during the slow software-rendered observation; minimum gap 2438.6ms, safely below the 12Hz maximum. Zero additional samples while pointer was outside canvas.
- Phone touch profile: fine query false, no active cursor class, trail opacity 0, body cursor auto.
- No application page errors in primary checks.
- Unit mapping checks cover night/forest white, bright foliage/mint blue, day sky green, warm photo white, cream/sunset/red/yellow blue, proportional poster coordinates, and 12Hz throttle.
- 43 Deno tests plus 3 Bun photo tests passed; preview build OK.

## Limits

Not verified: real-device tree FPS/readPixels overhead; accelerated homepage before/after jitter; every requested live foliage/grass/night/photo location; authenticated admin route (public request redirected to homepage); physical iPhone. Synthetic portal mount uses real project primitives but is not an authenticated account workflow.

Poster sampling showed blue at a sampled sky point and white at a dark canopy point; those follow measured luminance/hue, not named semantic areas. Photos similarly follow the founder's hue checks before the photo fallback.

Evidence/scripts: `/tmp/browser/cursor/` contains benchmark samples, QA JSON, navbar ring, real dialog/dropdown and day-tree screenshots.
## Motion follow-up — rAF direct lead + exponential tails

- Lead dot: no transition; one rAF callback writes the latest coalesced pointer position. Tails: `k = 1 - exp(-dt/τ)`, dt clamped to 64ms, τ 170ms / 340ms. All wrapper transform transitions removed (computed `0s`); colour-layer opacity and inner hover/press transitions kept.
- Loop starts on pointermove/recheck and stops when no move arrived and both tails are within 0.3px. Idle check: tails converged to the lead and 0 style writes in the following second.
- Probe averages one 7×7 `readPixels` (196 bytes). Tree/poster colour uses hysteresis (two consecutive classifications or luminance jump > .15); DOM colours stay immediate.

On-screen CDP screencast (everyNthFrame 1, PNG), /about, WebGL disabled, 1280×1800, 200px radius at ~1500px/s, 5s, first 15 frames dropped, lead dot QA-recoloured to track it:

| Technique | Speed CV idle | Speed CV busy (25ms/frame) | Stalled frames busy |
|---|---:|---:|---:|
| Previous 70ms ease-out transition (same rig) | 0.53 | 0.75 | 5 |
| New direct rAF lead (7 busy / 6 idle runs) | 0.24–0.31 | 0.17–0.30 (4 of 7 under 0.19) | 0 in every run |

**The ≤0.15 busy target was not reached here.** The rig's own floor is high: a pure compositor CSS keyframe orbit measured 0.22–0.24 CV and screencast frame intervals varied 10–45%. Driver input was fire-and-forget CDP mouse events every ~4ms from Python. The stall-free result is consistent; the absolute CV needs your quieter rig. Scripts and raw frames: `/tmp/browser/cursor2/`.
