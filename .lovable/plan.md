# Google sign-in: finish verification (no OAuth app needed)

## Short answer

No. The screen you are on — **Authentication → OAuth Apps** — is not for Google sign-in. It is for the opposite direction: making Supabase itself act as a sign-in provider for some other app. Leave it empty and do not press "+ New OAuth App". The **OAuth Server (BETA)** item in that same menu is also unrelated (it is for connecting AI tools to your app).

For "Continue with Google" the only places anything gets created are:

1. **Google Cloud Console** — the OAuth client (client ID + secret). You already made this.
2. **Supabase → Authentication → Sign In / Providers → Google** — a switch plus two paste boxes. Nothing is created there, and nothing else is needed there.

I just checked your project: Google is now switched on.

## What is left to do

### Step 1 — Confirm the return addresses (you, ~1 min, dashboard)

Supabase → Authentication → **URL Configuration**:

- Site URL: `https://coupondonation.com`
- Redirect URLs list contains:
  - `https://coupondonation.com/**`
  - `https://www.coupondonation.com/**`
  - the preview address (the `...lovable.app` one)

These cannot be read from here without an admin key, so this one needs your eyes.

### Step 2 — Sign in once with your real Google account (you, ~1 min, preview)

Open the preview, click **Continue with Google**, pick your account, finish. Google will say "to continue to vbnbacowuoeeojjdrzzp.supabase.co" — that is the free-plan trade-off we agreed on; the free consent-screen branding step can change that wording later.

### Step 3 — I verify the result (me, read-only)

Once you say it is done, I check:

- a sign-in code and profile exist for that address
- the account holds both **donor** and **recipient** access
- the address was added to the newsletter/follow-up list with source `google`
- signing in a second time does not create a duplicate account or error

## If something fails

| What you see | What it means |
| --- | --- |
| "redirect_uri_mismatch" from Google | The Authorized redirect URI in Google Cloud must be exactly `https://vbnbacowuoeeojjdrzzp.supabase.co/auth/v1/callback` |
| "provider is not enabled" | The Google switch or the pasted Client ID/Secret was not saved in Sign In / Providers |
| Lands on the lovable.app address instead of coupondonation.com | The `coupondonation.com/**` redirect URLs are missing from URL Configuration |
| Google page says "access blocked" / app not verified | The consent screen needs `vbnbacowuoeeojjdrzzp.supabase.co` as an authorized domain and the app published |

## Technical notes

- No database changes, no code changes, nothing published.
- Read-only checks used: Supabase auth settings endpoint (confirms `google: true` in `external`), Playwright against the local preview, and queries on `profiles`, `user_roles`, `email_subscribers`.
- `auth/v1/settings` does not expose `URI_ALLOW_LIST` / `site_url` to the anonymous key, so Step 1 cannot be verified from here — it is reported as unverified, not as missing.
- The `handle_new_user` trigger already creates the profile, both roles, and the `email_subscribers` row (`source = 'google'`) on signup, so no further backend work is expected.
