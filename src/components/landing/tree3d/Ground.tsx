import { useMemo } from 'react';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { getGroundTexture } from './textures';

export function Ground({ y = -0.01 }: { y?: number }) {
  const tex = useMemo(() => getGroundTexture(), []);

  // Scattered pebbles
  const pebbles = useMemo(() => {
    const arr: { pos: [number, number, number]; r: number }[] = [];
    for (let i = 0; i < 18; i++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = 1.2 + Math.random() * 3.2;
      arr.push({
        pos: [Math.cos(ang) * rad, y + 0.02, Math.sin(ang) * rad],
        r: 0.04 + Math.random() * 0.06,
      });
    }
    return arr;
  }, [y]);

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
        <circleGeometry args={[10, 64]} />
        <meshStandardMaterial map={tex} roughness={1} />
      </mesh>

      <ContactShadows
        position={[0, y + 0.005, 0]}
        opacity={0.55}
        scale={12}
        blur={2.6}
        far={8}
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
