# "Invalid token" page: diagnosis and next step

## What I found
- The real website works. coupondonation.com loads normally (checked just now).
- The site's own code never shows an "Invalid token" page. The only place that phrase exists is an old newsletter-unsubscribe step, and it returns a small message, not a full page.
- The preview address (id-preview--…lovable.app) refuses visitors who don't have a valid Lovable preview pass. When that pass has expired, or the preview link is opened in a separate tab, browser or device, Lovable shows its own "Invalid token" / "Unauthorized" page. This comes from Lovable's preview protection, not from CouponDonation, and your visitors never see it.

## What you can do right now
1. Reload the Lovable editor tab (or sign out of Lovable and back in). That gives the preview a fresh pass.
2. To see the site as visitors do, use coupondonation.com instead of a copied preview link.

## What I'll do if you approve
- Open the preview signed in and step through the main pages (home, Donate, Apply, Donate a card, sign-in, a fundraiser page, admin) to confirm none of them show an "Invalid token" error.
- Change the old unsubscribe step so an expired link sends people to the friendly "This link didn't work" page instead of a bare error.
- No changes to sign-in, payments or the database, and nothing published.

If you saw this message on coupondonation.com itself, or on a particular page or email link, tell me which one and I'll look at that path.
