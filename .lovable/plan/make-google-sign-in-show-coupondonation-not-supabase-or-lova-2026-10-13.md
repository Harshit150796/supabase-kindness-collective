# Make Google sign-in show CouponDonation, not Supabase or Lovable

## What people actually see today

1. **Our login page** (`/auth`) — already fully CouponDonation branded. No change needed.
2. **Google's consent screen** — shows whatever name, logo and domain are set in Google Cloud. Right now it would show the raw Supabase address `vbnbacowuoeeojjdrzzp.supabase.co`.
3. **The address bar during sign-in** — briefly shows `…supabase.co` while Google hands the person back to us. This is the part that needs a custom auth domain to remove.
4. **The Lovable preview address** — only appears while you test in the preview. Once published, visitors only ever see `coupondonation.com`. Nothing to fix here.

## Plan

### Step 1 — Brand the Google consent screen (you, ~10 min in Google Cloud)
This is what makes the Google page itself say "CouponDonation":
- Set the app name to **CouponDonation** and upload the logo.
- Add privacy policy and terms links (`coupondonation.com/privacy`, `/terms`).
- Publish the consent screen (removes the "unverified app" warning).

### Step 2 — Give the login its own CouponDonation address: `auth.coupondonation.com`
This removes `supabase.co` from the address bar entirely:
- Supabase supports a custom domain for the auth service (requires the Supabase Pro plan, $25/mo — it is a paid Supabase feature, not something I can switch on from here).
- You add one DNS record at Hostinger pointing `auth` to Supabase; Supabase issues the certificate automatically.
- I then update the code and settings so every sign-in redirect uses `https://auth.coupondonation.com`.

### Step 3 — Update the Google settings to match (you, after Step 2)
- Authorized redirect URI becomes: `https://auth.coupondonation.com/auth/v1/callback`
- Authorized domain becomes: `coupondonation.com` (no more `supabase.co` anywhere in the Google setup).

### Step 4 — I verify end to end
- Run a full Google sign-up and sign-in in the preview and on the live domain.
- Confirm the new account email lands in the subscribers list as before.

## If you'd rather not pay for Supabase Pro
Step 1 alone still makes the Google screen show "CouponDonation" with your logo — only the address bar would briefly show the Supabase address for a second or two during the handoff. Most sites on Supabase ship exactly this way. Tell me which way you want to go and I'll proceed.

## Notes
- No database changes. No publish.
- Email/password sign-in and the OTP flow are untouched; this only affects the Google button's handoff.
