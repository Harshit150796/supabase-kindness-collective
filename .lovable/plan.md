
## Goal

Match the GoFundMe reference: bigger, cleaner cards with the image as the hero, a single overlaid donation-count pill, minimal text below, and a category/state filter row above the grid. Fit 3-across on desktop, 2 on tablet, 1 on mobile.

## 1. Card redesign — `src/components/stories/FundraiserCard.tsx`

Strip the current card down to the GoFundMe anatomy:

```text
┌──────────────────────────────┐
│                              │
│         [image 4:3]          │
│                              │
│  ● 1.2K donations            │  ← pill, bottom-left, dark translucent
└──────────────────────────────┘
  Support Arabella's Healing…      ← bold serif-ish title, 2 lines max
  ▬▬▬▬▬▬▬▬▬▬▬▬░░░░░               ← thin 4px emerald bar, rounded
  $20,279 raised                    ← medium weight, no % chip, no goal
```

Remove:
- Live pill, verified badge overlay, category chip, location chip, story excerpt, avatar stack, "% Funded" chip, "Support" button, top-border divider, gradient shadows.

Keep/add:
- `AspectRatio 4/3`, rounded-2xl, `object-cover`, subtle `group-hover:scale-[1.02]` on image only (card itself does not lift — GoFundMe stays flat).
- Bottom-left overlay pill: `bg-black/70 text-white text-xs font-semibold px-2.5 py-1 rounded-full` showing `{formatDonorCount} donations` (1.2K style via `Intl.NumberFormat` compact).
- Below image, in `pt-3 space-y-2`:
  - `h3` — `font-bold text-[17px] leading-snug text-foreground line-clamp-2` (use the site's display font stack; no serif switch).
  - Progress bar — `h-1.5 bg-muted rounded-full` with emerald `#10b981` fill.
  - `$X,XXX raised` — `text-sm font-semibold text-foreground`.
- Whole card is a single `<Link>` to `/f/:slug` with a `focus-visible` ring for a11y. No hover lift; only image zoom.

Compact donation formatting helper (inline): `<1000 → "12 donations"`, `≥1000 → "1.2K donations"`, `≥1_000_000 → "1.2M donations"`.

## 2. Category + State filter row — new `src/components/stories/FundraiserFilterBar.tsx`

Shown above the grid on both `ImpactStories` (landing) and `/stories`.

- Horizontal scroll row (`overflow-x-auto`, snap-x on mobile) of pill buttons.
- Two dropdown chips on the left, then category pills:
  - **Category dropdown** — "All causes ▾" opens a popover with icons + labels: All, Food, Medical, Education, Travel, Housing, Utilities, Childcare, Emergency, Other. Uses `@/components/ui/popover` + `lucide-react` icons (`Utensils`, `Stethoscope`, `GraduationCap`, `Plane`, `Home`, `Zap`, `Baby`, `Siren`, `MoreHorizontal`).
  - **State dropdown** — "All states ▾" opens a popover with a search input + list of 50 US states. Selecting one filters by matching the fundraiser's ZIP → state (via existing `zipLookup`).
- Active pill: filled emerald with white text; inactive: `bg-muted text-foreground hover:bg-muted/70`.
- Emits `{ category, state }` up via `onChange`.

## 3. Grid + section — `ImpactStories.tsx` and `src/pages/Stories.tsx`

- Grid: `grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3`, `max-w-6xl mx-auto`.
- Landing: show 6 cards per page (2 rows of 3 on desktop), keep pagination dots.
- Add `FundraiserFilterBar` above the grid; filter `allStories` client-side before slicing.
- Section header row mirrors GoFundMe: left-aligned title chip ("Happening across the US ▾" as a subtle dropdown for a future scope tweak) + right-aligned prev/next arrows on desktop. Keep our existing eyebrow + heading above it; only restyle the controls row.
- Skeleton block updated to match new card height (~`h-[360px]`) and 3-col grid.

## 4. Category → state resolution

- Extend `src/lib/zipLookup.ts` with `useZipState(zip, country)` returning the 2-letter state code from the same cached zippopotam.us fetch (already returns state). No new network calls.
- Filter logic in `Stories.tsx` and `ImpactStories.tsx`:
  - `category === 'all' || fundraiser.category === category`
  - `state === 'all' || zipState(fundraiser.zip_code) === state`

## 5. Typography & color

- Keep app tokens; do NOT hardcode. Card title uses `font-bold text-foreground`; progress fill uses existing `bg-primary` (Deep Emerald) — no per-component hex.
- Donation pill uses `bg-foreground/85 text-background` so it flips correctly in dark mode.

## Technical Details

- Files created: `src/components/stories/FundraiserFilterBar.tsx`.
- Files modified: `src/components/stories/FundraiserCard.tsx`, `src/components/landing/ImpactStories.tsx`, `src/pages/Stories.tsx`, `src/lib/zipLookup.ts`.
- No schema changes, no new dependencies. Uses existing `@/components/ui/popover`, `@/components/ui/command`, `lucide-react`.
- All changes are frontend/presentation only.

## Out of Scope

- No new backend fields (uses existing `category`, `zip_code`, `country`, `donors_count`).
- No changes to fundraiser detail page.
- No new imagery generation.
