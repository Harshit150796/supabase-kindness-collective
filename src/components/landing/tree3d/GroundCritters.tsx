import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useInteraction } from './InteractionContext';
import { getSharedSquirrelTexture, getSharedRabbitTexture } from './squirrelTexture';

interface Critter {
  kind: 'squirrel' | 'rabbit';
  pos: THREE.Vector3;
  target: THREE.Vector3;
  pauseUntil: number;
  speed: number;
  bobPhase: number;
}

function pickTarget(out: THREE.Vector3) {
  // Anywhere on grass radius 1.8..9.5, avoiding trunk
  const angle = Math.random() * Math.PI * 2;
  const r = 1.8 + Math.random() * 7.7;
  out.set(Math.cos(angle) * r, 0.35, Math.sin(angle) * r);
}

export function GroundCritters({ count = 4 }: { count?: number }) {
  const { timeOfDay } = useInteraction();
  const { camera } = useThree();
  const squirrelTex = useMemo(() => getSharedSquirrelTexture(), []);
  const rabbitTex = useMemo(() => getSharedRabbitTexture(), []);
  const meshes = useRef<THREE.Mesh[]>([]);
  const materials = useRef<THREE.MeshBasicMaterial[]>([]);

  const critters = useMemo<Critter[]>(() => {
    const now = performance.now() / 1000;
    return Array.from({ length: count }, (_, i) => {
      const pos = new THREE.Vector3();
      const target = new THREE.Vector3();
      pickTarget(pos);
      pickTarget(target);
      return {
        kind: i % 2 === 0 ? 'squirrel' : 'rabbit',
        pos,
        target,
        pauseUntil: now + Math.random() * 2,
        speed: 0.5 + Math.random() * 0.4,
        bobPhase: Math.random() * Math.PI * 2,
      };
    });
  }, [count]);

  useFrame((_, dt) => {
    const now = performance.now() / 1000;
    const nightTarget = timeOfDay === 'night' ? 0.45 : 1;

    for (let i = 0; i < critters.length; i++) {
      const c = critters[i];
      const mesh = meshes.current[i];
      const mat = materials.current[i];
      if (!mesh || !mat) continue;

      // Visibility / opacity (rabbits stay at night, squirrels mostly hide)
      let targetOpacity = nightTarget;
      if (timeOfDay === 'night' && c.kind === 'squirrel') targetOpacity = 0;
      mat.opacity += (targetOpacity - mat.opacity) * 0.04;
      mesh.visible = mat.opacity > 0.02;

      if (now < c.pauseUntil) {
        // idle bob
        mesh.position.set(c.pos.x, 0.35 + Math.sin(now * 3 + c.bobPhase) * 0.01, c.pos.z);
      } else {
        const dx = c.target.x - c.pos.x;
        const dz = c.target.z - c.pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 0.1) {
          c.pauseUntil = now + 1 + Math.random() * 2;
          pickTarget(c.target);
        } else {
          const step = Math.min(dist, c.speed * dt);
          c.pos.x += (dx / dist) * step;
          c.pos.z += (dz / dist) * step;
        }
        const hop = Math.abs(Math.sin(now * 8 + c.bobPhase)) * 0.05;
        mesh.position.set(c.pos.x, 0.35 + hop, c.pos.z);
      }

      // Billboard toward camera (Y-axis only so they stay upright)
      const camPos = camera.position;
      const angle = Math.atan2(camPos.x - mesh.position.x, camPos.z - mesh.position.z);
      mesh.rotation.set(0, angle, 0);
    }
  });

  return (
    <group>
      {critters.map((c, i) => (
        <mesh
          key={i}
          ref={(m) => {
            if (m) meshes.current[i] = m;
          }}
          visible={false}
        >
          <planeGeometry args={[0.7, 0.7]} />
          <meshBasicMaterial
            ref={(mt) => {
              if (mt) materials.current[i] = mt;
            }}
            map={c.kind === 'squirrel' ? squirrelTex : rabbitTex}
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
