# Remove Halloween, faster and clearer donor names

## 1. Remove the Halloween theme
- Take the marshmallow ghosts, pumpkins and mummy (and their night glow) off the homepage hill on every device, now and in future Octobers.
- Delete their code and styles. The garden plants keep using the freed-up space on the grass.
- Remove the Halloween rule from the homepage design notes.

## 2. Names under the tree: faster
- A logo falls every **5 seconds** instead of every 9.
- Each name moment (dandelion or butterfly) runs in **about 4.5 seconds** instead of 7.6. The name shows up almost as soon as the logo lands, not after a pause.
- The logo's own fall and the plant growing speed up to match, so nothing overlaps or gets cut off.

## 3. Names under the tree: easier to see
- Bigger name: 30px on laptops/tablets (was 24px), 26px on phones. "donated $X" grows from 12.5px to 14px.
- More solid tag (less see-through) with a slightly stronger shadow, so it stands out over grass, trunk and the night sky.
- The name stays fully visible for longer within its moment before it fades.

Not changed: the tree itself, the cookie bar, the drive bar, phone mosaic, and the Pause animations button (Pause still shows names without movement).

## Technical details
- Delete `tree3d/HalloweenMarshmallows.tsx`, `tree3d/marshmallowSpots.ts`, the `.mm-*` rules in `garden.css`, and the `HALLOWEEN` import/render in `Tree3DScene.tsx`; remove the bullet in `components/landing/AGENTS.md` and any tests referencing them.
- `AUTO_DROP_MS` 9000 -> 5000; `MOMENT_SECONDS` 7.6 -> 4.5 and the matching `7.6s` animations/keyframe percentages in `garden.css` (tags appear at ~8% instead of 15-18%); speed up fall/rest timings in `CouponFruit.tsx` proportionally; keep the "busy" guard in `PlantsLayer` consistent.
- `.gm-name`/`.gm-amt` sizes, tag background opacity ~.95; check phone tag width (gardenSpots `TAG_W`) still fits.
- Update AGENTS.md garden bullet timings; run tree-quality/garden tests; browser-check laptop and phone, day and night.
