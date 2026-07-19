# Stripe Readiness — Finish Scrub + Fresh Diagnose

Two workstreams, both fully executable by me. No Cloudflare or ownership-% work here (those are still on you — see hand-off notes at the end).

---

## Part A — Finish UI / legal scrub

Complete the pending cleanup from the previous plan so nothing international remains visible to the Stripe underwriter.

1. **`src/pages/FeaturedStoryDetail.tsx`**
   - Remove imports and `imageMap` entries for the three deleted international stories (`childrens-hope`, `rural-family`, `children-of-heroes`).
   - Keep only the `hurricane-relief` mapping.
   - Confirm the page still renders when the storyKey is `hurricane-relief`; add a graceful fallback if an unknown key hits the route.

2. **`src/pages/admin/AdminStories.tsx`**
   - Change the location input placeholder from `"e.g. Port-au-Prince, Haiti"` to `"e.g. Asheville, NC"`.

3. **`src/lib/countryNames.ts`**
   - Trim the `COUNTRY_NAMES` map to `us` only (keep the function signature and fallback behavior identical so existing callers still work for legacy rows).

4. **Legal pages — bump "Last updated" to July 19, 2026**
   - `src/pages/Terms.tsx`
   - `src/pages/Privacy.tsx`
   - `src/pages/Cookies.tsx`

5. **Full-repo cash-language grep** (read-only pass, then targeted edits if hits found)
   - Search: `cash transfer`, `wire transfer`, `send money`, `Venmo`, `PayPal`, `cash grant`, `cash aid`, `direct payment to recipient`.
   - Reword any hit that implies raw currency routing to recipients. Existing "we do NOT distribute cash" statements in Terms stay as-is.

6. **`src/data/impactStories.ts`** — verify no remaining Poland/Haiti/Ukraine references outside the already-cleaned featured section. Remove any stragglers.

## Part B — Fresh Stripe diagnose snapshot

7. Invoke the existing `stripe-account-diagnose` edge function via `supabase--curl_edge_functions`.
8. Paste the returned JSON (account id, charges_enabled, capabilities, requirements, disabled_reason) directly into chat, formatted for copy-paste into the Stripe support ticket.

## Verification

- Re-read each edited file to confirm no international copy remains.
- Grep the repo one more time for `Haiti|Ukraine|Poland|Port-au-Prince|Rzeszów|Slava` — expect zero hits in `src/`.
- Confirm the diagnose JSON returns HTTP 200 and includes a `charges_enabled` field.

## Hand-off (still on you — I cannot do these)

- **Cloudflare WAF rule** — Dashboard → `coupondonation.com` → Security → WAF → Custom rules → `(ip.geoip.country ne "US")` → Block. Lovable has no Cloudflare API access.
- **Ownership %** — reply "Me: X%, Paul: Y%, other ≥25%: none/…" and I'll drop it into the Stripe support email.

## Not doing this pass

- No Stripe billing-country guard in the edge function (you deselected it).
- No changes to migrations, `types.ts`, admin RBAC, or the Stripe webhook.
- No deletion of real donor/fundraiser data.
