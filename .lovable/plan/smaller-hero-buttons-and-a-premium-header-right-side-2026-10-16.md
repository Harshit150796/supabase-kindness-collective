# Smaller hero buttons and a premium header right side

## Goal
Make the two homepage buttons more compact, take the Donate button out of the header, and rework the header's right side (Start a fundraiser, Sign in / account, Menu) so it looks calm, matched and high-end, in the same green Loki-style light as the hero buttons.

## Hero buttons (Donate now, Apply as Recipient)
- Smaller: 40px tall on phones, 44px on larger screens (was 48/52), about 9.5rem minimum width, slightly smaller text (0.84rem) with a bit more letter spacing.
- Same matched pair, same width, same effects (circling edge light, sweep, flicker), just scaled down. Glow on hover is softened to suit the smaller size.
- They sit side by side on phones too, when there's room.

## Header right side
- **Donate button removed from the header on every page.** Donate stays in the full-screen menu, and the homepage keeps "Donate now" in the hero.
- New layout, left to right:

```text
[ Logo ]                        Start a fundraiser   Sign in  |  ( Menu = )
```

- **Start a fundraiser** and **Sign in**: quiet text links with a thin green underline that draws in from the left on hover, no boxes. A fine vertical hairline separates them from the Menu button.
- **Signed in:** the account button becomes a small round initials badge with a fine green edge, same height as the Menu pill, instead of a boxy button.
- **Menu button:** a slim dark-glass pill (the same look as "Apply as Recipient") with the green edge line and the "Menu/Close" roll and two-line icon kept. Unread-message dot unchanged.
- Everything on the right shares one height (40px) and one baseline, so nothing looks oversized.
- Phones: only the Menu pill (plus account badge when signed in) shows; Sign in lives in the menu as today.
- Header height trimmed slightly for a lighter feel; logo size unchanged (the menu opening animation depends on it).

## Kept unchanged
Tree, opening animation, rotating "CouponDonation is ..." line, cookie bar, the full-screen menu itself, sign-in/sign-out behaviour.

## Technical details
- `src/index.css`: resize `.btn-tva`/`.btn-tva-ghost` (h-10 / md:h-11, min-width 9.5rem, padding 0 1.15rem, font .84rem); soften hover shadows. Add `.nav-quiet-link` (animated underline via `background-size` transform-free) and `.nav-divider`; restyle `.site-menu-button` as a glass pill using `--ink` and `--tva-green` tokens, 40px tall.
- `src/components/layout/Navbar.tsx`: delete the Donate `Button` and its import; swap `quietLink` to the new class; add the divider; header `h-18` to `h-16`.
- `src/components/navigation/AccountMenu.tsx`: trigger becomes a 40px round initials badge (dropdown stays `modal={false}`).
- `HeroHeadline.tsx`: keep `flex-nowrap` on widths above 360px.
- Update `src/components/navigation/AGENTS.md` only if a rule changes (it doesn't name the Donate button, so likely not); save the "no Donate button in header" choice to memory.
- Verify with Playwright screenshots at 937px and 390px, signed out, over day and night sky.
