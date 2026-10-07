import { revealMode } from '../../../src/lib/landingPresentation.ts';
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
Deno.test('reveal waits until 20% below the viewport (844px screen)', () => {
  assertEquals(revealMode(1100, 1500, 844, 0), 'wait');
  assertEquals(revealMode(1000, 1400, 844, 0), 'animate');
});
Deno.test('content mounting already on screen still animates instead of snapping', () => {
  assertEquals(revealMode(300, 700, 844, 0), 'late');
});
Deno.test('only content scrolled past or a fling over 6 screens per second finishes instantly', () => {
  assertEquals(revealMode(-900, -100, 844, 0), 'instant');
  assertEquals(revealMode(300, 700, 844, 7), 'instant');
  assertEquals(revealMode(300, 700, 844, 2), 'late');
});
Deno.test('full motion on every device regardless of the OS Reduce Motion setting', async () => {
  const hook = await Deno.readTextFile('src/hooks/useMotionPreference.tsx');
  const css = await Deno.readTextFile('src/index.css');
  assert(/useMotionPreference\(\): MotionPreference \{\s*return 'full';/.test(hook));
  assert(!css.includes('prefers-reduced-motion'));
});
