# Fundraiser card: better location + tighter layout

## 1. Location as "City, ST"

The `fundraisers` table only stores `country` + `zip_code` (no city/state). To show "Syracuse, NY":

- Add `src/lib/zipLookup.ts` — a tiny hook `useZipLocation(zip, country)` that:
  - For US zips, calls `https://api.zippopotam.us/us/{zip}` via react-query with `staleTime: Infinity` + `localStorage` cache (so each unique zip is fetched once, ever).
  - Returns `{ city, stateCode }` → rendered as `"Syracuse, NY"`.
  - For non-US zips, returns just the zip.
- In `FundraiserCard.tsx`, replace the country chip with the resolved `"City, ST"` string. While loading, show the zip (or nothing) — no skeleton flash.
- Remove country display entirely (per your note: everyone is US right now, so "US" adds no value).
- `formatCountry` / `countryNames.ts` stays for future international use but isn't rendered on the card.

## 2. Shrink the card

Current card is oversized (h-[520px] skeleton, `p-6`, `text-xl` title, `text-2xl` amount, big Support button). Tightening pass in `FundraiserCard.tsx`:

| Element              | From                       | To                         |
| -------------------- | -------------------------- | -------------------------- |
| Image aspect         | 16 / 10                    | 16 / 9                     |
| Content padding      | `p-6 space-y-5`            | `p-4 space-y-3.5`          |
| Title                | `text-xl`                  | `text-base md:text-lg`     |
| Excerpt              | `text-[0.9375rem]` 2 lines | `text-sm` 2 lines          |
| Amount raised        | `text-2xl font-black`      | `text-lg font-extrabold`   |
| "% Funded" chip      | `text-sm`                  | `text-xs`                  |
| Progress bar         | `h-3`                      | `h-2`                      |
| Donor avatars        | `w-8 h-8`                  | `w-6 h-6`                  |
| Support button       | `py-2.5 px-5 text-sm`      | `py-2 px-4 text-xs`        |
| Category/loc chips   | `px-3 py-1 text-[11px]`    | `px-2 py-0.5 text-[10px]`  |
| Live Campaign pill   | `px-3 py-1.5`              | `px-2 py-1 text-[10px]`    |
| Verified badge       | `w-5 h-5` icon             | `w-4 h-4`                  |
| Card radius/shadow   | `rounded-3xl` big shadow   | `rounded-2xl` softer       |

Also update the skeleton in `ImpactStories.tsx` from `h-[520px]` → `h-[380px]` so loading state matches.

## 3. Files touched

- `src/lib/zipLookup.ts` (new)
- `src/components/stories/FundraiserCard.tsx`
- `src/components/landing/ImpactStories.tsx` (skeleton height only)

No DB, no backend, no other pages affected.
