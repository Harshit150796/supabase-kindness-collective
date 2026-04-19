import { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useInteraction } from './InteractionContext';

const DURATION = 2.4;

function makeBirdTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 64, 64);
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath();
  ctx.moveTo(32, 32);
  ctx.quadraticCurveTo(8, 10, 4, 28);
  ctx.quadraticCurveTo(18, 26, 32, 34);
  ctx.quadraticCurveTo(46, 26, 60, 28);
  ctx.quadraticCurveTo(56, 10, 32, 32);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(32, 33, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function Bird() {
  const { birdEvent } = useInteraction();
  const ref = useRef<THREE.Mesh>(null);
  const [active, setActive] = useState<{ time: number; startX: number } | null>(null);
  const texture = useMemo(() => makeBirdTexture(), []);
  const path = useRef({
    p0: new THREE.Vector3(),
    p1: new THREE.Vector3(),
    p2: new THREE.Vector3(),
  });

  useEffect(() => {
    if (!birdEvent) return;
    const sx = (Math.random() - 0.5) * 1.5;
    path.current.p0.set(sx, 4.6, 0);
    path.current.p1.set(sx + 3, 6.5, 1);
    path.current.p2.set(sx + 9, 8, -2);
    setActive({ time: birdEvent.time, startX: sx });
  }, [birdEvent]);

  useFrame(() => {
    if (!ref.current || !active) return;
    const now = performance.now() / 1000;
    const k = (now - active.time) / DURATION;
    if (k >= 1) {
      ref.current.visible = false;
      setActive(null);
      return;
    }
    ref.current.visible = true;
    const u = k;
    const inv = 1 - u;
    const p = new THREE.Vector3()
      .addScaledVector(path.current.p0, inv * inv)
      .addScaledVector(path.current.p1, 2 * inv * u)
      .addScaledVector(path.current.p2, u * u);
    ref.current.position.copy(p);
    // Wing flap via vertical scale
    const flap = 0.6 + Math.abs(Math.sin(now * 18)) * 0.5;
    ref.current.scale.set(0.7, 0.7 * flap, 0.7);
    // Face direction of travel
    ref.current.lookAt(path.current.p2);
  });

  return (
    <mesh ref={ref} visible={false}>
      <planeGeometry args={[0.9, 0.9]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}
