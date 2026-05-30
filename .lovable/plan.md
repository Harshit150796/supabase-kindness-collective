# Auto Time-of-Day Based on User's Local Time

Make the tree's sky (day / sunset / night) initialize from the visitor's local time, instead of always starting at `day`. Clicking the sky still cycles manually as it does today.

## Time bands (local time)

- `day`    — 06:00 – 16:59
- `sunset` — 17:00 – 19:59
- `night`  — 20:00 – 05:59

## Changes

**`src/components/landing/tree3d/InteractionContext.tsx`**
- Add a small helper `getTimeOfDayFromClock()` that reads `new Date().getHours()` and returns `'day' | 'sunset' | 'night'` using the bands above. Uses the browser's local timezone automatically — no extra config needed.
- Change `useState<TimeOfDay>('day')` to `useState<TimeOfDay>(getTimeOfDayFromClock)` so the initial sky matches the visitor's current time on first render.
- Optional (kept in plan, low cost): add a `setInterval` inside a `useEffect` that re-checks every 5 minutes and updates `timeOfDay` only if the user hasn't manually cycled it. To keep this simple and avoid fighting user clicks, we'll track a `userOverrodeRef` that flips to `true` the first time `cycleTimeOfDay` is called; the interval skips updates once overridden.

## Out of scope

- No changes to `Sky.tsx` palettes, click-to-cycle behavior, lightning, tree visuals, plants, coupons, or anything else.
- No server-side timezone detection — browser local time is sufficient and matches "the time they are using the website".
