import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

async function opening({ path = '/', query = '', ua = 'Mozilla Safari', webgl = true, saveData = false, hour = 12 } = {}) {
  const html = await Deno.readTextFile('index.html');
  const source = html.match(/<script>(.*?)<\/script>/s)?.[1];
  if (!source) throw new Error('Missing opening script');
  let now = 0;
  const timers: { at: number; fn: () => void }[] = [];
  const events = new Map<string, (() => void)[]>();
  const classes = new Set<string>();
  const nodes = new Map<string, ReturnType<typeof node>>();
  function node() {
    return { className: '', style: { cssText: '', setProperty() {} }, dataset: {} as Record<string,string>, children: [] as unknown[], isConnected: true, innerHTML: '', remove() { this.isConnected = false; }, append(...items: unknown[]) { this.children.push(...items); }, setAttribute() {}, getContext(type: string) { return webgl && /webgl/.test(type) ? { getExtension: () => null } : null; } };
  }
  const root = { style: { setProperty() {} }, dataset: {} as Record<string,string>, classList: { add(...names: string[]) { names.forEach(n => classes.add(n)); }, remove(...names: string[]) { names.forEach(n => classes.delete(n)); } } };
  const head = node();
  const document = { documentElement: root, head, createElement: node, getElementById(id: string) { let n = nodes.get(id); if (!n) { n = node(); nodes.set(id,n); } return n; }, querySelector() { return null; } };
  const window: { WebGLRenderingContext?: object; __cdTreeReady?: boolean } = { WebGLRenderingContext: webgl ? {} : undefined };
  const dispatch = (e: Event) => { for (const cb of events.get(e.type) ?? []) cb(); return true; };
  const add = (event: string, cb: () => void) => events.set(event, [...events.get(event) ?? [], cb]);
  const timeout = (fn: () => void, ms: number) => { timers.push({ at: now + ms, fn }); return timers.length; };
  new Function('document','location','navigator','window','Date','performance','innerWidth','innerHeight','addEventListener','removeEventListener','dispatchEvent','setTimeout','setInterval','clearInterval', source)(document, { pathname: path, search: query }, { userAgent: ua, connection: { saveData } }, window, class { getHours() { return hour; } }, { now: () => now }, 390, 844, add, () => {}, dispatch, timeout, () => 1, () => {});
  function advance(to: number) { while (true) { timers.sort((a,b) => a.at-b.at); const t = timers[0]; if (!t || t.at > to) break; timers.shift(); now = t.at; t.fn(); } now = to; }
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
Deno.test('ready before drawing waits until exactly 2400ms', async () => {
  const o = await opening();o.ready();o.advance(2399);assert(!o.classes.has('cd-iris'));o.advance(2400);assert(o.classes.has('cd-iris'));assertEquals(o.root.dataset.introReason,'ready');
});
Deno.test('drawing alone waits for the first full live tree frame', async () => {
  const o = await opening();o.advance(2400);assert(!o.classes.has('cd-iris'));o.advance(4000);o.ready();assert(o.classes.has('cd-iris'));assertEquals(o.root.dataset.introMs,'4000');
});
Deno.test('fallback notification occurs at 5000ms and safety reveals at 8000ms', async () => {
  const o = await opening();let fallback = false;o.events.set('cd:intro-poster-fallback',[() => {fallback = true;}]);o.advance(4999);assert(!fallback);o.advance(5000);assert(fallback);o.advance(7999);assert(!o.classes.has('cd-iris'));o.advance(8000);assert(o.classes.has('cd-iris'));assertEquals(o.root.dataset.introReason,'cap');o.advance(8900);assert(!o.classes.has('cd-intro'));
});
Deno.test('live-capable opening preloads exact 18 logo URLs and model/Draco fetches', async () => {
  const o = await opening();
  const links = o.head.children as { href: string; as: string; crossOrigin?: string; fetchPriority: string }[];
  assertEquals(links.length,21);
  assertEquals(links.filter(x=>x.as==='fetch').map(x=>[x.href,x.crossOrigin,x.fetchPriority]),[['/models/tree.glb','anonymous','low'],['/draco/draco_wasm_wrapper.js','anonymous','low'],['/draco/draco_decoder.wasm','anonymous','low']]);
  const expected=['walmart','cvs','target','dominos','aldi','starbucks','mcdonalds','instacart','amazon','home-depot','uber','publix','doordash','walgreens','taco-bell','whole-foods','costco','lyft'];
  assertEquals(links.filter(x=>x.as==='image').map(x=>x.href),expected.map(x=>`/brand-logos/${x}.svg`));
});
Deno.test('no tree preloads without a usable WebGL context or with Save-Data enabled', async () => {
  assertEquals((await opening({webgl:false})).head.children.length,0);
  assertEquals((await opening({saveData:true})).head.children.length,0);
  assertEquals((await opening({path:'/about'})).head.children.length,0);
});
Deno.test('opening is the line-art seed-to-tree: trunk and branches, canopy circles, coupon tickets', async () => {
  const o = await opening();
  assertEquals(o.nodes.get('cd-b')?.children.length,6);
  assertEquals(o.nodes.get('cd-c')?.children.length,8);
  assertEquals(o.nodes.get('cd-t')?.children.length,8);
  const html=await Deno.readTextFile('index.html');const intro=html.slice(html.indexOf('<style id="cd-intro-style">'),html.indexOf('<div id="root"'));
  assert(intro.includes('#f6f5ef')||intro.includes('#F6F5EF'));
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
