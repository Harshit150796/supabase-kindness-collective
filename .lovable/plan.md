

## Fix: Admin Account Login Failure

### Root Cause

The migration that created the admin account only set a subset of columns in `auth.users`. Supabase's authentication engine (GoTrue) expects several text columns to contain empty strings (`''`), not NULL. Specifically, these columns were left as NULL:

- `email_change`
- `phone`
- `phone_change`
- `phone_change_token`
- `email_change_token_new`
- `email_change_token_current`
- `reauthentication_token`

When the system tries to log in the admin user, it scans these columns and crashes because it can't convert NULL to a Go string.

### Fix

Run a new database migration that updates the existing admin user row to set all these columns to empty strings:

```sql
UPDATE auth.users
SET
  email_change = '',
  phone = '',
  phone_change = '',
  phone_change_token = '',
  email_change_token_new = '',
  email_change_token_current = '',
  reauthentication_token = '',
  email_change_confirm_status = 0,
  is_sso_user = false
WHERE email = 'admin@coupondonation.com';
```

### What This Changes

| What | Details |
|------|---------|
| Files modified | 1 new migration SQL file |
| No code changes | The frontend Auth page already works correctly |
| After the fix | Login with `admin@coupondonation.com` / `Admin@123` will work and redirect to `/admin` |

### Login Instructions (After Fix)

1. Go to `/auth`
2. Make sure the "Sign In" tab is selected
3. Email: `admin@coupondonation.com`
4. Password: `Admin@123`
5. You'll be redirected to the admin dashboard with full CMS access

