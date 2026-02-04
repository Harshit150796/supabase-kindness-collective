

## Plan: Add Donor & Recipient Portal Links to My Account Menu

### Overview
Add both "Donor Portal" and "Recipient Portal" options to the "My Account" dropdown menu, so all logged-in users can access either portal regardless of which roles they have. This gives users full control over which features they want to use.

---

### Changes to Navbar.tsx

**1. Add new icons import:**
```typescript
import { DollarSign, Gift } from 'lucide-react';
```

**2. Add Portal section to dropdown menu (after Profile, before Your fundraisers):**

```
Profile
─────────────
Donor Portal        → /donor
Recipient Portal    → /recipient
─────────────
Your fundraisers
Your impact
─────────────
Account settings
─────────────
Sign out
```

**3. Add Portal section to mobile menu:**

Add two new buttons for Donor Portal and Recipient Portal in the mobile menu section.

---

### Visual Layout (Desktop Dropdown)

| Icon | Label | Route |
|------|-------|-------|
| User | Profile | /profile |
| --- | *separator* | --- |
| DollarSign | Donor Portal | /donor |
| Gift | Recipient Portal | /recipient |
| --- | *separator* | --- |
| Megaphone | Your fundraisers | /my-fundraisers |
| Heart | Your impact | /my-impact |
| --- | *separator* | --- |
| Settings | Account settings | /settings |
| --- | *separator* | --- |
| LogOut | Sign out | *action* |

---

### Files to Modify

| File | Change |
|------|--------|
| `src/components/layout/Navbar.tsx` | Add Donor Portal and Recipient Portal menu items to both desktop dropdown and mobile menu |

---

### Technical Details

**Desktop dropdown additions (after Profile, before Your fundraisers):**
```tsx
<DropdownMenuSeparator />

<DropdownMenuItem onClick={() => navigate('/donor')}>
  <DollarSign className="w-4 h-4 mr-3" />
  Donor Portal
</DropdownMenuItem>
<DropdownMenuItem onClick={() => navigate('/recipient')}>
  <Gift className="w-4 h-4 mr-3" />
  Recipient Portal
</DropdownMenuItem>
```

**Mobile menu additions (after Profile button, before Your fundraisers):**
```tsx
<Button 
  variant="outline" 
  className="w-full justify-start gap-2" 
  onClick={() => { navigate('/donor'); setMobileMenuOpen(false); }}
>
  <DollarSign className="w-4 h-4" />
  Donor Portal
</Button>
<Button 
  variant="outline" 
  className="w-full justify-start gap-2" 
  onClick={() => { navigate('/recipient'); setMobileMenuOpen(false); }}
>
  <Gift className="w-4 h-4" />
  Recipient Portal
</Button>
```

---

### Result

After this change, when any logged-in user clicks "My Account":
- They will see both **Donor Portal** and **Recipient Portal** options
- Clicking Donor Portal takes them to `/donor` with donation features
- Clicking Recipient Portal takes them to `/recipient` with verification, coupons, and loyalty card features
- Users have full control to access both sides of the platform

