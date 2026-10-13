# Turn on visitor follow-ups with AI-written emails

## Why you see nothing yet
The Follow-ups page has no visitor types yet. It was set to wait a few weeks for visit data first, so there was nothing to approve. The plan fixes that now.

## 1. Make the page easy to find
- Check that Follow-ups appears in the Admin sidebar for your account and opens without errors. Fix it if it doesn't.

## 2. Create starter visitor types now
Six types, built from the pages people visit on the site:
- Ready to give (donate pages, fundraiser pages)
- Planning a fundraiser (start or apply pages)
- Learning how it works (How it works, FAQ, Every Dollar)
- Story reader (stories, featured stories)
- Possible partner (Partners page)
- Returning donor (signed in, giving history)

Each type gets a short base email that follows your account-mail style: "Hi {first name}," a few plain sentences, one link, "— The CouponDonation team". No amounts, brands, exclamation marks or promises about coupon counts.

## 3. AI writes each email for the person
- At send time, AI rewrites the approved base email for that person, using their first name and the pages they looked at.
- Strict rules: it keeps the same single link, adds no facts, numbers or promises, keeps the style rules above, and stays under about 120 words.
- If the AI fails or breaks a rule, the approved base email goes out instead.
- The exact text sent is saved in the send log, so you can read what each person got.
- This uses the built-in AI service, not your Astra key, and has no extra setup.

## 4. Approve and switch on
- I approve the six types and turn on Live sending for you. Every action is recorded in the audit log.
- The existing safety rules still apply: only people who ticked "Email me helpful updates", at most one email every 14 days, one per type, and unsubscribe always respected.

## 5. Test the full loop
- Send one real follow-up to haagrawa123@gmail.com through your live PostHog workflow, and check it arrives and gets a HubSpot note.
- You can switch Live sending off anytime on the Follow-ups page.

## Technical details
- Seed `followup_personas` with signals (path prefixes), subject, body, approved=true, by migration; set `admin_settings.followup_live_sending = true` and add an audit row.
- `followup-dispatch`: add a `personalize()` step calling Lovable AI Gateway (google/gemini-3-flash-preview), plus a validator in `_shared/followup-rules.ts` (single coupondonation.com link, no `$`/digits amounts, no `!`, length cap, sign-off present), with fallback to the base template. Store `sent_subject`/`sent_body` on `followup_sends` (additive columns). Tests for the validator and fallback.
- Pass first name from profiles when available; else "Hi there,".
- Redeploy followup-dispatch; nothing published.
