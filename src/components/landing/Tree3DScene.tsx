import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { Tree, getBranchTips } from './tree3d/Tree';
import { CouponFruit, type CouponState } from './tree3d/CouponFruit';
import { Ground } from './tree3d/Ground';
import { COUPON_FRUITS } from './tree3d/couponDesign';
import { useFallingDonations } from '@/hooks/useFallingDonations';

const GROUND_Y = -0.01;

function Scene() {
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

  // Periodically drop a random hanging coupon with the next donation
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
    }, 4500);
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
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-4, 3, -2]} intensity={0.4} color="#fde68a" />

      <Tree />
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

      <Environment preset="park" />
    </>
  );
}

export function Tree3DScene() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [dpr, setDpr] = useState<[number, number]>([1, 1.6]);

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

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-[420px] sm:h-[500px] md:h-[600px] lg:h-[680px]"
    >
      <Canvas
        shadows
        dpr={dpr}
        frameloop={inView ? 'always' : 'demand'}
        camera={{ position: [0.5, 3.2, 8.5], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <PerformanceMonitor
          onDecline={() => setDpr([1, 1])}
          onIncline={() => setDpr([1, 1.6])}
        />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default Tree3DScene;
