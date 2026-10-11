import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { cursorColour, CURSOR_QUERY, NATIVE_DOT_IMAGES } from '../../../src/lib/cursorBackground.ts';
Deno.test('dark backgrounds including night and forest map to white first', () => {
  assertEquals(cursorColour({r:10,g:20,b:35}), 'white');
  assertEquals(cursorColour({r:25,g:65,b:30}), 'white');
});
Deno.test('bright foliage/grass and mint map to blue', () => {
  assertEquals(cursorColour({r:110,g:180,b:75}), 'blue');
  assertEquals(cursorColour({r:225,g:242,b:226}), 'blue');
});
Deno.test('day sky maps to brand green', () => assertEquals(cursorColour({r:150,g:205,b:235}), 'green'));
Deno.test('photos default white after dark and hue checks', () => {
  assertEquals(cursorColour({r:220,g:190,b:160}, true), 'white');
  assertEquals(cursorColour({r:150,g:205,b:235}, true), 'green');
});
Deno.test('cream sunset red and yellow backgrounds default blue', () => {
  for (const rgb of [{r:246,g:245,b:239},{r:240,g:165,b:100},{r:250,g:140,b:140},{r:255,g:240,b:0}]) assertEquals(cursorColour(rgb), 'blue');
});
Deno.test('the cursor stays blue over the live tree and its sky, with no pixel read-back', async () => {
  const trail = await Deno.readTextFile('src/components/CursorTrail.tsx');
  assertEquals(CURSOR_QUERY, '(hover: hover) and (pointer: fine)');
  assert(trail.includes("paint('blue');"));
  for (const gone of ['cd:cursor-bg', 'stableColour', 'setInterval(']) assert(!trail.includes(gone));
  // Reading WebGL pixels back makes the page wait for the GPU to finish the frame.
  const stack = ['src'];
  while (stack.length) {
    const dir = stack.pop()!;
    for await (const entry of Deno.readDir(dir)) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory) stack.push(path);
      else if (/\.(ts|tsx)$/.test(entry.name)) assert(!(await Deno.readTextFile(path)).includes('readPixels'), path);
    }
  }
});
Deno.test('over the live tree the lead dot is a system pointer image of the same blue dot', async () => {
  const css = await Deno.readTextFile('src/index.css');
  const trail = await Deno.readTextFile('src/components/CursorTrail.tsx');
  for (const src of NATIVE_DOT_IMAGES) assert((await Deno.stat(`public${src}`)).size > 500, src);
  assert(css.includes('html.cd-cursor-active.cd-native-dot .hero-stage canvas { cursor: image-set(url(/cursor/dot.png) 1x, url(/cursor/dot@2x.png) 2x) 16 16, auto !important; }'));
  assert(css.includes('html.cd-cursor-active.cd-native-dot-webkit .hero-stage canvas { cursor: -webkit-image-set('));
  assert(css.includes('.cursor-native > span:first-child { opacity: 0; }'));
  // Only where the browser understands the syntax, only on the canvas, and the DOM dot resumes at the pointer.
  assert(trail.includes("CSS.supports?.('cursor'"));
  assert(trail.includes('on &&= !!nativeClass;'));
  assert(trail.includes('target instanceof HTMLCanvasElement'));
  assert(trail.includes('if (!on) { pos[0].x = x; pos[0].y = y; write(0); }'));
});
import { trailFactor, TRAIL_TAU, TRAIL_MAX_DT } from '../../../src/lib/cursorBackground.ts';
Deno.test('all dots use exponential smoothing with 20/170/340ms and dt clamped to 0–64ms', () => {
  assertEquals(TRAIL_TAU, [20, 170, 340]);
  assertEquals(TRAIL_MAX_DT, 64);
  assertEquals(trailFactor(-1, 20), 0);
  assertEquals(trailFactor(0, 20), 0);
  assert(Math.abs(trailFactor(25, TRAIL_TAU[0]) - (1 - Math.exp(-25 / 20))) < 1e-12);
  assertEquals(trailFactor(170, 170), trailFactor(64, 170));
  assert(Math.abs(trailFactor(16, 170) - (1 - Math.exp(-16 / 170))) < 1e-12);
  assert(trailFactor(16, 340) < trailFactor(16, 170));
});
Deno.test('lead dot has no transition and trail loop is rAF-only', async () => {
  const css = await Deno.readTextFile('src/index.css');
  const trail = await Deno.readTextFile('src/components/CursorTrail.tsx');
  assert(!/\.cursor-trail > span[^{]*\{[^}]*transition/.test(css));
  assert(trail.includes('requestAnimationFrame(tick)'));
  assert(!trail.includes("style.transition"));
});
Deno.test('cursor dt uses performance.now at callback start, with 16ms first frame and lead included in settlement', async () => {
  const trail = await Deno.readTextFile('src/components/CursorTrail.tsx');
  assert(/const tick = \(ts: number\) => \{\s*const now = performance\.now\(\);/.test(trail));
  assert(trail.includes('const dt = lastTs ? frameDt(ts - lastTs, now - lastNow) : 16'));
  assert(trail.includes('for (let i = 0; i < pos.length; i++)'));
  assert(trail.includes('trailFactor(dt, TRAIL_TAU[i])'));
  assert(trail.includes('let settled = !hadMove'));
  assert(trail.includes('TRAIL_SETTLE_PX'));
});
import { frameDt } from '../../../src/lib/cursorBackground.ts';
Deno.test('frameDt trusts rAF unless it disagrees with the clock by more than 6ms', () => {
  assertEquals(frameDt(16.67, 18.2), 16.67);
  assertEquals(frameDt(33.3, 25), 25);
  assertEquals(frameDt(400, 400), 64);
  assertEquals(frameDt(-5, -4), 0);
});
