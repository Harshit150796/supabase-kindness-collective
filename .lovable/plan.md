

User wants 13 interactive features across 4 categories. This is a large but cohesive scope — all touch the same Tree3DScene + CouponFruit subsystems. I'll group them by system and implement in one coordinated pass.

## Interactive Tree v5 — Full Feature Plan

### Architecture overview

Add a shared **`InteractionContext`** (React context) inside the Canvas to coordinate cross-feature state: time-of-day, wind intensity, parallax boost, shake events, ripple events, etc. Add raycast-based hit zones on trunk / canopy / sky / root / ground using transparent invisible meshes (so clicks register reliably without depending on GLB mesh names).

---

### A. Camera & Viewing

**A1+A3. Click-drag orbit + horizontal pan** — replace `CameraParallax` with `<OrbitControls>` from drei, configured:
- `enablePan: false`, `enableZoom: true` (handles A2)
- `minPolarAngle: π/3`, `maxPolarAngle: π/2.1` (limit vertical tilt)
- `minAzimuthAngle: -π/2`, `maxAzimuthAngle: π/2` (left-to-right rotation, no full spin)
- `enableDamping: true`, `dampingFactor: 0.08`
- `target: (0, 3.4, 0)`
- Auto-return: track `lastInteractionTime`; after 3s idle, lerp `azimuthAngle` back to 0 over 1.2s with easing
- Subtle mouse-move parallax preserved as overlay when not actively dragging

**A2. Scroll zoom + double-click reset** — OrbitControls zoom with `minDistance: 9`, `maxDistance: 17` (≈0.7×–1.3×). Custom double-click handler on canvas → animate camera back to `(0, 4, 13)` over 0.6s.

**A4. Click-and-hold parallax boost** — `onPointerDown`/`onPointerUp` on canvas wrapper toggles `boostFactor` from 1 → 2.5; mouse parallax multiplied while held; smoothed with lerp. Disabled while OrbitControls is actively dragging (check `controls.current.state`).

---

### B. Direct Tree Interaction

**B1. Click trunk → shake + cascade drop**
- Add invisible cylinder mesh at trunk position (radius 0.5, height 4) with `onClick` handler
- On click: dispatch `shakeEvent` to context with timestamp
- `Tree.tsx` reads shake event in `useFrame`: applies decaying sine wobble to root group rotation `(sin(t*18) * 0.04 * exp(-t*2.5))` for 1.2s
- All `CouponFruit` components in `hanging` state read shake event: 3–5 random ones immediately transition to `falling` with staggered 100ms delays
- Haptic: trigger short toast "🌳 Shake!" + screen-shake CSS class on canvas wrapper

---

### D. Discovery / Storytelling

**D1. Click coupon → recipient story side panel**
- `CouponFruit` already has `onPointerDown` capability — add click handler on the mesh (only when `phase === 'hanging'` or `'landed'`)
- Opens a `<Sheet side="right">` (shadcn) overlaid on the hero
- Panel content: donor name, amount, brand, generated "story" snippet (use existing `useFallingDonations` data + a deterministic story template by donation ID), "Read more stories →" CTA linking to `/stories`
- New file: `src/components/landing/tree3d/RecipientStoryPanel.tsx`

**D2. Click root area → transparency breakdown**
- Invisible disc mesh at ground level (radius 1.5) around trunk base, `onClick` handler
- Opens floating glassmorphism card anchored to bottom of hero with the 95/3/2 breakdown (reuse colors from `mem://style/transparency-breakdown-colors`: emerald 95%, amber 3%, sky 2%)
- Animated bars fill on open; "View full transparency report" CTA → `/about`
- New file: `src/components/landing/tree3d/TransparencyPopover.tsx`

**D3. Click sky → day/night toggle**
- Invisible large back-plane at z=-15 with `onClick`
- Toggles `timeOfDay` in context: `'day' | 'sunset' | 'night'` (cycles)
- `Sky.tsx` interpolates `topColor`/`midColor`/`bottomColor` shader uniforms over 1.5s:
  - day: current blue palette
  - sunset: `#FF8E5C` → `#FFD89E` → `#5B7BB5`
  - night: `#0A1530` → `#1F2C5C` → `#3A4A7E`
- Directional light color/intensity lerps to match (sunset: warm orange dim, night: cool blue dim)
- Fog color lerps to match horizon
- **Fireflies**: at night, instanced 40 small emissive spheres flicker around canopy with random orbital paths, additive blending, bloom-friendly

---

### E. Ambient / Delight

**E1. Cursor velocity → wind intensity**
- Track `mouseVelocity` in context: `sqrt(dx² + dy²) / dt`, smoothed
- `Tree.tsx` leaf shader already reads `uTime` for sway — extend with `uWindIntensity` uniform; sway amplitude = `0.05 + uWindIntensity * 0.15`
- Decays back to baseline over 0.8s

**E2. Click anywhere on canvas → light ripple up trunk**
- On any unhandled canvas click, spawn `RippleEvent { startTime, originX, originY }`
- Render via shader on a tall thin plane aligned with trunk: vertical gradient mask animated upward over 1.0s, additive gold (`#FFD56A`) glow
- Multiple ripples can stack
- New file: `src/components/landing/tree3d/TrunkRipple.tsx`

**E3. Click coupon mid-fall → catch!**
- `CouponFruit` already has falling-state handler — add `onPointerDown` during `falling` phase
- On click: pause fall (zero velocity), play sparkle particle burst at coupon position (10 instanced gold points expanding outward, fade over 0.6s)
- Toast: "✨ You caught one! +$X impact recorded"
- Coupon then continues to `landed` state at current position

**E4. Hold click on canopy → bird flies out**
- Invisible sphere mesh enclosing canopy area (radius 2.8, center `(0, 4.4, 0)`), `onPointerDown`/`onPointerUp` for hold detection (>500ms)
- On trigger: spawn small bird sprite (instanced quad with bird silhouette texture, generated procedurally on canvas — simple V-shape wings)
- Animates along bezier path from canopy → arc upward → off-screen over 2s with wing-flap shader (vertical scale oscillation)
- 5s cooldown to prevent spam

**E5. Cursor near trunk → squirrel peek (easter egg)**
- Track cursor proximity to trunk's screen-space projection
- When within 80px of trunk for >1s: small squirrel sprite (procedural canvas: brown blob with tail) peeks from behind trunk at y=1.5
- Fades in over 0.4s, holds 2s, fades out
- 30s cooldown; only triggers if user hasn't interacted recently

---

### Implementation order (single pass)

1. Create `InteractionContext` with all shared state (timeOfDay, windIntensity, shakeEvent, rippleEvents, parallaxBoost, mouseVelocity)
2. Replace `CameraParallax` → `OrbitControls` + custom auto-return + zoom-reset hook (A1, A2, A3, A4)
3. Add invisible hit-zone meshes (trunk cylinder, root disc, canopy sphere, sky plane) inside `Scene`
4. Wire shake handler in `Tree.tsx` + cascade trigger in coupon state machine (B1)
5. Build `RecipientStoryPanel` Sheet + wire coupon click (D1)
6. Build `TransparencyPopover` + wire root click (D2)
7. Extend `Sky.tsx` with palette interpolation + add `Fireflies` component; wire sky click (D3)
8. Extend leaf shader uniform `uWindIntensity` + cursor velocity tracker (E1)
9. Build `TrunkRipple` shader plane + wire global click handler (E2)
10. Add catch handler to `CouponFruit` falling phase + sparkle particles (E3)
11. Build `Bird` flying component + canopy hold detector (E4)
12. Build `Squirrel` peek component + proximity tracker (E5)

### Files changed/created

**New:**
- `src/components/landing/tree3d/InteractionContext.tsx`
- `src/components/landing/tree3d/HitZones.tsx` (invisible click meshes)
- `src/components/landing/tree3d/RecipientStoryPanel.tsx`
- `src/components/landing/tree3d/TransparencyPopover.tsx`
- `src/components/landing/tree3d/Fireflies.tsx`
- `src/components/landing/tree3d/TrunkRipple.tsx`
- `src/components/landing/tree3d/SparkleBurst.tsx`
- `src/components/landing/tree3d/Bird.tsx`
- `src/components/landing/tree3d/Squirrel.tsx`

**Modified:**
- `src/components/landing/Tree3DScene.tsx` — OrbitControls, context provider, hit zones, day/night lighting interp, panel/popover overlays
- `src/components/landing/tree3d/Tree.tsx` — shake wobble, wind intensity uniform
- `src/components/landing/tree3d/CouponFruit.tsx` — click→fall, click→story panel, catch handler, sparkle
- `src/components/landing/tree3d/Sky.tsx` — palette interpolation uniforms

### Honest caveats

- 13 features = ~600 lines of new code. Will land in one large commit; expect 1–2 follow-up tweaks for feel/timing after you test.
- OrbitControls + custom mouse-parallax can fight each other. I'll gate parallax to only apply when controls are idle (>200ms since last drag).
- Squirrel & bird are procedural canvas sprites (not 3D models) — stylized, not photoreal. Matches existing coupon-design approach.
- Day/night toggle changes scene mood significantly; the existing tree GLB textures are baked for daylight, so night will look stylized-cool, not photoreal-night. Acceptable tradeoff.
- Performance: fireflies (40), bird (1), squirrel (1), ripples (max 5), sparkles (max 20 particles each) — all instanced or pooled, mobile-safe.
- Mobile: OrbitControls works with touch; hold-detection uses `onPointerDown`+timer (touch-compatible). Squirrel proximity disabled on touch (no hover concept).

