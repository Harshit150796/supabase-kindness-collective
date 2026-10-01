# Branded share previews on coupondonation.com (Vercel, free)

## Goal
When someone pastes `coupondonation.com/f/<slug>` into WhatsApp, Facebook, X, LinkedIn or a text message, the preview shows that fundraiser's own title, photo and summary. The link people see stays exactly `coupondonation.com/f/<slug>`. No Cloudflare, no new subdomain, no paid plan.

## Approach
Link-preview bots never run the website's code, so they only see the generic site tags. Vercel can tell bots apart from people by their browser signature and send bots to a small preview page instead. People are not affected and still get the normal fundraiser page.

```text
coupondonation.com/f/<slug>
   |-- person  -> normal fundraiser page (unchanged)
   |-- preview bot -> small Vercel function -> reads fundraiser from Supabase -> page with title, photo, summary
```

## Why not just use the existing Supabase share function
Supabase serves pages from its own functions as plain text, not as web pages, on its default address. Some preview bots then ignore the tags. A Vercel function on our own domain avoids this and costs nothing on Vercel's free tier. The Supabase function stays as a backup and is never shown to users.

## Steps
1. Add a Vercel function `api/share/[slug]` that:
   - cleans the slug, reads only `title`, `story`, `cover_photo_url`, `status` from the public fundraisers data with the public key;
   - returns a small web page with og/twitter tags, the canonical `coupondonation.com/f/<slug>` link, and a redirect for anyone who lands there;
   - falls back to the generic CouponDonation preview if the fundraiser is missing or not public;
   - caches for 5 minutes.
2. Update `vercel.json`: add a rewrite for `/f/:slug` that applies only when the visitor's signature matches known preview bots (facebookexternalhit, Facebot, Twitterbot, LinkedInBot, WhatsApp, Slackbot, TelegramBot, Discordbot, Pinterest, Googlebot, bingbot, Applebot, iMessage). Put it before the existing catch-all rewrite. Security headers stay as they are.
3. Keep share buttons on `coupondonation.com/f/<slug>` (already the case), so no change to the share sheet. Remove the "branded host" founder task from the roadmap.
4. Record in AGENTS.md: link previews come from the Vercel bot-only rewrite. Share URLs stay on the main domain.

## What the founder needs to do
Nothing in DNS. After this ships to GitHub, Vercel redeploys. Then:
- Confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` exist in the Vercel project's Environment Variables (the function reads them). Add them if missing and redeploy.
- Refresh old previews once in the Facebook Sharing Debugger and the LinkedIn Post Inspector. WhatsApp caches for a while, so a link shared before now may show the old preview.

## Verification
- Request `/f/<real-slug>` locally with a facebookexternalhit signature and confirm the HTML contains the fundraiser's og:title and og:image. With a normal browser signature, confirm the regular page loads.
- Live bot behaviour on coupondonation.com can only be confirmed after the Vercel deploy. Until then it is reported as unverified.

## Not changed
Payments, donations, tree, homepage, database.
