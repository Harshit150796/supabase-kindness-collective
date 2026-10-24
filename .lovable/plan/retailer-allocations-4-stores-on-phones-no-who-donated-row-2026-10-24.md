# Retailer allocations: 4 stores on phones, no "who donated" row

## Changes (homepage, "Retailer allocations" chart)
1. **Phones show the top 4 stores.** On small screens (under 640px wide) the chart shows only the 4 largest retailers, so logos and amounts stop overlapping. Tablets and laptops keep showing 6.
2. **Remove the rotating donor row.** The strip under the chart that cycles through "Name donated $X to Store · time ago" is deleted completely, along with the lookup of recent donors that only it used.

Nothing else changes: totals, colours, the chart itself and the rest of the homepage stay the same. Nothing published.

## Technical details
- `src/components/landing/BrandLeaderboard.tsx`: slice `stats.brands` to 4 when `useIsMobile`-style `matchMedia('(max-width: 639px)')` matches, else 6. Delete the `get_recent_public_donations` fetch, `recent`/`donationIndex` state, the rotation interval, `DonationAvatar`, `timeAgo`/`shortDate`, `firstRecognizedBrand` and unused `Clock`/`Heart` imports, plus the `latestDonation` block.
- Verify at 390px and 1280px widths in the test browser.
