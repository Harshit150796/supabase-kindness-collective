# Fix Google sign-in: wrong Client Secret in Supabase

## What is wrong
The sign-in log shows the exact cause for all three tries (03:55, 03:57, 04:03): Google rejects the Client Secret saved in Supabase, with the message "The provided client secret is invalid." Google accepts you, but Supabase can't finish the sign-in, so no account gets created. Nothing in the website code causes this.

## What you do (about 3 minutes)
1. Google Cloud Console → APIs & Services → Credentials → open the OAuth client you used (Web application).
2. Copy the **Client ID** (ends in .apps.googleusercontent.com). Then under Client secrets, copy the secret. If you can't see the full secret, click "Add secret" and copy the new one.
3. Supabase → Authentication → Providers → Google:
   - Paste the Client ID into "Client IDs". It must be the same client the secret came from.
   - Paste the secret into "Client Secret". Check there are no spaces before or after it.
   - Click Save.
4. Tell me when it's saved.

## What I do after that
- Read the sign-in log to confirm the error is gone.
- Check that the account for haagrawa123@gmail.com was created with donor and recipient access and was added to the email list.
- Make the login page show a clear "Google sign-in is temporarily unavailable, please use email" message for this kind of setup error, instead of a generic one.

No database changes, nothing published.
