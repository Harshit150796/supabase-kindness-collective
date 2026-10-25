# Logo falls first: every name, plant and butterfly follows a visible logo drop

## What is happening today
- Names, plants and the name-carrying butterfly already start only when a logo lands. But three things make it feel disconnected:
  - The tree picks the falling logo at random from all 18, including logos at the back of the tree, so visitors often see a plant and a name appear with no fall they could see.
  - The moment a logo touches the grass it disappears instantly, so the name seems to arrive from nowhere.
  - The empty spot on the branch stays bare for about 6 seconds before a new logo grows in.
- The fall itself starts abruptly, spins at random speeds (the logo is often edge-on and unreadable) and has no landing beat.
- The small butterflies drifting over the hill carry no names and are only scenery; they stay as they are.

## The new sequence (one drop, start to finish)
```text
1. Loosen   ~0.5s  the chosen front logo shivers and dips on its branch
2. Fall     ~1.2s  it drops like a leaf: gentle sway, slow turn, face mostly readable
3. Land     ~0.4s  soft bounce, lies on the grass, still visible
4. Name            the plant sprouts beneath it and the dandelion or butterfly
                   brings the donor's name (unchanged artwork and timing)
5. Settle   ~1.5s  the landed logo sinks into the grass and fades as the plant opens
6. Regrow          a different brand buds at the same branch spot ~1s after landing
```
- Nothing in steps 4 and 5 can start unless steps 1 to 3 happened for that logo.
- One name at a time stays as today (one drop every 9 seconds). Taps and shakes still drop logos; extra landings during a name grow a quiet plant, as now.

## Front logos fall most
- Each auto drop scores the hanging logos by how directly they face the current camera (this follows the visitor if they rotate the tree) and how clear of the screen edges they are.
- About 85% of drops come from the front-facing group; the rest from the sides so the whole tree renews. Back-of-tree logos never fall on the timer.
- The same spot never falls twice in a row, and logos that just regrew are skipped until they have hung for a while.

## Kept as is
- Brand rotation rules (no repeats on the tree, excluded brands), logo artwork and sizes, 18 slots, tree, lighting, camera, sky, plant count limits, name tag design, the dandelion and butterfly moments, gentle mode (no drops) and catching a falling logo by tapping.

## Technical details
- New pure helper `src/components/landing/tree3d/dropChoice.ts`: given hanging slot world positions, camera position/frustum, last dropped slot and regrow times, returns a weighted front-biased pick. Used by the auto-drop timer in `Tree3DScene.tsx` (replacing the uniform random pick); the shake cascade also prefers front slots.
- `CouponFruit.tsx`: add a short `loosening` stage before `falling` (state union gains `{ phase: 'loosening' }` handled in Scene), leaf-like fall (damped spin, sinusoidal side sway, bounded so the face turns toward the camera most of the flight), keep the logo visible while `landed` with a squash-and-sink fade, and call `onRegrown` after ~1s instead of 5s. Plant spawn stays tied to the landing (`tryPlant`).
- Delta-based motion with exponential damping; no per-frame React state; materials reuse the existing texture (fade via the material's opacity on the landed logo only).
- Brand swap still happens when regrowth begins, through `takeNextBrand`.
- Update the garden rule in `src/components/landing/AGENTS.md` to describe the loosen-fall-land-name order and front-biased drops.
- Test: `supabase/functions/_shared/tree-drop_test.ts` asserting that the picker never chooses a back-facing slot, never repeats the last slot, and picks front slots in at least 80% of 1,000 seeded draws.

## Verification
- Playwright captures over several drops at desktop and phone sizes: the logo is seen loosening, falling and resting before the name tag appears; the branch spot fills again within about 2 seconds; console clean.
