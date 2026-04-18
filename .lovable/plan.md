
The user wants to:
1. Remove the current hero section's 3 elements: left "Old Way" image+pills, center CentralTree, right "CouponDonation Way" image+pills
2. Replace with a single big beautiful 3D animated tree on the RIGHT side of the page only
3. Tree bears fruits = coupons labeled (Transparent, Traceable, Secure, Reliable, Uber, Walmart, etc.)
4. Fruits fall to ground showing real donations ("X donated $Y")

Let me plan carefully. Need to inspect HeroSection to know exactly what to remove, and confirm we have donation data to drive the falling fruit feed.

Tech choice: react-three-fiber for true 3D. The skill notes versions: `@react-three/fiber@^8.18`, `@react-three/drei@^9.122.0`, `three@>=0.133`. This is the right stack.

## Replace Hero with a 3D Animated Tree of Coupons

### What's being removed
From `HeroSection.tsx`:
- Left column: "Old Way" earth-heart image + red pills (Opaque / Untraceable / Unreliable) + label
- Center column: `CentralTree` SVG + "We're changing this" text
- Right column: "CouponDonation Way" image + green pills + label
- The whole split-screen narrative + featured story card layout below

The hero becomes a single right-aligned 3D scene. Left side of hero stays clean (headline + subcopy + CTA buttons we'll add).

### New hero layout (desktop)
```text
┌─────────────────────────────────────────────────────────┐
│                          │                              │
│  Big headline            │                              │
│  Subcopy paragraph       │      🌳  3D TREE             │
│  [Donate Now] [Learn]    │      with hanging coupons    │
│                          │      gently swaying          │
│                          │                              │
│                          │  ░░░ ground ░░░              │
│                          │  "Sarah donated $25" 🍎     │
└─────────────────────────────────────────────────────────┘
```
On mobile: text on top, 3D scene below at reduced height.

### The 3D scene — `Tree3DScene.tsx`

**Stack:** `@react-three/fiber@^8.18`, `@react-three/drei@^9.122.0`, `three@^0.160`

**Scene composition:**
- `<Canvas camera={{ position: [0, 2, 8], fov: 45 }}>` with soft ambient + directional lighting + a warm rim light
- **Ground plane**: subtle radial-gradient texture, soft contact shadow via drei's `<ContactShadows />`
- **Tree trunk**: `CylinderGeometry` tapered, with a procedural bark material (brown `#5C3A1E` base + noise-based normal map from drei's `<MeshDistortMaterial>` lite, or a simple textured material). Slight bend for organic feel.
- **Branches**: 6–8 branches built procedurally as tapered cylinders rotated outward in a fibonacci-ish pattern, each branching once more into 2 sub-branches.
- **Foliage**: clusters of `IcosahedronGeometry` spheres (low-poly) with multiple emerald shades (`#059669`, `#10B981`, `#34D399`) bunched at branch tips. Subtle vertex displacement for organic shape.
- **Coupons (fruits)**: ~12–16 hanging coupon cards. Each is a thin `BoxGeometry` (1.2 × 0.7 × 0.05 units) with rounded corners, hung from branches by a thin line. Front face uses an HTML-rendered texture (drei's `<Html>` overlaid OR `CanvasTexture` drawn from a 2D canvas) showing:
  - Top row: badge "TRANSPARENT" / "TRACEABLE" / "SECURE" / "RELIABLE"
  - Bottom row: brand name "WALMART" / "UBER" / "TARGET" / "DOORDASH" / "KROGER" / "CHIPOTLE" etc., pulled from `src/data/brandLogos.ts`
  - Gold accent border, small coupon-shaped notches on the sides
- **Hanging string**: thin `<Line>` (drei) from branch tip to coupon top edge.

**Animations (frame-driven via `useFrame`):**
1. **Sway**: each coupon's group rotates `Math.sin(time * 0.6 + offset) * 0.08` rad — gentle wind effect.
2. **Foliage breathe**: foliage clusters scale `1 + sin(t*0.4)*0.02`.
3. **Camera idle**: `useFrame` adds a tiny `position.x += sin(t*0.2)*0.001` for parallax life.
4. **Coupon drop on donation event**: when a new donation arrives, pick a random coupon, animate it from hanging position → free-fall (gravity `-9.8 * dt`) with rotation, settling on ground with a tiny bounce (spring damping). After landing, a label appears beside it for ~5s, then it fades out and a fresh coupon "grows" back on the branch (scale 0 → 1 with spring).

**Falling-coupon labels:** When a coupon lands, render a drei `<Html transform>` div near it: `"Sarah M. donated $25"` styled with the brand color and a gold glow. Auto-remove after 5s.

### Donation data feed — `useFallingDonations.ts`

A new hook that:
1. Fetches the most recent 20 donations from Supabase: `select donor_name, amount, brand_allocations, created_at from donations where status = 'completed' order by created_at desc limit 20`.
2. Subscribes to Supabase Realtime on `donations` INSERT events for live updates.
3. Returns a queue. The 3D scene pops one every ~6–8 seconds and triggers a fruit drop animation, cycling through the queue. Anonymous donors show as "Anonymous".

### Coupon labels (deterministic + branded)

Coupon front face composed in a 512×320 `CanvasTexture`:
- Background: white card with rounded-rect mask, gold border, subtle inner shadow
- Top stripe: brand color (from `brandLogos.ts`) — e.g., Walmart blue `#0071CE`, Uber black, DoorDash red
- Brand name in bold
- Below: trait pill (Transparent / Traceable / Secure / Reliable) — assigned by deterministic hash of brand
- Small "$5" or "$10" denomination corner

Coupon mix (16 fruits): Walmart, Uber Eats, DoorDash, Target, Kroger, Chipotle, Starbucks, Whole Foods, CVS, Costco, McDonald's, Subway, Trader Joe's, Aldi, Publix, Safeway — covers all categories from `brandLogos.ts`.

### Performance & quality

- Single `<Canvas>` with `dpr={[1, 1.5]}`, `frameloop="demand"` switched to `"always"` only when in viewport (IntersectionObserver)
- Suspense fallback: skeleton matching tree silhouette
- `<PerformanceMonitor>` from drei to reduce DPR on weak devices
- Lazy-load the 3D scene with `React.lazy` so initial bundle isn't bloated
- Mobile: reduce coupon count to 8, simpler shadows, lower DPR
- `pointer-events-none` on the canvas wrapper so it doesn't block scroll on mobile; allow pointer on desktop for subtle orbit-on-hover (constrained 5° each axis)

### Files to create/edit

**New files:**
- `src/components/landing/Tree3DScene.tsx` — main R3F canvas + scene composition
- `src/components/landing/tree3d/Tree.tsx` — trunk + branches + foliage geometry
- `src/components/landing/tree3d/CouponFruit.tsx` — single coupon mesh with sway + drop animation, uses `CanvasTexture`
- `src/components/landing/tree3d/Ground.tsx` — ground plane + contact shadows
- `src/components/landing/tree3d/FallenCouponLabel.tsx` — `<Html>` label that appears beside landed coupons
- `src/components/landing/tree3d/couponDesign.ts` — `drawCouponTexture(brand, trait, amount)` returns CanvasTexture
- `src/hooks/useFallingDonations.ts` — fetches + subscribes to recent donations, exposes a "next donation" queue

**Edited files:**
- `src/components/landing/HeroSection.tsx` — strip out the entire split-screen + featured story; new layout: text column (headline, subcopy, CTAs) on left, `<Tree3DScene />` on right (md:grid-cols-2). Mobile stacks.
- `package.json` — add `@react-three/fiber@^8.18`, `@react-three/drei@^9.122.0`, `three@^0.160` (and `@types/three`)
- `src/components/landing/CentralTree.tsx` — DELETE (no longer used anywhere)
- `src/index.css` — remove now-unused vine/tree CSS keyframes (cleanup)

### Memory updates
- Update `mem://style/central-tree-of-life` → replace with `mem://features/hero-3d-coupon-tree` describing the new 3D tree + falling coupon donation feed
- Update `mem://features/hero-visual-narrative` → reflect new single-tree hero (no more split-screen Old/New comparison)
- Update `mem://index.md` to point to the new memory entries

### Open question (will assume defaults if not answered)
Defaults if no answer: keep the headline copy ("From Donations to Real Meals — Track Every Coupon") and keep the featured story card BELOW the hero in its own section so we don't lose that content.
