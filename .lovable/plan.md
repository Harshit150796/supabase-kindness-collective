# Smaller hero buttons, Sign up in the header, a refined Menu button

## Hero buttons
- Smaller again: 36px tall on phones, 38px on larger screens (now 40/44), about 8.25rem minimum width, 0.8rem text. The same matched pair and the same green light effects.

## Header right side (signed out)

```text
[ Logo ]                               Sign in   ( Sign up )  |  Menu =
```

- **"Start a fundraiser" is removed from the header.** It stays in the menu.
- **Sign in:** a quiet text link with the green underline on hover.
- **Sign up:** the one clear action. It's a small pill outlined in logo green with green text, 36px tall. On hover it fills solid green and the text turns white. It opens the sign-up form directly, and sign-in and sign-up both bring you back to the page you were on.
- **Signed in:** Sign in and Sign up are hidden. The round initial badge shows instead.
- **Phones:** the logo, a compact Sign up pill and Menu show, so new visitors still see a way in.

## Menu button
- The dark pill goes. The new button is light and clear: no fill, a fine hairline edge in the border colour, dark text, and the same "Menu/Close" roll and two-line icon. On hover the edge turns logo green and the two lines move slightly apart. No glow. It matches the Sign up pill's height so the right side lines up.

## Technical details
- `src/index.css`: `.btn-tva`/`.btn-tva-ghost` height 2.25rem, md 2.375rem, min-width 8.25rem, padding 0 1rem, font .8rem. Replace the `[data-site-header] .site-menu-button` glass rules with a transparent hairline pill (`--border`, hover `--primary`). Add `.nav-signup-pill` (outline primary, hover fill primary, `--primary-foreground` text).
- `src/components/layout/Navbar.tsx`: remove the Start a fundraiser link. When signed out and not on the auth page: Sign in (`hidden md:inline-flex`) plus a Sign up link using `signUpHref(pathname, search)`, shown on every size.
- Update the memory note: the header has no Donate or fundraiser link, has a Sign up pill, and the glow exception covers the hero buttons only.
- Check with screenshots at 937px and 390px.
