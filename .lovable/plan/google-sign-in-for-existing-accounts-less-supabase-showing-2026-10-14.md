# Google sign-in for existing accounts + less "Supabase" showing

## Part 1 — Let existing email accounts sign in with Google

1. Find the real reason the last attempt failed: read the `error_description` Google/Supabase sends back (it is currently thrown away and replaced with "cancelled or failed"), and check the Supabase auth logs for haagrawa123@gmail.com.
2. Most likely cause: Supabase only links a Google login to an existing account when that account's email is marked "confirmed". Because we use our own email codes, older accounts may not be marked confirmed, so Supabase refuses (or the signup trigger errors on the duplicate email).
3. Fix (additive, safe):
   - One-time update marking accounts as confirmed if they already passed our email-code check, so Google links to the same account instead of creating a new one.
   - Make the new-user trigger tolerate an email that already exists in profiles/subscribers (never block sign-in).
   - Show the real error message on the login page instead of the generic toast, and a friendly "this email already has an account — sign in with your password once, then Google will work" fallback if linking still fails.
   - Add "Connect Google" in Settings so signed-in users can link Google to their account manually (Supabase identity linking; needs "Manual linking" switched on in Supabase → Authentication → Providers settings — I'll tell you exactly where).
4. Test: sign in with Google as haagrawa123@gmail.com and confirm it lands in the same dashboard, same donations, no duplicate account.

## Part 2 — Show "Supabase" as little as possible (free plan)

What we can remove:
- Google consent screen name/logo: set app name "CouponDonation", logo, home page, privacy and terms links in Google Cloud → OAuth consent screen (Branding), then publish. Google then shows "Sign in to continue to CouponDonation" in most places. Free, ~10 min, I'll give step-by-step.
- Any Supabase wording inside our own pages, emails and error messages: I'll scan the site and emails and replace with CouponDonation wording.

What cannot be removed on the free plan:
- The address bar flashes `vbnbacowuoeeojjdrzzp.supabase.co` for about a second, and Google may show the domain in small text under "Google will allow…". Only the paid custom auth domain (auth.coupondonation.com) removes this. Option kept open for later.

## Technical details
- Auth.tsx: surface `error_description` from URL query/hash.
- Migration: `update auth.users set email_confirmed_at = coalesce(email_confirmed_at, created_at)` only for users with a verified OTP record; harden `handle_new_user` with ON CONFLICT on profiles/email_subscribers.
- Settings: `supabase.auth.linkIdentity({ provider: 'google' })` + list identities via `getUserIdentities()`.
- No publish.
