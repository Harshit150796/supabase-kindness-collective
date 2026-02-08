

## Plan: Multi-Brand Donation Selection Feature

### Executive Summary

Add the ability for donors to select **multiple brands** when making a donation, with flexible allocation options. The donation will be split across the chosen brands, creating coupons for each brand proportionally.

---

### Current System Analysis

**How it works now:**
- Donor selects **1 brand** in Step 1
- Selects donation amount in Step 2
- Donation creates coupons for that single brand
- Database stores `brand_partner` as a single text field
- Webhook generates coupons with that brand's `store_name`

**Key integration points:**
- `DonationFlow.tsx` - manages single brand selection with `selectedBrand: string | null`
- `BrandSelectorModal.tsx` - single-select brand picker
- `create-donation-checkout` Edge Function - sends single `brandName` to Stripe
- `stripe-webhook` Edge Function - creates coupons for single `brandPartner`
- `donations.brand_partner` - stores single brand name

---

### Proposed Approaches (3 Options)

#### Option A: "Equal Split" Multi-Select (Recommended)

**Concept:** Donor picks 2-5 brands, donation is split equally among them.

**User Flow:**
1. Select multiple brands (checkboxes instead of radio buttons)
2. See "Your $50 will be split: $25 DoorDash + $25 Walmart"
3. Proceed to checkout
4. Coupons created proportionally for each brand

**Pros:**
- Simple UX, easy to understand
- Minimal changes to existing flow
- Works well with current coupon generation logic

**Cons:**
- Less control for donors who want specific allocations

---

#### Option B: "Custom Allocation" with Sliders

**Concept:** Donor picks brands, then uses sliders to allocate percentages.

**User Flow:**
1. Select multiple brands
2. Adjust sliders: "DoorDash 60% / Walmart 40%"
3. See real-time breakdown: "$30 DoorDash + $20 Walmart"
4. Proceed to checkout

**Pros:**
- Maximum flexibility
- Matches donor intent precisely
- Premium/modern UX feel

**Cons:**
- More complex UI
- Potential for analysis paralysis
- More edge cases (rounding, minimum amounts)

---

#### Option C: "Add to Cart" Pattern

**Concept:** Treat brands like a shopping cart - add multiple donations.

**User Flow:**
1. Select brand + amount, click "Add"
2. Card appears: "DoorDash $25"
3. Continue adding: "Walmart $15", "Target $10"
4. Review cart, single checkout for all

**Pros:**
- Familiar e-commerce pattern
- Donors control exact amounts per brand
- Clear visual breakdown

**Cons:**
- Bigger UX overhaul
- May feel less like "donating" and more like "shopping"

---

### Recommended Approach: Hybrid of A & B

Start with **Equal Split** as default, with optional "Customize" toggle for advanced allocation.

```text
Step 1: Select Brands (Multi-Select)
-----------------------------------------
[x] DoorDash    [x] Walmart    [ ] Target
[ ] Starbucks   [ ] CVS        [ ] Amazon

Selected: DoorDash, Walmart (2 brands)
Your $50 donation will be split equally: $25 each

[ ] Customize split (optional)

[Continue]
```

When "Customize" is toggled:
```text
Custom Allocation
-----------------------------------------
DoorDash:    [=====--------] 60%  = $30
Walmart:     [===----------] 40%  = $20
                            ----   ----
                            100%   $50

[Continue]
```

---

### Technical Implementation Plan

#### 1. Database Schema Changes

**New Table: `donation_brands`** (junction table for multi-brand donations)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| donation_id | uuid | FK to donations |
| brand_name | text | Brand selected |
| allocation_percent | integer | Percentage allocated (1-100) |
| allocated_amount | numeric | Calculated amount in dollars |
| created_at | timestamp | When created |

**Existing Changes:**
- Keep `donations.brand_partner` for backward compatibility (stores primary brand or comma-separated list)
- Add index on `donation_brands.donation_id`

**RLS Policies:**
- Donors can view their own donation_brands
- Service role can insert/update

---

#### 2. Frontend Changes

**2a. Update State Management in `DonationFlow.tsx`**

```typescript
// Change from:
const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

// To:
interface BrandAllocation {
  brandId: string;
  brandName: string;
  percentage: number;
}
const [selectedBrands, setSelectedBrands] = useState<BrandAllocation[]>([]);
const [useCustomAllocation, setUseCustomAllocation] = useState(false);
```

**2b. Update Brand Selection UI (Step 1)**

- Change brand buttons from single-select to multi-select with checkboxes
- Add visual indicator showing selected count
- Add "Customize allocation" toggle
- Show split preview: "Your $50 will create: 3 DoorDash coupons + 2 Walmart coupons"

**2c. Update `BrandSelectorModal.tsx`**

- Add multi-select mode prop
- Track multiple selected brands
- Add "Done" button that returns array of selections

**2d. Update Step 2 (Amount Selection)**

- Show breakdown by brand as amount changes
- Real-time coupon preview per brand

**2e. Update Step 3 (Impact Preview)**

- Show all selected brands with their logos
- Display per-brand coupon breakdown
- Show total meals across all brands

---

#### 3. Backend Changes

**3a. Update `create-donation-checkout` Edge Function**

Change metadata to support multiple brands:

```typescript
metadata: {
  type: "donation",
  amount: amount.toString(),
  brand_allocations: JSON.stringify([
    { brand: "DoorDash", percent: 60, amount: 30 },
    { brand: "Walmart", percent: 40, amount: 20 }
  ]),
  // Keep legacy field for single-brand compatibility
  brand_name: primaryBrandName,
}
```

**3b. Update `stripe-webhook` Edge Function**

Parse multi-brand allocations and create coupons for each:

```typescript
async function createCouponsFromDonation(
  supabase: any,
  donationId: string,
  amount: number,
  brandAllocations: BrandAllocation[]
) {
  for (const allocation of brandAllocations) {
    const allocatedAmount = (amount * allocation.percent) / 100;
    const couponValue = allocatedAmount >= 50 ? 10 : 5;
    const couponCount = Math.floor(allocatedAmount / couponValue);
    
    // Create coupons for this brand
    const coupons = Array(couponCount).fill(null).map(() => ({
      donation_id: donationId,
      title: `${allocation.brand} Gift`,
      store_name: allocation.brand,
      value: couponValue,
      code: generateCouponCode(),
      status: 'available',
      expiry_date: expiryDateStr,
    }));
    
    await supabase.from("coupons").insert(coupons);
  }
  
  // Also insert into donation_brands table
  const brandRecords = brandAllocations.map(a => ({
    donation_id: donationId,
    brand_name: a.brand,
    allocation_percent: a.percent,
    allocated_amount: (amount * a.percent) / 100,
  }));
  
  await supabase.from("donation_brands").insert(brandRecords);
}
```

---

#### 4. Update Display Components

**4a. Update `DonationCouponsModal.tsx`**

- Group coupons by brand with brand logo headers
- Show per-brand allocation summary
- Add visual brand sections

**4b. Update `ImpactDonationModal.tsx`**

- Fetch from `donation_brands` table for allocation breakdown
- Show pie chart or bar visualization of split
- Display each brand's logo with its allocation

**4c. Update `DonorHistory.tsx`**

- Show multiple brand badges when donation has multiple brands
- Display brand logos inline

---

### UI Mockups

**Step 1: Multi-Brand Selection**

```text
┌─────────────────────────────────────────────────────────────┐
│                Choose Partner Brands                        │
│        Select one or more brands for your donation          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │[✓]      │  │[✓]      │  │[ ]      │                     │
│  │DoorDash │  │ Walmart │  │ Target  │                     │
│  │ [logo]  │  │ [logo]  │  │ [logo]  │                     │
│  └─────────┘  └─────────┘  └─────────┘                     │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │[ ]      │  │[ ]      │  │[ ]      │                     │
│  │Starbucks│  │   CVS   │  │ Amazon  │                     │
│  │ [logo]  │  │ [logo]  │  │ [logo]  │                     │
│  └─────────┘  └─────────┘  └─────────┘                     │
│                                                             │
│  ───────────────────────────────────────────────────────── │
│                                                             │
│  Selected: 2 brands                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [DoorDash logo] DoorDash    50%    $25.00           │   │
│  │ [Walmart logo]  Walmart     50%    $25.00           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [ ] Customize split percentages                            │
│                                                             │
│  [Browse all 25+ brands]                                   │
│                                                             │
│               [Continue →]                                  │
└─────────────────────────────────────────────────────────────┘
```

**Step 3: Multi-Brand Impact Preview**

```text
┌─────────────────────────────────────────────────────────────┐
│                    Your Impact                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│       [DoorDash logo]  [Walmart logo]                       │
│         DoorDash    +    Walmart                            │
│                                                             │
│  ───────────────────────────────────────────────────────── │
│                                                             │
│              $50.00                100 meals                │
│           Your Donation         Meals Provided              │
│                                                             │
│  ───────────────────────────────────────────────────────── │
│                                                             │
│  COUPON BREAKDOWN                                           │
│  ┌────────────────────────────────────────────────────┐    │
│  │ [DoorDash] $25 → 5 x $5 coupons (50 meals)        │    │
│  │ [Walmart]  $25 → 5 x $5 coupons (50 meals)        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  ⭐ Plus, earn 500 Gold Coins for exclusive rewards        │
│                                                             │
│        [Back]           [Complete Donation ❤️]              │
└─────────────────────────────────────────────────────────────┘
```

---

### Edge Cases & Validation Rules

| Scenario | Handling |
|----------|----------|
| Minimum per brand | $5 minimum per brand (so $10 donation = max 2 brands) |
| Maximum brands | 5 brands maximum per donation |
| Odd amounts | Round down, any remainder goes to first brand |
| No coupons for small splits | If a brand allocation is < $5, show warning |
| Custom allocation doesn't add to 100% | Auto-normalize sliders |
| Single brand selected | Works exactly like current flow |

---

### Migration Strategy for Existing Data

1. Old donations have `brand_partner` set (single brand)
2. No migration needed - old data works as-is
3. New multi-brand donations will:
   - Populate `donation_brands` table
   - Set `brand_partner` to comma-separated list for backward compatibility

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/[ts]_add_donation_brands.sql` | Create | New junction table + RLS |
| `src/components/landing/DonationFlow.tsx` | Modify | Multi-select state, updated UI |
| `src/components/landing/BrandSelectorModal.tsx` | Modify | Add multi-select mode |
| `src/components/landing/BrandAllocationSliders.tsx` | Create | Custom allocation UI |
| `supabase/functions/create-donation-checkout/index.ts` | Modify | Handle multi-brand metadata |
| `supabase/functions/stripe-webhook/index.ts` | Modify | Create coupons per brand |
| `src/components/donor/DonationCouponsModal.tsx` | Modify | Group coupons by brand |
| `src/components/impact/ImpactDonationModal.tsx` | Modify | Show brand allocations |
| `src/pages/donor/DonorHistory.tsx` | Modify | Display multiple brands |
| `src/pages/MyImpact.tsx` | Modify | Handle multi-brand display |
| `src/integrations/supabase/types.ts` | Modify | Add new table types |

---

### Testing Considerations

1. **Single brand flow** - Ensure existing behavior unchanged
2. **Two brands equal split** - $50 = $25 + $25
3. **Multiple brands custom split** - 60/30/10% allocation
4. **Minimum amount validation** - $10 with 3 brands should show error
5. **Coupon creation accuracy** - Correct count per brand
6. **Modal display** - Coupons grouped correctly by brand
7. **History pages** - Multiple brand badges display correctly

---

### Future Enhancements (Phase 2)

- **Smart recommendations**: "Donors who chose DoorDash also picked Walmart"
- **Favorite brands**: Save donor's preferred brand mix
- **Monthly recurring**: Split recurring donations across brands
- **Brand matching**: "Walmart matches 10% of donations this month!"

