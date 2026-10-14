# Google sign-in: remaining Google Cloud setup

The preview now uses Google's official Identity Services button and an ID-token exchange. The company logo and two-colour wordmark are prominent above the login form. No website publishing or database changes were performed.

## Required: JavaScript origins

In Google Cloud → Google Auth Platform → Clients, open the **Web application** with this public Client ID:

`489615157150-dallsag01smn1laq5d16epmf40spm180.apps.googleusercontent.com`

Under **Authorized JavaScript origins**, add:

- `https://coupondonation.com`
- `https://www.coupondonation.com`
- `https://id-preview--3641b9a8-53c7-44ac-9c94-6032b9d89582.lovable.app`

For local automated verification only, add both `http://localhost` and `http://localhost:8080` if wanted. Do not put `/auth`, `/**`, or any other path in a JavaScript origin. Save. Google's changes can take time to propagate.

Keep the existing Supabase callback address under Authorized redirect URIs during transition. No new secret is needed in the website. If the Web Client ID changes, update the public `VITE_GOOGLE_CLIENT_ID` website setting and the matching Google provider configuration together.

## Company name and logo on Google's screens

Within the same Google Cloud project, check Branding, Audience and Verification centre. Save the name/logo/legal links, complete domain ownership verification if requested, and submit brand verification as Google requires. Moving Google's app from Testing to Production is a separate action from publishing this website. Use only the basic email/profile/openid permissions.

Google decides the name/logo placement; no website can guarantee its logo appears on every Google account chooser. The direct flow avoids browser navigation through the Supabase callback. The website's preview remains truthfully associated with the preview origin, not the live origin.

## Verification performed

- Four focused nonce/account-selection/missing-credential tests pass.
- Actual Google script and button render in Chromium; the button opens `accounts.google.com`, while the main page remains `/auth`.
- Local Google popup returns `origin_mismatch`, specifically requesting registration of the JavaScript origin. This is a Google Cloud setting, not proof that the live or preview origins are missing.
- Closing the Google window leaves the button usable.
- Script-blocked and missing-credential recovery work; email forms remain available and signup destination is preserved.
- 390×844, 937×549 and 1280×1800 screenshots show the logo/wordmark with no horizontal overflow; existing cookie banner untouched.
- Automatic preview build reports OK after moving tests alongside the existing Bun test suite.

## Still requires a real user check

After origins are saved, open the preview directly in a new tab and finish Google sign-in. Then verify new-user signup, a repeat login, an existing same-email account retaining its user ID and donation/fundraiser data, and subscriber/suppression state. No account merge, email-confirmation change, marketing re-consent or test signup was performed. Authenticated end-to-end checks are unavailable automatically for this external unmanaged Supabase project.

The live website is unchanged until the owner chooses to publish. Trial impact statistics must be disabled before publishing, per the existing founder requirement.

References: [Supabase Google guide](https://supabase.com/docs/guides/auth/social-login/auth-google), [Google Identity Services setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid), [Google brand verification](https://support.google.com/cloud/answer/15549049?hl=en).