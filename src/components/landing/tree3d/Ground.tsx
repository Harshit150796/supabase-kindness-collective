import { useMemo } from 'react';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { getGroundTexture, getGroundNormalMap } from './textures';

export function Ground({ y = -0.01, isMobile = false }: { y?: number; isMobile?: boolean }) {
  const tex = useMemo(() => getGroundTexture(), []);
  const nrm = useMemo(() => getGroundNormalMap(), []);

  const pebbleCount = 22;
  const pebbles = useMemo(() => {
    const arr: { pos: [number, number, number]; r: number }[] = [];
    for (let i = 0; i < pebbleCount; i++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = 1.2 + Math.random() * 3.5;
      arr.push({
        pos: [Math.cos(ang) * rad, y + 0.02, Math.sin(ang) * rad],
        r: 0.04 + Math.random() * 0.07,
      });
    }
    return arr;
  }, [y, pebbleCount]);

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
        <circleGeometry args={[12, 96]} />
        <meshStandardMaterial map={tex} normalMap={nrm} normalScale={new THREE.Vector2(0.6, 0.6)} roughness={1} />
      </mesh>

      <ContactShadows
        position={[0, y + 0.005, 0]}
        opacity={0.6}
        scale={14}
        blur={2.8}
        far={9}
        resolution={1024}
        color="#1f2937"
      />

      {pebbles.map((p, i) => (
        <mesh key={i} position={p.pos} castShadow receiveShadow>
          <icosahedronGeometry args={[p.r, 0]} />
          <meshStandardMaterial color="#6B5B45" roughness={0.95} flatShading />
        </mesh>
      ))}
    </>
  );
}
