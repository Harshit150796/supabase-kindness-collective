# Mobile motion and tree fidelity — preview verification

Nothing published. No database, payment, cookie-bar, model, or package changes.

## Implemented
- Removed the effectiveType gate entirely. Explicit Save-Data still holds the poster; connection changes re-evaluate it. Reduced motion no longer prevents live WebGL. Unsupported WebGL and crawler fallback remain.
- All non-software renderers start with the desktop configuration: the same authored GLB canopy (reported 7,000 leaves), 40 fireflies, eight ambient birds, trunk ripple, 4,096 shadows, MSAA and DPR cap 2. Width, DPR, CPU and memory no longer select quality. Removed mobile-only lighting, fog, contact-shadow and scatter quality differences; kept aspect-fitting camera and mobile label layout.
- Visible committed frame samples run over 2.5 seconds after a brief warmup. Sustained samples below 45 FPS step through 4,096→2,048→1,024 shadow maps, then DPR 2→1.75→1.5. Only subsequent poor samples reduce ambient effects. The actual GLB canopy is never thinned, including software-renderer fallback. Hidden/off-screen rendering remains paused.
- **Antialias exception:** retained context-owned MSAA and leaf alpha-to-coverage rather than switching the antialias method between shadow and DPR reductions. Switching would recreate the WebGL context or change leaf edge coverage, violating the no-visual-change requirement. This step is not implemented; no claim that every requested adaptation stage passed.
- Shared reveals now fade 0→1, rise 24px, last 600ms, and pre-trigger 20% below the viewport. Delays cap at 80ms. Late-mounted or fast-flung entries finish immediately by 20% viewport entry. Gentle mode uses quick opacity-only fades, never a hidden-content wait.
- Compact below-lg story illustrations play once on entry, captions follow by 120ms; no sticky mobile panels. Gentle illustrations fade without their large movements.
- Headline words rotate on all widths, crossfading without translation in gentle mode. Large count-ups also run in gentle mode; small values stay truthful immediately.
- Marquee has a visible pause/resume control and is paused in gentle mode. Touch controls/links receive pressed feedback, scoped away from the cookie bar; reduced-motion presses use colour instead of scale.
- Gentle tree stays live: fixed camera, no orbit controls, falling coupons, flying birds, dust motion or ripple; slower leaf life and stationary firefly glow remain. Debug overlay reports actual scene settings and motion mode without repeatedly creating GPU detection contexts.

## Browser evidence
Playwright Chromium, local preview; phone renderer strings and browser APIs simulated as requested. Pixel screenshots inspected for iPhone, Galaxy, and gentle tree, plus phone/tablet stepped recordings. Raw results and screenshots are under `/tmp/browser/mobile-motion`.

| Profile | Mount/start | Observed adaptation |
|---|---|---|
| iPhone-size 393×852, DPR3, Apple GPU, memory/connection absent | Mounted, detected high | Actual SwiftShader workload eventually reached last-resort low: shadows 1024, DPR1.5, 8 fireflies, 1 bird, ripple off; same GLB canopy |
| Galaxy-size 412×915, DPR2.625, Adreno 710, connection 3g | Mounted, detected high | Same last-resort step under software rendering; Save-Data change removed Canvas and switching it off mounted Canvas again |
| Budget Android 412×915, DPR2.625, 4 cores/2GB, Mali-G57, connection 3g | Mounted; captured step0 desktop settings | Same last-resort step under software rendering; off-screen state confirmed paused at scrollY3000, wrapper entirely above viewport |
| Gentle iPhone-size run | Live tree rendered, no runtime exceptions | Camera sampled identically at `0,4.4,22.5328`; zero active flying birds and ripple disabled. Inspected night scene with stationary glow |

**These are not real-device frame-rate results.** Overriding a renderer string does not replace SwiftShader with Apple/Adreno/Mali hardware. Capable hardware holding the threshold retains step0 (4096/MSAA/DPR2, full effects); actual capable iPhone/Android final settings and sustained smoothness cannot be established here. The software runs measured roughly 0.4–1 FPS in the expensive simulated scenes and correctly downgraded. Do not interpret that as phone performance.

### Shared reveal and scroll recordings
- Frame-by-frame independent reveal samples at 390 and 1024 went from opacity 0 to 1 with 34 and 35 intermediate frames respectively. At 1024 the sampled reveal was already 0.999999 at 78.3% viewport height. Phone stepped recordings found no hidden reveals once inside the first 80% of the viewport.
- Simulated iPhone/Galaxy reveal samples were zero below the early trigger and one before crossing the viewport; software rendering stalls prevented meaningful intermediate-frame timing there. Phone-specific smooth reveal timing remains unverified on hardware.
- Stepped viewport screenshots, ~85% viewport increments, top→bottom→top: 390×844 height 10,834→11,323; 1024×768 height 9,494→10,084. **Zero decreases**, no horizontal overflow, zero hidden in-screen reveals in both runs. Each run logged 11 homepage section entries in order.
- Compact receipt illustration produced five different frames when sampled before its first entrance. Gentle run had static geometry with a short fade. Marquee pause control stopped motion; gentle marquee was already paused. Debug overlay rendered; actual setting text also appeared in live-tree profile runs.

## Validation and limits
- 58 Deno tests passed, zero failures (all existing 52 plus six quality/motion regressions).
- Automatic preview build reported `build OK` after the final edits. No manual project build/typecheck was run, per harness rules; a separate TypeScript-only diagnostic run is not verified.
- No new phone-only model shipped or generated. Both devices keep the same 1,268,364-byte model; no optional SSIM proof claimed. Avoiding a variant guarantees no model-specific silhouette/colour/leaf-density difference.
- Real phones, Safari WebGL, sustained hardware frame rates, tab-hidden behavior with real OS backgrounding, and full frozen-time desktop/phone pixel equivalence were not verified. Some long SwiftShader runs timed out and were repeated in smaller focused checks; successful evidence above is from completed checks only.
- Existing React development ref warnings from Drei/scene helpers appeared; completed profile runs had no uncaught page exceptions. No claim of a warning-free console.
- No unique homepage content merged or removed. Only static mobile animation restrictions and device-based quality guesses were removed.
