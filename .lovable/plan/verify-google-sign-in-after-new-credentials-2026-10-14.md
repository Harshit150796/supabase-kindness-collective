# Verify Google sign-in after new credentials

You recreated the OAuth client in Google Cloud and pasted the new Client ID and Secret into Supabase.

## Already confirmed (just now)

- Google provider is on and the sign-in handoff works: our authorize address now redirects to Google with the **new** client ID (`489615157150-…apps.googleusercontent.com`) and the correct callback address (`vbnbacowuoeeojjdrzzp.supabase.co/auth/v1/callback`).
- The old failure ("client secret is invalid") can only be fully ruled out by one real sign-in, because that's the moment Google checks the secret.

## Checks

1. **You sign in once** — open the preview, click "Continue with Google", sign in with haagrawa123@gmail.com.
2. **Watch the sign-in log** — confirm there is no new "Unable to exchange external code" error after your attempt.
3. **Account created correctly** — query the database and confirm:
   - a user exists for haagrawa123@gmail.com,
   - a profile row was created,
   - both `donor` and `recipient` roles are present in `user_roles`,
   - the email appears in `email_subscribers` with source `google`.
4. **Return path** — confirm you land back on `/auth` and are routed to `/dashboard` with no error toast.
5. **Second sign-in** — sign out, sign in with Google again, confirm it goes straight in with no duplicate-account error.

## If it still fails

- Same "invalid_client" error again → the secret pasted in Supabase still doesn't match the client ID (they must come from the same OAuth client in Google Cloud; re-copy both together).
- `redirect_uri_mismatch` from Google → the redirect URI in Google Cloud must be exactly `https://vbnbacowuoeeojjdrzzp.supabase.co/auth/v1/callback`.

## Technical details

- Read-only checks: auth log query, `email_subscribers` / `profiles` / `user_roles` queries.
- No code changes expected. Nothing will be published.
