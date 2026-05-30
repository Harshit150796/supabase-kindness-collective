## Remove ground critters (rabbits & squirrels)

The canvas-sprite rabbits/squirrels on the grass look flat and out of place. Remove them entirely.

### Changes

1. **`src/components/landing/Tree3DScene.tsx`** — remove the `<GroundCritters />` render and its import. Also remove the `<Squirrel />` (trunk-peek) render and its import, since the user wants squirrels gone completely.

2. **Delete files** (no longer referenced):
   - `src/components/landing/tree3d/GroundCritters.tsx`
   - `src/components/landing/tree3d/Squirrel.tsx`
   - `src/components/landing/tree3d/squirrelTexture.ts`

3. **Keep** `AmbientBirds`, `Bird`, fireflies, plants — only ground critters/squirrels are removed.

### Out of scope
No changes to birds, tree, sky, lighting, or any other scene element.
