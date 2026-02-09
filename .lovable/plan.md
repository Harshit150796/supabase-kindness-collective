

## Plan: Replace Generic "Meals" with Brand-Specific Impact Display

### Problem Statement

The current donation flow displays "meals" for all brands, which is inaccurate and misleading:
- **DoorDash** → meals ✅
- **Walmart** → groceries, not meals
- **CVS** → healthcare items, not meals
- **Starbucks** → beverages, not meals
- **Amazon** → general products, not meals

When someone donates $1000 to multiple brands, they need to understand:
1. How many coupons will be created **per brand**
2. What value each coupon will have (based on allocation tier)
3. What those coupons will provide (category-specific)

---

### Solution Overview

Replace the universal "meals" metric with **coupon-focused display** that shows:
- Number of coupons per brand
- Value per coupon ($5 or $10)
- Brand-specific impact description (optional contextual text)

---

### Data Model Enhancement

Add a new `impactLabel` field to `BrandInfo` in `brandLogos.ts`:

| Category | Impact Label | Example |
|----------|--------------|---------|
| food-delivery | `meals` | "6 meals delivered" |
| restaurant | `meals` | "4 restaurant meals" |
| grocery | `groceries` | "Worth of groceries" |
| coffee | `beverages` | "Coffee/beverage credits" |
| pharmacy | `essentials` | "Healthcare essentials" |
| retail | `products` | "Worth of products" |

```typescript
export interface BrandInfo {
  name: string;
  logo: string;
  color: string;
  category: 'grocery' | 'food-delivery' | 'retail' | 'coffee' | 'pharmacy' | 'restaurant';
  popular?: boolean;
  impactUnit?: string;  // NEW: "meals" | "groceries" | "beverages" | "essentials" | "products"
}
```

---

### Display Changes

#### Option A: Coupon-Only Display (Recommended - Cleaner)

Remove "meals" entirely and focus on **coupon value**:

**Current:**
```
DoorDash   60%   $30.00
           ≈ 6 coupons (12 meals)
```

**New:**
```
DoorDash   60%   $30.00
           → 6 × $5 coupons
```

For larger allocations ($50+):
```
DoorDash   60%   $600.00
           → 60 × $10 coupons
```

#### Option B: Category-Aware Display (More Descriptive)

**Current:**
```
DoorDash   60%   $30.00
           ≈ 6 coupons (12 meals)

Walmart    40%   $20.00
           ≈ 4 coupons (8 meals)  ← WRONG
```

**New:**
```
DoorDash   60%   $30.00
           → 6 × $5 coupons (food delivery)

Walmart    40%   $20.00
           → 4 × $5 coupons (groceries)
```

---

### Recommended Approach: Clean Coupon Display

Focus purely on **what gets created** rather than trying to quantify impact:

```text
┌──────────────────────────────────────────────────────────────┐
│  COUPON PREVIEW                                              │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  [DoorDash]  DoorDash          $30.00  →  6 × $5 coupons    │
│  [Walmart]   Walmart           $20.00  →  4 × $5 coupons    │
│  ─────────────────────────────────────────────────────────── │
│  Total: $50.00 → 10 coupons                                  │
│                                                              │
│  ℹ️ Each coupon is redeemable at the selected brand         │
└──────────────────────────────────────────────────────────────┘
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/data/brandLogos.ts` | Add optional `impactUnit` field to BrandInfo |
| `src/components/landing/BrandAllocationSliders.tsx` | Replace `{coupons * 2} meals` with coupon details |
| `src/components/landing/DonationFlow.tsx` | Remove `getImpactMessage()`, update Step 2 & 3 displays |
| `src/pages/DonationSuccess.tsx` | Replace "Meals Provided" with "Coupons Created" |

---

### Detailed Changes

#### 1. BrandAllocationSliders.tsx

**Line 124-126 - Change coupon display:**

```typescript
// FROM:
<div className="text-xs text-muted-foreground text-right">
  ≈ {coupons} coupon{coupons !== 1 ? 's' : ''} ({coupons * 2} meals)
</div>

// TO:
<div className="text-xs text-muted-foreground text-right">
  → {coupons} × ${couponValue} coupon{coupons !== 1 ? 's' : ''}
</div>
```

**Update `getCouponsForBrand` to also return coupon value:**

```typescript
const getCouponDetails = (brandAmount: number) => {
  const couponValue = brandAmount >= 50 ? 10 : 5;
  const couponCount = Math.floor(brandAmount / couponValue);
  return { count: couponCount, value: couponValue };
};
```

**Update Summary section (lines 141-151):**

```typescript
// FROM:
<span key={allocation.brandId}>
  {allocation.brandName}: ${allocatedAmount.toFixed(2)} → {coupons} coupon{coupons !== 1 ? 's' : ''}
</span>

// TO:
<span key={allocation.brandId}>
  {allocation.brandName}: {couponDetails.count} × ${couponDetails.value}
</span>
```

#### 2. DonationFlow.tsx

**Lines 70-76 - Remove or replace `getImpactMessage()`:**

```typescript
// FROM:
const getImpactMessage = (amount: number) => {
  if (amount >= 100) return { meals: amount * 2, text: `${amount * 2} meals for families in need` };
  // ...
};

// TO:
const getTotalCoupons = (amount: number, allocations: BrandAllocation[]) => {
  return allocations.reduce((total, alloc) => {
    const brandAmount = (amount * alloc.percentage) / 100;
    const couponValue = brandAmount >= 50 ? 10 : 5;
    return total + Math.floor(brandAmount / couponValue);
  }, 0);
};
```

**Line 526 - Update text:**

```typescript
// FROM:
<p className="text-muted-foreground text-sm">Every dollar provides real meals for families</p>

// TO:
<p className="text-muted-foreground text-sm">Your donation creates coupons for families to use at partner brands</p>
```

**Lines 530-541 - Update amount display:**

```typescript
// FROM:
<div className="text-center py-6 bg-secondary/50 rounded-xl">
  <div className="text-5xl font-bold text-foreground mb-2">${amount}</div>
  <div className="flex items-center justify-center gap-2 text-primary font-medium">
    <Utensils className="w-4 h-4" />
    <span>= {impact.text}</span>
  </div>
</div>

// TO:
<div className="text-center py-6 bg-secondary/50 rounded-xl">
  <div className="text-5xl font-bold text-foreground mb-2">${amount}</div>
  <div className="flex items-center justify-center gap-2 text-primary font-medium">
    <Gift className="w-4 h-4" />
    <span>= {totalCoupons} coupons for families</span>
  </div>
</div>
```

**Lines 657-668 - Update Step 3 impact display:**

```typescript
// FROM:
<div>
  <div className="text-3xl font-bold text-primary flex items-center justify-center gap-1">
    <Utensils className="w-6 h-6" />
    {impact.meals}
  </div>
  <div className="text-sm text-muted-foreground">Meals Provided</div>
</div>

// TO:
<div>
  <div className="text-3xl font-bold text-primary flex items-center justify-center gap-1">
    <Gift className="w-6 h-6" />
    {totalCoupons}
  </div>
  <div className="text-sm text-muted-foreground">Coupons Created</div>
</div>
```

#### 3. DonationSuccess.tsx

**Lines 74-81 - Update success display:**

```typescript
// FROM:
<div className="text-center">
  <div className="text-3xl font-bold text-primary flex items-center justify-center gap-1">
    <Utensils className="w-6 h-6" />
    {meals}
  </div>
  <div className="text-sm text-muted-foreground">Meals Provided</div>
</div>

// TO:
<div className="text-center">
  <div className="text-3xl font-bold text-primary flex items-center justify-center gap-1">
    <Gift className="w-6 h-6" />
    {coupons}
  </div>
  <div className="text-sm text-muted-foreground">Coupons Created</div>
</div>
```

Also update URL parameter from `meals` to `coupons`.

---

### Enhanced Coupon Value Logic

Show clear breakdown of coupon values based on allocation:

```typescript
// Coupon value tier logic:
// - If brand allocation is $50+ → $10 coupons
// - If brand allocation is < $50 → $5 coupons

const getCouponBreakdown = (amount: number, percentage: number) => {
  const allocatedAmount = (amount * percentage) / 100;
  const couponValue = allocatedAmount >= 50 ? 10 : 5;
  const couponCount = Math.floor(allocatedAmount / couponValue);
  
  return {
    allocatedAmount,
    couponValue,
    couponCount,
    totalValue: couponCount * couponValue,
  };
};
```

**Example for $1000 donation split 60/40:**

| Brand | Allocation | Coupon Value | Coupons | Total Value |
|-------|------------|--------------|---------|-------------|
| DoorDash | $600 (60%) | $10 | 60 | $600 |
| Walmart | $400 (40%) | $10 | 40 | $400 |
| **Total** | **$1000** | - | **100** | **$1000** |

---

### UI Mockup: Updated Step 3

```text
┌──────────────────────────────────────────────────────────────┐
│                    Your Impact                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│       [DoorDash logo]  [Walmart logo]                        │
│                                                              │
│  ───────────────────────────────────────────────────────────│
│                                                              │
│           $1,000.00              100                         │
│         Your Donation       Coupons Created                  │
│                                                              │
│  ───────────────────────────────────────────────────────────│
│                                                              │
│  COUPON BREAKDOWN                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [DoorDash] $600.00 → 60 × $10 coupons                  │ │
│  │ [Walmart]  $400.00 → 40 × $10 coupons                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ℹ️ Coupons are distributed to verified recipient families  │
│     and redeemable at the selected partner brands.          │
│                                                              │
│        [Back]           [Complete Donation ❤️]               │
└──────────────────────────────────────────────────────────────┘
```

---

### Explanatory Notes to Add

Add contextual information where helpful:

**In BrandAllocationSliders:**
```text
💡 How it works:
• Allocations of $50+ create $10 coupons (higher value)
• Allocations under $50 create $5 coupons
• Each coupon is redeemable at the selected brand
```

**In Step 3 (Impact Preview):**
```text
ℹ️ Your coupons will be distributed to verified families who can 
   redeem them at {brand names} for {category-specific items}.
```

---

### Summary of Changes

| Metric | Current | New |
|--------|---------|-----|
| Primary display | "X meals" | "X coupons" |
| Per-brand detail | "X coupons (Y meals)" | "X × $Value coupons" |
| Impact text | "meals for families in need" | "coupons for families" |
| Success page | "Meals Provided" | "Coupons Created" |

This approach:
1. Accurately represents what is created (coupons, not meals)
2. Shows clear value breakdown ($5 vs $10 coupons)
3. Works for all brand categories (food, retail, pharmacy, etc.)
4. Removes misleading "meals" terminology for non-food brands

