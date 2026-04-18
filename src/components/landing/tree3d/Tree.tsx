import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Procedural stylized tree:
 * - Tapered curved trunk (LatheGeometry)
 * - 6 main branches arranged radially
 * - Each branch ends in a foliage cluster (low-poly icospheres)
 */

interface BranchSpec {
  // Branch tip world position (where coupons hang from)
  tip: THREE.Vector3;
  // Angle/rotation
  rotation: THREE.Euler;
  length: number;
}

export function getBranchTips(): BranchSpec[] {
  // Anchored around trunk top at y ~ 3.2
  const specs: { angle: number; pitch: number; length: number; height: number }[] = [
    { angle: 0.2, pitch: 0.5, length: 1.6, height: 3.0 },
    { angle: Math.PI * 0.45, pitch: 0.7, length: 1.8, height: 3.2 },
    { angle: Math.PI * 0.95, pitch: 0.55, length: 1.7, height: 3.1 },
    { angle: Math.PI * 1.4, pitch: 0.65, length: 1.7, height: 3.3 },
    { angle: Math.PI * 1.75, pitch: 0.5, length: 1.5, height: 2.9 },
    { angle: Math.PI * 0.7, pitch: 0.85, length: 1.4, height: 3.5 },
    { angle: Math.PI * 1.15, pitch: 0.85, length: 1.4, height: 3.5 },
    { angle: Math.PI * 0.25, pitch: 0.85, length: 1.35, height: 3.45 },
  ];
  return specs.map((s) => {
    const horiz = Math.cos(s.pitch) * s.length;
    const vert = Math.sin(s.pitch) * s.length;
    const x = Math.cos(s.angle) * horiz;
    const z = Math.sin(s.angle) * horiz;
    const y = s.height + vert;
    return {
      tip: new THREE.Vector3(x, y, z),
      rotation: new THREE.Euler(0, -s.angle, -s.pitch + Math.PI / 2),
      length: s.length,
    };
  });
}

function Foliage({ position, scale = 1, seed = 0 }: { position: THREE.Vector3; scale?: number; seed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const blobs = useMemo(() => {
    const arr: { pos: [number, number, number]; r: number; color: string }[] = [];
    const palette = ['#059669', '#10B981', '#34D399', '#047857'];
    const rand = (i: number) => {
      const x = Math.sin(seed * 9999 + i * 1234.567) * 43758.5453;
      return x - Math.floor(x);
    };
    for (let i = 0; i < 7; i++) {
      arr.push({
        pos: [
          (rand(i) - 0.5) * 0.9,
          (rand(i + 100) - 0.3) * 0.7,
          (rand(i + 200) - 0.5) * 0.9,
        ],
        r: 0.45 + rand(i + 300) * 0.25,
        color: palette[Math.floor(rand(i + 400) * palette.length)],
      });
    }
    return arr;
  }, [seed]);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      groupRef.current.scale.setScalar(scale * (1 + Math.sin(t * 0.6 + seed) * 0.025));
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {blobs.map((b, i) => (
        <mesh key={i} position={b.pos} castShadow>
          <icosahedronGeometry args={[b.r, 1]} />
          <meshStandardMaterial color={b.color} roughness={0.85} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function TrunkAndBranches() {
  // Lathe profile for tapered curved trunk
  const trunkGeometry = useMemo(() => {
    const points: THREE.Vector2[] = [];
    const segments = 12;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = t * 3.2;
      // Taper from 0.45 at base to 0.18 at top
      const r = 0.45 - t * 0.27 + Math.sin(t * 6) * 0.02;
      points.push(new THREE.Vector2(r, y));
    }
    return new THREE.LatheGeometry(points, 16);
  }, []);

  const branches = useMemo(() => getBranchTips(), []);

  return (
    <group>
      {/* Trunk */}
      <mesh geometry={trunkGeometry} castShadow receiveShadow>
        <meshStandardMaterial color="#5C3A1E" roughness={0.95} flatShading />
      </mesh>

      {/* Branches */}
      {branches.map((b, i) => {
        // Build branch as cylinder from trunk top to tip
        const start = new THREE.Vector3(0, 3.0, 0);
        const dir = b.tip.clone().sub(start);
        const len = dir.length();
        const mid = start.clone().add(dir.clone().multiplyScalar(0.5));
        const quat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          dir.clone().normalize()
        );
        return (
          <group key={i}>
            <mesh position={mid} quaternion={quat} castShadow>
              <cylinderGeometry args={[0.06, 0.13, len, 8]} />
              <meshStandardMaterial color="#4A2C0A" roughness={0.9} flatShading />
            </mesh>
            <Foliage position={b.tip} scale={0.95} seed={i + 1} />
          </group>
        );
      })}

      {/* Crown foliage on top of trunk */}
      <Foliage position={new THREE.Vector3(0, 3.4, 0)} scale={1.15} seed={99} />
    </group>
  );
}

export function Tree() {
  return <TrunkAndBranches />;
}
