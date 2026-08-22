# Relax geo-fencing for recipient applications

## What's blocking you

`/apply` and all `/recipient/*` routes are wrapped in `GeoGuard` (`src/App.tsx`). The guard calls `getUserCountry()` (`src/lib/geo.ts`), which asks ipapi.co and then api.country.is, and redirects to the home page with an error toast for any country code that isn't exactly `US`. It fails open only when both lookups fail or time out.

With a US VPN this can still block you: many VPN exit ranges are geolocated inaccurately or flagged by these free IP databases, and if the first provider answers with a non-US code the guard blocks even though your traffic is US-exit. The lookup is also cached for an hour in `sessionStorage`, so an early bad answer sticks for the rest of the session.

## What to change

Split the guard into two strictness levels instead of one hard block:

**Advisory (recipient side)** — `/apply`, `/my-fundraisers`, `/fundraiser/:id`, and `/recipient/*` stop redirecting. A non-US lookup shows a one-time informational toast ("Vouchers are redeemable at US retailers only") and lets the user continue. Risk stays low because coupons are only redeemable at US stores, and the actual eligibility control remains the manual document review in `recipient_verifications`.

**Strict (admin only)** — `/admin/*` keeps the redirect behavior for everyone *except* users who already hold the `admin` role: the guard checks roles from `useAuth()` first and skips the geo check for admins, so you can sign in from India (or anywhere) without being redirected. Admin access stays protected by the existing role check in `ProtectedRoute` plus RLS, which is the real control; the geo redirect only stops non-admin traffic from probing admin URLs.

Implementation: add a `mode` prop to `GeoGuard` (`"advisory" | "strict"`, defaulting to advisory), and pass `mode="strict"` on the admin routes in `App.tsx`. Advisory mode renders children immediately with no "Checking access..." screen — the lookup runs in the background purely to decide whether to show the notice, so there's no added load delay on the apply flow.

Also make the lookup less sticky: don't cache a *non-US* result, so a single bad IP-database answer can't follow the user around for an hour.

Nothing changes for donors — donation routes were never gated.

## Compliance note

This weakens what we described to Stripe as "IP blocking & geo-fencing" on beneficiary onboarding. It remains true for the admin surface, and beneficiary eligibility is still enforced by document review before any voucher is issued, but if Stripe asks specifically about onboarding geo-restriction, the accurate answer becomes "US-only enforced at verification review, with an IP-based advisory notice at onboarding." Worth knowing before we say anything further to them.

## Technical details

- `src/components/auth/GeoGuard.tsx` — add `mode` prop; advisory path returns children right away and fires the toast from the resolved promise; strict path keeps the checking state and `<Navigate to="/" replace />`.
- `src/lib/geo.ts` — only `writeCache` when the resolved country is `US` or `null`.
- `src/App.tsx` — add `mode="strict"` to the 14 `/admin/*` route guards; leave the recipient/apply guards as-is (they inherit advisory).
- Verify by loading `/apply` with a simulated non-US lookup and confirming the wizard renders with a toast instead of redirecting.
