import { revealMode } from '../../../src/lib/landingPresentation.ts';
import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { qualitySettings, rendererTier, shouldReduceQuality, TIER_SETTINGS } from '../../../src/lib/treeQuality.ts';

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
Deno.test('every WebGL device mounts the live tree (no Save-Data or picture fallback)', async () => {
  const hero = await Deno.readTextFile('src/components/landing/HeroSection.tsx');
  assert(hero.includes("const check = () => { if (canRender3D()) setMode('live'); else fallback(); };"));
  assert(!hero.includes('saveData'));
  assert(!hero.includes('TreePoster'));
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
  assert(scene.includes('const openingLogoPreload = preloadCouponLogos(OPENING_FRUITS, { paintAhead: true })'));
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
  // Phones get the account sections as a swipeable row of 48px targets under the header.
  assert(dashboard.includes('aria-label="Account sections"'));
  assert(dashboard.includes('overflow-x-auto') && dashboard.includes('min-h-12'));
  assert(!story.includes("matchMedia('(pointer: fine)').matches"));
});
Deno.test('the dollar section promises 100%, fills its number and keeps the journey motion', async () => {
  const transparency = await Deno.readTextFile('src/components/landing/TrustTransparency.tsx');
  // Founder-chosen: "The promise" heading and colours, "The big number" layout and filling 100%.
  // The 100% follows the scroll both ways, slowly (spring), so it is always in motion with the page.
  assert(transparency.includes('data-fill-number') && transparency.includes("useScroll({ target: ref, offset: ['start end', 'end start'] })") && transparency.includes('useSpring('));
  // The Promise headline sits above the number, and its underline redraws like the concept.
  assert(transparency.indexOf('data-promise-underline') < transparency.indexOf('<FillingNumber />'));
  assert(transparency.includes('Every dollar you give reaches a family.') && transparency.includes('All of it.') && transparency.includes('repeat: Infinity'));
  assert(transparency.includes('transparency-band') && transparency.includes('tracking-normal'));
  assert(!transparency.includes('text-[clamp('));
  assert(transparency.includes("document.addEventListener('visibilitychange', sync)") && transparency.includes('underline.stop()'));
  assert(!/95¢|95%|Platform operations|3¢/.test(transparency));
  assert(transparency.includes('data-journey-line'));
});
Deno.test('journey scroll frames interpolate cached geometry without layout or SVG readback', async () => {
  const journey = await Deno.readTextFile('src/components/landing/CouponScrollPath.tsx');
  const frame = journey.slice(journey.indexOf('const update ='), journey.indexOf('const size ='));
  assert(!/getBoundingClientRect|getTotalLength|getPointAtLength|offsetWidth|offsetTop/.test(frame));
  assert(frame.includes('ticket.style.transform') && frame.includes('document.hidden'));
  assert(journey.includes('new IntersectionObserver') && journey.includes('new ResizeObserver'));
  assert(journey.includes("querySelectorAll(':scope > *')"));
});
Deno.test('homepage sections retain their approved motion entry points', async () => {
  const story = await Deno.readTextFile('src/components/landing/WhatWeDo.tsx');
  const security = await Deno.readTextFile('src/components/landing/SecurityBadges.tsx');
  const impact = await Deno.readTextFile('src/components/landing/ImpactDashboard.tsx');
  const donation = await Deno.readTextFile('src/components/landing/DonationFlow.tsx');
  const footer = await Deno.readTextFile('src/components/layout/Footer.tsx');
  assert(story.includes('<LineReveal><h2'));
  // Laptops: the four steps are dealt as cards once on screen (compositor transforms, no scroll scrubbing).
  assert(story.includes('data-giving-steps="deal"') && story.includes('new IntersectionObserver('));
  assert(story.includes('element.animate(') && story.includes("DEAL_TONES = ['123 46% 34%', '212 80% 42%'"));
  assert(!story.includes('useScroll') && !story.includes('startIdleMotion'));
  assert(security.includes('initial={{opacity:0,scale:.92,rotate:-4}}'));
  assert(impact.includes('formatter={item.currency ? formatUSD : undefined}'));
  assert(donation.includes('<Reveal className="mx-auto max-w-5xl"><div ref={cardRef} data-donate-card'));
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
Deno.test('full motion on every device regardless of the OS Reduce Motion setting, unless the visitor presses Pause', async () => {
  const hook = await Deno.readTextFile('src/hooks/useMotionPreference.tsx');
  const css = await Deno.readTextFile('src/index.css');
  const choice = await Deno.readTextFile('src/lib/motionChoice.ts');
  // Only the on-page Pause animations control (WCAG 2.2.2) slows anything; the OS setting is never read.
  const body = hook.slice(hook.indexOf('export function useMotionPreference'), hook.indexOf('function osReducedMotion'));
  assert(/return paused \? 'gentle' : 'full';/.test(body));
  assert(!body.includes('matchMedia') && !body.includes('QUERY') && !choice.includes('matchMedia'));
  assert(!css.includes('prefers-reduced-motion'));
});

Deno.test('live tree reveal follows a drawn 18-logo frame with a 3s safety escape outside the opening', async () => {
  const scene = await Deno.readTextFile('src/components/landing/Tree3DScene.tsx');
  assert(scene.indexOf('const openingLogoPreload') < scene.indexOf('function Scene'));
  assert(scene.includes('openingLogoPreload.then'));
  // The coupons are compiled and uploaded while hidden once their logos are ready; the reveal counts frames that show them.
  assert(scene.includes('if (!logosReady || fruitsShown) return;') && scene.includes('<group ref={fruitsRef} visible={fruitsShown}>'));
  assert(scene.includes('if (!fruitsShown) return;'));
  assert(scene.includes('if (revealRef.current.frames < 2) return;'));
  assert(scene.includes("reveal('logos')"));
  assert(scene.includes("window.setTimeout(() => reveal('safety'), 3000)"));
  assert(!scene.includes('requestAnimationFrame(onReady)'));
  assert(scene.includes('logosReady && brandIndices.map'));
  const sky = await Deno.readTextFile('src/components/landing/tree3d/Sky.tsx');
  assert(sky.includes('Math.min(dt * 1.5, 0.05)'));
  assert(scene.includes('Math.min(dt * 1.5, 0.05)'));
});
Deno.test('the still tree picture is gone for good', async () => {
  for (const path of ['src/assets/tree-poster-desktop.webp', 'src/assets/tree-poster-mobile.webp', 'src/components/landing/TreePoster.tsx']) {
    let exists = true;
    try { await Deno.stat(path); } catch { exists = false; }
    assert(!exists, path);
  }
  const css = await Deno.readTextFile('src/index.css');
  // No part-built scenery either: plain page colour until the whole scene fades in.
  assert(css.includes('.hero-stage{background:hsl(var(--background))}') && !css.includes('.hero-stage::before{'));
  assert(!css.includes('.hero-stage>picture'));
});
Deno.test('the live tree has two skies, chosen once per load (night 70%, day 30%)', async () => {
  const ctx = await Deno.readTextFile('src/components/landing/tree3d/InteractionContext.tsx');
  const sky = await Deno.readTextFile('src/components/landing/tree3d/Sky.tsx');
  const scene = await Deno.readTextFile('src/components/landing/Tree3DScene.tsx');
  assert(ctx.includes("export type TimeOfDay = 'day' | 'night';"));
  assert(ctx.includes("Math.random() < 0.7 ? 'night' : 'day'"));
  assert(!ctx.includes('getHours') && !ctx.includes('setInterval'));
  for (const src of [ctx, sky, scene]) assert(!src.includes('sunset'));
  assert(sky.includes('const initial = PALETTES[timeOfDay];'));
  assert(scene.includes('const initialTime = useRef<TimeOfDay>(timeOfDay).current;'));
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

Deno.test('intro readiness preserves all 18 drawn logos', async () => {
  const scene = await Deno.readTextFile('src/components/landing/Tree3DScene.tsx');
  assert(scene.includes('if (!fruitsShown) return;'));
  assert(scene.includes('if (revealRef.current.frames < 2) return;'));
  assert(scene.includes("window.dispatchEvent(new Event('cd:tree-ready'))"));
  const html = await Deno.readTextFile('index.html');
  assert(!html.includes('gstatic.com'));
});

Deno.test('tree shaders compile before the first frame without per-shader GPU waits', async () => {
  const scene = await Deno.readTextFile('src/components/landing/Tree3DScene.tsx');
  // Production skips three's shader error queries (each one waits on the GPU).
  assert(scene.includes('gl.debug.checkShaderErrors = import.meta.env.DEV'));
  // No frame until the scene's programs are compiled (in parallel where supported).
  assert(scene.includes("frameloop={inView && compiled ? 'always' : 'never'}"));
  assert(scene.includes('pending = [...gl.compile(scene, camera)]'));
  assert(scene.includes('program.isReady()'));
  // A lost context never reports completion, so the warm-up has a deadline.
  assert(scene.includes('performance.now() + 5000'));
  // Warm-up runs after Scene so the environment, fog and shadows match the first frame.
  assert(/<Scene [^>]*\/>\s*\{\/\*[^*]*\*\/\}\s*<ShaderWarmup onDone=\{shadersCompiled\} \/>/.test(scene));
  // The environment map is built outside Suspense, while the model downloads.
  const envAt = scene.indexOf('<ProceduralEnvironment />');
  assert(envAt > 0 && envAt < scene.indexOf('<Suspense fallback={null}>'));
  assert(!scene.includes('compileEquirectangularShader'));
});

Deno.test('tree textures and opening coupons are prepared while the model downloads', async () => {
  const scene = await Deno.readTextFile('src/components/landing/Tree3DScene.tsx');
  const textures = await Deno.readTextFile('src/components/landing/tree3d/textures.ts');
  const coupons = await Deno.readTextFile('src/components/landing/tree3d/couponDesign.ts');
  assert(scene.includes('prewarmTreeTextures();'));
  assert(textures.includes('const steps = [getLeafTexture, getLeafTextureB, getGroundTexture];'));
  // The normal-map loop reads the pixel array once instead of a DOM getter per pixel.
  assert(textures.includes('const px = img.data;'));
  assert(!textures.includes('img.data[i]'));
  // Opening coupons are painted ahead, one per task, and each canvas is handed out once.
  assert(coupons.includes('paintAhead ? entry.settled.then(() => prepaint(fruit))'));
  assert(coupons.includes('prepainted.delete(data);'));
  assert(coupons.includes('return inOwnTask(() => {'));
});
