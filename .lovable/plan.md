# Fundraiser Card Redesign — Trust-Anchored

Redesign the fundraiser/help-request cards to feel credible, human, and clearly not a scam. Applies to both the landing page (`ImpactStories`) and the `/stories` page (`FundraiserCard`).

## Problems today
- Location shown as raw `ca` / `us` — vague.
- `Food Support` category tag competes with `Active` badge, both sitting on the image.
- "Active Campaign" appears twice (image badge + button below).
- No verification signal, no social proof, feels generic.

## What changes

### `src/components/stories/FundraiserCard.tsx` (primary card component)
Rebuild layout to match selected direction:

1. **Image area** — clean image, only two floating chips:
   - Top-left: white/blur pill with pulsing green dot + `LIVE CAMPAIGN` (only when `status === 'active'`).
   - Top-right: circular white/blur badge with emerald shield-check icon, `title="Verified Recipient"`.
   - Remove the hover "Support Now" pill on the image (moved to footer button).

2. **Meta row** (below image):
   - Left: emerald pill `Food Support` (category label, dynamic via existing `categoryLabels` map).
   - Right: slate pill with map-pin icon + **full country name** (see helper below).

3. **Title + excerpt** — larger title (`text-xl font-bold`), 2-line clamp excerpt.

4. **Funding block**:
   - Left: `$40.00` big black number, `raised of $500 target` subtitle.
   - Right: amber chip `8% Funded` (Warm Gold accent).
   - Progress bar: taller (`h-3`), emerald fill with subtle glow shadow.

5. **Footer row**:
   - Left: stacked donor avatar circles (show up to 3, with `+N` overflow when `donors_count > 3`) + `N Kind Donors`.
   - Right: emerald `Support →` button (links to same fundraiser detail page via the wrapping `<Link>`).

### Country name helper
Add a small `countryName(code)` util (inline in the card or `src/lib/utils.ts`) that maps common ISO codes to full names:
```
us → United States, ca → Canada, gb → United Kingdom, in → India,
au → Australia, de → Germany, fr → France, ...
```
Fallback: if unknown, uppercase the code. If `country` is null, hide the location chip entirely.

### `src/components/landing/ImpactStories.tsx`
Currently renders its own inline card markup. Refactor to render `<FundraiserCard />` for real fundraisers so the new design shows on the landing page too. Keep mock/success stories using the existing inline card (or a simple sibling variant), since they don't share the fundraiser data model.

Alternative (simpler): update the inline card markup in `ImpactStories.tsx` to mirror the same visual language (remove duplicate active badge, full country name, verified icon, gold chip). Pick whichever keeps the diff smallest — likely refactor to use `<FundraiserCard />` and drop the mock stories from this section entirely (fundraisers already fill 8 slots with `limit: 8`).

## Design tokens
- Primary emerald: `#10b981` (existing).
- Gold accent: `#f59e0b` (existing).
- Card: `rounded-2xl`, `shadow-xl` on hover with emerald tint.
- Uses existing `bg-card`, `text-foreground`, `border-border` semantic tokens — hex values only where the selected direction uses them for accent chips.

## Out of scope
- No data model changes.
- No new API fields.
- Verified badge shown for all active fundraisers (no per-record verification flag yet — can be wired later).
- Donor avatars are placeholder circles (no real avatar data on card yet).
