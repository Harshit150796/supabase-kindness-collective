# Site navigation rules
- Every menu item lives in src/components/navigation/siteLinks.ts; the header, full-screen menu, account dropdown and dashboard sections all read it, so a page is added or removed in one place.
- One full-screen menu is mounted at app level (SiteMenuProvider, inside the router and auth). Pages render `<Navbar/>` (or just `<MenuButton/>`), never a menu of their own; it portals to body, makes #root inert, locks scroll, closes on Escape and route change, and returns focus.
- The menu is the founder-chosen "two hands" design: a logo-green sheet grows from the Menu button and carries all content (clip-path, dropped once open); a logo-blue hand rises from the bottom-left corner holding the account (a curved foot on phones and tablets, a quarter circle on wide screens). Inside the menu the wordmark is white, a founder-approved exception.
- Menu motion animates the sheet's clip, transform, opacity and colour only. BrandLockup is the geometry the opening lands on, so its sizes stay fixed.
- Sign-out always goes through useSignOut(): it signs out this device and clears the stored session even when the logout request fails. Account dropdowns use `modal={false}`, because Radix modal menus left the page unclickable.
- Sign-in links carry `next` (signInPath); Auth accepts only same-site relative paths, and `next` wins over role redirects.
