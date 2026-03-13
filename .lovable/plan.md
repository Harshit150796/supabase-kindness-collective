

## Admin Fundraiser Management Page

You're right -- the admin panel currently has no way to manage the real fundraisers that users create. You can only manage CMS "impact stories" (which are editorial content), but the actual fundraiser campaigns in the `fundraisers` table have no admin interface. Here's the plan to add a comprehensive fundraiser management page.

### What gets built

A new `/admin/fundraisers` page with full CRUD and moderation capabilities:

**Dashboard stats bar:**
- Total fundraisers, active, pending review, paused/completed
- Total amount raised across all campaigns

**List view with:**
- Search by title, story, organizer
- Filter by status (all / active / pending / paused / completed)
- Filter by category (food, household, health, childcare, education, utilities, other)
- Sortable columns (date created, amount raised, goal, donors count)
- Pagination

**Each fundraiser row shows:**
- Cover image thumbnail
- Title, category badge, status badge
- Organizer email (joined from profiles)
- Progress bar (raised vs goal)
- Donor count, country
- Created date
- Action buttons: View public page, Edit, Change status, Delete

**Edit dialog (full fundraiser editing):**
- Title, story (textarea)
- Category, beneficiary type
- Monthly goal, amount raised, donors count
- Country, zip code
- Cover photo URL
- Status dropdown (pending / active / paused / completed)
- Long-term toggle

**Bulk actions:**
- Select multiple fundraisers
- Bulk activate, pause, or delete

**Delete confirmation:**
- AlertDialog before any deletion (consistent with other admin pages)

### Files changed

1. **New file: `src/pages/admin/AdminFundraisers.tsx`** -- The full management page, following the same patterns as `AdminStories.tsx` (search, filters, dialog form, AlertDialog delete, bulk actions)

2. **`src/App.tsx`** -- Add route: `/admin/fundraisers` with admin ProtectedRoute, import the new page

3. **`src/pages/admin/AdminDashboard.tsx`** -- Add "Fundraisers" to `platformActions` array with stats card showing active/pending counts. Add fundraiser counts to `AdminStats` and `fetchStats`

4. **`src/components/layout/DashboardLayout.tsx`** -- Add "Fundraisers" nav item to admin sidebar (between Coupons and Analytics)

### RLS note

The existing RLS policies already allow admins full SELECT and UPDATE on `fundraisers`. However, admins currently cannot DELETE fundraisers they don't own. A new migration will add an admin DELETE policy.

### Migration

```sql
CREATE POLICY "Admins can delete all fundraisers"
ON public.fundraisers FOR DELETE
TO public
USING (has_role(auth.uid(), 'admin'::user_role));
```

### Technical approach

- Fetches fundraisers with a join to `profiles` (for organizer email/name) and `fundraiser_images`
- Uses `@tanstack/react-query` for data fetching with invalidation on mutations
- Follows the exact same UI patterns as AdminStories (Card layout, search bar, category tabs, dialog form, AlertDialog, bulk selection, toast notifications)
- Links each fundraiser to its public page (`/f/:slug`) via external link icon

