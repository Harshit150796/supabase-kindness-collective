import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useInteraction } from './InteractionContext';

export function TrunkRipple() {
  const { ripples } = useInteraction();
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTimes: { value: new Float32Array(5).fill(-100) },
      uNow: { value: 0 },
    }),
    []
  );

  useFrame(() => {
    if (!matRef.current) return;
    const now = performance.now() / 1000;
    const arr = matRef.current.uniforms.uTimes.value as Float32Array;
    arr.fill(-100);
    ripples.forEach((r, i) => {
      if (i < 5) arr[i] = r.time;
    });
    matRef.current.uniforms.uNow.value = now;
  });

  return (
    <mesh position={[0, 3.0, 0.05]}>
      <planeGeometry args={[1.4, 5.5, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          uniform float uTimes[5];
          uniform float uNow;
          void main() {
            float alpha = 0.0;
            for (int i = 0; i < 5; i++) {
              float age = uNow - uTimes[i];
              if (age < 0.0 || age > 1.2) continue;
              float k = age / 1.0;
              float pos = k;
              float band = exp(-pow((vUv.y - pos) * 8.0, 2.0));
              float fade = 1.0 - smoothstep(0.0, 1.0, k);
              float horiz = exp(-pow((vUv.x - 0.5) * 4.0, 2.0));
              alpha += band * fade * horiz * 0.9;
            }
            vec3 col = vec3(1.0, 0.84, 0.42);
            gl_FragColor = vec4(col, alpha);
          }
        `}
      />
    </mesh>
  );
}
