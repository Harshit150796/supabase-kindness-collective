

## Central Tree of Life -- Animated Visual Centerpiece

### Inspiration from the reference image

The reference shows a large, living tree at the center of the website where the two halves (old/broken and new/growth) merge. The tree acts as a unifying visual element with intertwining vines, stems, leaves, flowers, and organic textures wrapping around the entire hero and content area. It tells the story of transformation -- decay on the left becoming life on the right.

### What we'll build

A **central animated SVG tree** that sits between and connects the two hero images, with its root system and branches extending outward across the page. The left side of the tree shows brown/decaying branches (connecting to the existing `AnimatedBranchesLeft`), while the right side shows green, lively growth with leaves and small flowers.

### Architecture

**New component: `src/components/landing/CentralTree.tsx`**

A large SVG overlay positioned at the center of the hero section that renders:

1. **Central trunk** -- A thick, textured trunk rising from the bottom-center between the two hero images, using the dual-stroke bark technique. It splits into a Y-shape, with left branches going brown/dead and right branches going green/alive.

2. **Left side (decay)** -- Brown/dead branches extending toward the left hero image, visually merging with the existing `AnimatedBranchesLeft` system. Dry, leafless twigs with knots and bark texture. Colors: `#4A2C0A`, `#6B4423`, `#8B6914`.

3. **Right side (growth)** -- Green, lively branches extending toward the right hero image with:
   - Emerald stems (`#059669`, `#10B981`, `#34D399`)
   - Small animated leaf shapes that "unfurl" with a scale+rotate animation
   - Tiny flower/blossom accents in gold (`#D4A017`) at branch tips
   - Subtle vine tendrils curling at endpoints

4. **Intertwining vines** -- Two main vines (one brown, one green) that spiral around the central trunk like a DNA helix, representing the transition from old to new.

5. **Root system** -- Visible roots at the base spreading left (brown/dry) and right (green/alive), grounding the tree visually.

### Animations

All CSS-based for performance:

- **`tree-grow`** -- Trunk grows upward from base using stroke-dashoffset (2s)
- **`branch-spread`** -- Branches extend outward with staggered delays (1-3s after trunk)
- **`leaf-unfurl`** -- Leaves scale from 0 + rotate from -90deg to 0 (0.5s each, staggered)
- **`flower-bloom`** -- Small gold circles at tips scale in with a gentle bounce (0.6s)
- **`vine-spiral`** -- Intertwining vines draw along their paths (3-4s)
- **`breathe`** -- Subtle scale oscillation (1.00-1.02) on the green side, suggesting life
- Existing `sway-gentle` and `sway-slow` reused for branch movement

### Layout integration

- Replace the simple arrow between hero images with this central tree
- The tree sits in the `md:grid-cols-[1fr_auto_1fr]` center column, replacing the current arrow div
- On mobile (stacked layout), the tree renders as a vertical trunk between the two images with a downward arrow incorporated into the design
- The tree extends slightly beyond its column using `overflow-visible` to create visual overlap with both hero images

### SVG structure (simplified)

```text
              [Leaf] [Leaf]        [Leaf]
         [Flower]  \   |   / [Flower]
    Brown branches   \ | /   Green branches  
         ----         \|/         ----
              \    TRUNK    /
               \    ||    /
         Brown  \   ||   /  Green
         vine ~~~\  ||  /~~~ vine
                  \ || /
                   \||/
              ====ROOTS====
        dry roots ← → green roots
```

### Performance

- Pure SVG + CSS animations, no JS loops
- `pointer-events: none` on overlay
- `will-change: transform` on animated elements
- IntersectionObserver triggers growth only when visible
- Total SVG: ~50 paths, lightweight

### Files changed

- **`src/components/landing/CentralTree.tsx`** -- New component: the full animated tree SVG
- **`src/components/landing/AnimatedBranchesRight.tsx`** -- New component: green branches/vines cascading from right hero image down the right side of the page (mirrors AnimatedBranchesLeft but with emerald/green palette and live leaves)
- **`src/components/landing/HeroSection.tsx`** -- Replace center arrow div with `CentralTree` component; adjust grid layout to give center column more space
- **`src/pages/Index.tsx`** -- Add `AnimatedBranchesRight` to the relative wrapper alongside `AnimatedBranchesLeft`
- **`src/index.css`** -- Add new keyframes: `leaf-unfurl`, `flower-bloom`, `vine-spiral`, `breathe`

