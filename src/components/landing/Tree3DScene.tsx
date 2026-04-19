import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, PerformanceMonitor } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Tree, getBranchTips } from './tree3d/Tree';
import { CouponFruit, type CouponState } from './tree3d/CouponFruit';
import { Ground } from './tree3d/Ground';
import { Sky } from './tree3d/Sky';
import { COUPON_FRUITS } from './tree3d/couponDesign';
import { useFallingDonations } from '@/hooks/useFallingDonations';

const GROUND_Y = -0.01;

function CameraParallax() {
  const { camera, mouse } = useThree();
  useFrame((_, dt) => {
    const t = performance.now() / 1000;
    const targetX = mouse.x * 0.5 + Math.sin(t * 0.12) * 0.06;
    const targetY = 4.0 + mouse.y * 0.2;
    camera.position.x += (targetX - camera.position.x) * Math.min(1, dt * 1.6);
    camera.position.y += (targetY - camera.position.y) * Math.min(1, dt * 1.6);
    camera.lookAt(0, 3.2, 0);
  });
  return null;
}

function Scene({ leafCount }: { leafCount: number }) {
  const branchTips = useMemo(() => getBranchTips().map((b) => b.tip), []);
  const fruits = useMemo(
    () => COUPON_FRUITS.slice(0, branchTips.length),
    [branchTips.length]
  );

  const donations = useFallingDonations();
  const donationIdxRef = useRef(0);

  const [states, setStates] = useState<CouponState[]>(() =>
    fruits.map(() => ({ phase: 'hanging' as const }))
  );

  useEffect(() => {
    if (donations.length === 0) return;
    const interval = setInterval(() => {
      setStates((prev) => {
        const hangingIdx = prev
          .map((s, i) => (s.phase === 'hanging' ? i : -1))
          .filter((i) => i >= 0);
        if (hangingIdx.length === 0) return prev;
        const pick = hangingIdx[Math.floor(Math.random() * hangingIdx.length)];
        const donation = donations[donationIdxRef.current % donations.length];
        donationIdxRef.current++;
        const next = [...prev];
        next[pick] = {
          phase: 'falling',
          startTime: performance.now() / 1000,
          donation,
        };
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [donations]);

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
      {/* Natural mid-morning lighting — neutral, less orange */}
      <ambientLight intensity={0.75} color="#F4F1E8" />
      <directionalLight
        position={[6, 11, 5]}
        intensity={1.3}
        color="#FFF4E0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-3}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-6, 5, -3]} intensity={0.45} color="#BFD8E8" />
      <directionalLight position={[0, 4, -8]} intensity={0.5} color="#FFD8A8" />

      {/* Atmospheric depth */}
      <fog attach="fog" args={['#DCE6D5', 18, 45]} />

      <Sky />
      <Tree leafCount={leafCount} />
      <Ground y={GROUND_Y} />

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
        />
      ))}

      <Environment preset="park" background={false} />
      <CameraParallax />
    </>
  );
}

export function Tree3DScene() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [dpr, setDpr] = useState<[number, number]>([1, 1.75]);
  const [isMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [enablePost, setEnablePost] = useState(!isMobile);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const leafCount = isMobile ? 2800 : 7000;

  return (
    <div ref={wrapRef} className="absolute inset-0 w-full h-full">
      <Canvas
        shadows
        dpr={dpr}
        frameloop={inView ? 'always' : 'demand'}
        camera={{ position: [0, 4.0, 13], fov: 38 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        style={{ background: 'transparent' }}
      >
        <PerformanceMonitor
          onDecline={() => {
            setDpr([1, 1]);
            setEnablePost(false);
          }}
          onIncline={() => setDpr([1, 1.75])}
        />
        <Suspense fallback={null}>
          <Scene leafCount={leafCount} />
          {enablePost && (
            <EffectComposer multisampling={0}>
              <Bloom
                intensity={0.3}
                luminanceThreshold={0.92}
                luminanceSmoothing={0.3}
                mipmapBlur
              />
              <Vignette eskil={false} offset={0.3} darkness={0.3} />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}

export default Tree3DScene;
