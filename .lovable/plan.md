

## Plan: Show Recipient Portal for Dual-Role Users

### Current Situation

Your account `aayushit0192@gmail.com` already has everything set up correctly:
- Has both `donor` and `recipient` roles
- Has a loyalty card (LC-D009AC52)
- Has a pending verification (type: "yourself")

**The problem**: The dashboard checks `donor` role before `recipient`, so you always see the Donor Portal.

---

### Solution

Update the role priority in `DashboardLayout.tsx` to check `recipient` BEFORE `donor`.

---

### File: `src/components/layout/DashboardLayout.tsx`

**Change 1: Update role checking order (lines 27-52)**

From:
```typescript
if (hasRole('donor')) {
  return [...donor items...];
}
return [...recipient items...];
```

To:
```typescript
if (hasRole('recipient')) {
  return [...recipient items...];
}
return [...donor items...];
```

**Change 2: Update role label (line 55)**

From:
```typescript
const roleLabel = hasRole('admin') ? 'Admin' : hasRole('donor') ? 'Donor' : 'Recipient';
```

To:
```typescript
const roleLabel = hasRole('admin') ? 'Admin' : hasRole('recipient') ? 'Recipient' : 'Donor';
```

---

### Result After Implementation

When you log in to `aayushit0192@gmail.com`, you will see:

| Sidebar Item | Route |
|--------------|-------|
| Dashboard | `/recipient` |
| Coupons | `/recipient/coupons` |
| Loyalty Card | `/recipient/loyalty-card` |
| History | `/recipient/history` |
| **Verification** | `/recipient/verification` |

The Verification page (`/recipient/verification`) shows all the options:
- Income-Based Assistance
- Disability Support
- Senior Citizen
- **Student**
- **Veteran**
- Other Assistance Program

---

### Files to Modify

| File | Change |
|------|--------|
| `src/components/layout/DashboardLayout.tsx` | Swap recipient/donor priority in `getNavItems()` and `roleLabel` |

