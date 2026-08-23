# Enable Google sign-up / sign-in

Google sign-in buttons already exist in the UI, but nothing behind them works yet
except the one in the apply dialog. Two parts are needed: configuration you do in
your Google + Supabase dashboards, and code/database changes on my side.

## Part 1 — What you need to do (I cannot do this from here)

This project uses your own Supabase project, so the provider must be turned on there.

1. Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID →
   Web application.
   - Authorized JavaScript origins: `https://coupondonation.com`,
     `https://www.coupondonation.com`, `https://dreamweave-supabase.lovable.app`,
     `http://localhost:8080`
   - Authorized redirect URI:
     `https://vbnbacowuoeeojjdrzzp.supabase.co/auth/v1/callback`
   - Consent screen: add authorized domain `vbnbacowuoeeojjdrzzp.supabase.co`,
     scopes `userinfo.email`, `userinfo.profile`, `openid`, plus links to our
     Privacy Policy and Terms.
2. Supabase Dashboard → Authentication → Providers → Google: enable it and paste the
   Client ID and Client Secret.
3. Supabase Dashboard → Authentication → URL Configuration: Site URL
   `https://coupondonation.com`, and add the other origins above as Redirect URLs
   (including `http://localhost:8080/**`).

Email Confirmations stays disabled — our custom OTP flow is unaffected by Google.

## Part 2 — What I will change in the app

- **Every user who arrives via Google gets both roles and a loyalty card.** Today
  roles and the loyalty card are created by the sign-up form in the browser, which
  Google sign-in never runs — a Google user would land with no roles and a broken
  dashboard. I will move this into the database so it happens for every signup
  method, email or Google.
- **Wire up the buttons that currently do nothing:**
  - The "Continue with Google" button in the welcome modal (`AuthModal`).
  - A Google button on the main `/auth` page, above the email form, for both the
    sign-in and sign-up tabs.
  - The apply-flow dialog button keeps working, and returns the applicant to their
    application instead of the dashboard.
- **Return destination after Google:** back to the page they started from —
  applicants resume their in-progress application (draft and photos preserved),
  everyone else lands on their dashboard.
- **Failure handling:** if Google is not yet enabled in Supabase, the button shows a
  clear toast instead of a silent no-op.

## Technical notes

- Migration: extend `public.handle_new_user()` to also insert `donor` + `recipient`
  rows into `public.user_roles` (`ON CONFLICT DO NOTHING`) and a `loyalty_cards` row
  with a generated card number, keeping the existing `profiles` insert. Function stays
  `SECURITY DEFINER` with `search_path = public`. The client-side inserts in
  `useAuth.signUp` become redundant and are removed (the conflict clause makes the
  transition safe either way).
- `full_name` for Google users comes from `raw_user_meta_data->>'full_name'`, which
  Google already populates; fall back to `->>'name'` in the trigger.
- New helper `src/lib/googleAuth.ts`: `signInWithGoogle(redirectPath)` calling
  `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo:
  window.location.origin + redirectPath } })` with toast-based error surfacing.
  `ApplyRecipient.handleGoogleAuth` switches to it with `redirectPath = "/apply"`,
  `AuthModal` and `Auth.tsx` call it with `/` (existing role-based redirect in
  `Auth.tsx` then routes them).
- `Auth.tsx`: Google button + "or use email" divider added above the existing form;
  no change to the OTP/password logic.
- GeoGuard is untouched — Google users hit the same US-only rules as everyone else.
