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
  assert(probe.indexOf('document.elementFromPoint(x, y) !== canvas') < probe.indexOf('gl.readPixels'));
  assert(probe.includes('addAfterEffect'));
  for (const forbidden of ['bindFramebuffer(', 'setRenderTarget(', 'invalidate(', 'preserveDrawingBuffer:']) assert(!probe.includes(forbidden));
});
