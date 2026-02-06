

## Plan: Link Donations to Coupons & Show Coupon Details in Donor History

### Overview

Currently, donations store `brand_partner` (the brand chosen) but there's **no connection to coupons**. To show which coupons were created from a donation, we need to:
1. Add a `donation_id` column to the `coupons` table
2. Create coupons automatically when a donation is successful
3. Update the donor history page to show coupon details when clicking on a transaction

---

### Database Changes

**1. Add `donation_id` column to coupons table**

| Column | Type | Purpose |
|--------|------|---------|
| donation_id | uuid (nullable) | Links coupon to the donation that funded it |

**2. Add RLS policy for donors to view coupons created from their donations**

---

### Backend Changes

**Modify `stripe-webhook/index.ts`**

When a donation is successful, automatically create coupons based on the donation amount:

| Donation Amount | Coupons Created | Example |
|----------------|-----------------|---------|
| $10 | 2 x $5 coupons | 2 meals |
| $25 | 5 x $5 coupons | 5 meals |
| $50 | 5 x $10 coupons | 10 meals |
| $100 | 10 x $10 coupons | 20 meals |
| $200 | 20 x $10 coupons | 40 meals |

Coupon creation logic:
- Status: `pending` (until admin activates) or `available` 
- Store name: from `brand_partner`
- Value: based on donation tier
- Code: auto-generated unique code

---

### Frontend Changes

**1. Create new component: `DonationCouponsModal.tsx`**

A modal/drawer that shows when clicking on a donation:

```text
┌─────────────────────────────────────────────────┐
│  Donation Details - $50.00                       │
│  ─────────────────────────────────────────────── │
│  Brand: DoorDash                                 │
│  Date: Feb 6, 2026                               │
│  Net Impact: $48.25                              │
│                                                  │
│  COUPONS CREATED (5)                             │
│  ┌─────────────────────────────────────────────┐ │
│  │ ✅ $10 DoorDash     Available               │ │
│  │ ✅ $10 DoorDash     Redeemed by Maria       │ │
│  │ ✅ $10 DoorDash     Available               │ │
│  │ ⏳ $10 DoorDash     Pending                 │ │
│  │ ⏳ $10 DoorDash     Pending                 │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  Summary: 2 available, 1 redeemed, 2 pending    │
└─────────────────────────────────────────────────┘
```

**2. Update `DonorHistory.tsx`**

- Make each donation card clickable
- When clicked, open the `DonationCouponsModal`
- Show coupon count badge on each donation card
- Add "View Coupons" button

---

### Coupon Status Display

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| pending | Clock | Yellow | Coupon being processed, not yet available |
| available | Check | Green | Ready for recipients to claim |
| reserved | User | Blue | Someone has reserved but not used |
| redeemed | CheckCircle | Gray | Used by a recipient |

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/[timestamp]_add_donation_coupons_link.sql` | Add donation_id to coupons + RLS |
| `supabase/functions/stripe-webhook/index.ts` | Create coupons on successful donation |
| `src/components/donor/DonationCouponsModal.tsx` | New modal for coupon details |
| `src/pages/donor/DonorHistory.tsx` | Add click handler and modal integration |
| `src/integrations/supabase/types.ts` | Update types |

---

### Technical Details

**Migration SQL:**
```sql
-- Add donation_id to coupons
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS donation_id uuid REFERENCES donations(id);

-- Index for efficient lookup
CREATE INDEX IF NOT EXISTS idx_coupons_donation_id ON coupons(donation_id);

-- RLS: Donors can view coupons from their donations
CREATE POLICY "Donors can view coupons from their donations"
ON coupons FOR SELECT
USING (
  donation_id IN (
    SELECT id FROM donations WHERE donor_id = auth.uid()
  )
);
```

**Coupon creation in webhook:**
```typescript
// After donation is recorded successfully
const couponCount = Math.floor(amount / 5); // 1 coupon per $5
const couponValue = amount >= 50 ? 10 : 5;  // $10 coupons for larger donations

for (let i = 0; i < couponCount; i++) {
  await supabase.from('coupons').insert({
    donation_id: donationId,
    title: `${brandPartner} Gift`,
    store_name: brandPartner,
    value: couponValue,
    code: generateCouponCode(),
    status: 'available',
    expiry_date: addMonths(new Date(), 6),
  });
}
```

**Frontend query for coupons:**
```typescript
const { data: coupons } = await supabase
  .from('coupons')
  .select('*')
  .eq('donation_id', selectedDonationId)
  .order('created_at', { ascending: true });
```

---

### User Flow After Implementation

1. User donates $50 to DoorDash
2. Stripe webhook processes payment
3. 5 x $10 DoorDash coupons are created with `donation_id`
4. User goes to Donor History
5. Sees donation with badge "5 coupons"
6. Clicks on donation
7. Modal shows:
   - Brand chosen: DoorDash
   - 5 coupons with their status (available/pending/redeemed)
   - Which recipients redeemed them (if any)

---

### Edge Cases Handled

- **Old donations**: Will show "No coupons linked" message (created before system)
- **Failed donations**: No coupons created
- **Partial refunds**: Coupons remain but donation shows refund status

