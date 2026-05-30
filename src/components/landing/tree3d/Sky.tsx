import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useInteraction } from './InteractionContext';

const PALETTES = {
  day: { top: '#7FB5E6', mid: '#CFE6F5', bot: '#E8F1E0' },
  sunset: { top: '#5B7BB5', mid: '#FFD89E', bot: '#FF8E5C' },
  night: { top: '#0A1530', mid: '#1F2C5C', bot: '#3A4A7E' },
};

export function Sky() {
  const { timeOfDay } = useInteraction();

  const targets = useMemo(
    () => ({
      top: new THREE.Color(),
      mid: new THREE.Color(),
      bot: new THREE.Color(),
    }),
    []
  );

  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(PALETTES.day.top) },
        midColor: { value: new THREE.Color(PALETTES.day.mid) },
        bottomColor: { value: new THREE.Color(PALETTES.day.bot) },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPos;
        void main() {
          float h = normalize(vWorldPos).y;
          vec3 col;
          if (h > 0.0) col = mix(midColor, topColor, smoothstep(0.0, 0.7, h));
          else col = mix(midColor, bottomColor, smoothstep(0.0, -0.4, h));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  }, []);

  useFrame((_, dt) => {
    const p = PALETTES[timeOfDay];
    targets.top.set(p.top);
    targets.mid.set(p.mid);
    targets.bot.set(p.bot);
    const k = Math.min(1, dt * 1.5);
    (mat.uniforms.topColor.value as THREE.Color).lerp(targets.top, k);
    (mat.uniforms.midColor.value as THREE.Color).lerp(targets.mid, k);
    (mat.uniforms.bottomColor.value as THREE.Color).lerp(targets.bot, k);
  });

  return (
    <>
      <mesh>
        <sphereGeometry args={[60, 32, 32]} />
        <primitive object={mat} attach="material" />
      </mesh>
      {timeOfDay !== 'night' && (
        <mesh position={[8, 9, -12]}>
          <sphereGeometry args={[1.2, 24, 24]} />
          <meshBasicMaterial color={timeOfDay === 'sunset' ? '#FFB070' : '#FFF6D8'} toneMapped={false} />
        </mesh>
      )}
      {timeOfDay === 'night' && (
        <mesh position={[6, 10, -12]}>
          <sphereGeometry args={[0.9, 24, 24]} />
          <meshBasicMaterial color="#E8EBF5" toneMapped={false} />
        </mesh>
      )}
      <DustMotes />
    </>
  );
}

function DustMotes() {
  const ref = useRef<THREE.Points>(null);
  const { positions, basePositions } = useMemo(() => {
    const N = 140;
    const arr = new Float32Array(N * 3);
    const base = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const x = (Math.random() - 0.5) * 16;
      const y = 1 + Math.random() * 7;
      const z = (Math.random() - 0.5) * 8;
      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
      base[i * 3] = x;
      base[i * 3 + 1] = y;
      base[i * 3 + 2] = z;
    }
    return { positions: arr, basePositions: base };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const bx = basePositions[i * 3];
      const by = basePositions[i * 3 + 1];
      const bz = basePositions[i * 3 + 2];
      pos.setXYZ(
        i,
        bx + Math.sin(t * 0.3 + i) * 0.2,
        by + Math.sin(t * 0.5 + i * 1.3) * 0.15,
        bz + Math.cos(t * 0.4 + i * 0.7) * 0.2
      );
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#FFF8E8" transparent opacity={0.45} sizeAttenuation depthWrite={false} />
    </points>
  );
}
