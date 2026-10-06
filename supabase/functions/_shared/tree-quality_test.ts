import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { allowLiveTree, qualitySettings, rendererTier, shouldReduceQuality, TIER_SETTINGS } from '../../../src/lib/treeQuality.ts';

Deno.test('Apple, Adreno and budget Mali begin with full desktop artwork', () => {
  for (const gpu of ['Apple GPU', 'Adreno (TM) 710', 'Mali-G57', '', 'Intel Iris']) {
    assertEquals(rendererTier(gpu), 'high');
    assertEquals(qualitySettings(rendererTier(gpu), 0), TIER_SETTINGS.high);
  }
  assertEquals(rendererTier('ANGLE SwiftShader'), 'low');
  assertEquals(rendererTier('llvmpipe'), 'low');
});
Deno.test('shadow resolution then DPR precede any ambient density reduction', () => {
  const stages = Array.from({ length: 7 }, (_, step) => qualitySettings('high', step));
  assertEquals(stages.map(s => s.shadowMapSize), [4096, 2048, 1024, 1024, 1024, 1024, 1024]);
  assertEquals(stages.map(s => s.dprCap), [2, 2, 2, 1.75, 1.5, 1.5, 1.5]);
  for (const s of stages.slice(0, 5)) {
    assertEquals(s.leafCount, 7000);
    assertEquals(s.fireflyCount, 40);
    assertEquals(s.ambientBirds, 8);
    assert(s.trunkRipple);
    assert(s.antialias);
  }
  // The authored GLB canopy is never simplified, including the weak-hardware profile.
  assertEquals(stages[6].leafCount, 7000);
});
Deno.test('quality sampling ignores loading, hidden and smooth frames', () => {
  assert(!shouldReduceQuality(20, false, 3000));
  assert(!shouldReduceQuality(20, true, 2000));
  assert(!shouldReduceQuality(60, true, 3000));
  assert(shouldReduceQuality(30, true, 3000));
});
Deno.test('only explicit Save-Data prevents tree mounting', () => {
  assert(allowLiveTree(undefined));
  assert(allowLiveTree(false));
  assert(!allowLiveTree(true));
});
Deno.test('reveals trigger early, fling entries complete, and gentle mode fades', async () => {
  const motion = await Deno.readTextFile('src/components/ui/editorial-motion.tsx');
  assert(motion.includes('height * 1.2'));
  assert(motion.includes('height * 0.8'));
  assert(motion.includes('rootMargin:'));
  assert(motion.includes('opacity: 0, y: 24'));
  assert(motion.includes('gentle ? 0.18 : 0.6'));
  assert(motion.includes('Math.min(delay, 0.08)'));
  assert(!motion.includes("preference === 'gentle' || value < 10"));
});
Deno.test('gentle scene is live with fixed camera and no flying elements', async () => {
  const scene = await Deno.readTextFile('src/components/landing/Tree3DScene.tsx');
  const flies = await Deno.readTextFile('src/components/landing/tree3d/Fireflies.tsx');
  const brands = await Deno.readTextFile('src/components/landing/LiveActivityBar.tsx');
  assert(scene.includes('enabled={!gentle}'));
  assert(scene.includes('if (gentle) return;'));
  assert(scene.includes('gentle || !logosReady'));
  assert(scene.includes('gentle={gentle}'));
  assert(!scene.includes('mobileSettings'));
  assert(flies.includes('gentle ? 0 : Math.sin'));
  assert(brands.includes('Pause brand animation'));
  assert(brands.includes("gentle || paused ? 'paused' : 'running'"));
});