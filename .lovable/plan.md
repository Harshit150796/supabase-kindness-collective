

## Fix: Replace Broken Clearbit Brand Logos

### Problem
All brand logos across the site use `logo.clearbit.com` URLs, which no longer work (Clearbit deprecated their free Logo API). This affects:
- LiveActivityBar ("Powered by" section)
- BrandLeaderboard (chart and donor cards)
- DonationFlow (brand selection grid)
- BrandSelectorModal (brand picker dialog)

This is NOT caused by our recent featured story changes -- it's an external service shutdown.

### Solution
Update `src/data/brandLogos.ts` to use a working logo source. Two reliable options:

**Option chosen: Google's favicon service + brand initial fallback**
- Primary: `https://www.google.com/s2/favicons?domain=DOMAIN&sz=128` (reliable, free, no API key)
- These return high-quality favicons at 128px which work well for small brand circles

### File Changed
**`src/data/brandLogos.ts`** -- Replace all `logo.clearbit.com` URLs with Google favicon URLs:

```
logo: 'https://logo.clearbit.com/doordash.com'
```
becomes:
```
logo: 'https://www.google.com/s2/favicons?domain=doordash.com&sz=128'
```

Applied to all 24 brands in the file. No other files need changes since they all read from this single data source.

### Why This Is Safe
- Single file change (`brandLogos.ts`) -- the centralized data source
- No component logic changes
- No database changes
- All consumers (LiveActivityBar, BrandLeaderboard, DonationFlow, BrandSelectorModal) automatically pick up the new URLs
- Google's favicon service is stable and widely used

