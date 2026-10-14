# Verify Google sign-in is working

You enabled the Google provider in Supabase (free plan, so the callback address stays `vbnbacowuoeeojjdrzzp.supabase.co/auth/v1/callback` — the Google consent screen will show that domain; everything else shows CouponDonation).

In the Supabase Google panel: Client IDs = the OAuth client ID from Google Cloud (ends in `.apps.googleusercontent.com`), Client Secret = the matching secret from the same client. Leave "Skip nonce checks" and "Allow users without an email" off. Click Save.

## Checks

1. **Provider is on** — query Supabase auth settings and confirm `google: true` (it was `false` before).
2. **End-to-end sign-in test** — drive the preview with a browser:
   - Open `/auth`, click "Continue with Google".
   - Confirm it redirects to Google (accounts.google.com), not an error page.
   - Complete sign-in with a test Google account if one is available; otherwise stop at the Google consent screen and confirm it loads without a "redirect_uri_mismatch" or "access blocked" error.
3. **Return path** — after Google, confirm the user lands back on `/auth` and is routed to `/dashboard` (or the `next`/`intent` target), with no "OAuth state parameter missing" error (this error appeared in the auth logs on Oct 13 — verify it is gone).
4. **Email capture** — confirm the new Google account's email appears in `email_subscribers` with source `google` (the `handle_new_user` trigger does this), and that the profile plus both donor/recipient roles were created.
5. **Sign-in again** — sign out, sign in with the same Google account, confirm it logs straight in with no duplicate-account error.

## If something fails

- `redirect_uri_mismatch` from Google → the redirect URI in Google Cloud must be exactly `https://vbnbacowuoeeojjdrzzp.supabase.co/auth/v1/callback`.
- "Provider is not enabled" → Google toggle/Client ID/Secret in Supabase not saved.
- Lands on Lovable preview instead of coupondonation.com → Site URL / redirect URLs in Supabase → Authentication → URL Configuration need `https://coupondonation.com/**` and `https://www.coupondonation.com/**` added.

## Technical details

- Read-only checks: `GET https://vbnbacowuoeeojjdrzzp.supabase.co/auth/v1/settings`, Playwright against the preview, and a query on `email_subscribers` / `profiles` / `user_roles` for the test account.
- No code changes expected; fixes are configuration-side unless a real bug shows up.
- Nothing will be published.
