import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  position: THREE.Vector3;
  startTime: number;
  onDone: () => void;
}

const N = 14;
const DURATION = 0.7;

export function SparkleBurst({ position, startTime, onDone }: Props) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const dirs = useMemo(() => {
    return Array.from({ length: N }, () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      return new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi) * 0.7 + 0.3,
        Math.sin(phi) * Math.sin(theta)
      ).multiplyScalar(0.6 + Math.random() * 0.5);
    });
  }, []);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
  }, [startTime]);

  useFrame(() => {
    if (!ref.current || !matRef.current) return;
    const now = performance.now() / 1000;
    const age = now - startTime;
    const k = Math.min(1, age / DURATION);
    const fade = 1 - k;
    matRef.current.opacity = fade;

    for (let i = 0; i < N; i++) {
      const d = dirs[i];
      const p = position.clone().add(d.clone().multiplyScalar(k * 1.4));
      p.y -= k * k * 0.3; // light gravity
      dummy.position.copy(p);
      dummy.scale.setScalar((1 - k) * 0.08 + 0.02);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;

    if (k >= 1 && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        ref={matRef}
        color="#FFD56A"
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
