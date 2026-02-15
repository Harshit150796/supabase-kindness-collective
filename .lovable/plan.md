

## Plan: Create Dedicated Admin Account with Full CMS Access

### The Challenge

There are a few constraints we need to work around:

1. **Supabase uses email-based login**, not usernames -- so the admin will log in with an email address
2. **Password "admin" is only 5 characters** -- Supabase requires a minimum of 6 characters, and the login form validates for 8. We need a password that meets these requirements while staying simple and easy to remember.

### Proposed Admin Credentials

| Field | Value |
|-------|-------|
| **Email** | `admin@coupondonation.com` |
| **Password** | `Admin@123` |
| **Name** | `CMS Admin` |
| **Role** | `admin` (+ donor + recipient for full access) |

The password `Admin@123` is short, memorable, and meets all validation rules (uppercase, lowercase, number, special character, 8+ chars). Your team member just goes to `/auth`, enters these credentials, and gets redirected straight to the admin dashboard.

**Important security note:** This password should be changed after first login in a production environment. For now it works for your team's internal CMS management.

### What the Admin Account Can Do

Once logged in, the admin lands on `/admin` and has access to:

| Sidebar Item | What they can do |
|-------------|-----------------|
| **Overview** | See platform stats at a glance |
| **Users** | View all users, promote others to admin |
| **Verifications** | Approve/reject recipient verification requests |
| **Coupons** | Manage coupon inventory |
| **Analytics** | View signup trends, donation charts, role breakdowns |
| **Content** | Edit hero text, CTA buttons, section titles on the website |
| **Stories** | Add/edit/delete impact stories with photos |
| **Testimonials** | Manage donor and recipient quotes |
| **Blog Posts** | Write, edit, and publish articles with cover images |
| **FAQ** | Add/edit/reorder questions and answers |

### How It Works Technically

We will create a **database migration** that:

1. Creates a new user in Supabase's `auth.users` table with email `admin@coupondonation.com` and password `Admin@123`
2. Creates a profile entry in the `profiles` table
3. Assigns three roles: `admin`, `donor`, and `recipient` in `user_roles`

This bypasses the normal signup flow (no OTP needed) since it's done directly in the database.

### Admin Users Page Enhancement

We'll also update the **Admin Users page** (`/admin/users`) so the admin can:

- See each user's current roles (donor, recipient, admin) as colored badges
- Click **"Make Admin"** to promote any user to admin
- Click **"Remove Admin"** to revoke admin access from other users
- This way, the first admin can grant CMS access to additional team members without touching code

### Login Flow

```
1. Go to /auth
2. Enter email: admin@coupondonation.com
3. Enter password: Admin@123
4. Click "Sign In"
5. Automatically redirected to /admin dashboard
6. Full sidebar with all CMS + analytics options
```

### Files to Create/Modify

| File | Change |
|------|--------|
| `supabase/migrations/[timestamp]_create_admin_account.sql` | SQL to create admin user, profile, and roles |
| `src/pages/admin/AdminUsers.tsx` | Add "Make Admin" / "Remove Admin" buttons |

### Migration SQL (What It Does)

The migration will:
- Insert a user into `auth.users` with the hashed password
- Insert a profile with name "CMS Admin" and email `admin@coupondonation.com`
- Insert three role entries: admin, donor, recipient
- Use `ON CONFLICT DO NOTHING` so it's safe to run multiple times

