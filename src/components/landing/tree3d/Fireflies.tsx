import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useInteraction } from './InteractionContext';
import { useIsMobile } from '@/hooks/use-mobile';

// Adaptive firefly count based on device capability
const getFireflyCount = (isMobile: boolean): number => {
  if (!isMobile) return 40;
  // Mobile: reduce to 20 for better performance
  // Further reduced for low-power devices
  if (typeof navigator !== 'undefined') {
    const cores = navigator.hardwareConcurrency || 2;
    return cores >= 6 ? 20 : 12;
  }
  return 20;
};

export function Fireflies() {
  const isMobile = useIsMobile();
  const { timeOfDay } = useInteraction();
  const N = useMemo(() => getFireflyCount(isMobile), [isMobile]);
  const ref = useRef<THREE.InstancedMesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const opacityRef = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => {
    return Array.from({ length: N }, (_, i) => ({
      cx: (Math.random() - 0.5) * 5,
      cy: 3.5 + Math.random() * 2.5,
      cz: (Math.random() - 0.5) * 4,
      rx: 0.3 + Math.random() * 0.8,
      ry: 0.2 + Math.random() * 0.5,
      rz: 0.3 + Math.random() * 0.8,
      sx: 0.4 + Math.random() * 0.6,
      sy: 0.5 + Math.random() * 0.7,
      sz: 0.3 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      flicker: 0.6 + Math.random() * 0.6,
      seed: i,
    }));
  }, [N]);

  useFrame((_, dt) => {
    if (!ref.current || !matRef.current) return;
    const target = timeOfDay === 'night' ? 1 : 0;
    opacityRef.current += (target - opacityRef.current) * Math.min(1, dt * 1.5);
    matRef.current.opacity = opacityRef.current * 0.95;

    if (opacityRef.current < 0.02) {
      ref.current.visible = false;
      return;
    }
    ref.current.visible = true;

    const t = performance.now() / 1000;
    for (let i = 0; i < N; i++) {
      const d = data[i];
      const x = d.cx + Math.sin(t * d.sx + d.phase) * d.rx;
      const y = d.cy + Math.sin(t * d.sy + d.phase * 1.7) * d.ry;
      const z = d.cz + Math.cos(t * d.sz + d.phase) * d.rz;
      const flicker = 0.6 + Math.sin(t * 3 * d.flicker + d.seed) * 0.4;
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(flicker * 0.06);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  // Reduce sphere geometry segments on mobile for better performance
  const segmentsX = isMobile ? 6 : 8;
  const segmentsY = isMobile ? 6 : 8;

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <sphereGeometry args={[1, segmentsX, segmentsY]} />
      <meshBasicMaterial
        ref={matRef}
        color="#FFEC8B"
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
