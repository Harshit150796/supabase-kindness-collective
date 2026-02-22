

## Fix All Broken Brand Logos

### Problem
Out of 25 brands in the brand selector modal, approximately 13 have broken/missing logo images. The root cause:
- **Wikipedia SVG URLs** are blocked due to hotlinking restrictions (Whole Foods, Safeway, Publix, Aldi, Postmates, Rite Aid, Panera, Subway)
- **Some companieslogo.com URLs** have outdated hash values (Kroger, Costco)

### Solution
Update **one file** -- `src/data/brandLogos.ts` -- which is the single source of truth for all brand logos across the entire app (used in 10+ components including BrandSelectorModal, DonationFlow, BrandLeaderboard, BrandAllocationSliders, LiveActivityBar, DonationCouponsModal, ImpactDonationModal, etc.).

### Logo URL Updates

| Brand | Status | New Source |
|-------|--------|-----------|
| DoorDash | Working | Keep as-is |
| Walmart | Working | Keep as-is |
| Uber | Working | Keep as-is |
| Amazon | Working | Keep as-is |
| Target | Working | Keep as-is |
| Starbucks | Working | Keep as-is |
| **Kroger** | Broken (old hash) | Updated companieslogo.com URL |
| **Whole Foods** | Broken (Wikipedia) | img.logo.dev CDN |
| **Costco** | Broken (old hash) | Updated companieslogo.com URL |
| **Safeway** | Broken (Wikipedia) | companieslogo.com (newly found) |
| **Publix** | Broken (Wikipedia) | companieslogo.com (newly found) |
| **Aldi** | Broken (Wikipedia) | img.logo.dev CDN |
| Grubhub | Working | Keep as-is |
| Instacart | Working | Keep as-is |
| **Postmates** | Broken (Wikipedia) | img.logo.dev CDN |
| Best Buy | Working | Keep as-is |
| Home Depot | Working | Keep as-is |
| Lowe's | Working | Keep as-is |
| CVS | Working | Keep as-is |
| Walgreens | Working | Keep as-is |
| **Rite Aid** | Broken (Wikipedia) | companieslogo.com (newly found) |
| Dunkin' | Working | Keep as-is |
| Chipotle | Working | Keep as-is |
| **Panera** | Broken (Wikipedia) | img.logo.dev CDN |
| **Subway** | Broken (Wikipedia) | img.logo.dev CDN |
| McDonald's | Working | Keep as-is |
| Wendy's | Working | Keep as-is |

### Technical Details

**File: `src/data/brandLogos.ts`**

Update the `logo` property for 10 brands:

1. **Kroger**: `https://companieslogo.com/img/orig/KR-f39fde68.png?t=1720244492`
2. **Whole Foods**: `https://img.logo.dev/wholefoodsmarket.com` (logo.dev CDN)
3. **Costco**: `https://companieslogo.com/img/orig/COST-180a6d1f.png?t=1720244491`
4. **Safeway**: `https://companieslogo.com/img/orig/SWY.defunct.2015-69b0f460.png?t=1723348719`
5. **Publix**: `https://companieslogo.com/img/orig/publix-dbe14b16.png?t=1720244494`
6. **Aldi**: `https://img.logo.dev/aldi.us` (logo.dev CDN)
7. **Postmates**: `https://img.logo.dev/postmates.com` (logo.dev CDN)
8. **Rite Aid**: `https://companieslogo.com/img/orig/RAD-73c35102.png?t=1720244493`
9. **Panera**: `https://img.logo.dev/panerabread.com` (logo.dev CDN)
10. **Subway**: `https://img.logo.dev/subway.com` (logo.dev CDN)

### Fallback Handling

Add an `onError` handler to key `<img>` tags in `BrandSelectorModal.tsx` and `DonationFlow.tsx` so that if any logo fails to load, the brand name initial is shown as a colored circle instead of a broken image icon. This ensures the UI degrades gracefully.

### Files Modified

| File | Change |
|------|--------|
| `src/data/brandLogos.ts` | Update 10 broken logo URLs |
| `src/components/landing/BrandSelectorModal.tsx` | Add `onError` fallback for logo images |
| `src/components/landing/DonationFlow.tsx` | Add `onError` fallback for logo images |

### Impact
Since `brandLogos.ts` is the single source of truth, updating it automatically fixes logos across all 10+ components that display brand logos (modal, donation flow, leaderboard, allocation sliders, live activity bar, coupon modals, impact modals, etc.).

