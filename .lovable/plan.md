## Goal
Application-level geo-fencing: allow global read + donate, restrict campaign creation, recipient onboarding, and admin dashboards to US IPs. Non-US visitors to restricted routes get redirected home with a toast.

## Approach

### 1. Country detection utility — `src/lib/geo.ts`
- `getUserCountry(): Promise<string | null>` with in-memory + `sessionStorage` cache (key `geo_country`, TTL 1h) so we hit the network at most once per session.
- Primary: `fetch('https://ipapi.co/json/')` → read `country_code`.
- Fallback: `fetch('https://api.country.is/')` → read `country`.
- Fail-open: on error/timeout (3s AbortController), return `null`. The guard treats `null` as "allow" so a broken lookup never locks legitimate US users out (safer than fail-closed given Stripe just needs a good-faith geo control, not an airtight one).

### 2. `GeoGuard` wrapper — `src/components/auth/GeoGuard.tsx`
- Client component. On mount, calls `getUserCountry()`.
- While loading: renders a lightweight centered "Checking access..." spinner (same style as `RouteFallback`).
- If country resolves and `country !== 'US'` (and not `null`): fires `toast.error("Campaign creation and beneficiary onboarding are currently restricted to United States residents.")` via sonner and `<Navigate to="/" replace />`.
- Otherwise renders `{children}`.
- Uses a module-level flag so the toast fires only once per session even if the user tries several restricted routes.

### 3. Route wiring — `src/App.tsx`
Wrap these routes with `<GeoGuard>`:
- Campaign creation / recipient onboarding: `/apply`, `/my-fundraisers`, `/fundraiser/:id`, `/recipient/*` (all 5 recipient routes).
- Donor write surfaces stay open — donating is explicitly global.
- All `/admin/*` routes (16 of them). GeoGuard sits *outside* the existing `ProtectedRoute` so the geo check runs first.

Left untouched (global read + donate):
- `/`, `/about`, `/how-it-works`, `/faq`, `/stories`, `/story/*`, `/f/:slug`, `/featured/*`, `/story-detail/*`, `/blog`, `/blog/:slug`, `/donate`, `/donation-success`, `/donation-cancelled`, `/auth`, `/reset-password`, `/privacy`, `/terms`, `/cookies`, all overlay routes.

Ambiguous — need your call (see question below): `/donor/*` and `/profile`, `/settings`, `/my-impact`.

## Files to change
- `src/lib/geo.ts` (new)
- `src/components/auth/GeoGuard.tsx` (new)
- `src/App.tsx` (wrap restricted routes)

## Out of scope
- No Cloudflare rule (you explicitly opted for app-level only).
- No server-side re-check in edge functions this pass — the existing `allowed_countries: ['US']` guard we added to `create-donation-checkout` is unrelated and stays as-is for the donor billing side.
- No VPN detection; ipapi/country.is only see the raw IP.
