import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

async function runGate({ path = '/', query = '', ua = 'Mozilla Safari', seen = 0, storageFails = false } = {}) {
  const html = await Deno.readTextFile('index.html');
  const match = html.match(/<script>(.*?)<\/script>/s);
  if (!match) throw new Error('Missing intro script');
  const source = match[1];
  let removed = false, shown = false, stored = '';
  const now = 2000000;
  const node = { style: {}, remove() { removed = true; }, setAttribute() {}, addEventListener() {} };
  const document = {
    documentElement: { style: { setProperty() {} }, classList: { add() { shown = true; } } },
    getElementById() { return node; }, querySelector() { return null; },
  };
  const storage = { getItem() { if (storageFails) throw new Error('blocked'); return String(seen); }, setItem(_key: string, value: string) { stored = value; } };
  new Function('document', 'location', 'navigator', 'localStorage', 'Date', 'performance', 'innerWidth', 'innerHeight', 'addEventListener', 'setTimeout', source)(document, { pathname: path, search: query }, { userAgent: ua }, storage, { now: () => now }, { now: () => 0 }, 390, 664, () => {}, () => {});
  return { shown, removed, stored };
}

Deno.test('intro gates homepage, bots, 30-minute activity, overrides and blocked storage', async () => {
  assert((await runGate()).shown);
  assert((await runGate({ path: '/about' })).removed);
  assert((await runGate({ ua: 'Googlebot' })).removed);
  assert((await runGate({ seen: 1999999 })).removed);
  assert((await runGate({ seen: 200000 })).shown); // exactly 30 minutes
  assert((await runGate({ seen: 200001 })).removed); // one ms inside visit
  assert((await runGate({ path: '/f/test' })).removed);
  assert((await runGate({ seen: 199999 })).shown);
  assert((await runGate({ query: '?intro=0' })).removed);
  assert((await runGate({ query: '?intro=1', seen: 1999999 })).shown);
  assert((await runGate({ storageFails: true })).shown);
  assertEquals((await runGate({ path: '/blog' })).stored, '2000000');
});

Deno.test('static opening has disabled-JS default, safety, skip and bounded inline budget', async () => {
  const html = await Deno.readTextFile('index.html');
  const intro = html.slice(html.indexOf('<style id="cd-intro-style">'), html.indexOf('<div id="root"'));
  assert(new TextEncoder().encode(intro).length <= 6200);
  assert(intro.includes('display:none'));
  assert(intro.includes('Skip intro'));
  assert(intro.includes('Escape'));
  assert(intro.includes('3200'));
  assert(intro.includes('cd:tree-ready'));
  assert(html.indexOf('cd-intro-style') < html.indexOf('src="/src/main.tsx"'));
});

Deno.test('tree readiness is emitted at reveal, with unavailable-tree fallback', async () => {
  const scene = await Deno.readTextFile('src/components/landing/Tree3DScene.tsx');
  const fallback = await Deno.readTextFile('src/lib/treeReady.ts');
  const hero = await Deno.readTextFile('src/components/landing/HeroSection.tsx');
  assert(scene.includes('window.__cdTreeReady = true'));
  assert(scene.includes("window.dispatchEvent(new Event('cd:tree-ready'))"));
  assert(scene.indexOf("window.dispatchEvent(new Event('cd:tree-ready'))") < scene.indexOf('    onReady();'));
  assert(fallback.includes("new Event('cd:tree-ready')"));
  assert(hero.includes('if (!allowed) announceTreeReady()'));
});

Deno.test('cursor is fine-pointer only, admin excluded, RAF/ref driven and never hides mouse', async () => {
  const cursor = await Deno.readTextFile('src/components/CursorTrail.tsx');
  const css = await Deno.readTextFile('src/index.css');
  assert(cursor.includes('(hover: hover) and (pointer: fine)'));
  assert(cursor.includes("pathname.startsWith('/admin')"));
  assert(cursor.includes('translate3d'));
  assert(cursor.includes('Math.pow'));
  assert(!cursor.includes('useState'));
  assert(!css.includes('cursor: none'));
});

Deno.test('effects reuse installed motion and avoid additional animation libraries', async () => {
  const pkg = JSON.parse(await Deno.readTextFile('package.json'));
  assert(pkg.dependencies.motion);
  for (const name of ['gsap', 'animejs', '@react-spring/web', 'lottie-web']) assert(!pkg.dependencies[name]);
  const observer = await Deno.readTextFile('src/lib/earlyObserver.ts');
  assertEquals((observer.match(/new IntersectionObserver/g) ?? []).length, 1);
  const path = await Deno.readTextFile('src/components/landing/CouponScrollPath.tsx');
  assert(path.includes('getPointAtLength'));
});

Deno.test('opening mounts trunk and five branches at original coordinates and delays', async () => {
  const html = await Deno.readTextFile('index.html');
  const source = html.match(/<script>(.*?)<\/script>/s)?.[1];
  assert(source);
  type Shape = { className: string; style: { cssText: string }; innerHTML: string; append(...nodes: Shape[]): void };
  const nodes = new Map<string, Shape & { children: Shape[] }>();
  const create = () => ({ className: '', style: { cssText: '' }, innerHTML: '', children: [] as Shape[], append(...children: Shape[]) { this.children.push(...children); }, querySelector() {}, addEventListener() {} });
  const document = {
    documentElement: { style: { setProperty() {} }, classList: { add() {} } },
    createElement: create,
    getElementById(id: string) { let node = nodes.get(id); if (!node) { node = create(); nodes.set(id, node); } return node; },
    querySelector() { return null; },
  };
  new Function('document', 'location', 'navigator', 'localStorage', 'Date', 'performance', 'innerWidth', 'innerHeight', 'addEventListener', 'setTimeout', source)(document, { pathname: '/', search: '?intro=1' }, { userAgent: 'Safari' }, { getItem() { return null; }, setItem() {} }, { now: () => 2000000 }, { now: () => 0 }, 390, 664, () => {}, () => {});
  const shapes = nodes.get('cd-b')?.children ?? [];
  assertEquals(shapes.length, 6);
  const expected = [[640,586,640,430,10,.55],[640,500,548,430,6,.9],[640,478,734,414,6,.97],[640,432,640,320,6,1.02],[580,462,568,410,4,1.12],[700,444,714,396,4,1.16]];
  expected.forEach(([x,y,X,Y,width,delay], index) => {
    const shape = shapes[index];
    const left = Math.min(x,X), top = Math.min(y,Y);
    assertEquals(shape.className, index === 0 ? 'b v' : 'b');
    assert(shape.style.cssText.includes(`--d:${delay}s`));
    assert(shape.style.cssText.includes(`stroke-width:${width}px`));
    assert(shape.innerHTML.includes(`M${x-left} ${y-top}L${X-left} ${Y-top}`));
  });
});