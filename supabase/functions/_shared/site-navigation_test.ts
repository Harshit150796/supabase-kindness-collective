import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const read = (path: string) => Deno.readTextFile(path);

Deno.test('every menu item comes from one list and points at a real route', async () => {
  const links = await read('src/components/navigation/siteLinks.ts');
  const app = await read('src/App.tsx');
  const routes = [...app.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]);
  const targets = [...links.matchAll(/to: '([^']+)'/g)].map((m) => m[1]).filter((to) => to.startsWith('/'));
  assert(targets.length >= 20, `found ${targets.length} links`);
  for (const to of targets) assert(routes.includes(to), `menu link ${to} has no route`);
  assertEquals(new Set(targets).size, targets.length, 'a page is listed twice');
  // Removed duplicates and dead ends stay removed.
  assert(!links.includes("'/dashboard/donate'"));
  assert(!links.includes("'/dashboard/impact'"));
  // Added: dashboard, giving, messages, contact, team portal.
  for (const to of ["'/dashboard'", "'/dashboard/giving'", "'/messages'", "'/admin'"]) assert(links.includes(to), to);
  assert(links.includes("to: `mailto:${SUPPORT_EMAIL}`") && links.includes("SUPPORT_EMAIL = 'support@coupondonation.com'"));
});

Deno.test('one menu for the whole app, mounted once inside the router and auth', async () => {
  const app = await read('src/App.tsx');
  assertEquals(app.split('<SiteMenuProvider>').length - 1, 1);
  assert(app.indexOf('<AuthProvider>') < app.indexOf('<SiteMenuProvider>'));
  assert(app.indexOf('<SiteMenuProvider>') < app.indexOf('<AppRoutes />'));
  const provider = await read('src/components/navigation/SiteMenuProvider.tsx');
  // A new page closes it; the opener gets focus back; stuck Radix locks are cleared.
  assert(provider.includes('const routeKey = `${location.pathname}${location.search}`;'));
  assert(provider.includes('if (trigger?.isConnected) trigger.focus({ preventScroll: true });'));
  assert(provider.includes("body.style.pointerEvents = '';"));
  // The unread count is read once for the app, not once per header.
  assertEquals((provider.match(/useUnreadMessages\(\)/g) ?? []).length, 1);
  const navbar = await read('src/components/layout/Navbar.tsx');
  assert(!navbar.includes('useUnreadMessages'));
});

Deno.test('the open menu is a real modal: inert page, no scroll, Escape, own close button', async () => {
  const menu = await read('src/components/navigation/SiteMenu.tsx');
  assert(menu.includes('role="dialog"') && menu.includes('aria-modal="true"') && menu.includes('id="site-menu"'));
  assert(menu.includes("root?.setAttribute('inert', '')") && menu.includes("root?.removeAttribute('inert')"));
  assert(menu.includes("html.classList.add('site-menu-open')"));
  assert(menu.includes("if (event.key === 'Escape')"));
  assert(menu.includes('createPortal('));
  assert(menu.includes('<MenuButton ref={buttonRef} expanded={shown} onClick={onClose} />'));
  // Everything in the menu sits on the sheet, so it never shows outside the growing circle.
  assert(menu.indexOf('className="site-menu-sheet"') < menu.indexOf('className="site-menu-scroll"'));
  assert(menu.indexOf('className="site-menu-scroll"') < menu.indexOf('<nav aria-label="Site"'));
  // Signing out from the menu keeps the account panel as it was until the menu has gone.
  assert(menu.includes("if (phase === 'open') shownAuth.current = auth;"));
  const button = await read('src/components/navigation/MenuButton.tsx');
  assert(button.includes('aria-controls="site-menu"') && button.includes('aria-expanded={isExpanded}') && button.includes('aria-haspopup="dialog"'));
  const css = await read('src/index.css');
  assert(css.includes('html.site-menu-open{overflow:hidden;padding-right:var(--site-menu-gap,0px)}'));
  assert(css.includes('.site-menu-scroll{position:absolute;inset:0;display:flex;flex-direction:column;overflow-y:auto;overscroll-behavior:contain'));
  // Close stays in reach while a long menu scrolls.
  assert(css.includes('.site-menu-bar{position:sticky;top:0;'));
});

Deno.test('menu motion is a clip, transforms and opacity only, and ends when the JS timer does', async () => {
  const css = await read('src/index.css');
  const block = css.slice(css.indexOf('/* ---------- Site menu'));
  for (const rule of block.matchAll(/transition:([^;}]+)/g)) {
    for (const part of rule[1].replace(/\([^)]*\)/g, '').split(',')) {
      const prop = part.trim().split(' ')[0];
      assert(['transform', 'opacity', 'color', 'background-color', 'clip-path'].includes(prop), `animates ${prop}`);
    }
  }
  // The green sheet is a clip of a solid full-screen layer (no giant scaled layers to rasterise)
  // and carries all the content; it drops its clip once open so it covers the screen through any resize.
  assert(block.includes('.site-menu-sheet{position:absolute;inset:0;background:hsl(var(--primary));clip-path:circle(0px at var(--ox) var(--oy));'));
  assert(block.includes('.site-menu.is-settled .site-menu-sheet{clip-path:none}'));
  // The blue hand grows from the bottom-left corner and holds the account.
  assert(block.includes('transform-origin:0 100%') && block.includes('.site-menu-hand.is-account{'));
  // Closing: the hand folds away first; the sheet starts at .2s and runs .56s, after two frames → done by ~.8s, inside MENU_CLOSE_MS.
  const provider = await read('src/components/navigation/SiteMenuProvider.tsx');
  const ms = Number(provider.match(/MENU_CLOSE_MS = (\d+)/)?.[1]);
  assert(ms >= 800 && ms <= 900, String(ms));
  assert(block.includes('.site-menu[data-phase=closing] .site-menu-sheet{transition-duration:.56s;transition-delay:.2s}'));
});

Deno.test('the header keeps the brand geometry the opening lands on', async () => {
  const brand = await read('src/components/navigation/BrandLockup.tsx');
  assert(brand.includes("const logo = '/brand/logo-256.webp'"));
  assert(brand.includes('className="w-10 h-10 sm:w-12 sm:h-12 object-contain" width={48} height={48}'));
  assert(brand.includes('<span className="font-bold text-base sm:text-lg leading-tight">'));
  assert(brand.includes('flex min-h-11 shrink-0 items-center gap-3'));
  const navbar = await read('src/components/layout/Navbar.tsx');
  assert(navbar.includes('<BrandLockup navBrand />') && navbar.includes('data-site-header'));
  const css = await read('src/index.css');
  assert(css.includes('html.cd-intro nav[data-site-header]{transform:translateY(-110%)}'));
});

Deno.test('signing out always works and leaves nothing behind', async () => {
  const auth = await read('src/hooks/useAuth.tsx');
  assert(auth.includes("await supabase.auth.signOut({ scope: 'local' })"));
  // Logout request failed: the stored session is removed anyway.
  assert(auth.includes('if (auth.storage && auth.storageKey) await auth.storage.removeItem(auth.storageKey);'));
  assert(auth.includes('queryClient.clear();'));
  // Roles are fetched per user, not on every token refresh.
  assert(auth.includes('if (rolesForRef.current === userId) return;'));
  const hook = await read('src/hooks/useSignOut.ts');
  assert(hook.includes("toast.success('Signed out'") && hook.includes("if (isAccountPath(location.pathname)) navigate('/', { replace: true });"));
  for (const file of ['src/components/navigation/SiteMenu.tsx', 'src/components/navigation/AccountMenu.tsx', 'src/components/layout/DashboardLayout.tsx', 'src/components/admin/AdminLayout.tsx', 'src/pages/Settings.tsx']) {
    const src = await read(file);
    assert(src.includes('useSignOut()'), `${file} signs out its own way`);
  }
  // Account dropdowns are non-modal: a modal Radix menu unmounted by the sign-out navigation left the page unclickable.
  for (const file of ['src/components/navigation/AccountMenu.tsx', 'src/components/admin/AdminLayout.tsx']) {
    assert((await read(file)).includes('<DropdownMenu modal={false}>'), file);
  }
});

Deno.test('signing in returns people to where they were, and only to this site', async () => {
  const app = await read('src/App.tsx');
  assert(app.includes('<Navigate to={signInPath(`${location.pathname}${location.search}`)} replace />'));
  const authPage = await read('src/pages/Auth.tsx');
  assert(authPage.includes("rawNext.startsWith('/') && !rawNext.startsWith('//')"));
  assert(authPage.indexOf('if (nextPath) navigate(nextPath') < authPage.indexOf("else if (hasRole('admin'))"));
  assert(authPage.includes("return 'That email and password do not match.';"));
  const links = await read('src/components/navigation/siteLinks.ts');
  // On the sign-in page the links keep its return path and only switch the tab, which follows ?mode=.
  assert(links.includes("if (!onAuth && pathname !== '/' && pathname !== '/reset-password') params.set('next', `${pathname}${search}`);"));
  assert(authPage.includes('setMode(modeParam);'));
  assert((await read('src/components/navigation/SiteMenu.tsx')).includes('to={signUpHref(pathname, search)}'));
  const apply = await read('src/components/apply/ApplyLayout.tsx');
  assert(apply.includes('to={signInPath("/apply")}') && apply.includes('<MenuButton'));
});

Deno.test('the inactivity sign-out keeps its warning up instead of resetting it', async () => {
  const idle = await read('src/hooks/useIdleTimeout.ts');
  assert(idle.includes('if (throttleTimeout || warningRef.current) return;'));
  assert(idle.includes('}, [enabled, resetTimers, clearAllTimers]);'));
  assert(!idle.includes('showWarning]);'));
});

Deno.test('account pages use the site header and the shared sections', async () => {
  const dashboard = await read('src/components/layout/DashboardLayout.tsx');
  assert(dashboard.includes('<Navbar autoHide={false} />'));
  assert(dashboard.includes('accountLinksFor(roles)') && dashboard.includes('DASHBOARD_EXTRA_LINKS'));
  assert(dashboard.includes('aria-label="Account sections"'));
  for (const page of ['src/pages/Auth.tsx', 'src/pages/ResetPassword.tsx']) assert((await read(page)).includes('<Navbar />'), page);
});
