# Fewer plants, more names on the hill

## What changes for visitors
- **Every plant carries a name.** Right now, when a coupon lands while another name is still showing, it grows a "quiet" plant with no name. Those nameless plants go away: each plant and blossom on the hill has its donor's name beside it.
- **Names stay up.** A name brought by a butterfly or carried by dandelion seeds no longer fades after about 5 seconds. It stays next to its plant until 3–4 names are showing at once. When a new one arrives, the oldest plant and its name fade out together.
- **Fewer plants at once.** The hill shows at most 4 plants on laptops, 4 on tablets and 3 on phones, down from 8, 6 and 5. Every plant you see has a name.
- The butterfly still flies in and drops the name tag, then flies off. The dandelion seeds still drift up, but the name card stays where it is.
- A new name still arrives about every 5 seconds. Each name stays up for about 15–20 seconds.

## What stays the same
- The tree, the falling store logos, the deer, rabbits, birds, kids and fireflies.
- Tag size and colours (made bigger last time).
- The Pause animations button: names show at once with no flight.

## Technical details
- `tree3d/PlantsLayer.tsx`: change MAX_PLANTS to `{ wide: 4, narrow: 4, phone: 3 }`. Remove the "busy" quiet-plant branch so every landing gets a moment (alternating dandelion/butterfly). Stop clearing other plants' `moment` when a new one arrives, and drop the MOMENT_LIFETIME_MS timer. The moment then lasts as long as the plant, and the FIFO cap / same-spot replacement fades it out.
- `tree3d/garden.css`: change the end keyframes so tags hold at full opacity. `gm-d-tag` ends visible with no fly-away. In `gm-b-exit`, only the butterfly svg leaves and the hanging tag stays. Seeds and the butterfly flight keep their current 4.6s timing.
- `tree3d/PlantSprout.tsx`: confirm the fade-out also fades its child name tag. If it doesn't, add an opacity fade on the Html wrapper.
- Low-power tiers keep their lower `cap`.
- Update the comments, `components/landing/AGENTS.md` and tree-quality tests (plant caps, every plant named). Then check in the browser at 1280px and 390px that 3–4 names show at once and that no plant is left without a name.
- Not published.
