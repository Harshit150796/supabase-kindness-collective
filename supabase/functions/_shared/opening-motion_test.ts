import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

async function opening({ path = '/', query = '', ua = 'Mozilla Safari', webgl = true, saveData = false, hour = 12, nav = true } = {}) {
  const html = await Deno.readTextFile('index.html');
  const source = html.match(/<script>(.*?)<\/script>/s)?.[1];
  if (!source) throw new Error('Missing opening script');
  let now = 0;
  const timers: { at: number; fn: () => void }[] = [];
  const events = new Map<string, (() => void)[]>();
  const classes = new Set<string>();
  const nodes = new Map<string, ReturnType<typeof node>>();
  function node() {
    return { className: '', style: { cssText: '', setProperty(k: string, v: string) { (this as Record<string,string>)[k] = v; } } as { cssText: string; setProperty(k: string, v: string): void; [k: string]: unknown }, dataset: {} as Record<string,string>, children: [] as unknown[], isConnected: true, innerHTML: '', remove() { this.isConnected = false; }, append(...items: unknown[]) { this.children.push(...items); }, setAttribute() {}, getContext(type: string) { return webgl && /webgl/.test(type) ? { getExtension: () => null } : null; }, getBoundingClientRect() { return { left: 400, top: 300, width: 115, height: 115 }; }, closest() { return null; } };
  }
  const brand = { ...node(), getBoundingClientRect() { return { left: 16, top: -60, width: 48, height: 48 }; } };
  const root = { style: { setProperty() {} }, dataset: {} as Record<string,string>, classList: { add(...names: string[]) { names.forEach(n => classes.add(n)); }, remove(...names: string[]) { names.forEach(n => classes.delete(n)); } } };
  const head = node();
  const document = { documentElement: root, head, createElement: node, getElementById(id: string) { let n = nodes.get(id); if (!n) { n = node(); nodes.set(id,n); } return n; }, querySelector(sel: string) { return nav && sel.includes('data-nav-brand') ? brand : null; } };
  const window: { WebGLRenderingContext?: object; __cdTreeReady?: boolean } = { WebGLRenderingContext: webgl ? {} : undefined };
  const dispatch = (e: Event) => { for (const cb of events.get(e.type) ?? []) cb(); return true; };
  const add = (event: string, cb: () => void) => events.set(event, [...events.get(event) ?? [], cb]);
  const timeout = (fn: () => void, ms: number) => { timers.push({ at: now + ms, fn }); return timers.length; };
  const intervals: { every: number; next: number; fn: () => void }[] = [];
  const interval = (fn: () => void, ms: number) => { intervals.push({ every: ms, next: now + ms, fn }); return intervals.length; };
  new Function('document','location','navigator','window','Date','performance','innerWidth','innerHeight','addEventListener','removeEventListener','dispatchEvent','setTimeout','setInterval','clearInterval', source)(document, { pathname: path, search: query }, { userAgent: ua, connection: { saveData } }, window, class { getHours() { return hour; } }, { now: () => now }, 390, 844, add, () => {}, dispatch, timeout, interval, (id: number) => { if (intervals[id - 1]) intervals[id - 1].every = Infinity; });
  function advance(to: number) {
    while (true) {
      timers.sort((a,b) => a.at-b.at);
      const t = timers[0], i = intervals.filter(x => x.every !== Infinity).sort((a,b) => a.next-b.next)[0];
      const nextAt = Math.min(t?.at ?? Infinity, i?.next ?? Infinity);
      if (nextAt > to) break;
      now = nextAt;
      if (t && t.at === nextAt) { timers.shift(); t.fn(); } else if (i) { i.next += i.every; i.fn(); }
    }
    now = to;
  }
  return { classes, nodes, root, head, events, advance, ready() { window.__cdTreeReady = true; dispatch(new Event('cd:tree-ready')); } };
}
Deno.test('every full homepage load and refresh plays without visit storage', async () => {
  for (let i = 0; i < 3; i++) assert((await opening()).classes.has('cd-intro'));
  const html = await Deno.readTextFile('index.html');
  assert(!html.includes('cd_intro_seen_at'));
});
Deno.test('other entry pages including shared fundraisers skip the opening', async () => {
  for (const path of ['/about', '/f/test', '/blog']) assert(!(await opening({path})).classes.has('cd-intro'));
});
Deno.test('bots skip even with intro=1', async () => {
  for (const ua of ['Googlebot', 'HeadlessChrome', 'Twitterbot']) assert(!(await opening({ua, query:'?intro=1'})).classes.has('cd-intro'));
});
Deno.test('intro=0 skips the opening', async () => assert(!(await opening({query:'?intro=0'})).classes.has('cd-intro')));
Deno.test('opening has no button, Escape or pointer skip listener', async () => {
  const o = await opening();
  assert(!o.events.has('keydown'));
  assert(!o.events.has('pointerup'));
  const html = await Deno.readTextFile('index.html');
  assert(!html.includes('Skip intro'));
});
Deno.test('the lockup holds until its drawing finishes at 1550ms, then flies into the nav', async () => {
  const o = await opening();o.ready();o.advance(1549);assert(!o.classes.has('cd-iris'));o.advance(1550);
  assert(o.classes.has('cd-iris'));assert(o.classes.has('cd-fly'));assertEquals(o.root.dataset.introReason,'ready');
  const lock = o.nodes.get('cd-lock')!.style;assertEquals(lock['--fx'],'-384.00px');assertEquals(lock['--fy'],'-360.00px');assertEquals(lock['--fk'],'0.4174');
});
Deno.test('a drawn lockup waits for the live tree before revealing', async () => {
  const o = await opening();o.advance(1550);assert(!o.classes.has('cd-iris'));o.advance(4000);o.ready();assert(o.classes.has('cd-iris'));assertEquals(o.root.dataset.introMs,'4000');
});
Deno.test('the reveal waits for the nav logo to exist, and lands only after the flight', async () => {
  const o = await opening({nav:false});o.ready();o.advance(7999);assert(!o.classes.has('cd-iris'));
  const p = await opening();p.ready();p.advance(1550);assert(!p.classes.has('cd-landed'));p.advance(2509);assert(!p.classes.has('cd-landed'));p.advance(2510);assert(p.classes.has('cd-landed'));
});
Deno.test('loading hairline appears only when loading outlasts the animation, safety reveal at 8000ms', async () => {
  const o = await opening();o.advance(1799);assert(!o.classes.has('cd-wait'));o.advance(1800);assert(o.classes.has('cd-wait'));
  o.advance(7999);assert(!o.classes.has('cd-iris'));o.advance(8000);assert(o.classes.has('cd-iris'));assertEquals(o.root.dataset.introReason,'cap');
  o.advance(9599);assert(o.classes.has('cd-intro'));o.advance(9600);assert(!o.classes.has('cd-intro'));assert(!o.classes.has('cd-iris'));
});
Deno.test('every page load picks this visit\'s sky: night 70%, day 30%, ?time3d forces one', async () => {
  const real = Math.random;
  try {
    Math.random = () => 0.69;assertEquals((await opening()).root.dataset.sky,'night');assertEquals((await opening({path:'/about'})).root.dataset.sky,'night');
    Math.random = () => 0.7;assertEquals((await opening()).root.dataset.sky,'day');
    Math.random = () => 0.1;assertEquals((await opening({query:'?time3d=day'})).root.dataset.sky,'day');
    Math.random = () => 0.9;assertEquals((await opening({query:'?time3d=night'})).root.dataset.sky,'night');
  } finally { Math.random = real; }
});
Deno.test('live-capable opening preloads exact 18 logo URLs and model/Draco fetches', async () => {
  const o = await opening();
  const links = o.head.children as { href: string; as: string; crossOrigin?: string; fetchPriority: string }[];
  assertEquals(links.length,21);
  assertEquals(links.filter(x=>x.as==='fetch').map(x=>[x.href,x.crossOrigin,x.fetchPriority]),[['/models/tree.glb','anonymous','low'],['/draco/draco_wasm_wrapper.js','anonymous','low'],['/draco/draco_decoder.wasm','anonymous','low']]);
  const expected=['walmart','cvs','target','dominos','aldi','starbucks','mcdonalds','instacart','amazon','home-depot','uber','publix','doordash','walgreens','taco-bell','whole-foods','costco','lyft'];
  assertEquals(links.filter(x=>x.as==='image').map(x=>x.href),expected.map(x=>`/brand-logos/${x}.svg`));
});
Deno.test('no tree preloads without a usable WebGL context; Save-Data no longer denies the live tree', async () => {
  assertEquals((await opening({webgl:false})).head.children.length,0);
  assertEquals((await opening({saveData:true})).head.children.length,21);
  assertEquals((await opening({path:'/about'})).head.children.length,0);
});
Deno.test('opening is the logo-to-navbar lockup on the shared logo file, with build-time chunk preloads', async () => {
  const html=await Deno.readTextFile('index.html');const intro=html.slice(html.indexOf('<style id="cd-intro-style">'),html.indexOf('<div id="root"'));
  for (const id of ['cd-cover','cd-lock','cd-mark','cd-w1','cd-w2','cd-tag','cd-bar']) assert(intro.includes(`id="${id}"`), id);
  assert(intro.includes('src="/brand/logo-256.webp"'));assert(intro.includes('>Coupon<')&&intro.includes('>Donation<')&&intro.includes('>Transforming Giving<'));
  assert(intro.includes('"__CD_PAGE_CHUNKS__"')&&intro.includes('"__CD_TREE_CHUNKS__"'));
  assert(html.includes('<link rel="preload" href="/brand/logo-256.webp" as="image"'));
  const navbar=await Deno.readTextFile('src/components/layout/Navbar.tsx');assert(navbar.includes("const logo = '/brand/logo-256.webp'"));assert(navbar.includes('data-nav-brand'));
  const vite=await Deno.readTextFile('vite.config.ts');assert(vite.includes('openingPreloads()'));assert(vite.includes('__CD_PAGE_CHUNKS__'));
  for (const name of ['cd-mark','cd-w1','cd-w2','cd-tag','cd-lock','cd-cover']) assert(!/#cd-(mark|w1|w2|tag|lock|cover)\{[^}]*(width|height|top|left):[^}]*transition/.test(intro), name);
});
Deno.test('static opening stays hidden without JS and under 12KiB', async () => {
  const html=await Deno.readTextFile('index.html');const intro=html.slice(html.indexOf('<style id="cd-intro-style">'),html.indexOf('<div id="root"'));
  assert(new TextEncoder().encode(intro).length < 12288);assert(intro.includes('display:none'));
});
Deno.test('tree readiness is emitted at reveal, with unavailable-tree fallback', async () => {
  const scene=await Deno.readTextFile('src/components/landing/Tree3DScene.tsx');const fallback=await Deno.readTextFile('src/lib/treeReady.ts');
  assert(scene.indexOf("window.dispatchEvent(new Event('cd:tree-ready'))") < scene.indexOf('    onReady();'));
  assert(fallback.includes("new Event('cd:tree-ready')"));
});
Deno.test('cursor remains compositor driven and survives route changes', async () => {
  const cursor=await Deno.readTextFile('src/components/CursorTrail.tsx');const css=await Deno.readTextFile('src/index.css');
  assert(cursor.includes("path.current.startsWith('/admin')"));assert(/\}, \[\]\);\s*return createPortal/.test(cursor));assert(cursor.includes('translate3d'));assert(!cursor.includes('useState'));assert(css.includes('cursor: none'));
});
Deno.test('effects reuse installed motion without new animation packages', async () => {
  const pkg=JSON.parse(await Deno.readTextFile('package.json'));assert(pkg.dependencies.motion);for(const name of ['gsap','animejs','@react-spring/web','lottie-web'])assert(!pkg.dependencies[name]);
});
