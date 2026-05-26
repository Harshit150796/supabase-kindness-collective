# Restore the tree's original look on mobile

Revert the mobile-only visual downgrades made in the recent perf pass to `Tree3DScene.tsx` and `Ground.tsx`. Keep the unrelated perf wins (Navbar/LiveActivityBar blur fix, favicon compression, DPR cap, idle-mount, paused-when-hidden, scroll touchAction).

## Changes

### `src/components/landing/Tree3DScene.tsx`
- Re-enable on mobile (remove the `!isMobile &&` guards):
  - `<Environment preset="forest" background={false} />` — restores the image-based lighting that made the tree feel lit and warm.
  - `<Fireflies />` — restores the canopy glow.
  - `<Bird />` and `<Squirrel />` — restores ambient life.
- Restore leaf density: `leafCount` mobile `2000 → 2800`.
- Restore plant cap: `plantCap` mobile `12 → 20`.

### `src/components/landing/tree3d/Ground.tsx`
- Restore pebble count mobile `10 → 22`.
- Restore `ContactShadows` resolution mobile `256 → 1024` (this also softens the shadow so it stops reading as a hard dark blob).
- Restore `circleGeometry` segments mobile `48 → 96`.
- (Optional kept) `isMobile` prop stays; values just match desktop.

### Not changed (keep current perf wins)
- DPR cap (1.5 mobile / 2 desktop).
- Idle-mount of canvas on mobile.
- Pause render loop when tab hidden.
- `touchAction: 'pan-y'` on hero wrapper.
- `Navbar` + `LiveActivityBar` mobile blur removal.
- Compressed `favicon-192.png`.
- Postprocessing import stays out (it was already disabled).

## Trade-off note
Bringing back `Environment` (HDRI), `Fireflies`, `Bird`, `Squirrel`, and full-res contact shadows on mobile will increase GPU/CPU cost on phones — which is what they were removed for. The user has explicitly accepted this in favor of preserving the look. The other perf fixes above remain so the page still loads and scrolls better than before the perf pass.
