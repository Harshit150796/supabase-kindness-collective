# Make "Fundraisers open now" appear faster on the homepage

## Why it's slow (from the code)
1. The section only starts asking for fundraisers once its code has loaded and it has scrolled near the screen, so visitors stare at grey placeholders.
2. It fetches up to 300 fundraisers including each one's full story text, then waits for a second request for live totals before showing anything.
3. The team lineup is a third request on top.

## Changes
1. **Start loading earlier:** begin fetching the fundraisers as soon as the homepage opens (in parallel with the top of the page), so the data is ready by the time the visitor scrolls there.
2. **Ask for less:** drop the full story text from the homepage list (cards only show a short preview, cut to ~200 characters on the server side via a lighter column set), keeping the 300-campaign ranking pool so order doesn't change.
3. **Show sooner:** keep cached results for a few minutes so returning to the homepage shows cards instantly.
4. Measure before/after in the browser (time from page open to first card) on phone and laptop sizes, and check real-visitor speed data for the homepage.

Nothing about which fundraisers show, their order, labels, or layout changes. No database change. Not published.

## Technical details
- `useFundraisers`: remove `story` from the homepage select (or add a `fields: 'card'` option); verify FundraiserCard/Mosaic don't need it, otherwise fetch a truncated excerpt.
- `Index.tsx`: `queryClient.prefetchQuery` for the `['fundraisers','active',...]` key and the homepage lineup on mount.
- Set `staleTime` (~5 min) on both queries.
