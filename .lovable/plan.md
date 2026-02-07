

## Plan: Make MyImpact Transactions Clickable with Brand Logos & Coupon Details

### Overview

Update the `/my-impact` page to make all recent transactions clickable, showing a detailed modal with:
- Brand logo (matching homepage logos)
- Full donation details
- All coupons created from that donation with clear status indicators

---

### Current State vs. Target State

| Feature | Current `/my-impact` | Target State |
|---------|---------------------|--------------|
| Transaction cards | Static, not clickable | Clickable with hover effect |
| Brand display | Not shown | Brand logo + name prominently displayed |
| Coupon details | Not shown | Modal with full coupon breakdown |
| Visual feedback | None | Cursor pointer, hover states |

---

### Implementation Details

#### 1. Update Donation Interface

Add missing fields to the `Donation` interface in `MyImpact.tsx`:

```typescript
interface Donation {
  id: string;
  amount: number;
  created_at: string;
  stripe_fee: number | null;
  net_amount: number | null;
  brand_partner: string | null;  // Add this
  status: string | null;          // Add this
}
```

#### 2. Update Query to Fetch Required Fields

Ensure the Supabase query returns `brand_partner` and `status` fields (already available with `select("*")`).

#### 3. Create Enhanced Modal Component

Create a new component `src/components/impact/ImpactDonationModal.tsx` with:

- **Header**: Large brand logo + brand name
- **Donation Details**: Amount, date, net impact, status
- **Coupons Grid**: Visual display of all coupons with status

```text
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│            [Brand Logo - Large 64x64]                        │
│              DoorDash                                        │
│                                                              │
│  ───────────────────────────────────────────────────────────│
│                                                              │
│  💰 $50.00 donated                                           │
│  📅 Feb 7, 2026                                              │
│  ✅ $48.25 reached recipients                                │
│                                                              │
│  ───────────────────────────────────────────────────────────│
│                                                              │
│  COUPONS CREATED (5)                                         │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ [DoorDash]   │ │ [DoorDash]   │ │ [DoorDash]   │         │
│  │   $10.00     │ │   $10.00     │ │   $10.00     │         │
│  │ ✅ Available │ │ 👤 Reserved  │ │ ✓ Redeemed   │         │
│  │   ABC123     │ │   DEF456     │ │   GHI789     │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐                          │
│  │ [DoorDash]   │ │ [DoorDash]   │                          │
│  │   $10.00     │ │   $10.00     │                          │
│  │ ⏳ Pending   │ │ ⏳ Pending   │                          │
│  │   JKL012     │ │   MNO345     │                          │
│  └──────────────┘ └──────────────┘                          │
│                                                              │
│  Summary: 1 available • 1 reserved • 1 redeemed • 2 pending │
└──────────────────────────────────────────────────────────────┘
```

#### 4. Update MyImpact Transaction Cards

Transform static rows into clickable cards with:

- **Brand logo** displayed in place of generic Heart icon
- **Hover effect** with cursor pointer
- **Coupon count badge** showing how many coupons were created
- **Click handler** to open the modal

```text
┌────────────────────────────────────────────────────────────────┐
│  [DoorDash Logo]    Donated to DoorDash         $50.00        │
│                     Feb 7, 2026                  $48.25 net   │
│                                            [🎟️ 5 coupons]     │
└────────────────────────────────────────────────────────────────┘
```

#### 5. Integrate Brand Logos from `brandLogos.ts`

Use the existing `brandLogos` data to:
- Match `donation.brand_partner` to the correct logo
- Display the brand's color accent
- Fallback to a generic gift icon if brand not found

```typescript
import { brandLogos } from '@/data/brandLogos';

const getBrandInfo = (brandName: string | null) => {
  if (!brandName) return null;
  // Try exact match first
  if (brandLogos[brandName]) return brandLogos[brandName];
  // Try case-insensitive match
  const key = Object.keys(brandLogos).find(
    k => k.toLowerCase() === brandName.toLowerCase()
  );
  return key ? brandLogos[key] : null;
};
```

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/impact/ImpactDonationModal.tsx` | **Create** | New modal with enhanced brand display and coupon grid |
| `src/pages/MyImpact.tsx` | **Modify** | Update interface, add click handlers, integrate modal, show brand logos |

---

### Technical Implementation

**1. ImpactDonationModal Component Features:**

- Uses `brandLogos` data for accurate brand logo display
- Larger modal width (`sm:max-w-lg`) for better coupon grid display
- Grid layout for coupons (3 columns on desktop, 2 on mobile)
- Each coupon card shows:
  - Brand logo (small)
  - Coupon value
  - Status with color-coded badge
  - Coupon code
- Summary bar at bottom with status breakdown

**2. MyImpact Page Updates:**

- Add `selectedDonation` and `modalOpen` state
- Wrap each transaction in a clickable container
- Replace Heart icon with brand logo when `brand_partner` is set
- Add coupon count fetch (similar to DonorHistory pattern)
- Display coupon badge on each transaction

---

### Visual Enhancements

| Element | Style |
|---------|-------|
| Transaction row | `cursor-pointer hover:bg-muted/50 transition-colors rounded-lg p-3` |
| Brand logo | `w-10 h-10 object-contain rounded-lg bg-white p-1` |
| Coupon badge | `Badge variant="outline" with Ticket icon` |
| Modal brand logo | `w-16 h-16 object-contain` centered at top |
| Coupon cards | `border rounded-lg p-3` with status-colored left border |

---

### Status Color Coding

| Status | Color | Icon | Background |
|--------|-------|------|------------|
| Pending | Amber | Clock | `bg-amber-500/10` |
| Available | Emerald | Check | `bg-emerald-500/10` |
| Reserved | Blue | User | `bg-blue-500/10` |
| Redeemed | Gray | CheckCircle | `bg-muted` |
| Expired | Red | Clock | `bg-destructive/10` |

---

### User Flow

1. User visits `/my-impact`
2. Sees list of donations with brand logos and coupon counts
3. Hovers over a transaction (visual feedback with hover state)
4. Clicks on transaction
5. Modal opens showing:
   - Large brand logo at top
   - Donation amount and date
   - Net impact amount
   - Grid of all coupons with their statuses
   - Summary showing count by status
6. User can close modal and click another transaction

---

### Edge Cases

- **No brand selected**: Show generic gift/heart icon
- **No coupons yet**: Show "Coupons being created..." message with pending icon
- **Brand not in brandLogos**: Show brand name text only without logo
- **Old donations before coupon system**: Show "No coupons linked" message

