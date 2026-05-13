import { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Line, Html } from '@react-three/drei';
import { drawCouponTexture, type CouponData } from './couponDesign';
import { brandLogos } from '@/data/brandLogos';
import type { FallingDonation } from '@/hooks/useFallingDonations';
import { useInteraction } from './InteractionContext';
import { SparkleBurst } from './SparkleBurst';
import { toast } from 'sonner';

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
  onClickHanging: (idx: number) => void;
}

const HANG_DROP = 1.0;
const COUPON_W = 1.15;
const COUPON_H = 0.74;
const COUPON_D = 0.05;

// Build a rounded-rect extruded geometry for premium coupon shape
function makeRoundedCouponGeom(): THREE.ExtrudeGeometry {
  const w = COUPON_W;
  const h = COUPON_H;
  const r = 0.07;
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: COUPON_D,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
    curveSegments: 8,
  });
  geo.center();
  // Map UVs of front face to coupon texture (front face is the +Z extrude cap)
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    uv.setXY(i, (x + w / 2) / w, (y + h / 2) / h);
  }
  uv.needsUpdate = true;
  return geo;
}

let couponGeomCache: THREE.ExtrudeGeometry | null = null;
function getCouponGeom() {
  if (!couponGeomCache) couponGeomCache = makeRoundedCouponGeom();
  return couponGeomCache;
}

export function CouponFruit({ branchTip, data, state, groundY, index, onLanded, onRegrown, onClickHanging }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const velocityRef = useRef({ y: 0, x: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0 });
  const posRef = useRef(new THREE.Vector3());
  const rotRef = useRef(new THREE.Euler());
  const caughtRef = useRef(false);
  const [sparkle, setSparkle] = useState<{ pos: THREE.Vector3; time: number } | null>(null);
  const { openStory } = useInteraction();

  useEffect(() => {
    if (state.phase === 'falling') {
      caughtRef.current = false;
      velocityRef.current = {
        y: 0.4,
        x: (Math.random() - 0.5) * 0.5,
        z: (Math.random() - 0.5) * 0.3,
        rotX: (Math.random() - 0.5) * 5,
        rotY: (Math.random() - 0.5) * 3,
        rotZ: (Math.random() - 0.5) * 5,
      };
      posRef.current.set(branchTip.x, branchTip.y - HANG_DROP, branchTip.z);
      rotRef.current.set(0, 0, 0);
    }
  }, [state.phase, branchTip]);

  const handlePointer = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (state.phase === 'hanging') {
      onClickHanging(index);
    } else if (state.phase === 'falling' && !caughtRef.current) {
      caughtRef.current = true;
      velocityRef.current = { y: 0, x: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0 };
      setSparkle({ pos: posRef.current.clone(), time: performance.now() / 1000 });
      toast(`✨ You caught one! +$${state.donation.amount} impact`, { duration: 2200 });
      // Settle to ground after a brief pause
      setTimeout(() => {
        const restPos = posRef.current.clone();
        restPos.y = groundY + 0.025;
        onLanded(index, restPos);
      }, 350);
    } else if (state.phase === 'landed') {
      openStory(state.donation);
    }
  };

  const texture = useMemo(() => drawCouponTexture(data), [data]);
  const geom = useMemo(() => getCouponGeom(), []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    const t = performance.now() / 1000;

    if (state.phase === 'hanging') {
      // Pendulum sway with mixed sines (perlin-ish)
      const sway = Math.sin(t * 0.7 + index * 1.3) * 0.14 + Math.sin(t * 1.7 + index) * 0.04;
      const swayZ = Math.cos(t * 0.5 + index * 0.7) * 0.07;
      groupRef.current.position.set(branchTip.x, branchTip.y - HANG_DROP, branchTip.z);
      groupRef.current.rotation.set(swayZ, sway * 0.5, sway);
      const breathe = 1 + Math.sin(t * 1.2 + index) * 0.02;
      groupRef.current.scale.setScalar(breathe);
      if (glowRef.current) {
        const m = glowRef.current.material as THREE.MeshBasicMaterial;
        m.opacity = 0.12 + Math.sin(t * 1.5 + index) * 0.04;
      }
    } else if (state.phase === 'falling') {
      velocityRef.current.y -= 9.8 * dt;
      velocityRef.current.x *= 0.99; // air drag
      velocityRef.current.z *= 0.99;
      posRef.current.y += velocityRef.current.y * dt;
      posRef.current.x += velocityRef.current.x * dt;
      posRef.current.z += velocityRef.current.z * dt;
      rotRef.current.x += velocityRef.current.rotX * dt;
      rotRef.current.y += velocityRef.current.rotY * dt;
      rotRef.current.z += velocityRef.current.rotZ * dt;

      if (posRef.current.y <= groundY + COUPON_H / 2) {
        posRef.current.y = groundY + 0.025;
        const restPos = posRef.current.clone();
        onLanded(index, restPos);
      }
      groupRef.current.position.copy(posRef.current);
      groupRef.current.rotation.copy(rotRef.current);
      groupRef.current.scale.setScalar(1);
    } else if (state.phase === 'landed') {
      const elapsed = t - state.landTime;
      // Squash & settle
      const settle = Math.min(1, elapsed / 0.4);
      const squash = 1 - Math.sin(settle * Math.PI) * 0.1;
      groupRef.current.position.copy(state.restPos);
      groupRef.current.rotation.set(-Math.PI / 2.1, rotRef.current.y * 0.4, rotRef.current.z * 0.5);
      groupRef.current.scale.set(1, squash, 1);
      if (elapsed > 5) onRegrown(index);
    } else if (state.phase === 'regrowing') {
      const elapsed = t - state.startTime;
      const dur = 0.9;
      const k = Math.min(1, elapsed / dur);
      // Elastic ease
      const eased = k === 1 ? 1 : 1 - Math.pow(2, -10 * k) * Math.cos((k * 10 - 0.75) * (2 * Math.PI) / 3);
      groupRef.current.position.set(branchTip.x, branchTip.y - HANG_DROP, branchTip.z);
      groupRef.current.rotation.set(0, 0, 0);
      groupRef.current.scale.setScalar(Math.max(0, eased));
      if (k >= 1) onRegrown(index);
    }
  });

  const showLabel = state.phase === 'landed' && performance.now() / 1000 - state.landTime < 5;

  return (
    <>
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

      <group
        ref={groupRef}
        onPointerDown={handlePointer}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = '';
        }}
      >
        {/* Gold edge glow (additive) */}
        <mesh ref={glowRef} scale={[1.08, 1.12, 0.9]} raycast={() => {}}>
          <boxGeometry args={[COUPON_W, COUPON_H, COUPON_D]} />
          <meshBasicMaterial
            color="#FFD56A"
            transparent
            opacity={0.14}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* Front face (textured base — card background only, text drawn via crisp HTML overlay) */}
        <mesh geometry={geom} castShadow>
          <meshStandardMaterial
            map={texture}
            roughness={0.55}
            metalness={0.05}
          />
        </mesh>

        {/* Crisp vector overlay anchored to the front face — follows sway/fall via parent group */}
        {state.phase !== 'regrowing' && (
          <Html
            transform
            occlude={false}
            position={[0, 0, COUPON_D / 2 + 0.012]}
            scale={0.115}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
            zIndexRange={[10, 0]}
          >
            <CouponFace data={data} />
          </Html>
        )}

        {/* Back face (white) */}
        <mesh position={[0, 0, -COUPON_D / 2 - 0.001]} rotation={[0, Math.PI, 0]} raycast={() => {}}>
          <planeGeometry args={[COUPON_W * 0.95, COUPON_H * 0.95]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.7} />
        </mesh>
      </group>

      {sparkle && (
        <SparkleBurst
          position={sparkle.pos}
          startTime={sparkle.time}
          onDone={() => setSparkle(null)}
        />
      )}

      {showLabel && state.phase === 'landed' && (
        <Html
          position={[state.restPos.x, state.restPos.y + 0.55, state.restPos.z]}
          center
          distanceFactor={6}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(8px)',
              border: '1.5px solid #D4A017',
              borderRadius: '14px',
              padding: '10px 16px',
              fontFamily: 'system-ui, -apple-system, Arial',
              fontSize: '13px',
              fontWeight: 600,
              color: '#1f2937',
              boxShadow: '0 10px 30px rgba(212,160,23,0.35), 0 0 0 4px rgba(212,160,23,0.08)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              animation: 'fadeIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {state.donation.donorName.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ color: '#059669', fontWeight: 700 }}>
                {state.donation.donorName}
              </span>
              <span style={{ color: '#6b7280', fontSize: 11, fontWeight: 500 }}>
                donated{' '}
                <span style={{ color: '#D4A017', fontWeight: 800, fontSize: 13 }}>
                  ${state.donation.amount}
                </span>
              </span>
            </div>
          </div>
        </Html>
      )}
    </>
  );
}
