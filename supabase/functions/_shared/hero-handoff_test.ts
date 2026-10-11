import { assert, assertAlmostEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { FOG_COLORS, PHONE_BREAKPOINT, SKY_PALETTES, heroCamera } from '../../../src/lib/heroBackdrop.ts';

Deno.test('the no-WebGL fallback is drawn from the live scene\'s own sky, fog, ground and lens', async () => {
  const sky = await Deno.readTextFile('src/components/landing/tree3d/Sky.tsx');
  const ground = await Deno.readTextFile('src/components/landing/tree3d/Ground.tsx');
  const scene = await Deno.readTextFile('src/components/landing/Tree3DScene.tsx');
  const backdrop = await Deno.readTextFile('src/lib/heroBackdrop.ts');
  const mobile = await Deno.readTextFile('src/hooks/use-mobile.tsx');
  for (const [name, p] of Object.entries(SKY_PALETTES)) assert(sky.includes(`${name}: { top: '${p.top}', mid: '${p.mid}', bot: '${p.bot}' }`), name);
  assert(sky.includes('<sphereGeometry args={[60, 32, 32]} />') && sky.includes('smoothstep(0.0, 0.7, h)') && sky.includes('smoothstep(0.0, -0.4, h)'));
  assert(sky.includes('<mesh position={[8, 9, -12]}>') && sky.includes('args={[1.2, 24, 24]}') && sky.includes('color="#FFF6D8"'));
  assert(sky.includes('<mesh position={[6, 10, -12]}>') && sky.includes('args={[0.9, 24, 24]}') && sky.includes('color="#E8EBF5"'));
  assert(scene.includes(`fog: '${FOG_COLORS.day}' }`) && scene.includes(`fog: '${FOG_COLORS.night}' }`));
  assert(scene.includes("<fog attach=\"fog\" args={['#DCE6D5', 18, 45]} />") && backdrop.includes('const FOG_NEAR = 18;') && backdrop.includes('const FOG_FAR = 45;'));
  assert(ground.includes('<circleGeometry args={[12, 96]} />') && scene.includes('const GROUND_Y = -0.01;'));
  assert(scene.includes('fov: isMobile ? 32 : 38') && scene.includes('const zoomProgressRef = useRef(0.7);'));
  assert(scene.includes('Math.max(isMobile ? MOBILE_BASE_DIST : 13,') && scene.includes('4.5 / (Math.tan(verticalFov / 2) * Math.min(aspect, 1))'));
  assert(scene.includes('maxPolarAngle={Math.PI / 2.1}') && scene.includes("target={isMobile ? [0, 3.6, 0] : [0, 3.4, 0]}"));
  assert(mobile.includes(`const MOBILE_BREAKPOINT = ${PHONE_BREAKPOINT};`));
});

Deno.test('the backdrop camera lands where the live tree\'s first frame does', () => {
  // Cameras read back from rendered frames (canvas data-tree-camera) at laptop and phone size;
  // the canvas measures whole pixels (offsetSize), so a 489.5px-tall phone hero is 490.
  const laptop = heroCamera(960, 474, false).position;
  [0, 4.5859, 15.8246].forEach((v, i) => assertAlmostEquals(laptop[i], v, 0.002));
  const phone = heroCamera(390, 490, true).position;
  [0, 5.2827, 22.4543].forEach((v, i) => assertAlmostEquals(phone[i], v, 0.002));
});

Deno.test('the painted scene is only a no-WebGL fallback, and the tree only fades when nothing covers it', async () => {
  const hero = await Deno.readTextFile('src/components/landing/HeroSection.tsx');
  const scene = await Deno.readTextFile('src/components/landing/Tree3DScene.tsx');
  assert(hero.indexOf('<HeroBackdrop />') > hero.indexOf('className="hero-tree ') && hero.indexOf('<HeroBackdrop />') < hero.indexOf('<Tree3DErrorBoundary'));
  assert(scene.includes("const coverUp = root.classList.contains('cd-intro') && !root.classList.contains('cd-iris');"));
  assert(scene.includes("transition: instant ? 'none' : 'opacity .7s"));
});

Deno.test('nothing compiles or uploads inside a frame people are watching', async () => {
  const scene = await Deno.readTextFile('src/components/landing/Tree3DScene.tsx');
  // The first compile includes the effects that appear later; the coupons compile while hidden.
  assert(scene.includes('<group visible={false} position={[0, -40, 0]}>') && scene.includes('<PlantSprout id="warmup"') && scene.includes('<SparkleBurst position={WARMUP_SPOT}'));
  assert(scene.includes('gl.compileAsync(root, camera, scene)') && scene.includes('prepareHidden(gl, group, camera, scene)'));
  // Textures go to the GPU one per task, during the warm-up rather than inside the first frame.
  assert(scene.includes('gl.initTexture(texture)') && scene.includes('void uploadAhead(gl, texturesUnder(scene), () => done)'));
});

Deno.test('startup creates no extra WebGL contexts once the opening has checked', async () => {
  const html = await Deno.readTextFile('index.html');
  const tier = await Deno.readTextFile('src/hooks/useDeviceTier.ts');
  const hero = await Deno.readTextFile('src/components/landing/HeroSection.tsx');
  assert(html.includes('window.__cdGpu=g?String(o.getParameter(g.UNMASKED_RENDERER_WEBGL)):""'));
  assert(tier.includes("typeof window.__cdGpu === 'string') return window.__cdGpu;"));
  assert(hero.includes("gl?.getExtension('WEBGL_lose_context')?.loseContext();"));
  // Under the opening the tree mounts at once instead of after two frames.
  assert(hero.includes("return known === undefined ? 'checking' : known ? 'live' : 'fallback';"));
});
