

## Fix All Brand Logos to Use Real Company Logos

### Problem

Several brands display incorrect or generic logos because they use unreliable image sources:
- **`img.logo.dev` brands** (return random/generic icons): Whole Foods, Aldi, Postmates, Panera Bread, Subway
- **`companieslogo.com` broken URLs**: Grubhub, Instacart, Chipotle, and potentially others with outdated hashes

### Solution

Replace all logo URLs with ones from `logo.clearbit.com`, which is a reliable, well-maintained company logo API that returns the actual official logo for any company domain. The format is simple: `https://logo.clearbit.com/{company-domain}`.

### Changes

**File: `src/data/brandLogos.ts`**

Every brand's `logo` URL will be updated to use `logo.clearbit.com`:

| Brand | Current Source | New URL |
|-------|---------------|---------|
| DoorDash | companieslogo.com | `https://logo.clearbit.com/doordash.com` |
| Walmart | companieslogo.com | `https://logo.clearbit.com/walmart.com` |
| Uber | companieslogo.com | `https://logo.clearbit.com/ubereats.com` |
| Amazon | companieslogo.com | `https://logo.clearbit.com/amazon.com` |
| Target | companieslogo.com | `https://logo.clearbit.com/target.com` |
| Starbucks | companieslogo.com | `https://logo.clearbit.com/starbucks.com` |
| Kroger | companieslogo.com | `https://logo.clearbit.com/kroger.com` |
| Whole Foods | img.logo.dev | `https://logo.clearbit.com/wholefoodsmarket.com` |
| Costco | companieslogo.com | `https://logo.clearbit.com/costco.com` |
| Safeway | companieslogo.com | `https://logo.clearbit.com/safeway.com` |
| Publix | companieslogo.com | `https://logo.clearbit.com/publix.com` |
| Aldi | img.logo.dev | `https://logo.clearbit.com/aldi.us` |
| Grubhub | companieslogo.com | `https://logo.clearbit.com/grubhub.com` |
| Instacart | companieslogo.com | `https://logo.clearbit.com/instacart.com` |
| Postmates | img.logo.dev | `https://logo.clearbit.com/postmates.com` |
| Best Buy | companieslogo.com | `https://logo.clearbit.com/bestbuy.com` |
| Home Depot | companieslogo.com | `https://logo.clearbit.com/homedepot.com` |
| Lowe's | companieslogo.com | `https://logo.clearbit.com/lowes.com` |
| CVS | companieslogo.com | `https://logo.clearbit.com/cvs.com` |
| Walgreens | companieslogo.com | `https://logo.clearbit.com/walgreens.com` |
| Rite Aid | companieslogo.com | `https://logo.clearbit.com/riteaid.com` |
| Dunkin' | companieslogo.com | `https://logo.clearbit.com/dunkindonuts.com` |
| Chipotle | companieslogo.com | `https://logo.clearbit.com/chipotle.com` |
| Panera Bread | img.logo.dev | `https://logo.clearbit.com/panerabread.com` |
| Subway | img.logo.dev | `https://logo.clearbit.com/subway.com` |
| McDonald's | companieslogo.com | `https://logo.clearbit.com/mcdonalds.com` |
| Wendy's | companieslogo.com | `https://logo.clearbit.com/wendys.com` |

This is a single-file change updating all 27 logo URLs to a consistent, reliable source that serves real official company logos. The existing fallback mechanism in `BrandSelectorModal.tsx` (which shows a colored initial if an image fails to load) remains as a safety net.

