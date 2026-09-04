# Remove the Live Activity bar under the hero

## Change

Remove the `<LiveActivityBar />` section from the home page (`src/pages/Index.tsx`), so the hero runs straight into the ImpactStories section. Nothing else changes — the component file stays in place untouched in case you want it later.

## Why

You've decided to drop the simulated live feed and the hardcoded stats rather than rebuild it right now. The progress-to-goal bar idea (fund 1,000 vouchers, 116/1,000) is a strong follow-up, but that's a separate step you can revisit after deciding the goal number and whether it promotes a specific fundraiser. For now: just take the bar out, leave everything else exactly as is.

## Technical notes

- Edit `src/pages/Index.tsx`: remove the `import { LiveActivityBar }` line and the `<LiveActivityBar />` usage. Keep the import ordering and the rest of the page structure intact.
- Leave `src/components/landing/LiveActivityBar.tsx` as-is — not deleted, not edited.
- No data, routing, or styling changes anywhere else.
