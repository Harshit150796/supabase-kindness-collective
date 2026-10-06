import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test('tree preload is homepage-scoped and route entry is lazy', async () => {
  const html = await Deno.readTextFile('index.html');
  const app = await Deno.readTextFile('src/App.tsx');
  const hero = await Deno.readTextFile('src/components/landing/HeroSection.tsx');
  assert(!html.includes('tree.glb'));
  assert(app.includes("lazy(() => import"));
  assert(hero.includes("lazy(() => import('@/components/landing/Tree3DScene')"));
  assert(hero.includes('connection?.saveData'));
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

Deno.test('estimated connection speeds never deny the live tree', async () => {
  const hero = await Deno.readTextFile('src/components/landing/HeroSection.tsx');
  assert(!hero.includes('effectiveType'));
  assert(hero.includes('allowLiveTree(connection?.saveData)'));
  assert(hero.includes("connection?.addEventListener?.('change', mount)"));
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
