import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { createRefreshTracker, pacingDivisor } from '../../../src/lib/framePacing.ts';
import { SLOW_TREE_FPS, shouldReduceQuality } from '../../../src/lib/treeQuality.ts';

Deno.test('the tree draws about 60 times a second on high-refresh screens', () => {
  assertEquals(pacingDivisor(1000 / 60), 1);
  assertEquals(pacingDivisor(1000 / 75), 1);
  assertEquals(pacingDivisor(1000 / 90), 1);
  assertEquals(pacingDivisor(1000 / 100), 1);
  assertEquals(pacingDivisor(1000 / 120), 2);
  assertEquals(pacingDivisor(8.34), 2);
  assertEquals(pacingDivisor(1000 / 144), 2);
  assertEquals(pacingDivisor(1000 / 165), 2);
  assertEquals(pacingDivisor(1000 / 240), 4);
  assertEquals(pacingDivisor(NaN), 1);
});

Deno.test('the refresh estimate is the shortest recent frame gap, so a busy GPU never hides it', () => {
  const tracker = createRefreshTracker();
  let t = 0, estimate = 0;
  // A 120Hz screen whose frames are often late (8.3 / 16.7 / 25ms gaps).
  for (let i = 0; i < 40; i++) { t += [8.33, 16.67, 8.33, 25][i % 4]; estimate = tracker.push(t); }
  assert(Math.abs(estimate - 8.33) < 0.01);
  assertEquals(pacingDivisor(estimate), 2);
  // Long pauses (tab hidden, off screen) are ignored rather than read as a slow screen.
  estimate = tracker.push(t + 5000);
  assert(Math.abs(estimate - 8.33) < 0.01);
  assertEquals(createRefreshTracker().push(16), 1000 / 60);
});

Deno.test('on laptops the tree steps quality down below 55 drawn frames a second, phones keep 45', async () => {
  assertEquals(SLOW_TREE_FPS, { pointer: 55, touch: 45 });
  assert(shouldReduceQuality(50, true, 3000, SLOW_TREE_FPS.pointer));
  assert(!shouldReduceQuality(58, true, 3000, SLOW_TREE_FPS.pointer));
  assert(!shouldReduceQuality(50, true, 3000));
  assert(shouldReduceQuality(40, true, 3000));
  const scene = await Deno.readTextFile('src/components/landing/Tree3DScene.tsx');
  assert(scene.includes("matchMedia('(hover: hover) and (pointer: fine)').matches ? SLOW_TREE_FPS.pointer : SLOW_TREE_FPS.touch"));
});

Deno.test('the tree draws its own frames, every frame until the reveal, and counts drawn frames', async () => {
  const scene = await Deno.readTextFile('src/components/landing/Tree3DScene.tsx');
  assert(scene.includes('<FramePacer />'));
  assert(scene.includes('pace.draw = !window.__cdTreeReady || divisor === 1 || pace.frame % divisor === 0;'));
  assert(/gl\.render\(scene, camera\);\s*pace\.drawn\+\+;\s*\}, 1\);/.test(scene));
  assert(scene.includes('const fps = (pace.drawn - s.drawn) * 1000 / elapsed;'));
  // The camera readout is no longer a DOM write on every frame.
  assert(scene.includes('if (stamp - cameraStampRef.current > 250)'));
});

Deno.test('invisible click targets are never drawn and fruit hover restyles only the canvas', async () => {
  const zones = await Deno.readTextFile('src/components/landing/tree3d/HitZones.tsx');
  const fruit = await Deno.readTextFile('src/components/landing/tree3d/CouponFruit.tsx');
  assertEquals((zones.match(/visible=\{false\}/g) ?? []).length, 4);
  assert(!fruit.includes('document.body.style.cursor'));
  assert(fruit.includes("canvas.style.cursor = 'pointer';"));
});
