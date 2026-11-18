# Sharper, readable share image

## What is happening
- WhatsApp (and iMessage, Telegram, Slack in compact view) shows only a small square cut from the middle of the wide 1200x630 picture, then shrinks it to about 160px.
- In today's picture the line "Transform Lives Through Giving" is tiny, so at that size it turns into a blur, and the name is thin and close to the edges.
- The top preview in your screenshot is the older picture that WhatsApp still remembers for www.coupondonation.com; the bottom one is the newer centered picture.

## What I will change
1. Make a new 1200x630 share picture on the same green background with the faint star lines:
   - Logo and "CouponDonation" much larger and bolder, all kept inside the middle square so the square thumbnail shows them whole.
   - Tagline "Transform Lives Through Giving" made large and bold enough to read when shrunk, kept in the same middle square, or moved fully off if it still can't be read at thumbnail size.
   - Saved at full sharpness (crisp edges, no extra compression), still under ~300 KB so WhatsApp loads it.
2. Point every share tag at it with a new version number (`og-image.png?v=4`) so apps fetch the new one: index.html, src/lib/seo.ts, the share-link fallback and its test, plus the note in src/AGENTS.md.
3. Redeploy share-fundraiser so share links use it at once. Check it by viewing the picture shrunk to 160px square.

## After that
- It reaches coupondonation.com once you publish (I won't publish).
- Links WhatsApp has already seen may keep the old picture for a while; a fresh link or the Facebook Sharing Debugger refreshes it.
