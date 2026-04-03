

## Add Animated Brown Branches from Left Hero Image to "Where Your Money Goes"

### Concept

SVG-based animated brown vines, roots, and branches that originate from the bottom of the left hero image (the "old way" crumbling earth) and trail down the left side of the page. They stop just before the "Where Your Money Goes" headline in the TrustTransparency section. The vines represent decay and the broken donation system — brown, dry, withered branches that slowly sway and grow.

### Technical approach

**New component: `src/components/landing/AnimatedBranchesLeft.tsx`**

- A full-width, absolutely positioned SVG overlay rendered as a sibling layer in `Index.tsx`, spanning from the hero section down to the TrustTransparency section
- Uses `pointer-events: none` so all text and interactive elements remain fully clickable
- Low `z-index` (z-0) so content sits above it, but branches are visible in the background
- Uses CSS animations for gentle swaying motion (keyframes defined in `index.css`)

**SVG branch design:**
- 5-7 organic SVG `<path>` elements with cubic bezier curves simulating natural vine/root shapes
- Brown color palette: `#8B6914`, `#6B4423`, `#A0522D`, `#5C4033` (sienna, saddle brown tones)
- Thin stroke widths (1.5-3px) with `stroke-linecap: round` for organic feel
- Small leaf/twig offshoots branching from main stems
- `stroke-dasharray` + `stroke-dashoffset` animation to create a "growing" effect on page load
- Gentle CSS `transform` sway animations (2-4 degree rotation, 6-10s duration) for liveliness
- Varying opacity (0.15-0.35) so they don't compete with content

**Scroll-aware growth:**
- Uses `IntersectionObserver` or scroll position to trigger branch growth animations as user scrolls
- Branches "grow" progressively — upper ones animate first, lower ones follow with staggered delays

**Layout in `Index.tsx`:**
- Wrap hero through TrustTransparency in a `relative` container
- Place `AnimatedBranchesLeft` as an absolute overlay within this container
- Branches hug the left margin and occasionally curve inward slightly, never crossing center

### Animation details (added to `index.css`)
- `@keyframes vine-grow`: `stroke-dashoffset` from full length to 0 over 3-4s
- `@keyframes sway-gentle`: subtle rotation oscillation (±2-3deg) over 6-8s
- `@keyframes sway-slow`: slower, larger oscillation for main stems
- Each branch has different animation-delay and duration for natural variance

### Files changed
- **`src/components/landing/AnimatedBranchesLeft.tsx`** — New component with SVG branches
- **`src/pages/Index.tsx`** — Wrap relevant sections in relative container, add overlay
- **`src/index.css`** — Add vine-grow and sway keyframe animations

### Performance considerations
- Pure CSS animations (no JS animation loops)
- SVG paths are lightweight (few KB total)
- `will-change: transform` on animated elements for GPU acceleration
- `pointer-events: none` ensures zero interaction overhead

