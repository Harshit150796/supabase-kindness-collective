# Google sign-up / sign-in + every account email on the mailing list

## What you get
- A "Continue with Google" button on the Sign in and Sign up screens. One click creates the account (or signs in) and lands on the dashboard, the same as email sign-up.
- New Google users get the same donor + recipient account, profile and welcome flow as everyone else. No role picker.
- Every account email (Google or email/password, new and existing) is automatically added to the email list in Admin → Newsletters → Subscribers, source "website_user" or "google".
- Anyone who unsubscribed stays unsubscribed: signing in again never re-adds them to optional emails.

## Steps
1. Google button: add to the Sign in and Sign up screens, styled to match the page. Handle cancel/errors with a clear message, and bring the person back to where they started (for example a donate page).
2. Return page: after Google, finish sign-in, show a short loading state, then send the person to the dashboard or their saved destination. The 15-minute idle and 24-hour limits still apply.
3. Account setup: make sure Google sign-ups get a profile (name and email from Google) and both roles, using the existing signup trigger. Test that it can't block signup.
4. Email list: an automatic database step adds each new account email to the subscriber list (skipped if it is already there or on the unsubscribe list). A one-time backfill adds every existing account email the same way.
5. Test a full Google sign-up, sign-out and sign-in on the preview, then check the email appears in Subscribers.

## What you need to do (once)
Your sign-in system is on your own Supabase account, so Google must be switched on there. I'll give you exact steps:
- In Google Cloud: create an OAuth client (Web), add the redirect address Supabase shows you.
- In Supabase → Authentication → Providers → Google: paste the Client ID and Secret.
- In Supabase → URL Configuration: add coupondonation.com, www.coupondonation.com and the preview address.

## Note on consent
US law (CAN-SPAM) allows emailing account holders as long as every message has a working unsubscribe link, which all newsletters already do. EU visitors normally need a tick box for marketing. The plan adds everyone, as you asked; tell me if you'd rather only add people who tick "Email me helpful updates".

## Technical details
- `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: origin + '/auth/callback?next=...' } })`; new public `/auth/callback` route uses `onAuthStateChange` + `getUser()`, clears local state on change.
- Verify `handle_new_user` reads `full_name`/`name`/`avatar_url` from Google metadata with empty-string fallbacks; `ensure_dual_roles` covers OAuth users.
- Additive migration: security-definer AFTER INSERT trigger on `public.profiles` inserting into `email_subscribers` (lower(email), ON CONFLICT DO NOTHING, skip rows in `email_suppressions`), wrapped in EXCEPTION so signup never fails; source 'google' when the provider is google. One-off backfill INSERT ... SELECT from profiles with the same rules. No UPDATE triggers.
- Custom OTP stays for email sign-up; Google users skip OTP (Google already verified the email).
- Nothing published.
