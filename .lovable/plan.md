# Optimize hero-tree logo loading and opening arrangement

## Goal
Make every logo fruit appear complete and correctly proportioned on the first visible frame, then present a deliberate front-facing group led by CVS, McDonald’s, Instacart, Amazon, Walmart, and Target without changing the protected tree scene.

## Confirmed current issues
- All 27 SVGs begin decoding at module initialization, but the tree renders immediately. While a logo is still decoding, its texture uses a generic wide wordmark fallback with a fixed 1024×420 shape. Emblems can therefore appear temporarily short, stretched, or visually wrong before the real SVG replaces them.
- Instacart is initially assigned to slot 4. That slot is invalid because its one-item rear band calculates `0 / 0`, producing a `NaN` position; the Instacart fruit can therefore disappear or render unpredictably.
- The current Instacart SVG is a small 21×24 two-part symbol rather than a complete, recognizable carrot treatment.
- The opening brand order is deterministic, but Instacart is not in a valid front slot. Walmart, CVS, Target, McDonald’s, and Amazon already occupy front-facing slots across the lower, middle, and upper canopy.

## Implementation

### 1. Make logo readiness deterministic
- Convert the existing logo cache into a shared preload contract that exposes when each local SVG has decoded, been alpha-cropped, and had its final aspect and coverage measured.
- Start all 27 local loads once, as today, but do not mount logo-fruit meshes until the required opening set is ready. The tree, sky, and ambient scene may render while logos prepare.
- Reveal the complete opening logo set together on the first ready frame, avoiding a sequence of temporary wordmarks or geometry changes.
- Keep a per-brand fallback for genuine asset failure, but size that fallback from the brand profile rather than the current generic wide rectangle. A failed asset must remain recognizable and must never produce a blank mesh.
- Preserve the existing shared texture path, 1024px long-edge rasterization, alpha crop, original colours, mipmaps, anisotropy, SRGB handling, and reuse across hanging, falling, landed, and regrowing states.

### 2. Repair and validate every local mark
- Replace only the incomplete Instacart artwork with a complete, authentic, original-colour carrot emblem stored locally; preserve its aspect ratio and include the full orange carrot body and green leaves.
- Validate all 27 SVGs for successful decode, non-empty alpha bounds, finite dimensions, and reasonable final aspect ratios.
- Keep every company’s original logo colours and proportions. Do not recolour Uber or Amazon, flatten eBay, stretch wordmarks, or add plaques, boards, threads, or backgrounds.
- Retain brand-specific optical sizing, refining only profiles that remain visibly too short or disproportionate after deterministic loading.

### 3. Fix slot generation and curate the opening view
- Fix the single-rear-slot division-by-zero in the deterministic canopy layout so every one of the 18 positions is finite and stable.
- Keep the same 18-slot count, three height bands, full-orbit coverage, branch-relative attachment, face offsets, depth behavior, sway, and fall/regrowth lifecycle.
- Reassign the initial brand order so these six are guaranteed valid front positions: Walmart and CVS on the lower band; Target, McDonald’s, and Instacart across the middle band; Amazon on the upper band.
- Use the remaining front positions for a balanced mix of compact emblems and readable wordmarks, placing wider marks in more separated slots and moving lower-priority marks to valid side/rear slots.
- Preserve the non-repeating replacement queue so omitted brands still enter after fruits fall and no duplicate brand hangs simultaneously.

### 4. Prevent regressions
- Keep geometry dimensions tied to the final cached logo measurements, so texture and plane proportions cannot drift apart.
- Ensure a replacement brand is ready before regrowth starts; if it is not, hold the slot at zero scale until its valid logo or fallback is ready.
- Add development diagnostics for logo readiness, failed slugs, finite slot coordinates, and the opening brand order without adding runtime network requests.

## Protected scope
- Do not change tree geometry or model, leaf materials, lighting, exposure, tone mapping, environment, fog, Sky, camera, FOV, orbit behavior, colours, hero copy, page layout, fruit count, fall physics, or donation behavior.
- Do not add packages or external runtime requests.

## Verification
- Load from a cold cache and capture early and settled frames at 390px and 1440px; confirm there are no temporary short/stretched wordmarks, blanks, or late logo swaps.
- Confirm all 27 local SVG requests succeed and each cached result has finite, non-zero dimensions and alpha bounds.
- Capture the opening view and verify CVS, McDonald’s, full-carrot Instacart, Amazon, Walmart, and Target are complete, readable, front-facing, spread across canopy heights, and not severely overlapping.
- Rotate through front, side, and rear views to confirm all 18 slots are valid and attached naturally to the canopy.
- Trigger falling and regrowth; confirm the same complete artwork persists while falling and a different preloaded brand regrows without flashing a fallback.
- Check desktop and mobile console/runtime errors, horizontal overflow, current build status, and representative frame rate. If automated WebGL capture remains unavailable, report that limitation rather than claiming visual proof.
