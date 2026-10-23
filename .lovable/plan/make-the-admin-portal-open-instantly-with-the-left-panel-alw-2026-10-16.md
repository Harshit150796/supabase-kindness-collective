# Make the admin portal open instantly, with the left panel always visible

## What is going wrong (confirmed in the code)

Every admin page builds the whole portal again from scratch when you click a link:

1. **The left panel is part of each page, not the portal.** Each page draws its own copy of the panel, so while the next page loads there is no panel at all.
2. **A full-screen "Loading..." replaces everything** while the next page's code downloads (shared app-wide loading screen).
3. **The access checks re-run on every click.** The US-location check starts in a "Checking access..." state and the sign-in/role check can show its own full-screen "Loading..." — so each switch can flash two blank screens before the page appears.
4. **Data is thrown away between visits.** Lists are re-fetched from zero every time you return to a tab, so going back to Donations or Fundraisers waits again.
5. **Console warnings** on Donations (the donation side panel and status labels) indicate parts that can misbehave when opened.

## The fix

- **One portal frame for all admin pages.** The left panel, top bar, search and notifications stay on screen permanently; only the middle area changes.
- **Loading happens inside the middle area only**, as a light skeleton of the page, never a blank screen. The panel never disappears.
- **Access checks run once** when you enter the admin portal, not on every click. Same rules (admin/staff/viewer, admin-only pages, US check for non-admins) — nothing is loosened.
- **Instant switching:** the code for all admin pages is fetched quietly in the background right after the portal opens, and also when you hover a link in the panel. Clicking then shows the page with no wait.
- **Keep recent data for a short while** (about 1 minute) so returning to a tab shows its list immediately and refreshes quietly behind the scenes. Previous page of results stays visible while the next page loads (no flicker when paging or sorting).
- **Smooth transition:** a short fade (about 150ms) between tabs instead of a hard flash, plus a thin progress bar at the top while anything is loading.
- **Errors stay contained:** if one page fails, a small "Couldn't load this section — Retry" appears in the middle area; the panel and other tabs keep working.
- **Fix the Donations warnings** (donation side panel and status labels).

## Full check of every operation

After the change, open each of the ~28 admin pages signed in as the admin account, in both wide and the current small window size, and confirm: page opens, panel stays, no errors, buttons/drawers open. Any page that is actually broken gets fixed in the same pass and listed in the reply.

## Technical details

- `App.tsx`: replace the per-route `GeoGuard`/`ProtectedRoute` wrappers for `/admin/*` with one parent layout route (`<Route path="/admin" element={<AdminShell/>}>` with nested children). AdminShell = GeoGuard(strict) + ProtectedRoute(TEAM) + AdminLayout + `<Suspense fallback={<PageSkeleton/>}><Outlet/></Suspense>` inside the content area, wrapped in a route-keyed ErrorBoundary. Admin-only children (`moderation`, `users`, `audit`) keep an inner role gate. Redirect route for `/admin/fundraisers/manage` preserved.
- `DashboardLayout`: when on `/admin`, render children only (frame already provided by the shell), so all existing pages work unchanged.
- `GeoGuard` strict: cache the allowed result for the session (module-level) so remounts never return to "checking".
- Prefetch: a list of the admin `import()` loaders, called on idle after shell mount and on link `onMouseEnter`/`onFocus` (reuse `src/lib/idlePrefetch.ts`).
- React Query: admin queries get `staleTime: 60_000` and `placeholderData: keepPreviousData` in `useAdminPaged` and shared admin hooks; global default left unchanged for the public site.
- Move the inner `Nav` component out of AdminLayout's render body so it isn't recreated every render.
- Fix the forwardRef warnings in `DataTable.tsx` StatusBadge and `AdminDonations.tsx` DonationDrawer.
- Update `src/pages/admin/AGENTS.md` with the rule: admin pages render inside a single nested AdminShell route; pages must not add their own guards.
- No database, permission, or publishing changes.
