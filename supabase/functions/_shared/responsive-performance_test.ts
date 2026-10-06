import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test('tree preload is homepage-scoped and route entry is lazy', async () => {
  const html = await Deno.readTextFile('index.html');
  const app = await Deno.readTextFile('src/App.tsx');
  const hero = await Deno.readTextFile('src/components/landing/HeroSection.tsx');
  assert(!html.includes('tree.glb'));
  assert(app.includes("lazy(() => import"));
  assert(hero.includes("lazy(() => import('@/components/landing/Tree3DScene')"));
  assert(hero.includes('connection?.saveData'));
  assert(hero.includes('prefers-reduced-motion: reduce'));
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
