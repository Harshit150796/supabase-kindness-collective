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
  isMobile?: boolean;
  /** On mobile only the most recently landed coupon shows its donor label. */
  labelSuppressed?: boolean;
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

// Crisp vector coupon face rendered as DOM via Drei <Html transform>.
// Designed at ~920×600 px so it stays sharp when scaled down into 3D.
function CouponFace({ data }: { data: CouponData }) {
  const logo = brandLogos[data.brand]?.logo;
  return (
    <div
      style={{
        width: 920,
        height: 600,
        borderRadius: 56,
        background: '#FFFFFF',
        border: '12px solid #D4A017',
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 18px 60px rgba(0,0,0,0.18)',
      }}
    >
      {/* Brand stripe */}
      <div
        style={{
          background: data.color,
          color: '#FFFFFF',
          height: 170,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22,
          padding: '0 28px',
        }}
      >
        {logo && (
          <img
            src={logo}
            alt=""
            crossOrigin="anonymous"
            style={{
              width: 96,
              height: 96,
              borderRadius: 18,
              background: '#fff',
              padding: 8,
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
        )}
        <span
          style={{
            fontSize: 92,
            fontWeight: 900,
            letterSpacing: 2,
            lineHeight: 1,
            textTransform: 'uppercase',
            textShadow: '0 2px 0 rgba(0,0,0,0.12)',
          }}
        >
          {data.brand}
        </span>
      </div>

      {/* Trait pill */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 36 }}>
        <div
          style={{
            background: 'rgba(16,185,129,0.12)',
            border: '4px solid #10B981',
            color: '#047857',
            borderRadius: 999,
            padding: '14px 40px',
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: 2,
          }}
        >
          {data.trait}
        </div>
      </div>

      {/* Amount */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 8,
        }}
      >
        <div
          style={{
            color: '#D4A017',
            fontSize: 200,
            fontWeight: 900,
            lineHeight: 1,
            textShadow: '0 4px 0 rgba(212,160,23,0.18)',
          }}
        >
          ${data.amount}
        </div>
        <div
          style={{
            color: '#6B7280',
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: 6,
            marginTop: 12,
          }}
        >
          GROCERY COUPON
        </div>
      </div>
    </div>
  );
}

/**
 * Screen-space placement for the donor badge on tablet/desktop.
 * Projects the anchor to pixels, then clamps it into a padded safe area so the
 * badge is never clipped by the hero edges and never collides with the headline
 * (top), the Top Donors panel (top-right) or the chat launcher (bottom-right).
 */
const projected = new THREE.Vector3();
function clampedPosition(
  el: THREE.Object3D,
  camera: THREE.Camera,
  size: { width: number; height: number }
): [number, number] {
  projected.setFromMatrixPosition(el.matrixWorld).project(camera);
  const halfW = size.width / 2;
  const halfH = size.height / 2;
  let x = projected.x * halfW + halfW;
  let y = -(projected.y * halfH) + halfH;

  const padX = Math.min(170, size.width * 0.28);
  const padTop = Math.min(140, size.height * 0.3);
  const padBottom = Math.min(110, size.height * 0.24);

  x = Math.min(Math.max(x, padX), size.width - padX);
  y = Math.min(Math.max(y, padTop), size.height - padBottom);
  return [x, y];
}

export function CouponFruit({ branchTip, data, state, groundY, index, onLanded, onRegrown, onClickHanging, isMobile = false, labelSuppressed = false }: Props) {
  const tier = useDeviceTier();
  const isTablet = tier === 'tablet';
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const velocityRef = useRef({ y: 0, x: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0 });
  const posRef = useRef(new THREE.Vector3());
  const rotRef = useRef(new THREE.Euler());
  const caughtRef = useRef(false);
  const [sparkle, setSparkle] = useState<{ pos: THREE.Vector3; time: number } | null>(null);
  const { openStory, spawnPlant } = useInteraction();
  const plantSpawnedRef = useRef(false);


  // Stable scatter target across the grass, deterministic per coupon slot.
  // Phones frame the tree much tighter, so coupons land in a small ring around
  // the trunk instead of drifting toward (or past) the viewport edges.
  const scatterTarget = useMemo(() => {
    const ang = (index * 2.3998) % (Math.PI * 2);
    const unit = (index * 0.6180339) % 1;
    // Mobile gets a slightly wider ring than before so coupons don't land in
    // one tight cluster under the trunk, while still staying clear of the edges.
    const rad = isMobile ? 1.6 + unit * 1.7 : 1.8 + unit * 3.7;
    return { x: Math.cos(ang) * rad, z: Math.sin(ang) * rad };
  }, [index, isMobile]);

  useEffect(() => {
    if (state.phase === 'falling') {
      caughtRef.current = false;
      plantSpawnedRef.current = false;
      const startY = branchTip.y - HANG_DROP;
      const dropH = Math.max(0.1, startY - groundY);
      const tFall = Math.sqrt((2 * dropH) / 9.8);
      const dx = scatterTarget.x - branchTip.x;
      const dz = scatterTarget.z - branchTip.z;
      const jitter = isMobile ? 0.06 : 0.2;
      velocityRef.current = {
        y: 0.4,
        x: dx / tFall + (Math.random() - 0.5) * jitter,
        z: dz / tFall + (Math.random() - 0.5) * jitter,
        rotX: (Math.random() - 0.5) * 5,
        rotY: (Math.random() - 0.5) * 3,
        rotZ: (Math.random() - 0.5) * 5,
      };
      posRef.current.set(branchTip.x, startY, branchTip.z);
      rotRef.current.set(0, 0, 0);
    }
  }, [state.phase, branchTip, groundY, scatterTarget]);

  const tryPlant = (pos: THREE.Vector3) => {
    if (plantSpawnedRef.current) return;
    if (state.phase !== 'falling') return;
    plantSpawnedRef.current = true;
    spawnPlant(
      { id: state.donation.id, amount: state.donation.amount },
      [pos.x, groundY, pos.z],
      data.color
    );
  };

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
        tryPlant(restPos);
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
        // Snap to scatter target so coupons land spread across the grass.
        posRef.current.x = scatterTarget.x + (Math.random() - 0.5) * 0.15;
        posRef.current.z = scatterTarget.z + (Math.random() - 0.5) * 0.15;
        posRef.current.y = groundY + 0.025;
        const restPos = posRef.current.clone();
        tryPlant(restPos);
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

  const showLabel =
    !labelSuppressed &&
    state.phase === 'landed' &&
    performance.now() / 1000 - state.landTime < 2.8;
  const nameLimit = isMobile ? 12 : isTablet ? 16 : 20;
  const safeDonorName =
    state.phase === 'landed'
      ? (state.donation.donorName || 'A generous donor').slice(0, nameLimit)
      : '';


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
        visible={state.phase !== 'landed'}
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

        {/* Crisp vector overlay anchored to the front face.
            Skipped on mobile — CSS3D composited over WebGL causes soft/jittery
            coupons on phones. The baked canvas texture on the mesh above is used instead. */}
        {!isMobile && state.phase !== 'regrowing' && (
          <Html
            transform
            sprite
            occlude={false}
            position={[0, 0, COUPON_D / 2 + 0.012]}
            scale={COUPON_W / 920}
            style={{
              pointerEvents: 'none',
              userSelect: 'none',
              backfaceVisibility: 'hidden',
              transformStyle: 'preserve-3d',
              willChange: 'transform',
              imageRendering: 'auto',
            }}
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
          position={[
            // Pull the anchor toward the scene centre so a card that landed on
            // the edge of the ring still renders fully in-canvas.
            state.restPos.x * (isMobile ? 0.7 : isTablet ? 0.55 : 0.7),
            state.restPos.y + (isMobile ? 0.85 : 0.7),
            state.restPos.z * (isMobile ? 0.7 : isTablet ? 0.55 : 0.7),
          ]}
          center
          // Mobile keeps the world-scaled badge (already tuned). Tablet/desktop
          // render screen-space at a fixed pixel size and clamp the projected
          // point into a padded safe area so the name can never be cut off.
          {...(isMobile
            ? { distanceFactor: 5.5 }
            : { calculatePosition: clampedPosition })}
          style={{ pointerEvents: 'none' }}
        >

          <div
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #D4A017',
              borderRadius: isMobile ? '12px' : '14px',
              padding: isMobile ? '8px 13px' : '12px 19px',
              fontFamily: 'system-ui, -apple-system, Arial',
              fontSize: isMobile ? '13px' : '16px',
              fontWeight: 600,
              color: '#1f2937',
              boxShadow: '0 10px 30px rgba(212,160,23,0.35), 0 0 0 4px rgba(212,160,23,0.08)',
              whiteSpace: 'nowrap',
              maxWidth: isMobile ? 170 : 260,
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 8 : 12,
              animation: 'fadeIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div
              style={{
                width: isMobile ? 26 : 34,
                height: isMobile ? 26 : 34,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: isMobile ? 13 : 16,
                flexShrink: 0,
              }}
            >
              {safeDonorName.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0 }}>
              <span
                style={{
                  color: '#059669',
                  fontWeight: 700,
                  maxWidth: isMobile ? 118 : 190,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {safeDonorName}
              </span>
              <span style={{ color: '#6b7280', fontSize: isMobile ? 12 : 13, fontWeight: 500 }}>
                donated{' '}
                <span style={{ color: '#D4A017', fontWeight: 800, fontSize: isMobile ? 13 : 16 }}>
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
