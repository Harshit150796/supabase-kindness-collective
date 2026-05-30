import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useInteraction } from './InteractionContext';
import { getSharedBirdTexture } from './birdTexture';

interface Path {
  p0: THREE.Vector3;
  p1: THREE.Vector3;
  p2: THREE.Vector3;
  start: number;
  duration: number;
  flapPhase: number;
}

function randomPath(now: number): Path {
  const dir = Math.random() < 0.5 ? 1 : -1;
  const sx = -14 * dir;
  const ex = 14 * dir;
  const sy = 5 + Math.random() * 4;
  const ey = 5 + Math.random() * 4;
  const sz = -4 + Math.random() * 6;
  const ez = -4 + Math.random() * 6;
  const midX = (sx + ex) * 0.5 + (Math.random() - 0.5) * 4;
  const midY = Math.max(sy, ey) + 1 + Math.random() * 2;
  const midZ = (sz + ez) * 0.5 + (Math.random() - 0.5) * 3;
  return {
    p0: new THREE.Vector3(sx, sy, sz),
    p1: new THREE.Vector3(midX, midY, midZ),
    p2: new THREE.Vector3(ex, ey, ez),
    start: now + Math.random() * 2,
    duration: 6 + Math.random() * 8,
    flapPhase: Math.random() * Math.PI * 2,
  };
}

export function AmbientBirds({ count = 6 }: { count?: number }) {
  const { timeOfDay } = useInteraction();
  const texture = useMemo(() => getSharedBirdTexture(), []);
  const groupRef = useRef<THREE.Group>(null);
  const meshes = useRef<THREE.Mesh[]>([]);
  const materials = useRef<THREE.MeshBasicMaterial[]>([]);
  const paths = useRef<Path[]>([]);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  // Initialize paths once based on count
  const initialPaths = useMemo(() => {
    const now = performance.now() / 1000;
    return Array.from({ length: count }, () => randomPath(now));
  }, [count]);

  if (paths.current.length !== count) {
    paths.current = initialPaths;
  }

  useFrame(() => {
    const now = performance.now() / 1000;
    const targetOpacity = timeOfDay === 'night' ? 0 : 1;
    const tint = timeOfDay === 'sunset' ? '#FFD0A0' : '#FFFFFF';

    for (let i = 0; i < count; i++) {
      const mesh = meshes.current[i];
      const mat = materials.current[i];
      const path = paths.current[i];
      if (!mesh || !mat || !path) continue;

      // Fade
      mat.opacity += (targetOpacity - mat.opacity) * 0.05;
      mat.color.lerp(new THREE.Color(tint), 0.05);
      mesh.visible = mat.opacity > 0.01;

      const elapsed = now - path.start;
      if (elapsed < 0) {
        mesh.visible = false;
        continue;
      }
      let k = elapsed / path.duration;
      if (k >= 1) {
        paths.current[i] = randomPath(now);
        continue;
      }
      const inv = 1 - k;
      tmp
        .set(0, 0, 0)
        .addScaledVector(path.p0, inv * inv)
        .addScaledVector(path.p1, 2 * inv * k)
        .addScaledVector(path.p2, k * k);
      mesh.position.copy(tmp);
      const flap = 0.55 + Math.abs(Math.sin(now * 14 + path.flapPhase)) * 0.55;
      mesh.scale.set(0.7, 0.7 * flap, 0.7);
      // Face travel direction (toward p2)
      mesh.lookAt(path.p2);
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            if (m) meshes.current[i] = m;
          }}
          visible={false}
        >
          <planeGeometry args={[0.9, 0.9]} />
          <meshBasicMaterial
            ref={(mt) => {
              if (mt) materials.current[i] = mt;
            }}
            map={texture}
            transparent
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
