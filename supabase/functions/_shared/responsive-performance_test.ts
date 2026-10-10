import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test('tree preload is homepage-scoped and route entry is lazy', async () => {
  const html = await Deno.readTextFile('index.html');
  const app = await Deno.readTextFile('src/App.tsx');
  const hero = await Deno.readTextFile('src/components/landing/HeroSection.tsx');
  // The model is only preloaded by the homepage opening script, never by a static tag on every page.
  assert(!/<link[^>]*tree\.glb/.test(html));
  const opening = html.slice(html.indexOf('<style id="cd-intro-style">'), html.indexOf('<div id="root"'));
  assert(opening.includes('tree.glb') && opening.includes('location.pathname'));
  assert(html.split('tree.glb').length === 2);
  assert(app.includes("lazy(() => import"));
  assert(hero.includes("lazy(() => import('@/components/landing/Tree3DScene')"));
  assert(!hero.includes('!query.matches'));
});

Deno.test('responsive currency formatting handles numeric database strings', () => {
  const usd = (n: number | string) => {
    const value = Number(n) || 0;
    return `$${value.toLocaleString('en-US', { maximumFractionDigits: value % 1 ? 2 : 0 })}`;
  };
  assertEquals(usd('1000'), '$1,000');
  assertEquals(usd(1000), '$1,000');
  assertEquals(usd('20.5'), '$20.5');
});

Deno.test('figure labels pluralise counts', () => {
  const plural = (n: number, one: string, many = one + 's') => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;
  assertEquals(plural(1, 'coupon'), '1 coupon');
  assertEquals(plural(2, 'coupon'), '2 coupons');
  assertEquals(plural(0, 'coupon'), '0 coupons');
});

Deno.test('connection hints never deny the live tree', async () => {
  const hero = await Deno.readTextFile('src/components/landing/HeroSection.tsx');
  assert(!hero.includes('effectiveType'));
  assert(!hero.includes('saveData'));
});

Deno.test('fundraiser list loads card numbers in one batched request', async () => {
  const hook = await Deno.readTextFile('src/hooks/useFundraisers.ts');
  assert(hook.includes("get_fundraiser_cards"));
  assert(!hook.includes("get_fundraiser_totals"));
});

Deno.test('tree model stays under its compressed budget', async () => {
  const { size } = await Deno.stat('public/models/tree.glb');
  assert(size < 1_300_000, `tree.glb is ${size} bytes`);
});

Deno.test('hero shows a sky backdrop in this load\'s sky until the live tree draws', async () => {
  const hero = await Deno.readTextFile('src/components/landing/HeroSection.tsx');
  const scene = await Deno.readTextFile('src/components/landing/Tree3DScene.tsx');
  const css = await Deno.readTextFile('src/index.css');
  assert(hero.includes('if (!allowed) announceTreeReady();'));
  assert(hero.includes('className="hero-tree '));
  assert(scene.includes("opacity: ready ? 1 : 0, transition: 'opacity .7s"));
  assert(css.includes('.hero-stage::before{'));
});

Deno.test('homepage section code is fetched in idle time after the opening, not mid-scroll', async () => {
  const index = await Deno.readTextFile('src/pages/Index.tsx');
  const prefetch = await Deno.readTextFile('src/lib/idlePrefetch.ts');
  assert(index.includes('useEffect(() => prefetchWhenIdle(Object.values(sectionCode)), []);'));
  // Every lazy section loads through the same import the prefetch warms.
  for (const key of ['stories', 'proof', 'transparency', 'donationFlow', 'security', 'testimonials', 'dashboard', 'cta', 'footer']) assert(index.includes(`sectionCode.${key}().then(`), key);
  assert(index.includes("leaderboard: () => import('@/components/landing/BrandLeaderboard')"));
  // Waits for the opening, one module per idle period, and respects Save-Data.
  assert(prefetch.includes("window.addEventListener('cd:intro-end', start, { once: true })"));
  assert(prefetch.includes('load().catch(() => undefined).finally(() => idle(next))'));
  assert(prefetch.includes('connection?.saveData'));
});

Deno.test('navbar hide-on-scroll never reads layout on scroll frames', async () => {
  const navbar = await Deno.readTextFile('src/components/layout/Navbar.tsx');
  assert(navbar.includes('new IntersectionObserver(([entry]) => {'));
  assert(navbar.includes('heroPassed = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;'));
  // The per-frame box read survives only as the fallback without IntersectionObserver.
  assert(navbar.includes('(observer ? heroPassed : hero.getBoundingClientRect().bottom <= 0)'));
});

Deno.test('card and stat formatting reuse one Intl formatter instead of building one per call', async () => {
  const live = await Deno.readTextFile('src/hooks/useFundraiserLive.ts');
  const stats = await Deno.readTextFile('src/hooks/useLandingStats.ts');
  const board = await Deno.readTextFile('src/components/landing/BrandLeaderboard.tsx');
  assert(live.includes("const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });"));
  assert(!live.includes('.toLocaleDateString(') && !live.includes('.toLocaleString('));
  assert(stats.includes("const enUS = new Intl.NumberFormat('en-US');") && !stats.includes(".toLocaleString('en-US')"));
  assert(board.includes("const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });") && !board.includes('.toLocaleDateString('));
  // A reused formatter prints exactly what the per-call helpers printed.
  const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  const cents = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
  for (const value of [0, 5, 12.5, 12.345, 1234, 1234567.891, -1234.56]) {
    assertEquals((value % 1 ? cents : whole).format(value), value.toLocaleString('en-US', { maximumFractionDigits: value % 1 ? 2 : 0 }));
  }
  const date = new Date('2024-01-05T12:00:00Z');
  assertEquals(new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date), date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
});

Deno.test('the hero kicker stays readable on the night sky', async () => {
  const headline = await Deno.readTextFile('src/components/landing/hero/HeroHeadline.tsx');
  const css = await Deno.readTextFile('src/index.css');
  assert(headline.includes('className="hero-kicker-lead ') && headline.includes('className="hero-kicker-word '));
  assert(css.includes('html[data-sky=night] .hero-kicker-lead{color:rgb(255 255 255 / .8)}'));
  assert(css.includes('html[data-sky=night] .hero-kicker-word{color:hsl(123 46% 66%)}'));
});
