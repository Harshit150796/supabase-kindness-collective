import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
// Postprocessing intentionally not imported — bloom/vignette disabled, keeps mobile bundle smaller.
import * as THREE from 'three';
import { Tree, getBranchTips } from './tree3d/Tree';
import { CouponFruit, type CouponState } from './tree3d/CouponFruit';
import { Ground } from './tree3d/Ground';
import { Sky } from './tree3d/Sky';
import { COUPON_FRUITS } from './tree3d/couponDesign';
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

const GROUND_Y = -0.01;
const DEFAULT_CAM = new THREE.Vector3(0, 4.0, 13);
const TARGET = new THREE.Vector3(0, 3.4, 0);
const MOBILE_CAM = new THREE.Vector3(0, 4.4, 16);
const MOBILE_TARGET = new THREE.Vector3(0, 3.6, 0);

function CameraRig({
  controlsRef,
  zoomProgressRef,
  isMobile,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl>;
  zoomProgressRef: React.MutableRefObject<number>;
  isMobile: boolean;
}) {
  const { camera, mouse } = useThree();
  const { parallaxBoostRef } = useInteraction();
  const lastInteractionRef = useRef(performance.now() / 1000);
  const resetAnim = useRef<{ start: number; from: THREE.Vector3 } | null>(null);
  const defaultCam = isMobile ? MOBILE_CAM : DEFAULT_CAM;
  const target = isMobile ? MOBILE_TARGET : TARGET;
  const baseDist = isMobile ? 16 : 13;
  const currentDistRef = useRef(baseDist);

  // Track interactions on the controls
  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    const onStart = () => {
      lastInteractionRef.current = performance.now() / 1000;
      resetAnim.current = null;
    };
    const onChange = () => {
      lastInteractionRef.current = performance.now() / 1000;
    };
    c.addEventListener('start', onStart);
    c.addEventListener('change', onChange);
    return () => {
      c.removeEventListener('start', onStart);
      c.removeEventListener('change', onChange);
    };
  }, [controlsRef]);

  // Expose reset on double-click via window event
  useEffect(() => {
    const onReset = () => {
      resetAnim.current = { start: performance.now() / 1000, from: camera.position.clone() };
    };
    window.addEventListener('tree3d-reset-camera', onReset);
    return () => window.removeEventListener('tree3d-reset-camera', onReset);
  }, [camera]);

  useFrame((_, dt) => {
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
    } else if (idle > 3 && c.getAzimuthalAngle() !== 0) {
      // Auto-return to center azimuth
      const az = c.getAzimuthalAngle();
      const newAz = az * Math.pow(0.04, dt);
      // Rotate camera around target on Y-axis to approach az=0
      const offset = camera.position.clone().sub(c.target);
      const sph = new THREE.Spherical().setFromVector3(offset);
      sph.theta = newAz;
      offset.setFromSpherical(sph);
      camera.position.copy(c.target).add(offset);
    }

    // Drive camera distance from external zoomProgress (scroll-controlled)
    const targetDist = baseDist + zoomProgressRef.current * 4;
    currentDistRef.current += (targetDist - currentDistRef.current) * Math.min(1, dt * 6);
    const offset = camera.position.clone().sub(c.target);
    const sph = new THREE.Spherical().setFromVector3(offset);
    sph.radius = currentDistRef.current;
    offset.setFromSpherical(sph);
    camera.position.copy(c.target).add(offset);

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

function DayNightLights({ isMobile = false }: { isMobile?: boolean }) {
  const { timeOfDay } = useInteraction();
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const ambRef = useRef<THREE.AmbientLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const fogColorRef = useRef(new THREE.Color('#DCE6D5'));
  const targetFog = useMemo(() => new THREE.Color(), []);
  const { scene } = useThree();

  const targets: Record<TimeOfDay, { dirCol: string; dirInt: number; ambCol: string; ambInt: number; fillCol: string; fillInt: number; fog: string }> = useMemo(
    () => ({
      day: { dirCol: '#FFF4E0', dirInt: 1.35, ambCol: '#F4F1E8', ambInt: 0.75, fillCol: '#BFD8E8', fillInt: 0.45, fog: '#DCE6D5' },
      sunset: { dirCol: '#FFA060', dirInt: 1.0, ambCol: '#FFD0A0', ambInt: 0.55, fillCol: '#9B7BB5', fillInt: 0.35, fog: '#E8B890' },
      night: { dirCol: '#9DB4E6', dirInt: 0.45, ambCol: '#5A6B8A', ambInt: 0.35, fillCol: '#3A4A7E', fillInt: 0.2, fog: '#1A2440' },
    }),
    []
  );

  const dirColor = useMemo(() => new THREE.Color(targets.day.dirCol), [targets]);
  const ambColor = useMemo(() => new THREE.Color(targets.day.ambCol), [targets]);
  const fillColor = useMemo(() => new THREE.Color(targets.day.fillCol), [targets]);

  useFrame((_, dt) => {
    const t = targets[timeOfDay];
    const k = Math.min(1, dt * 1.5);
    if (dirRef.current) {
      dirColor.lerp(new THREE.Color(t.dirCol), k);
      dirRef.current.color.copy(dirColor);
      dirRef.current.intensity += (t.dirInt - dirRef.current.intensity) * k;
    }
    if (ambRef.current) {
      ambColor.lerp(new THREE.Color(t.ambCol), k);
      ambRef.current.color.copy(ambColor);
      ambRef.current.intensity += (t.ambInt - ambRef.current.intensity) * k;
    }
    if (fillRef.current) {
      fillColor.lerp(new THREE.Color(t.fillCol), k);
      fillRef.current.color.copy(fillColor);
      fillRef.current.intensity += (t.fillInt - fillRef.current.intensity) * k;
    }
    if (scene.fog) {
      targetFog.set(t.fog);
      fogColorRef.current.lerp(targetFog, k);
      (scene.fog as THREE.Fog).color.copy(fogColorRef.current);
    }
  });

  const shadowSize = isMobile ? 512 : 4096;
  const shadowBlur = isMobile ? 2 : 25;

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
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-3}
        shadow-bias={-0.0005}
        shadow-radius={8}
        shadow-blurSamples={shadowBlur}
      />
      <directionalLight ref={fillRef} position={[-6, 5, -3]} intensity={0.45} color="#BFD8E8" />
    </>
  );
}

function Scene({ leafCount, plantCap, isMobile }: { leafCount: number; plantCap: number; isMobile: boolean }) {
  const branchTips = useMemo(() => getBranchTips().map((b) => b.tip), []);
  const fruits = useMemo(() => COUPON_FRUITS.slice(0, branchTips.length), [branchTips.length]);

  const donations = useFallingDonations();
  const donationIdxRef = useRef(0);
  const { shakeEvent, bumpWind } = useInteraction();

  const [states, setStates] = useState<CouponState[]>(() =>
    fruits.map(() => ({ phase: 'hanging' as const }))
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
    if (donations.length === 0) return;
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
  }, [donations]);

  // Shake event → cascade drop 3-5 hanging coupons
  useEffect(() => {
    if (!shakeEvent) return;
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
  }, [shakeEvent, donations, bumpWind]);

  const handleLanded = useCallback((idx: number, restPos: THREE.Vector3) => {
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
        next[idx] = { phase: 'regrowing', startTime: performance.now() / 1000 };
      } else if (cur.phase === 'regrowing') {
        next[idx] = { phase: 'hanging' };
      }
      return next;
    });
  }, []);

  return (
    <>
      <DayNightLights isMobile={isMobile} />
      <directionalLight position={[0, 4, -8]} intensity={0.35} color="#FFD8A8" />
      {isMobile && <hemisphereLight args={['#cfe8d8', '#3a4a3a', 0.45]} />}
      <fog attach="fog" args={['#DCE6D5', 18, 45]} />

      <Sky />
      <Tree leafCount={leafCount} />
      <Ground y={GROUND_Y} isMobile={isMobile} />
      <HitZones />
      {!isMobile && <Fireflies />}
      <TrunkRipple />
      <Bird />
      <AmbientBirds count={isMobile ? 2 : 6} />
      <PlantsLayer cap={plantCap} />


      {fruits.map((data, i) => (
        <CouponFruit
          key={i}
          index={i}
          branchTip={branchTips[i]}
          data={data}
          state={states[i]}
          groundY={GROUND_Y}
          onLanded={handleLanded}
          onRegrown={handleRegrown}
          onClickHanging={dropOne}
        />
      ))}

      {!isMobile && <Environment preset="forest" background={false} />}
    </>
  );
}

function WindTracker() {
  const { bumpWind } = useInteraction();
  const lastRef = useRef<{ x: number; y: number; t: number } | null>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
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

export function Tree3DScene() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const zoomProgressRef = useRef(0); // 0 = zoomed in (13), 1 = zoomed out (17)
  const [inView, setInView] = useState(true);
  const [isMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [mounted, setMounted] = useState(true);
  const [tabVisible, setTabVisible] = useState(() => typeof document === 'undefined' || document.visibilityState !== 'hidden');
  // DPR: 1.5 cap on mobile (visually indistinguishable at hero scale, ~30% cheaper),
  // 2 cap on desktop for crisp rendering.
  const stableDpr = useMemo<[number, number]>(() => {
    const max = isMobile ? 1.5 : 2;
    const d = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, max) : max;
    return [d, d];
  }, [isMobile]);
  const dpr = stableDpr;
  // Post-processing (bloom + vignette) softens the whole scene; keep it off for clarity.
  const enablePost = false;

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




  // Scroll-to-zoom-then-release: intercept wheel + touch on the hero wrapper.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const WHEEL_SENSITIVITY = 0.0018;
    const TOUCH_SENSITIVITY = 0.005;

    const onWheel = (e: WheelEvent) => {
      if (window.scrollY > 4) return;
      const cur = zoomProgressRef.current;
      const dy = e.deltaY;
      if (dy > 0 && cur >= 1) return; // fully zoomed out → let page scroll
      if (dy < 0 && cur <= 0) return; // fully zoomed in → let page scroll up (no-op at top)
      e.preventDefault();
      zoomProgressRef.current = Math.max(0, Math.min(1, cur + dy * WHEEL_SENSITIVITY));
    };

    let lastTouchY: number | null = null;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      lastTouchY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (lastTouchY === null || e.touches.length !== 1) return;
      if (window.scrollY > 4) return;
      const y = e.touches[0].clientY;
      const dy = lastTouchY - y; // swipe up = positive (zoom out)
      lastTouchY = y;
      const cur = zoomProgressRef.current;
      if (dy > 0 && cur >= 1) return; // let page scroll
      if (dy < 0 && cur <= 0) return; // let page scroll
      e.preventDefault();
      zoomProgressRef.current = Math.max(0, Math.min(1, cur + dy * TOUCH_SENSITIVITY));
    };

    const onTouchEnd = () => {
      lastTouchY = null;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  const leafCount = isMobile ? 2000 : 7000;
  const plantCap = isMobile ? 12 : 40;

  return (
    <InteractionProvider>
      <div
        ref={wrapRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'pan-y' }}
      >
        {mounted ? (
          <Tree3DInner
            controlsRef={controlsRef}
            zoomProgressRef={zoomProgressRef}
            dpr={dpr}
            inView={inView && tabVisible}
            enablePost={enablePost}
            leafCount={leafCount}
            plantCap={plantCap}
            isMobile={isMobile}
            onDecline={() => {}}
            onIncline={() => {}}
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
  leafCount: number;
  plantCap: number;
  isMobile: boolean;
  onDecline: () => void;
  onIncline: () => void;
}

function Tree3DInner({ controlsRef, zoomProgressRef, dpr, inView, enablePost, leafCount, plantCap, isMobile, onDecline, onIncline }: InnerProps) {
  const { spawnRipple, setParallaxBoost } = useInteraction();
  const lastClickRef = useRef(0);

  return (
    <>
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        dpr={dpr}
        frameloop={inView ? 'always' : 'demand'}
        camera={{ position: isMobile ? [0, 4.4, 16] : [0, 4.0, 13], fov: isMobile ? 32 : 38 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        style={{ background: 'transparent' }}
        onPointerDown={() => setParallaxBoost(true)}
        onPointerUp={() => setParallaxBoost(false)}
        onPointerLeave={() => setParallaxBoost(false)}
        onClick={() => {
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
          enablePan={false}
          enableZoom={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={isMobile ? 12 : 9}
          maxDistance={isMobile ? 20 : 17}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2.1}
          minAzimuthAngle={-Math.PI / 2}
          maxAzimuthAngle={Math.PI / 2}
          target={isMobile ? [0, 3.6, 0] : [0, 3.4, 0]}
          makeDefault
        />
        <CameraRig controlsRef={controlsRef} zoomProgressRef={zoomProgressRef} isMobile={isMobile} />
        <WindTracker />
        <Suspense fallback={null}>
          <Scene leafCount={leafCount} plantCap={plantCap} isMobile={isMobile} />
        </Suspense>
      </Canvas>
    </>
  );
}

export default Tree3DScene;
