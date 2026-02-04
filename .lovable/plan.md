

## Plan: Ensure All Users Have Both Donor and Recipient Roles

### Problem Analysis

The database shows several accounts with incomplete role assignments:

| Email | Roles | Issue |
|-------|-------|-------|
| aayushit0192@gmail.com | recipient, donor | OK |
| aashiii1424@gmail.com | recipient only | Missing donor |
| jackass6745@gmail.com | recipient only | Missing donor |
| survivorstruggler@gmail.com | donor only | Missing recipient |
| vish3544@gmail.com | recipient only | Missing donor |
| cristiano0907977@gmail.com | donor only | Missing recipient |
| connect.coupondonation@gmail.com | donor, recipient | OK |

**Root cause**: The Auth.tsx signup only assigns the selected role, not both roles.

---

### Solution: Three-Part Fix

#### Part 1: Fix Auth.tsx to Assign Both Roles

**File: `src/pages/Auth.tsx`**

Modify the `handleOTPVerified` function to pass the second role as `additionalRoles`:

**Current code (line 137-142):**
```typescript
const { error: signupError } = await signUp(
  signupEmail,
  signupPassword,
  signupFullName,
  targetRole  // Only assigns one role
);
```

**New code:**
```typescript
// Determine the additional role (opposite of selected)
const additionalRole = targetRole === 'donor' ? 'recipient' : 'donor';

const { error: signupError } = await signUp(
  signupEmail,
  signupPassword,
  signupFullName,
  targetRole,
  [additionalRole]  // Now assigns both roles
);
```

---

#### Part 2: Backfill Missing Roles for Existing Accounts

Run a SQL migration to add missing roles to all existing users:

```sql
-- Add missing donor roles
INSERT INTO user_roles (user_id, role)
SELECT u.id, 'donor'::app_role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = u.id AND ur.role = 'donor'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Add missing recipient roles
INSERT INTO user_roles (user_id, role)
SELECT u.id, 'recipient'::app_role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = u.id AND ur.role = 'recipient'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Add missing loyalty cards for recipients without one
INSERT INTO loyalty_cards (user_id, card_number)
SELECT u.id, 'LC-' || UPPER(SUBSTR(MD5(u.id::text), 1, 8))
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM loyalty_cards lc
  WHERE lc.user_id = u.id
)
ON CONFLICT DO NOTHING;
```

---

#### Part 3: Add Database Trigger for Future-Proofing (Optional)

Create a trigger that automatically ensures both roles exist whenever a user is created or a role is added:

```sql
-- Function to ensure both roles exist
CREATE OR REPLACE FUNCTION ensure_dual_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- When a donor role is added, ensure recipient exists
  IF NEW.role = 'donor' THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.user_id, 'recipient')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  -- When a recipient role is added, ensure donor exists
  IF NEW.role = 'recipient' THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.user_id, 'donor')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run after role insert
CREATE TRIGGER tr_ensure_dual_roles
AFTER INSERT ON user_roles
FOR EACH ROW
EXECUTE FUNCTION ensure_dual_roles();
```

---

### Implementation Summary

| Component | Action | Purpose |
|-----------|--------|---------|
| `src/pages/Auth.tsx` | Add `additionalRole` parameter to signUp call | Fix new signups from Auth page |
| SQL Migration | Insert missing donor/recipient roles | Fix existing accounts |
| SQL Trigger (optional) | Auto-add opposite role on insert | Future-proof the system |

---

### Files to Modify

1. **src/pages/Auth.tsx** - Add additional role assignment in handleOTPVerified

### Database Changes

1. **Run SQL backfill** - Add missing roles and loyalty cards to existing accounts
2. **Create trigger (optional)** - Auto-ensure dual roles on role insert

---

### Result After Implementation

- **survivorstruggler@gmail.com** will gain `recipient` role and can access Recipient Portal
- **aashiii1424@gmail.com**, **jackass6745@gmail.com**, **vish3544@gmail.com** will gain `donor` role
- **All future signups** (from Auth page or Apply flow) will automatically get both roles
- **Every user** can access both Donor Portal and Recipient Portal from My Account menu

