import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line, Html } from '@react-three/drei';
import { drawCouponTexture, type CouponData } from './couponDesign';
import type { FallingDonation } from '@/hooks/useFallingDonations';

export type CouponState =
  | { phase: 'hanging' }
  | { phase: 'falling'; startTime: number; donation: FallingDonation }
  | { phase: 'landed'; landTime: number; donation: FallingDonation; restPos: THREE.Vector3 }
  | { phase: 'regrowing'; startTime: number };

interface Props {
  branchTip: THREE.Vector3;
  data: CouponData;
  state: CouponState;
  groundY: number;
  index: number;
  onLanded: (idx: number, restPos: THREE.Vector3) => void;
  onRegrown: (idx: number) => void;
}

const HANG_DROP = 0.85; // distance below branch tip where coupon hangs
const COUPON_W = 0.85;
const COUPON_H = 0.55;

export function CouponFruit({ branchTip, data, state, groundY, index, onLanded, onRegrown }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const velocityRef = useRef({ y: 0, x: 0, z: 0, rot: 0 });
  const posRef = useRef(new THREE.Vector3());
  const rotRef = useRef(0);

  // Reset velocity when entering falling phase
  useEffect(() => {
    if (state.phase === 'falling') {
      velocityRef.current = {
        y: 0,
        x: (Math.random() - 0.5) * 0.4,
        z: (Math.random() - 0.5) * 0.2,
        rot: (Math.random() - 0.5) * 4,
      };
      posRef.current.set(branchTip.x, branchTip.y - HANG_DROP, branchTip.z);
      rotRef.current = 0;
    }
  }, [state.phase, branchTip]);

  const texture = useMemo(() => drawCouponTexture(data), [data]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    const t = performance.now() / 1000;

    if (state.phase === 'hanging') {
      // Sway with sine
      const sway = Math.sin(t * 0.7 + index * 1.3) * 0.12;
      const swayZ = Math.cos(t * 0.5 + index * 0.7) * 0.06;
      groupRef.current.position.set(branchTip.x, branchTip.y - HANG_DROP, branchTip.z);
      groupRef.current.rotation.set(swayZ, 0, sway);
      const breathe = 1 + Math.sin(t * 1.2 + index) * 0.02;
      groupRef.current.scale.setScalar(breathe);
    } else if (state.phase === 'falling') {
      velocityRef.current.y -= 9.8 * dt;
      posRef.current.y += velocityRef.current.y * dt;
      posRef.current.x += velocityRef.current.x * dt;
      posRef.current.z += velocityRef.current.z * dt;
      rotRef.current += velocityRef.current.rot * dt;

      if (posRef.current.y <= groundY + COUPON_H / 2) {
        posRef.current.y = groundY + 0.02;
        const restPos = posRef.current.clone();
        onLanded(index, restPos);
      }
      groupRef.current.position.copy(posRef.current);
      groupRef.current.rotation.set(0, 0, rotRef.current);
      groupRef.current.scale.setScalar(1);
    } else if (state.phase === 'landed') {
      groupRef.current.position.copy(state.restPos);
      // Lay flat-ish on ground
      groupRef.current.rotation.set(-Math.PI / 2.2, 0, rotRef.current);
      // Auto-trigger regrow after 5s of being landed
      if (t - state.landTime > 5) {
        onRegrown(index);
      }
    } else if (state.phase === 'regrowing') {
      const elapsed = t - state.startTime;
      const dur = 0.8;
      const k = Math.min(1, elapsed / dur);
      // Spring-ish ease
      const eased = 1 - Math.pow(1 - k, 3);
      groupRef.current.position.set(branchTip.x, branchTip.y - HANG_DROP, branchTip.z);
      groupRef.current.rotation.set(0, 0, 0);
      groupRef.current.scale.setScalar(eased);
      if (k >= 1) onRegrown(index);
    }
  });

  const showLabel =
    state.phase === 'landed' && performance.now() / 1000 - state.landTime < 5;

  return (
    <>
      {/* Hanging string visible only when hanging */}
      {state.phase === 'hanging' && (
        <Line
          points={[
            [branchTip.x, branchTip.y, branchTip.z],
            [branchTip.x, branchTip.y - HANG_DROP + COUPON_H / 2, branchTip.z],
          ]}
          color="#3D2106"
          lineWidth={1.2}
          transparent
          opacity={0.7}
        />
      )}

      <group ref={groupRef}>
        <mesh castShadow>
          <boxGeometry args={[COUPON_W, COUPON_H, 0.04]} />
          <meshStandardMaterial
            map={texture}
            roughness={0.55}
            metalness={0.05}
          />
        </mesh>
        {/* Back side white */}
        <mesh position={[0, 0, -0.025]}>
          <planeGeometry args={[COUPON_W, COUPON_H]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.7} />
        </mesh>
      </group>

      {showLabel && state.phase === 'landed' && (
        <Html
          position={[state.restPos.x, state.restPos.y + 0.5, state.restPos.z]}
          center
          distanceFactor={6}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.96)',
              border: '2px solid #D4A017',
              borderRadius: '12px',
              padding: '8px 14px',
              fontFamily: 'system-ui, -apple-system, Arial',
              fontSize: '14px',
              fontWeight: 600,
              color: '#1f2937',
              boxShadow: '0 6px 20px rgba(212,160,23,0.35)',
              whiteSpace: 'nowrap',
              animation: 'fadeIn 0.35s ease-out',
            }}
          >
            <span style={{ color: '#059669' }}>{state.donation.donorName}</span>
            {' donated '}
            <span style={{ color: '#D4A017', fontWeight: 800 }}>
              ${state.donation.amount}
            </span>
          </div>
        </Html>
      )}
    </>
  );
}
