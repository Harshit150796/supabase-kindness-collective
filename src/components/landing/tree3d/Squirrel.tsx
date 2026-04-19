import { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

function makeSquirrelTexture() {
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 96;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 96, 96);
  // Body
  ctx.fillStyle = '#8B5A2B';
  ctx.beginPath();
  ctx.ellipse(48, 58, 18, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.beginPath();
  ctx.ellipse(48, 32, 14, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // Ears
  ctx.beginPath();
  ctx.ellipse(38, 22, 4, 6, 0, 0, Math.PI * 2);
  ctx.ellipse(58, 22, 4, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tail
  ctx.fillStyle = '#A0703A';
  ctx.beginPath();
  ctx.ellipse(74, 50, 10, 22, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // Belly
  ctx.fillStyle = '#D9B58A';
  ctx.beginPath();
  ctx.ellipse(48, 62, 9, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eyes
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(43, 30, 2, 0, Math.PI * 2);
  ctx.arc(53, 30, 2, 0, Math.PI * 2);
  ctx.fill();
  // Nose
  ctx.fillStyle = '#3b2412';
  ctx.beginPath();
  ctx.arc(48, 36, 1.5, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const TRUNK_POS = new THREE.Vector3(0, 1.8, 0);

export function Squirrel() {
  const { camera, size } = useThree();
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const texture = useMemo(() => makeSquirrelTexture(), []);
  const [state, setState] = useState<'hidden' | 'visible'>('hidden');
  const proximityStart = useRef<number | null>(null);
  const lastShown = useRef(0);
  const visibleStart = useRef(0);
  const opacityRef = useRef(0);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (state === 'visible') return;
      // Project trunk to screen space
      const v = TRUNK_POS.clone().project(camera);
      const sx = (v.x * 0.5 + 0.5) * size.width;
      const sy = (-v.y * 0.5 + 0.5) * size.height;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        if (proximityStart.current === null) proximityStart.current = performance.now();
        else if (performance.now() - proximityStart.current > 1000) {
          const now = performance.now() / 1000;
          if (now - lastShown.current > 30) {
            lastShown.current = now;
            visibleStart.current = now;
            setState('visible');
          }
        }
      } else {
        proximityStart.current = null;
      }
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [camera, size, state]);

  useFrame(() => {
    if (!ref.current || !matRef.current) return;
    const target = state === 'visible' ? 1 : 0;
    opacityRef.current += (target - opacityRef.current) * 0.08;
    matRef.current.opacity = opacityRef.current;
    ref.current.visible = opacityRef.current > 0.01;

    if (state === 'visible') {
      const now = performance.now() / 1000;
      const elapsed = now - visibleStart.current;
      // Peek out from behind trunk
      const peek = Math.min(1, elapsed / 0.4) * 0.6;
      ref.current.position.set(0.4 + peek * 0.3, 1.5, 0.55);
      // Subtle bob
      ref.current.position.y += Math.sin(now * 4) * 0.015;
      if (elapsed > 2.4) {
        setState('hidden');
        proximityStart.current = null;
      }
    }
  });

  return (
    <mesh ref={ref} visible={false}>
      <planeGeometry args={[0.7, 0.7]} />
      <meshBasicMaterial
        ref={matRef}
        map={texture}
        transparent
        opacity={0}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
