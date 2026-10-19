# Lift hero buttons and remove the day/night switch

## What changes
1. **Hero buttons sit higher above the tree.** The "Donate now / Apply" pair and the "CouponDonation is …" line move up so there is clear sky between them and the leaves. Gap above the tree grows from 12px to about 40px on laptops and 32px on phones. Sizes stay the same.
2. **Day/night switch removed from the header.** The little sun/moon toggle next to Sign in disappears completely. The page still picks night or day once per visit as it does now, and the tree, sky and header colours keep following it.

## Not changed
- The tree, moon/sun position, button design, header links and menu.
- Tapping the sky still flips night/day (it's not a button). Say so if you want that gone too.

## Technical details
- `src/index.css`: `.hero-cta` bottom offset `+ 12px` becomes `+ 32px` by default and `+ 40px` at `min-width:768px`; delete the `.sky-switch*` rules (lines ~768–776).
- `src/components/layout/Navbar.tsx`: remove the `SkySwitch` import and the `{onHome && <SkySwitch />}` render.
- Delete `src/components/navigation/SkySwitch.tsx`; keep `src/lib/sky.ts` (still used by the tree and the sky tap).
- Update notes in `src/components/landing/AGENTS.md` (gap above canopy) and `src/components/navigation/AGENTS.md` (no sky switch in header).
- Check at 1280x800 and 390x844 that the buttons clear the moon and header; run the hero Deno tests.
