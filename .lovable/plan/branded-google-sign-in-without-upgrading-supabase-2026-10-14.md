# Branded Google sign-in without upgrading Supabase

## What the screenshots confirm
- Google Cloud Branding has **CouponDonation**, a logo, and your privacy/terms links entered.
- The screenshots still show the Supabase address on Google's account chooser and consent screen.
- The branding screenshot says the app is in **Testing**. This does not establish whether Google has approved the brand.
- The website currently uses Google's redirect sign-in through Supabase. Entering a name and logo alone does not guarantee Google displays them.

## Recommended solution — free plan

### 1. Open Google sign-in directly from CouponDonation
Replace the redirect-based Google button with Google's official **Google Identity Services** button and sign-in window. Pass the resulting Google identity token securely to the existing sign-in service in the background.

- On `coupondonation.com`, the main login page stays on CouponDonation rather than navigating through a Supabase address.
- Google's window will still use Google's own address; its site identity can refer to the CouponDonation origin rather than the Supabase callback.
- Keep explicit account selection; no automatic sign-in or unsolicited One Tap prompts.
- Keep email/password sign-in, custom email codes, existing accounts, and the current destination after login unchanged.
- Handle a closed window, blocked popup, unavailable Google script, and rejected credentials without leaving the button stuck.
- Do not silently fall back to the old Supabase redirect; offer email sign-in if Google cannot open.

### 2. Make our own login unmistakably branded
Place the existing logo and approved two-colour **CouponDonation** wordmark prominently above the sign-in/sign-up form—not only in the navigation. Preserve the header logo's current sizing and animation landing geometry.

### 3. Finish Google's branding approval
Check the **same Google Cloud project that owns the Client ID saved in Supabase**:
- Save the Branding information already entered.
- Check **Audience** and **Verification centre**; submit the company name/logo for brand verification as required by Google, and move the Google app to Production when ready for public use.
- Keep permissions limited to name, email and profile information; do not add sensitive permissions.
- Verify ownership of `coupondonation.com` if Google requests it.

These are Google account actions you may need to complete. Google controls whether and where the logo appears, and approval can take several business days. Publishing the Google consent configuration is separate from publishing this website; **the website will not be published**.

### 4. Configure the allowed website addresses
Use the current **Web application OAuth Client ID**, not an API key. Add these exact Authorized JavaScript origins in Google Cloud:
- `https://coupondonation.com`
- `https://www.coupondonation.com`
- `https://id-preview--3641b9a8-53c7-44ac-9c94-6032b9d89582.lovable.app`
- Local testing origins only if needed for verification.

The Client ID is public and may be used by the website. The Client Secret stays in Supabase; it is never added to website code. Keep the existing callback configuration during the transition.

Preview sign-in will identify the preview origin rather than pretend to be the live domain. Final company-domain verification must happen on `coupondonation.com`; test the preview separately, including any embedded-window limitations.

### 5. Verify account continuity and email-list behaviour
- Complete one real Google signup and confirm the profile, account access and email-list entry read back correctly.
- Sign in again and confirm it uses the same account.
- Test an existing email/password account with the same verified Google email; confirm the user ID, donations and fundraisers remain unchanged. Investigate any linking failure rather than merging accounts manually or changing verified-email flags blindly.
- Confirm existing unsubscribe choices remain respected and sign-in does not silently renew marketing consent.
- Check company branding, cancellation and error recovery across a narrow and wide screen.

Real Google account selection requires your browser; an automated handoff alone will not be reported as a completed sign-in test.

## Technical details
- Add an isolated GIS loader/button and use `supabase.auth.signInWithIdToken({ provider: 'google', token, nonce })` with the existing auth listener and same-site destination validation.
- Follow current official Supabase nonce guidance: generate a cryptographically random raw nonce; send its SHA-256 hexadecimal hash to Google and the raw nonce to Supabase. Keep nonce checking enabled; never log identity tokens.
- Load Google's script only on the auth page, clean up callbacks, prevent duplicate submissions, and use Google's official button rendering.
- Inspect actual hosting CSP/COOP headers before changing them; allow only Google's documented sources where required. Do not rely on the inert Vercel configuration for Lovable hosting.
- Verify existing signup/email-list behaviour rather than proposing database changes now. No new profile system or payment changes.

## Limits and correction
The earlier claim that only paid Supabase custom domains could improve these screens was incomplete: **verified Google branding and direct Google Identity Services sign-in are available without upgrading Supabase**. A paid custom auth domain remains an alternative for the redirect approach, not a requirement for this solution.

Google's pages cannot be restyled by the website, and a logo cannot be guaranteed on every account-selection screen. The result we can control is a clearly branded CouponDonation login and no browser navigation through the Supabase callback in the new Google flow.

## Official references
- [Supabase: Google sign-in, branding and direct Google button](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google: Identity Services setup and allowed origins](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)
- [Google: Brand verification](https://support.google.com/cloud/answer/15549049?hl=en)

**No Supabase upgrade, no website publishing, no unrelated changes.**