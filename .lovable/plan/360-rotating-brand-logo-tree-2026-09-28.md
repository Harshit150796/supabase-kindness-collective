# 360° rotating brand-logo tree

## Goal
Make the logo fruits feel intentionally arranged around the whole tree, remain clear as the viewer circles it, allow unrestricted 360° horizontal rotation, and replace each fallen logo with a different brand from the existing collection.

## Experience
- Arrange a balanced visible set around the full canopy—front, sides, and back—using deterministic height bands and golden-angle spacing so logos do not form a crowded wall.
- Keep every existing brand in the collection. Show a curated subset at once for legibility, then cycle through the complete 27-brand pool as fruits fall and regrow.
- When a logo lands, regrow a different brand in that same canopy location. Use a shuffled rotation queue so the same few brands do not repeat and every brand appears before the cycle reshuffles.
- Keep the existing falling, catching, landing, donor-label, wind-sway, and plant-growth behavior.

## Readability while rotating
- Replace the current fixed frontward offset with a radial canopy offset, so each fruit belongs to its actual side of the tree.
- Make hanging and regrowing logos camera-aware: each silhouette turns smoothly around the tree’s vertical axis to present its correct front face to the viewer while retaining its individual pendulum tilt and wind sway.
- Preserve natural motion by combining camera-facing yaw with the existing small X/Z sway rather than locking every logo rigidly to the screen.
- Falling logos keep their physical tumble; they do not billboard during the fall. The same logo texture remains visible from both sides until landing.
- Keep transparent original-color SVG silhouettes, per-brand sizing, and the single shared WebGL rendering path. No boards, threads, plates, or replacement artwork.

## Full rotation
- Remove the current ±90° horizontal orbit limits so dragging can circle the tree continuously in either direction.
- Remove the three-second automatic return to the front, which currently pulls the view back after interaction.
- Preserve the existing vertical-angle limits, distance, field of view, zoom behavior, double-click reset, lighting, and all protected scene settings.
- Retain native page scrolling and existing mobile gesture safeguards; horizontal dragging rotates the tree view without adding wheel or touch interception.

## Technical details
- Separate each slot’s stable canopy position from its current brand index and animation phase.
- Use a deterministic, non-repeating brand queue for replacements; swap the slot’s brand when regrowth begins so the new silhouette scales into view.
- Use camera-relative yaw computed from each fruit’s world position, with frame-rate-independent smoothing and no per-frame React state updates.
- Keep stable slot keys so changing brands does not reset unrelated interaction state.
- Limit the simultaneous visible set to a balanced canopy density while retaining all 27 brands in the replacement pool.

## Verification
- Confirm continuous rotation passes the rear view and completes at least one full 360° orbit on desktop and mobile-sized viewports.
- Capture front, side, and rear views to confirm logos are distributed around the tree and face legibly toward the camera.
- Capture two sway frames to confirm camera-facing logos still move naturally.
- Trigger a fall and confirm the replacement is a different brand, then repeat enough times to verify queue rotation and no immediate repeats.
- Confirm a mid-fall logo remains the correct artwork and is not blank or stale.
- Check console, local asset requests, layout overflow, runtime errors, and the current preview build. If software WebGL blocks visual proof again, report that limitation plainly.
