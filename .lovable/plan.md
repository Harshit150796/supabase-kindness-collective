

## Update Logo Text Colors to Match the Logo Icon

The current text uses muted olive green (`#7a9e4e`) and steel blue (`#4a6fa5`). The logo icon itself uses richer, deeper shades -- a forest green for the upper arc and a navy blue for the lower arc.

### New Colors

- "Coupon": Deep forest green (`#2e7d32`) -- matches the green arc in the logo
- "Donation": Navy blue (`#1565c0`) -- matches the blue arc in the logo

### Files Modified

| File | Change |
|------|--------|
| `src/components/layout/Navbar.tsx` | Change `#7a9e4e` to `#2e7d32` and `#4a6fa5` to `#1565c0` |
| `src/components/layout/Footer.tsx` | Same color updates for consistency |

Both files already have the two-span structure in place, so this is just swapping the hex values (4 replacements total).

