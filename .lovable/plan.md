# Growth, proof and Gold Coins — plan (items 0–7)

## 0 — How production is deployed (report only, already checked)
- coupondonation.com and dreamweave-supabase.lovable.app return identical hosting headers (`server: cloudflare`, Lovable `x-deployment-id`). The domain is served by **Lovable hosting**, which runs on Cloudflare. It is not served by Vercel.
- Publishing from Lovable **will** update coupondonation.com, www and the lovable.app URL with the current frontend. Backend changes (database, edge functions) are already live.
- Publishing **will not** run `vercel.json` or `api/share/[slug].js`. Those files do nothing on Lovable hosting, so crawler link previews for `/f/:slug` fall back to the static `index.html` tags. The Supabase `share-fundraiser` function is still available as a backup.
- I will check GitHub and Vercel connections in project settings and report what I find. I will not publish.
- Follow-up (needs approval): correct the AGENTS.md rule about Vercel, and choose a per-campaign preview approach that works on Lovable hosting.

## 1 — Start a fundraiser + /partners
- Add a "Start a fundraiser" link to the navbar (desktop and mobile), beside the homepage campaign heading, and as a final "Start your own" card on the homepage carousel and the /stories grid. All of them link to the existing creation flow.
- New /partners page: how organizations run consent-based campaigns for families they already serve, what CouponDonation provides, and an inquiry form. No partner names.
- New table `partner_inquiries` (anon can submit but not read; admins can read). The form is validated in the browser, and the database enforces length limits.
- The dispatcher polls new inquiries, creates an auto-task (source key dedupe) and adds them to the digest email to connect.coupondonation@gmail.com. The admin portal gets a new "Partner inquiries" view.

## 2 — Required, guided photo step
- A shared `PhotoPicker` gives guidance, a canvas crop to the card ratio (16:10, built without new packages), a live card preview and a warning when the short edge is under 800px. Output goes through the existing single-WebP upload.
- Used in the application StoryStep and the organizer ImageUploadModal.
- Submission is blocked without a photo, with a plain explanation of why. The organizer dashboard blocks removing the last photo. Live fundraisers are unaffected.

## 3 — Need pages (SEO)
- Real categories: `food` (4), `utilities` (2), `health` (1).
- Mapping:
  - food assistance and grocery assistance → `food`
  - help paying bills → `utilities`
  - healthcare assistance → `health`
  - transportation, emergency and essentials → all categories, with honest copy (no dedicated category exists)
- Route `/help/:need` with seven slugs. Each page has an H1, an accurate explainer, live campaigns using the shared FundraiserCard, an empty state, a FAQ, links to the other need pages, a unique title, description and canonical URL, and FAQPage/CollectionPage JSON-LD.
- Add the pages to the sitemap, footer links and homepage category chips.

## 4 — Completed campaigns and proof figures
- Completion state: there is no `completed` status, so a campaign counts as completed when computed completed donations reach `monthly_goal`, or when its status is `completed` (if one is ever set). I will report this rule.
- New security-definer read functions:
  - `get_completed_fundraisers()`: totals, coupons issued and coupons redeemed per campaign (aggregate counts only)
  - `get_proof_stats()`: coupons issued and redeemed this month, site-wide
- Zero figures are omitted. Sections are hidden when empty.

## 5 — Testimonial collection
- Add nullable columns to `cms_testimonials`: `status` (default 'approved' for existing rows, 'pending' for new submissions), `submitted_by`, `is_anonymous`, `consent_at`.
- A `submit-testimonial` edge function enforces sign-in, consent, a 300-character limit and HTML stripping. It inserts the submission unpublished and creates an admin task.
- The form appears on the success page and both dashboards. Recipients default to anonymous.
- The admin Testimonials page gets a pending filter and an approve action. The public section shows only published rows.

## 6 — Gold Coins crediting
- Rate: 10 coins per $1. This comes from DonationFlow's `amount * 10`. Fractional cents are floored.
- New tables:
  - `gold_coin_ledger`: unique on `donation_id`; fields user_id (nullable), donor_email, coins, status credited/pending, credited_at
  - `gold_coin_state`: watermark
- New security-definer function `credit_gold_coins()`. In one transaction it runs `INSERT … ON CONFLICT (donation_id) DO NOTHING RETURNING` and then updates `loyalty_cards.points_balance` only for the rows that were inserted. Donations are read-only.
- Guest donations are recorded as pending. `claim_gold_coins()` is called on sign-in and matches only when `auth.users.email_confirmed_at` is set and the email matches.
- The dispatcher calls `credit_gold_coins()` every run. A backfill runs once and writes an audit log entry.
- UI: real balance in the donor dashboard, the success-page message ("credited within a few minutes"), and a read-only admin ledger view.
- Proof: run the function twice and confirm the second run inserts 0 rows. I will report coins credited, donors credited and pending guest credits.

## 7 — Pre-publish smoke test
- Playwright, signed out, at 390px and 1440px: homepage, /stories, a campaign page, all seven need pages, /partners and /auth.
- Start a donation and stop at the hosted Stripe or Square page without paying.
- Confirm signed-out visitors are rejected from /admin. Collect console errors. Report each check as pass, fail or unverified.

## Technical rules
- Additive schema only. No payment-table triggers. No changes to webhooks, checkout or coupon issuance. Hero and tree untouched. No new packages.
- roadmap.md is ticked after each item.
