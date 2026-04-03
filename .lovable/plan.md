

## Make Branches Look Like Real Wood & Visually Connect to Left Hero Image

### Problem
The current branches are thin, barely visible SVG strokes (1.5-3px, 0.15-0.3 opacity) that look like abstract lines, not real wood. They don't visually originate from the left hero image and are nearly invisible. The user wants thick, realistic wooden branches that clearly emerge from the left "crumbling earth" image and cascade down the page.

### Vision alignment
The left hero image represents **broken, corrupt donation systems** -- the brown branches extending from it symbolize the **decay, rot, and withering** of these old systems. They should look like real dried, cracked wood -- not subtle decorative lines.

### Plan

**Rewrite `src/components/landing/AnimatedBranchesLeft.tsx`** with a completely new SVG design:

1. **Origin point**: Branches start from coordinates matching the bottom-center of the left hero image (~25% from left on desktop), creating visual continuity -- as if growing out of the crumbling earth artwork

2. **Realistic wood appearance**:
   - Main trunk: 8-12px stroke width with `stroke-linecap: round` and `stroke-linejoin: round`
   - Use **dual-stroke technique**: a darker outer stroke (6-10px, `#4A2C0A`) with a lighter inner stroke (3-6px, `#8B6914`) layered on top to simulate bark texture and wood grain
   - Add knots/bumps using small filled circles at branch junction points
   - Opacity increased to 0.4-0.7 for visibility

3. **Branch structure** (8-10 paths total):
   - One thick main trunk flowing downward along the left ~15% of the page
   - 3-4 medium secondary branches curving inward (reaching to ~30% page width)
   - 3-4 thin twigs and offshoots with dead leaf clusters at tips
   - 1-2 drooping "hanging" branches for depth
   - All paths use organic cubic bezier curves with irregularity (no straight lines)

4. **Brown color palette** matched to the hero image:
   - Deep bark: `#4A2C0A`, `#3E2106`
   - Mid brown: `#6B4423`, `#5C4033`
   - Light wood: `#8B6914`, `#A0522D`
   - Dry leaf accents: `#8B7355`

5. **Dead leaf clusters**: Small SVG leaf shapes (not circles) at branch tips using `<path>` for curled, dried leaf silhouettes

6. **Animations** (keep existing CSS keyframes):
   - `vine-grow` stroke-dash animation for growth effect
   - `sway-gentle` / `sway-slow` for lifelike movement
   - Staggered delays so branches grow sequentially from top to bottom
   - Increased opacity in `vine-leaf-appear` to 0.3-0.5

7. **Visibility**: The branches must be clearly visible -- the current near-invisible approach is abandoned. They're a storytelling element, not subtle decoration. Still use `pointer-events: none` so text remains clickable.

### Files changed
- `src/components/landing/AnimatedBranchesLeft.tsx` -- Complete rewrite with realistic wood branches

