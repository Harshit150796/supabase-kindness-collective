
# Stripe Underwriter Readiness Plan

Goal: before the Stripe human underwriter opens the live site + database, remove every discrepancy between our stated model (US-only, essentials-only, no cash) and what they can actually see. Four mandatory workstreams below — I'll do everything that lives in code + database and hand you the exact steps for the two items that must happen in external dashboards (Cloudflare + ownership numbers).

---

## Step 1 — Purge international test data (code + DB)

Underwriter risk: staging content showing Haiti / Ukraine / Poland campaigns on a site that claims US-only operation is an instant red flag.

Verified findings from the current project:

**Database — `fundraisers` table (11 rows to fix):**
- 1 row with `country = 'ca'` → *"Help Feed My Family This Month"* (id `6314054e…`)
- 2 rows with `country` field misused to store a US city instead of country code: `"Syracuse, NY"`, `"Boston, NY"`
- 8 rows with `country = 'us'` (correct, kept)

**Code — hardcoded international sample data:**
- `src/data/featuredStories.ts` — 3 entries with `location: 'Poland' | 'Haiti' | 'Ukraine'`
- `src/data/impactStories.ts` — 4 entries referencing Poland / Haiti / Ukraine (plus long narrative paragraphs, "Slava Ukraini" supporter, Rzeszów location updates, etc.)
- `src/pages/admin/AdminStories.tsx` — placeholder text `"e.g. Port-au-Prince, Haiti"` in the location input
- `src/lib/countryNames.ts` — `pl: 'Poland'` (and likely other non-US entries)

Actions:
1. **DB cleanup (via `supabase--insert`):**
   - `UPDATE fundraisers SET country = 'us' WHERE country IN ('ca')` → convert the Canada row to US (or delete it if it's clearly test data; will confirm with you before running).
   - `UPDATE fundraisers SET location = country, country = 'us' WHERE country IN ('Syracuse, NY','Boston, NY')` — move the city into `location` and set country back to `us`.
   - No production coupons or donations reference these rows unsafely; verified via schema.
2. **Code cleanup:**
   - Replace the 3 international entries in `featuredStories.ts` with US-based stories (Detroit, New Orleans, Appalachia region) using the same schema.
   - Same treatment for `impactStories.ts` — rewrite the 4 international narratives as US stories with US supporter names, US timeline events, US cities.
   - Change `AdminStories.tsx` placeholder to `"e.g. Syracuse, NY"`.
   - Trim `src/lib/countryNames.ts` to US only (or leave the map but stop exposing non-US countries in any UI dropdown — I'll confirm which after reading the file).
3. **Brand/retail check:** search `public/brands/` and `src/data/brandLogos.ts` for any non-US retailer logos; the current list is already US-only (Walmart, Kroger, DoorDash, CVS, etc.), so nothing to remove — will re-confirm as a sanity pass.

---

## Step 2 — Cloudflare Geo-blocking (you drive, I document)

This must happen in your Cloudflare Dashboard — I have no API access. Exact steps to hand you as a checklist:

1. Cloudflare Dashboard → select `coupondonation.com`.
2. **Security → WAF → Custom rules → Create rule**.
3. Name: `Block non-US traffic`.
4. Expression (Edit expression):
   ```text
   (ip.geoip.country ne "US")
   ```
5. Action: **Block** (recommended) — or **Managed Challenge** if you want to allow VPN users to prove humanity. Underwriter language works either way; "Block" is stronger.
6. Deploy.
7. Add a second rule *above* it to allow specific ops IPs (yours, mine for testing) so we don't lock ourselves out:
   ```text
   (ip.src in {YOUR.IP.ADDR.ESS})
   ```
   Action: **Skip → All remaining custom rules**.

After you deploy, I'll add a small server-side backstop in `create-donation-checkout` that rejects non-US billing country at the Stripe Checkout layer (defense in depth if someone bypasses Cloudflare via a US-based VPN). This is a ~10-line change to the existing edge function.

---

## Step 3 — Ownership percentages (you + Paul align, I insert into the email)

Cannot be resolved in code. Two things needed from you before I regenerate the Stripe email:

1. Your ownership % of the legal entity.
2. Paul's ownership % of the legal entity.
3. Whether any other person owns ≥25% (Stripe's beneficial-owner threshold).

Once you paste those numbers in chat, I'll drop them into the previously-drafted Stripe support email (Question 2 placeholders) and re-post the finalized email in chat, ready to send. No code changes.

---

## Step 4 — Website footer + legal copy audit

Verified current state of `src/pages/Terms.tsx`:
- Line 21: `Last updated: June 18, 2026` → needs bump to today's date (**July 19, 2026**).
- Section 2 already says *"We do not distribute physical cash"* ✅
- Section 5 already says *"No direct cash transfers are distributed to recipients"* ✅
- Section 5.1 already says *"we cannot process standard cash refunds"* ✅

Actions:
1. Update `Last updated` in `Terms.tsx` → `July 19, 2026`.
2. Same audit + date bump on `src/pages/Privacy.tsx` and `src/pages/Cookies.tsx`.
3. Grep the whole codebase for the phrases `cash transfer`, `wire`, `send money`, `Venmo`, `PayPal`, `cash grant`, `cash aid`, `direct payment to recipient` — remove or reword any hit that implies raw currency routing to recipients. (Preliminary grep of legal pages shows only the three *correct* denial statements above; will do a full-repo pass during implementation.)
4. Confirm the Footer's contact/company block still reads `United States` (verified — `src/components/layout/Footer.tsx` line 60 ✅).

---

## Execution order (once you approve)

1. Ask you the 3 questions I can't resolve alone: (a) delete vs. relocate the `ca` fundraiser, (b) your + Paul's ownership %, (c) confirm your ops IP for the Cloudflare allow rule.
2. Run the DB cleanup via `supabase--insert`.
3. Rewrite `featuredStories.ts`, `impactStories.ts`, `AdminStories.tsx`, `countryNames.ts`.
4. Bump `Last updated` on all three legal pages + full-repo cash-language grep.
5. Add the US-billing-country guard to `create-donation-checkout` edge function.
6. Regenerate the Stripe support email in chat with your ownership numbers filled in.
7. Hand you the Cloudflare checklist (Step 2) — you deploy on your end and confirm.

## Not doing

- No changes to Stripe integration logic beyond the US-billing-country guard.
- No touching migration files, `types.ts`, or admin RBAC.
- Not deleting user data or real donations — cleanup is scoped to test/international rows only.
