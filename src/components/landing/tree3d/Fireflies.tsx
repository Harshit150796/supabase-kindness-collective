import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useInteraction } from './InteractionContext';

const N = 40;

export function Fireflies() {
  const { timeOfDay } = useInteraction();
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
  }, []);

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

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <sphereGeometry args={[1, 8, 8]} />
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
