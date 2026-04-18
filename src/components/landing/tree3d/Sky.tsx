import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Gradient sky dome + warm sun disc + soft floating dust motes for depth.
 */
export function Sky() {
  const skyMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color('#FFC9A3') },
        midColor: { value: new THREE.Color('#FFF1D6') },
        bottomColor: { value: new THREE.Color('#E8F0E8') },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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
          if (h > 0.0) {
            col = mix(midColor, topColor, smoothstep(0.0, 0.8, h));
          } else {
            col = mix(midColor, bottomColor, smoothstep(0.0, 0.6, -h));
          }
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  }, []);

  return (
    <>
      <mesh>
        <sphereGeometry args={[60, 32, 32]} />
        <primitive object={skyMat} attach="material" />
      </mesh>
      {/* Warm sun glow */}
      <mesh position={[8, 9, -12]}>
        <sphereGeometry args={[1.4, 24, 24]} />
        <meshBasicMaterial color="#FFE9B0" toneMapped={false} />
      </mesh>
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
      const x = (Math.random() - 0.5) * 14;
      const y = Math.random() * 7 + 0.5;
      const z = (Math.random() - 0.5) * 6 - 1;
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
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < arr.length / 3; i++) {
      arr[i * 3] = basePositions[i * 3] + Math.sin(t * 0.3 + i) * 0.25;
      arr[i * 3 + 1] = basePositions[i * 3 + 1] + Math.sin(t * 0.4 + i * 0.7) * 0.15;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#FFF6D6"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
