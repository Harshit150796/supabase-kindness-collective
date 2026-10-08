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
Deno.test('only content already scrolled past finishes instantly', () => {
  assertEquals(revealMode(-900, -100, 844, 0), 'instant');
  assertEquals(revealMode(300, 700, 844, 7), 'late');
  assertEquals(revealMode(300, 700, 844, 2), 'late');
});
Deno.test('top donors are removed and the brand rail uses one 48-second speed', async () => {
  const hero = await Deno.readTextFile('src/components/landing/HeroSection.tsx');
  const stories = await Deno.readTextFile('src/pages/Stories.tsx');
  const rail = await Deno.readTextFile('src/components/landing/LiveActivityBar.tsx');
  const chat = await Deno.readTextFile('supabase/functions/coupon-chat/index.ts');
  assert(!hero.includes('TopDonors'));
  assert(!stories.includes('useTopDonors'));
  assert(!chat.includes('getTopDonors'));
  assert(!chat.includes('get_top_donors_week'));
  assert(rail.includes('[animation-duration:48s]'));
  assert(!rail.includes('lg:[animation-duration:48s]'));
  assert(!rail.includes('animation-play-state:paused'));
  assert(!rail.includes('Pause brand animation'));
  assert(!rail.includes('Resume brand animation'));
  assert(rail.includes("loading={group === 0 ? 'eager' : 'lazy'}"));
});
Deno.test('tree startup restores 18-slot layout and preloads replacement logos on demand', async () => {
  const scene = await Deno.readTextFile('src/components/landing/Tree3DScene.tsx');
  const tree = await Deno.readTextFile('src/components/landing/tree3d/Tree.tsx');
  const coupons = await Deno.readTextFile('src/components/landing/tree3d/couponDesign.ts');
  assert(scene.includes('getBranchTips(visibleFruitCount)'));
  assert(scene.includes('Math.min(18, COUPON_FRUITS.length)'));
  assert(scene.includes("'doordash', 'walgreens', 'taco-bell', 'whole-foods', 'costco', 'lyft',"));
  assert(!tree.includes('getFrontBranchTips'));
  assert(tree.includes("useGLTF.preload(MODEL_URL, DRACO_PATH)"));
  assert(!tree.includes('gstatic'));
  assert(scene.includes('const openingLogoPreload = preloadCouponLogos(OPENING_FRUITS)'));
  assert(!scene.includes('rearReady'));
  assert(!scene.includes('isRearBranchSlot'));
  assert(scene.includes('preloadCouponLogos([COUPON_FRUITS[chosen]])'));
  assert(tree.includes('band.frontCount'));
  assert(!coupons.includes("COUPON_FRUITS.forEach((f) => loadLogo(f.logo))"));
});
Deno.test('device-safe interfaces retain dynamic viewport and touch equivalents', async () => {
  const chat = await Deno.readTextFile('src/components/landing/hero/AITreeChat.tsx');
  const gallery = await Deno.readTextFile('src/components/fundraiser/FundraiserGallery.tsx');
  const dashboard = await Deno.readTextFile('src/components/layout/DashboardLayout.tsx');
  const story = await Deno.readTextFile('src/components/landing/WhatWeDo.tsx');
  assert(chat.includes('100dvh'));
  assert(!chat.toLowerCase().includes('top donors'));
  assert(gallery.includes('srcSet='));
  assert(gallery.includes('sizes='));
  assert(dashboard.includes("aria-label={sidebarOpen ? 'Close account navigation' : 'Open account navigation'}"));
  assert(dashboard.includes('min-h-11 min-w-11'));
  assert(!story.includes("matchMedia('(pointer: fine)').matches"));
});
Deno.test('the transparency section keeps its ring, allocation bars and journey motion', async () => {
  const transparency = await Deno.readTextFile('src/components/landing/TrustTransparency.tsx');
  assert(transparency.includes('data-allocation-ring'));
  assert(transparency.includes('<MotionBar value={percent}'));
  assert(transparency.includes('data-journey-line'));
  assert(transparency.includes('duration: 1.6'));
});
Deno.test('homepage sections retain their approved motion entry points', async () => {
  const story = await Deno.readTextFile('src/components/landing/WhatWeDo.tsx');
  const security = await Deno.readTextFile('src/components/landing/SecurityBadges.tsx');
  const impact = await Deno.readTextFile('src/components/landing/ImpactDashboard.tsx');
  const donation = await Deno.readTextFile('src/components/landing/DonationFlow.tsx');
  const footer = await Deno.readTextFile('src/components/layout/Footer.tsx');
  assert(story.includes('<LineReveal><h2'));
  assert(story.includes('startIdleMotion();'));
  assert(security.includes('initial={{opacity:0,scale:.92,rotate:-4}}'));
  assert(impact.includes('formatter={item.currency ? formatUSD : undefined}'));
  assert(donation.includes('<Reveal className="mx-auto max-w-3xl"><Card'));
  assert(footer.includes('<Reveal className="grid grid-cols-2'));
});
Deno.test('all four compact giving stories keep a visible animation loop', async () => {
  const story = await Deno.readTextFile('src/components/landing/WhatWeDo.tsx');
  assertEquals((story.match(/data-mobile-step=/g) ?? []).length, 1);
  assert(story.includes('duration: 6'));
  assert(story.includes('repeat: Infinity'));
  assert(story.includes('y: [0, -3, 0]'));
  assert(story.includes('data-giving-steps="compact"'));
  assert(story.includes('data-desktop-step={index + 1}'));
});
Deno.test('full motion on every device regardless of the OS Reduce Motion setting', async () => {
  const hook = await Deno.readTextFile('src/hooks/useMotionPreference.tsx');
  const css = await Deno.readTextFile('src/index.css');
  assert(/useMotionPreference\(\): MotionPreference \{\s*return 'full';/.test(hook));
  assert(!css.includes('prefers-reduced-motion'));
});

Deno.test('poster reveal follows a drawn 18-logo frame with a 3s safety escape', async () => {
  const scene = await Deno.readTextFile('src/components/landing/Tree3DScene.tsx');
  assert(scene.indexOf('const openingLogoPreload') < scene.indexOf('function Scene'));
  assert(scene.includes('openingLogoPreload.then'));
  assert(scene.includes('if (!logosReady) return;'));
  assert(scene.includes('if (revealRef.current.frames < 2) return;'));
  assert(scene.includes("reveal('logos')"));
  assert(scene.includes("window.setTimeout(() => reveal('safety'), 3000)"));
  assert(!scene.includes('requestAnimationFrame(onReady)'));
  assert(scene.includes('logosReady && brandIndices.map'));
  const sky = await Deno.readTextFile('src/components/landing/tree3d/Sky.tsx');
  assert(sky.includes('Math.min(dt * 1.5, 0.05)'));
  assert(scene.includes('Math.min(dt * 1.5, 0.05)'));
});
Deno.test('daytime posters retain wide landscape and 2x phone capture sizes and budgets', async () => {
  // cwebp emits VP8 lossy WebP: the frame width/height follow its start code.
  async function dimensions(path: string) {
    const b = await Deno.readFile(path);
    const chunk = new TextDecoder().decode(b.subarray(12, 16));
    assertEquals(chunk, 'VP8 ');
    assertEquals(Array.from(b.subarray(23, 26)), [157, 1, 42]);
    return { width: (b[26] | b[27] << 8) & 16383, height: (b[28] | b[29] << 8) & 16383, bytes: b.length };
  }
  const desktop = await dimensions('src/assets/tree-poster-desktop.webp');
  const mobile = await dimensions('src/assets/tree-poster-mobile.webp');
  assertEquals([desktop.width, desktop.height], [2880, 828]);
  assertEquals([mobile.width, mobile.height], [780, 978]);
  assert(desktop.bytes <= 160000);
  assert(mobile.bytes <= 70000);
});
Deno.test('Draco runtime uses only the self-hosted decoder', async () => {
  const tree = await Deno.readTextFile('src/components/landing/tree3d/Tree.tsx');
  assert(tree.includes("const DRACO_PATH = '/draco/'"));
  assert(tree.includes('useGLTF(MODEL_URL, DRACO_PATH)'));
  assert(tree.includes('useGLTF.preload(MODEL_URL, DRACO_PATH)'));
  assert(!tree.includes('gstatic.com'));
  for (const name of ['draco_decoder.js', 'draco_decoder.wasm', 'draco_wasm_wrapper.js']) {
    assert((await Deno.stat(`public/draco/${name}`)).size > 0);
  }
});
