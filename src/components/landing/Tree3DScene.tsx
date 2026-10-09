import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useIsMobile } from '@/hooks/use-mobile';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
// Postprocessing intentionally not imported — bloom/vignette disabled, keeps mobile bundle smaller.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Tree, getBranchTips } from './tree3d/Tree';
import { CouponFruit, type CouponState } from './tree3d/CouponFruit';
import { Ground } from './tree3d/Ground';
import { Sky } from './tree3d/Sky';
import { COUPON_FRUITS, preloadCouponLogos } from './tree3d/couponDesign';
import { useFallingDonations } from '@/hooks/useFallingDonations';
import { InteractionProvider, useInteraction, type TimeOfDay } from './tree3d/InteractionContext';
import { HitZones } from './tree3d/HitZones';
import { Fireflies } from './tree3d/Fireflies';
import { TrunkRipple } from './tree3d/TrunkRipple';
import { Bird } from './tree3d/Bird';
import { AmbientBirds } from './tree3d/AmbientBirds';
import { RecipientStoryPanel } from './tree3d/RecipientStoryPanel';
import { TransparencyPopover } from './tree3d/TransparencyPopover';
import { PlantsLayer } from './tree3d/PlantsLayer';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { shouldReduceQuality } from '@/lib/treeQuality';
import { useDeviceTier, type DeviceTier, type TierSettings } from '@/hooks/useDeviceTier';

// Start all opening SVG decodes alongside the model/Draco preload at module evaluation.
const OPENING_LOGOS = [
  'walmart', 'cvs', 'target', 'dominos', 'aldi',
  'starbucks', 'mcdonalds', 'instacart', 'amazon', 'home-depot', 'uber', 'publix',
  'doordash', 'walgreens', 'taco-bell', 'whole-foods', 'costco', 'lyft',
];
const OPENING_FRUITS = OPENING_LOGOS.flatMap(logo => {
  const fruit = COUPON_FRUITS.find(fruit => fruit.logo === logo);
  return fruit ? [fruit] : [];
});
const openingLogoPreload = preloadCouponLogos(OPENING_FRUITS);

const GROUND_Y = -0.01;
const DEFAULT_CAM = new THREE.Vector3(0, 4.0, 13);
const TARGET = new THREE.Vector3(0, 3.4, 0);
const MOBILE_CAM = new THREE.Vector3(0, 4.4, 16);
const MOBILE_TARGET = new THREE.Vector3(0, 3.6, 0);
const MOBILE_BASE_DIST = 16;

// Frame-loop scratch objects — avoids per-frame allocation inside useFrame.
const TMP_OFFSET = new THREE.Vector3();
const TMP_SPHERICAL = new THREE.Spherical();

/**
 * Procedural image-based lighting. RoomEnvironment is bundled with Three.js,
 * so this restores material sheen without downloading an HDR asset.
 */
function ProceduralEnvironment() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const previousEnvironment = scene.environment;
    const room = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(gl);
    generator.compileEquirectangularShader();
    const target = generator.fromScene(room, 0.04);
    scene.environment = target.texture;

    return () => {
      if (scene.environment === target.texture) scene.environment = previousEnvironment;
      target.dispose();
      generator.dispose();
      room.dispose();
    };
  }, [gl, scene]);

  return null;
}


function CameraRig({
  controlsRef,
  zoomProgressRef,
  isMobile,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl>;
  zoomProgressRef: React.MutableRefObject<number>;
  isMobile: boolean;
}) {
  const { camera, mouse, size, gl, controls } = useThree();
  const gentle = useMotionPreference() === 'gentle';
  const { parallaxBoostRef } = useInteraction();
  const lastInteractionRef = useRef(performance.now() / 1000);
  const resetAnim = useRef<{ start: number; from: THREE.Vector3 } | null>(null);
  // Fit the full rotating canopy envelope, not just the trunk, on narrow canvases.
  const aspect = size.width / Math.max(size.height, 1);
  const verticalFov = THREE.MathUtils.degToRad(isMobile ? 32 : 38);
  const fitDist = Math.max(isMobile ? MOBILE_BASE_DIST : 13,
    4.5 / (Math.tan(verticalFov / 2) * Math.min(aspect, 1)));
  const defaultCam = (isMobile ? MOBILE_CAM : DEFAULT_CAM).clone();
  defaultCam.z = fitDist;
  const target = isMobile ? MOBILE_TARGET : TARGET;
  const baseDist = fitDist;
  // Seed at the current zoom progress so the initial (already pulled-back) view
  // paints immediately instead of animating outward on load.
  const currentDistRef = useRef(baseDist + zoomProgressRef.current * 4);

  useEffect(() => {
    currentDistRef.current = baseDist + zoomProgressRef.current * 4;
    if (gentle) {
      camera.position.copy(defaultCam); camera.position.z = currentDistRef.current;
      camera.lookAt(target); controlsRef.current?.target.copy(target);
    }
  }, [baseDist, zoomProgressRef, gentle, camera, controlsRef]);

  // Drei creates the controls after its first render. Wait for the actual ref,
  // rather than treating the still-null first effect as a completed attachment.
  useEffect(() => {
    let frame = 0;
    let detach: (() => void) | undefined;
    const attach = () => {
      const c = controlsRef.current;
      if (!c) { frame = requestAnimationFrame(attach); return; }
      const onStart = () => {
        lastInteractionRef.current = performance.now() / 1000;
        resetAnim.current = null;
      };
      const onChange = () => {
        lastInteractionRef.current = performance.now() / 1000;
        gl.domElement.dataset.treeAzimuth = c.getAzimuthalAngle().toFixed(4);
      };
      gl.domElement.dataset.treeAzimuth = c.getAzimuthalAngle().toFixed(4);
      c.addEventListener('start', onStart);
      c.addEventListener('change', onChange);
      detach = () => {
        c.removeEventListener('start', onStart);
        c.removeEventListener('change', onChange);
      };
    };
    attach();
    return () => { cancelAnimationFrame(frame); detach?.(); };
  }, [controlsRef, controls, gl]);

  // Expose reset on double-click via window event
  useEffect(() => {
    const onReset = () => {
      resetAnim.current = { start: performance.now() / 1000, from: camera.position.clone() };
    };
    window.addEventListener('tree3d-reset-camera', onReset);
    return () => window.removeEventListener('tree3d-reset-camera', onReset);
  }, [camera]);

  useFrame((_, dt) => {
    gl.domElement.dataset.treeCamera = camera.position.toArray().map(v => v.toFixed(4)).join(',');
    if (gentle) return;
    const c = controlsRef.current;
    if (!c) return;
    const now = performance.now() / 1000;
    const idle = now - lastInteractionRef.current;

    // Camera reset animation (double-click)
    if (resetAnim.current) {
      const k = Math.min(1, (now - resetAnim.current.start) / 0.6);
      const eased = 1 - Math.pow(1 - k, 3);
      camera.position.lerpVectors(resetAnim.current.from, defaultCam, eased);
      c.target.copy(target);
      if (k >= 1) resetAnim.current = null;
    }

    // Drive camera distance from external zoomProgress (scroll-controlled)
    const targetDist = baseDist + zoomProgressRef.current * 4;
    currentDistRef.current += (targetDist - currentDistRef.current) * Math.min(1, dt * 6);
    TMP_OFFSET.copy(camera.position).sub(c.target);
    TMP_SPHERICAL.setFromVector3(TMP_OFFSET);
    TMP_SPHERICAL.radius = currentDistRef.current;
    TMP_OFFSET.setFromSpherical(TMP_SPHERICAL);
    camera.position.copy(c.target).add(TMP_OFFSET);


    // Subtle parallax overlay when not actively dragging (idle > 0.2s)
    if (idle > 0.2 && !resetAnim.current) {
      const boost = parallaxBoostRef.current.value;
      const dx = mouse.x * 0.25 * boost;
      const dy = mouse.y * 0.12 * boost;
      // apply as offset on top of current orbit position
      camera.position.x += dx * dt * 0.6;
      camera.position.y += dy * dt * 0.6;
    }

    c.update();
  });

  return null;
}

function DayNightLights({ shadowSize = 4096, shadowBlur = 25, tightShadow = false }: { shadowSize?: number; shadowBlur?: number; tightShadow?: boolean }) {
  const { timeOfDay } = useInteraction();
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const ambRef = useRef<THREE.AmbientLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const fogColorRef = useRef(new THREE.Color('#DCE6D5'));
  const { scene } = useThree();
  useEffect(() => {
    const light = dirRef.current;
    if (!light) return;
    light.shadow.map?.dispose(); light.shadow.map = null;
    light.shadow.mapSize.set(shadowSize, shadowSize);
    light.shadow.needsUpdate = true;
  }, [shadowSize]);

  const targets: Record<TimeOfDay, { dirCol: string; dirInt: number; ambCol: string; ambInt: number; fillCol: string; fillInt: number; fog: string }> = useMemo(
    () => ({
      day: { dirCol: '#FFF4E0', dirInt: 1.35, ambCol: '#F4F1E8', ambInt: 0.75, fillCol: '#BFD8E8', fillInt: 0.45, fog: '#DCE6D5' },
      sunset: { dirCol: '#FFA060', dirInt: 1.0, ambCol: '#FFD0A0', ambInt: 0.55, fillCol: '#9B7BB5', fillInt: 0.35, fog: '#E8B890' },
      night: { dirCol: '#9DB4E6', dirInt: 0.45, ambCol: '#5A6B8A', ambInt: 0.35, fillCol: '#3A4A7E', fillInt: 0.2, fog: '#1A2440' },
    }),
    []
  );

  // Pre-built target colours — identical values, just allocated once instead of
  // three `new THREE.Color()` per frame.
  const targetColors = useMemo(() => {
    const build = (k: TimeOfDay) => ({
      dir: new THREE.Color(targets[k].dirCol),
      amb: new THREE.Color(targets[k].ambCol),
      fill: new THREE.Color(targets[k].fillCol),
      fog: new THREE.Color(targets[k].fog),
    });
    return { day: build('day'), sunset: build('sunset'), night: build('night') } as Record<
      TimeOfDay,
      { dir: THREE.Color; amb: THREE.Color; fill: THREE.Color; fog: THREE.Color }
    >;
  }, [targets]);

  const dirColor = useMemo(() => new THREE.Color(targets.day.dirCol), [targets]);
  const ambColor = useMemo(() => new THREE.Color(targets.day.ambCol), [targets]);
  const fillColor = useMemo(() => new THREE.Color(targets.day.fillCol), [targets]);

  useFrame((_, dt) => {
    const t = targets[timeOfDay];
    const tc = targetColors[timeOfDay];
    const k = Math.min(dt * 1.5, 0.05);
    if (dirRef.current) {
      dirColor.lerp(tc.dir, k);
      dirRef.current.color.copy(dirColor);
      dirRef.current.intensity += (t.dirInt - dirRef.current.intensity) * k;
    }
    if (ambRef.current) {
      ambColor.lerp(tc.amb, k);
      ambRef.current.color.copy(ambColor);
      ambRef.current.intensity += (t.ambInt - ambRef.current.intensity) * k;
    }
    if (fillRef.current) {
      fillColor.lerp(tc.fill, k);
      fillRef.current.color.copy(fillColor);
      fillRef.current.intensity += (t.fillInt - fillRef.current.intensity) * k;
    }
    if (scene.fog) {
      fogColorRef.current.lerp(tc.fog, k);
      (scene.fog as THREE.Fog).color.copy(fogColorRef.current);
    }
  });


  return (
    <>
      <ambientLight ref={ambRef} intensity={0.75} color="#F4F1E8" />
      <directionalLight
        ref={dirRef}
        position={[6, 11, 5]}
        intensity={1.35}
        color="#FFF4E0"
        castShadow
        shadow-mapSize-width={shadowSize}
        shadow-mapSize-height={shadowSize}
        shadow-camera-left={tightShadow ? -5 : -12}
        shadow-camera-right={tightShadow ? 5 : 12}
        shadow-camera-top={tightShadow ? 9 : 12}
        shadow-camera-bottom={tightShadow ? -1.5 : -3}
        shadow-bias={-0.0005}
        shadow-radius={8}
        shadow-blurSamples={shadowBlur}
      />
      <directionalLight ref={fillRef} position={[-6, 5, -3]} intensity={0.45} color="#BFD8E8" />
    </>
  );
}

/**
 * Toggles shadow rendering in place so a runtime tier downgrade never remounts
 * the Canvas.
 */
function ShadowSwitch({ enabled }: { enabled: boolean }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    gl.shadowMap.enabled = enabled;
    gl.shadowMap.needsUpdate = true;
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => (m.needsUpdate = true));
    });
  }, [gl, scene, enabled]);
  return null;
}

/** Sample only committed, visible rendering; loading/hidden time is not hardware evidence. */
/** Page-load jank must not count: wait 2s, then step down only after two slow samples in a row. */
function PerfWatchdog({ onSlow, active }: { onSlow: () => void; active: boolean }) {
  const sample = useRef({ start: 0, frames: 0, warm: 0, strikes: 0 });
  useEffect(() => { sample.current = { start: 0, frames: 0, warm: performance.now(), strikes: 0 }; }, [active]);
  useFrame(({ gl }) => {
    if (!active || document.hidden) return;
    const now = performance.now();
    const s = sample.current;
    if (now - s.warm < 2000) return;
    if (!s.start) { s.start = now; return; }
    s.frames++;
    const elapsed = now - s.start;
    if (elapsed < 2500) return;
    const fps = s.frames * 1000 / elapsed;
    gl.domElement.dataset.treeFps = fps.toFixed(1);
    s.start = now; s.frames = 0;
    s.strikes = shouldReduceQuality(fps, active, elapsed) ? s.strikes + 1 : 0;
    if (s.strikes >= 2) { s.strikes = 0; onSlow(); }
  });
  return null;
}

function Scene({ settings, isMobile, onReady }: { settings: TierSettings; isMobile: boolean; onReady: () => void }) {
  const gentle = useMotionPreference() === 'gentle';
  useEffect(() => {
    if (gentle) setStates(previous => previous.map(() => ({ phase: 'hanging' })));
  }, [gentle]);

  const { plantCap } = settings;
  const visibleFruitCount = Math.min(18, COUPON_FRUITS.length);
  // Open with 18 distinct, instantly recognizable brands — no two marks from the
  // same family (Uber / Uber Eats) hang at the same time. Every omitted brand
  // enters through the same non-repeating replacement queue after a fruit falls.
  const initialBrandIndices = useMemo(() => {
    // Opening-facing slots lead with distinct red, blue, green, and orange
    // silhouettes. Wider marks stay separated while rear slots retain depth.
    return OPENING_LOGOS
      .map((logo) => COUPON_FRUITS.findIndex((fruit) => fruit.logo === logo))
      .filter((index) => index >= 0)
      .slice(0, visibleFruitCount);
  }, [visibleFruitCount]);


  const branchTips = useMemo(() => {
    return getBranchTips(visibleFruitCount);
  }, [visibleFruitCount]);
  const [logosReady, setLogosReady] = useState(false);
  const { gl } = useThree();
  const revealRef = useRef({ frames: 0, revealed: false });
  const reveal = useCallback((reason: 'logos' | 'safety') => {
    if (revealRef.current.revealed) return;
    revealRef.current.revealed = true;
    gl.domElement.dataset.treeRevealReason = reason;
    gl.domElement.dataset.treeRevealMs = performance.now().toFixed(1);
    window.__cdTreeReady = true;
    window.dispatchEvent(new Event('cd:tree-ready'));
    onReady();
  }, [gl, onReady]);
  useEffect(() => {
    const timer = window.setTimeout(() => reveal('safety'), 3000);
    return () => window.clearTimeout(timer);
  }, [reveal]);
  useEffect(() => {
    let active = true;
    openingLogoPreload.then((diagnostics) => {
      if (!active) return;
      const canvas = gl.domElement;
      canvas.dataset.treeLogoFailures = diagnostics.failed.join('|');
      canvas.dataset.treeLogoInvalid = diagnostics.invalid.join('|');
      canvas.dataset.treeSlotsFinite = String(branchTips.every(({ tip, faceOffset }) =>
        [tip.x, tip.y, tip.z, faceOffset].every(Number.isFinite)));
      setLogosReady(true);
    });
    return () => { active = false; };
  }, [branchTips, gl]);
  // useFrame runs before rendering. The second committed frame proves the first
  // full 18-fruit frame has already been drawn/uploaded before revealing it.
  useFrame(() => {
    if (!logosReady) return;
    revealRef.current.frames++;
    if (revealRef.current.frames < 2) return;
    gl.domElement.dataset.treeLogosReady = 'true';
    gl.domElement.dataset.treeDrawnLogos = String(OPENING_FRUITS.length);
    reveal('logos');
  });
  const [brandIndices, setBrandIndices] = useState(() => initialBrandIndices);
  const replacementQueueRef = useRef(
    COUPON_FRUITS.map((_, index) => index).filter((index) => !initialBrandIndices.includes(index)),
  );
  const shuffleRoundRef = useRef(1);
  const brandIndicesRef = useRef(brandIndices);

  useEffect(() => {
    brandIndicesRef.current = brandIndices;
  }, [brandIndices]);

  const updateBrandDebugState = useCallback(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('canvas');
    if (!canvas) return;
    canvas.dataset.treeBrands = brandIndicesRef.current
      .map((brandIndex) => COUPON_FRUITS[brandIndex]?.brand ?? '')
      .filter(Boolean)
      .join('|');
    canvas.dataset.treeReplacementQueue = String(replacementQueueRef.current.length);
  }, []);

  const takeNextBrand = useCallback((currentBrandIndex: number) => {
    // Never hand back a brand that is already hanging elsewhere on the tree.
    const inUse = new Set(brandIndicesRef.current);
    inUse.delete(currentBrandIndex);
    const isFree = (index: number) => !inUse.has(index);

    for (let attempt = 0; attempt < 2; attempt++) {
      const queue = replacementQueueRef.current;
      const pick = queue.findIndex(isFree);
      if (pick >= 0) {
        const [chosen] = queue.splice(pick, 1);
        void preloadCouponLogos([COUPON_FRUITS[chosen]]);
        return chosen;
      }
      let seed = 0x9e3779b9 ^ shuffleRoundRef.current++;
      const nextRandom = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 0x100000000;
      };
      const round = COUPON_FRUITS.map((_, index) => index);
      for (let i = round.length - 1; i > 0; i--) {
        const j = Math.floor(nextRandom() * (i + 1));
        [round[i], round[j]] = [round[j], round[i]];
      }
      if (round[0] === currentBrandIndex && round.length > 1) {
        [round[0], round[1]] = [round[1], round[0]];
      }
      replacementQueueRef.current = round;
    }
    return replacementQueueRef.current.shift() ?? currentBrandIndex;
  }, []);


  useEffect(() => {
    updateBrandDebugState();
    const replaceOne = (event: Event) => {
      const detail = (event as CustomEvent<{ index?: number }>).detail;
      const rawIndex = detail?.index ?? 0;
      const idx = Math.max(0, Math.min(visibleFruitCount - 1, rawIndex));
      setBrandIndices((current) => {
        const next = [...current];
        next[idx] = takeNextBrand(current[idx]);
        brandIndicesRef.current = next;
        return next;
      });
      requestAnimationFrame(updateBrandDebugState);
    };
    window.addEventListener('tree3d-replace-brand', replaceOne);
    return () => window.removeEventListener('tree3d-replace-brand', replaceOne);
  }, [takeNextBrand, updateBrandDebugState, visibleFruitCount]);

  const donations = useFallingDonations();
  const donationIdxRef = useRef(0);
  const { shakeEvent, bumpWind } = useInteraction();

  const [states, setStates] = useState<CouponState[]>(() =>
    Array.from({ length: visibleFruitCount }, () => ({ phase: 'hanging' as const }))
  );

  const dropOne = useCallback(
    (idx: number) => {
      setStates((prev) => {
        if (prev[idx].phase !== 'hanging') return prev;
        const donation = donations[donationIdxRef.current % Math.max(1, donations.length)];
        donationIdxRef.current++;
        const next = [...prev];
        next[idx] = {
          phase: 'falling',
          startTime: performance.now() / 1000,
          donation,
        };
        return next;
      });
    },
    [donations]
  );

  // Auto drops on timer
  useEffect(() => {
    if (gentle || !logosReady || donations.length === 0) return;
    const interval = setInterval(() => {
      setStates((prev) => {
        const hangingIdx = prev.map((s, i) => (s.phase === 'hanging' ? i : -1)).filter((i) => i >= 0);
        if (hangingIdx.length === 0) return prev;
        const pick = hangingIdx[Math.floor(Math.random() * hangingIdx.length)];
        const donation = donations[donationIdxRef.current % donations.length];
        donationIdxRef.current++;
        const next = [...prev];
        next[pick] = { phase: 'falling', startTime: performance.now() / 1000, donation };
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [donations, logosReady, gentle]);

  // Shake event → cascade drop 3-5 hanging coupons
  useEffect(() => {
    if (gentle || !logosReady || !shakeEvent) return;
    setStates((prev) => {
      const hangingIdx = prev.map((s, i) => (s.phase === 'hanging' ? i : -1)).filter((i) => i >= 0);
      if (hangingIdx.length === 0) return prev;
      const count = Math.min(hangingIdx.length, 3 + Math.floor(Math.random() * 3));
      const shuffled = [...hangingIdx].sort(() => Math.random() - 0.5).slice(0, count);
      const next = [...prev];
      shuffled.forEach((idx, n) => {
        const donation = donations[donationIdxRef.current % Math.max(1, donations.length)];
        donationIdxRef.current++;
        next[idx] = {
          phase: 'falling',
          startTime: performance.now() / 1000 + n * 0.1,
          donation,
        };
      });
      return next;
    });
    bumpWind(0.5);
  }, [shakeEvent, donations, bumpWind, logosReady, gentle]);

  // On phones only the most recently landed coupon shows its donor label,
  // so overlapping cards can never stack on a narrow screen.
  const [lastLandedIdx, setLastLandedIdx] = useState<number | null>(null);

  const handleLanded = useCallback((idx: number, restPos: THREE.Vector3) => {
    setLastLandedIdx(idx);
    setStates((prev) => {
      if (prev[idx].phase !== 'falling') return prev;
      const donation = (prev[idx] as Extract<CouponState, { phase: 'falling' }>).donation;
      const next = [...prev];
      next[idx] = {
        phase: 'landed',
        landTime: performance.now() / 1000,
        donation,
        restPos: restPos.clone(),
      };
      return next;
    });
  }, []);

  const handleRegrown = useCallback((idx: number) => {
    setStates((prev) => {
      const cur = prev[idx];
      const next = [...prev];
      if (cur.phase === 'landed') {
        setBrandIndices((current) => {
          const next = [...current];
          next[idx] = takeNextBrand(current[idx]);
          brandIndicesRef.current = next;
          requestAnimationFrame(updateBrandDebugState);
          return next;
        });
        next[idx] = { phase: 'regrowing', startTime: performance.now() / 1000 };
      } else if (cur.phase === 'regrowing') {
        next[idx] = { phase: 'hanging' };
      }
      return next;
    });
  }, [takeNextBrand, updateBrandDebugState]);

  return (
    <>
      <DayNightLights shadowSize={settings.shadowMapSize} />
      <ProceduralEnvironment />
      <directionalLight position={[0, 4, -8]} intensity={0.35} color="#FFD8A8" />
      <fog attach="fog" args={['#DCE6D5', 18, 45]} />

      <Sky gentle={gentle} />

      <Tree lowPower={settings.tier === 'low'} />
      <Ground y={GROUND_Y} />
      {!gentle && <HitZones />}
      {settings.fireflies && <Fireflies count={settings.fireflyCount} gentle={gentle} />}
      {settings.trunkRipple && !gentle && <TrunkRipple />}
      {!gentle && <Bird />}
      {!gentle && <AmbientBirds count={settings.ambientBirds} />}
      <PlantsLayer cap={plantCap} />


      {logosReady && brandIndices.map((brandIndex, i) => (
        <CouponFruit
          key={i}
          index={i}
          branch={branchTips[i]}
          data={COUPON_FRUITS[brandIndex]}
          state={states[i]}
          groundY={GROUND_Y}
          onLanded={handleLanded}
          onRegrown={handleRegrown}
          onClickHanging={dropOne}
          isMobile={isMobile}
          labelSuppressed={lastLandedIdx !== i}
        />
      ))}
    </>
  );
}

function WindTracker() {
  const { bumpWind } = useInteraction();
  const lastRef = useRef<{ x: number; y: number; t: number } | null>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      // Mouse-only — touch swipes shouldn't shake the tree while scrolling.
      if (e.pointerType !== 'mouse') return;
      const now = performance.now();
      if (lastRef.current) {
        const dx = e.clientX - lastRef.current.x;
        const dy = e.clientY - lastRef.current.y;
        const dt = Math.max(1, now - lastRef.current.t);
        const v = Math.sqrt(dx * dx + dy * dy) / dt; // px/ms
        if (v > 0.5) bumpWind(Math.min(0.05, v * 0.01));
      }
      lastRef.current = { x: e.clientX, y: e.clientY, t: now };
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [bumpWind]);

  return null;
}

function readForcedTier(): DeviceTier | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const v = new URLSearchParams(window.location.search).get('tier3d');
    return v === 'low' || v === 'medium' || v === 'high' ? v : undefined;
  } catch {
    return undefined;
  }
}

export function Tree3DScene({ onReady }: { onReady?: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  // 0 = zoomed in, 1 = zoomed out. Start mostly out so one wheel gesture finishes it.
  const zoomProgressRef = useRef(0.7);
  const [inView, setInView] = useState(true);
  const isMobile = useIsMobile();
  const [tabVisible, setTabVisible] = useState(() => typeof document === 'undefined' || document.visibilityState !== 'hidden');

  // Tier is resolved synchronously on first render and never re-detected, so the
  // Canvas never re-initialises. `?tier3d=low|medium|high` forces a tier for QA.
  const forced = useMemo(() => readForcedTier(), []);
  const gentle = useMotionPreference() === 'gentle';
  const { settings: effectiveSettings, initialTier, requestDowngrade, step } = useDeviceTier(forced);

  // DPR follows the tier cap; changing it later only calls setPixelRatio in place.
  const dpr = useMemo<[number, number]>(() => {
    const max = effectiveSettings.dprCap;
    const d = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, max) : max;
    return [d, d];
  }, [effectiveSettings.dprCap]);
  const enablePost = false;
  // Antialias must be fixed at context creation time — derived from the first tier.
  const antialias = useMemo(
    () => true,
    [],
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Pause render loop while tab is hidden — saves battery + CPU on mobile.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVis = () => setTabVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Mobile: keep canvas mounted and always animating while visible. Switching
  // frameloop or unmounting mid-scroll causes blink/jitter around the live bar.
  const mounted = true;

  // Scroll-to-zoom-then-release: desktop wheel only. Mobile keeps native scroll.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (isMobile) return;

    const WHEEL_SENSITIVITY = 0.006;

    const onWheel = (e: WheelEvent) => {
      if (window.scrollY > 4) return;
      const cur = zoomProgressRef.current;
      // Normalise Firefox line/page deltas to pixels.
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      if (dy > 0 && cur >= 1) return;
      if (dy < 0 && cur <= 0) return;
      zoomProgressRef.current = Math.max(0, Math.min(1, cur + dy * WHEEL_SENSITIVITY));
    };

    el.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [isMobile]);

  // Render while in view + tab visible. We no longer downgrade based on scroll
  // position on mobile — that caused visible pause/resume hitches.
  const effectiveInView = inView && tabVisible;

  return (
    <InteractionProvider>
      <div
        ref={wrapRef}
        className="absolute inset-0 w-full h-full"
        style={{
          touchAction: 'pan-y',
          contain: 'strict',
          willChange: 'transform',
        }}
        data-tree-tier={effectiveSettings.tier}
        data-tree-initial-tier={initialTier}
        data-tree-quality-step={step}
        data-tree-settings={JSON.stringify(effectiveSettings)}
        data-tree-shadow-size={effectiveSettings.shadowMapSize}
        data-tree-dpr-cap={effectiveSettings.dprCap}
        data-tree-leaves={effectiveSettings.leafCount}
        data-tree-fireflies={effectiveSettings.fireflyCount}
        data-tree-birds={effectiveSettings.ambientBirds}
        data-tree-plant-cap={effectiveSettings.plantCap}
        data-tree-trunk-ripple={!gentle && effectiveSettings.trunkRipple}
        data-tree-motion={gentle ? "gentle" : "full"}
        data-tree-active-birds={gentle ? 0 : effectiveSettings.ambientBirds}
        data-tree-rendering={effectiveInView ? "active" : "paused"}
      >
        {mounted ? (
          <Tree3DInner
            controlsRef={controlsRef}
            zoomProgressRef={zoomProgressRef}
            dpr={dpr}
            inView={effectiveInView}
            enablePost={enablePost}
            settings={effectiveSettings}
            antialias={antialias}
            isMobile={isMobile}
            onSlow={forced ? () => undefined : requestDowngrade}
            onReady={onReady}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-[#BFD8E8] via-[#FFF2D8] to-[#D8E0CC]" />
        )}
        <RecipientStoryPanel />
        <TransparencyPopover />
      </div>
    </InteractionProvider>
  );
}


interface InnerProps {
  controlsRef: React.RefObject<OrbitControlsImpl>;
  zoomProgressRef: React.MutableRefObject<number>;
  dpr: [number, number];
  inView: boolean;
  enablePost: boolean;
  settings: TierSettings;
  antialias: boolean;
  isMobile: boolean;
  onSlow: () => void;
  onReady?: () => void;
}

function Tree3DInner({ controlsRef, zoomProgressRef, dpr, inView, enablePost, settings, antialias, isMobile, onSlow, onReady }: InnerProps) {
  const { spawnRipple, setParallaxBoost } = useInteraction();
  const gentle = useMotionPreference() === 'gentle';
  const [ready, setReady] = useState(false);
  const sceneReady = useCallback(() => {
    setReady(true);
    onReady?.();
  }, [onReady]);
  const lastClickRef = useRef(0);
  // Fixed at first render so the WebGL context is never recreated.
  const initialShadows = useRef(settings.shadows).current;

  return (
    <>
      <Canvas
        resize={{ offsetSize: true }}
        shadows={initialShadows ? { type: THREE.PCFSoftShadowMap } : false}
        dpr={dpr}
        frameloop={inView ? 'always' : 'never'}
        camera={{ position: isMobile ? [0, 4.4, 16] : [0, 4.0, 13], fov: isMobile ? 32 : 38 }}
        gl={{
          antialias,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.25,
        }}

        style={{ background: 'transparent', opacity: ready ? 1 : 0 }}
        onPointerDown={(e) => { if (e.pointerType === 'mouse') setParallaxBoost(true); }}
        onPointerUp={(e) => { if (e.pointerType === 'mouse') setParallaxBoost(false); }}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') setParallaxBoost(false); }}
        onClick={() => {
          if (gentle) return;
          spawnRipple();
          const now = performance.now();
          if (now - lastClickRef.current < 350) {
            window.dispatchEvent(new CustomEvent('tree3d-reset-camera'));
          }
          lastClickRef.current = now;
        }}
      >
        {/* PerformanceMonitor removed — was causing DPR rescaling flicker */}
        <OrbitControls
          ref={controlsRef}
          enabled={!gentle}
          enablePan={false}
          enableZoom={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={isMobile ? 12 : 9}
          maxDistance={60}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2.1}
          target={isMobile ? [0, 3.6, 0] : [0, 3.4, 0]}
          makeDefault
        />
        <CameraRig controlsRef={controlsRef} zoomProgressRef={zoomProgressRef} isMobile={isMobile} />
        {!gentle && <WindTracker />}
        <ShadowSwitch enabled={settings.shadows} />
        <Suspense fallback={null}>
          <Scene settings={settings} isMobile={isMobile} onReady={sceneReady} />
          <PerfWatchdog onSlow={onSlow} active={inView && ready} />
        </Suspense>

      </Canvas>
    </>
  );
}

export default Tree3DScene;
