Change the Top Donors panel to show only 3 entries instead of 5.

## Changes
- `src/hooks/useTopDonors.ts`: set `TARGET_COUNT = 3` so both the placeholder seed and the real+padded merge cap at 3.
- `src/lib/placeholderDonors.ts`: default `count` param to 3 (matches new target; keeps at-least-one Anonymous logic intact).
- `src/components/landing/hero/TopDonorsPanel.tsx`: no logic change needed — it renders whatever the hook returns. Existing `RANK_STYLES` already covers 3 ranks (gold/silver/bronze).

## Result
Panel shows top 3 donors this week. Real donors take priority; remaining slots filled by the daily-rotating placeholder pool with at least one "Anonymous".