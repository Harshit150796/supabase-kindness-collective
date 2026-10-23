# Round-2 intro and photo corrections — October 9

- Restored six HTML wrappers with static SVG line shapes: trunk at .55s; branches at .9/.97/1.02s; twigs at 1.12/1.16s. Only wrapper transform and opacity animate. Original endpoints, stroke widths and uniform frame scaling are preserved.
- First-HTML opening totals 6,078 bytes, within the existing 6,200-byte test budget.
- Chromium screenshots at frozen animation times 1,200ms and 2,200ms, at 1440×900 and 390×664, show the trunk and branches; all six wrappers have nonzero opacity at 1,200ms and full opacity at 2,200ms. Main application loading was excluded for these deterministic first-HTML captures. Physical-device Safari busy-thread behavior was not reverified in this pass.
- Both Supabase image helpers now request proportional `resize=contain`, without a height. Card CSS framing is unchanged.
- Real public fundraiser image verified on `/stories` and homepage at 390px: original 648×405; transformed response 400×250, HTTP 200. Identical 1.6 aspect ratio, no delivery crop. Each card was compared against the same original URL in the same container; framing matches, with expected compression differences.
- Browser page errors: none. Screenshots and measured data are under `/tmp/browser/round2/`.
- Tests: 37 existing/new Deno tests plus 3 photo delivery tests using Bun, all passing. Automatic preview build: OK.
- Live 3D tree, cookie bar, retailer rail and existing full-motion behavior untouched. No publishing.