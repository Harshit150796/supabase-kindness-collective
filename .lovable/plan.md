

## Color the Logo Text: "Coupon" in Green, "Donation" in Blue

### Change

**File: `src/components/layout/Navbar.tsx`** (line 40)

Replace the single `<span>` containing "CouponDonation" with two separate `<span>` elements:

```tsx
<span className="font-bold text-lg leading-tight">
  <span className="text-[#7a9e4e]">Coupon</span>
  <span className="text-[#4a6fa5]">Donation</span>
</span>
```

The colors are matched from the reference screenshot:
- "Coupon" -- Olive/sage green (`#7a9e4e`)
- "Donation" -- Steel blue (`#4a6fa5`)

This same change will also apply to the footer if the logo text appears there, for consistency.

### Files Modified

| File | Change |
|------|--------|
| `src/components/layout/Navbar.tsx` | Split logo text into two colored spans |
| `src/components/layout/Footer.tsx` | Match the same coloring if logo text exists there |

