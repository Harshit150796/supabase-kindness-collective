import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { cursorColour, coverSamplePoint, CURSOR_SAMPLE_INTERVAL, CURSOR_QUERY } from '../../../src/lib/cursorBackground.ts';
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
Deno.test('poster cover mapping is centred and proportional', () => {
  assertEquals(coverSamplePoint(720,333,1440,666,2880,828), {x:1440,y:414});
  assertEquals(coverSamplePoint(195,244.5,390,489,780,978), {x:390,y:489});
});
Deno.test('probe rate is capped at twelve reads a second and fine pointers', () => {
  assertEquals(CURSOR_SAMPLE_INTERVAL, 1000 / 12);
  assertEquals(CURSOR_QUERY, '(hover: hover) and (pointer: fine)');
  let last = -Infinity, reads = 0;
  for(let t=0;t<1000;t+=1) if(t-last>=CURSOR_SAMPLE_INTERVAL) {last=t; reads++;}
  assertEquals(reads, 12);
});
Deno.test('probe is read-only and gates before default-framebuffer read', async () => {
  const probe = await Deno.readTextFile('src/components/landing/tree3d/CursorPixelProbe.tsx');
  assert(probe.indexOf('!query.matches') < probe.indexOf('gl.readPixels'));
  assert(probe.indexOf('hit !== canvas') < probe.indexOf('gl.readPixels'));
  assert(probe.includes('addAfterEffect'));
  for (const forbidden of ['bindFramebuffer(', 'setRenderTarget(', 'invalidate(', 'preserveDrawingBuffer:']) assert(!probe.includes(forbidden));
});
import { trailFactor, stableColour, immediateColour, averagePixels, TRAIL_TAU, TRAIL_MAX_DT, type ColourHysteresis } from '../../../src/lib/cursorBackground.ts';
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
Deno.test('textured colour alternating white/blue every 16ms for 2s never switches', () => {
  const s: ColourHysteresis = {};
  const shade = {r:70,g:115,b:60}, leaf = {r:100,g:150,b:80};
  assertEquals(stableColour(s, shade, 0), 'white');
  for (let t = 16; t <= 2000; t += 16) assertEquals(stableColour(s, t % 32 ? leaf : shade, t), 'white');
});
Deno.test('textured colour switches only after 160ms of a steady new colour', () => {
  const s: ColourHysteresis = {};
  const shade = {r:70,g:115,b:60}, leaf = {r:100,g:150,b:80};
  assertEquals(stableColour(s, shade, 0), 'white');
  assertEquals(stableColour(s, leaf, 100), 'white');  // wait starts
  assertEquals(stableColour(s, leaf, 200), 'white');  // 100ms: held
  assertEquals(stableColour(s, leaf, 259), 'white');  // 159ms: held
  assertEquals(stableColour(s, leaf, 260), 'blue');   // 160ms: switch
  // an interrupting match of the current colour restarts the wait
  assertEquals(stableColour(s, shade, 300), 'blue');
  assertEquals(stableColour(s, leaf, 320), 'blue');
  assertEquals(stableColour(s, shade, 340), 'blue');  // current colour: pending cleared
  assertEquals(stableColour(s, leaf, 360), 'blue');   // wait restarts here
  assertEquals(stableColour(s, leaf, 500), 'blue');   // 140ms: held
  assertEquals(stableColour(s, leaf, 520), 'white');  // 160ms: switch
});
Deno.test('DOM backgrounds switch immediately and reset pending state', () => {
  const s: ColourHysteresis = {};
  stableColour(s, {r:10,g:10,b:10}, 0);
  stableColour(s, {r:100,g:150,b:80}, 16); // pending blue
  assertEquals(immediateColour(s, {r:255,g:255,b:255}), 'blue');
  assertEquals(s.pending, undefined);
});
Deno.test('probe averages a 7x7 block from one 196-byte read', async () => {
  const px = new Uint8Array(196); for (let i = 0; i < 196; i += 4) { px[i] = i < 98 ? 0 : 200; px[i+3] = 255; }
  const avg = averagePixels(px); assert(avg && avg.r > 90 && avg.r < 110);
  assertEquals(averagePixels(new Uint8Array(196)), undefined);
  const probe = await Deno.readTextFile('src/components/landing/tree3d/CursorPixelProbe.tsx');
  assert(probe.includes('BLOCK = 7') && (probe.match(/readPixels\(/g) ?? []).length === 1);
});
import { frameDt } from '../../../src/lib/cursorBackground.ts';
Deno.test('frameDt trusts rAF unless it disagrees with the clock by more than 6ms', () => {
  assertEquals(frameDt(16.67, 18.2), 16.67);
  assertEquals(frameDt(33.3, 25), 25);
  assertEquals(frameDt(400, 400), 64);
  assertEquals(frameDt(-5, -4), 0);
});
