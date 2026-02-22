

## Three Fixes: Remove Admin Toggle, Consistent Brand Colors, Fix Logo Loading Lag

### 1. Remove Admin Role Management from AdminUsers

Remove the "Make Admin" / "Remove Admin" buttons entirely from the user management page. The page will remain as a read-only user list showing names, emails, roles, and join dates -- but without the ability to change roles.

**File: `src/pages/admin/AdminUsers.tsx`**
- Remove the `toggleAdmin` function and `toggling` state
- Remove the `ShieldCheck`, `ShieldOff` icon imports
- Remove the entire button column from each user card
- Keep the user list, search, role badges -- just remove the admin toggle action

---

### 2. Make "CouponDonation" Brand Name Consistent Everywhere

Currently, the brand name uses green ("Coupon") + blue ("Donation") colors only in the Navbar and Footer. Four other locations render it as plain `text-foreground` with no color split:

| Location | Current | Fix |
|----------|---------|-----|
| Navbar | Green + Blue | Already correct |
| Footer | Green + Blue | Already correct |
| DashboardLayout (mobile header) | Plain `text-foreground` | Add green + blue split |
| DashboardLayout (sidebar logo) | Plain `text-foreground` | Add green + blue split |
| ApplyLayout | Plain `text-foreground` | Add green + blue split |
| Auth.tsx | Plain `text-foreground` | Add green + blue split |
| ResetPassword.tsx | Plain `text-foreground` | Add green + blue split |

Each will be updated to use:
```
<span className="text-[#2e7d32]">Coupon</span><span className="text-[#1565c0]">Donation</span>
```

---

### 3. Fix Logo Loading Lag in Header

The logo is loaded as a dynamic import (`import logo from '@/assets/logo.png'`). On initial page load, there can be a flash where the logo hasn't loaded yet, causing a layout shift.

**Fix in `src/components/layout/Navbar.tsx`:**
- Add fixed `width` and `height` attributes to the `<img>` tag to reserve space and prevent layout shift
- Add `loading="eager"` and `decoding="async"` to prioritize the logo load
- Add `fetchPriority="high"` to signal the browser to load it first

Same fix applied to `DashboardLayout.tsx` for the dashboard header logo.

---

### Files Modified

| File | Change |
|------|--------|
| `src/pages/admin/AdminUsers.tsx` | Remove admin toggle buttons and related logic |
| `src/components/layout/DashboardLayout.tsx` | Add green+blue brand colors to both logo locations, fix logo loading |
| `src/components/apply/ApplyLayout.tsx` | Add green+blue brand colors |
| `src/pages/Auth.tsx` | Add green+blue brand colors |
| `src/pages/ResetPassword.tsx` | Add green+blue brand colors |
| `src/components/layout/Navbar.tsx` | Add loading optimization attributes to logo img |

