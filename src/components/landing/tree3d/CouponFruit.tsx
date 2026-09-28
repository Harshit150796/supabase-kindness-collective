import { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { drawCouponTexture, getLogo, onLogoSettled, type CouponData } from './couponDesign';
import type { FallingDonation } from '@/hooks/useFallingDonations';
import { useInteraction } from './InteractionContext';
import { SparkleBurst } from './SparkleBurst';
import { toast } from 'sonner';
import type { BranchTip } from './Tree';

export type CouponState =
  | { phase: 'hanging' }
  | { phase: 'falling'; startTime: number; donation: FallingDonation }
  | { phase: 'landed'; landTime: number; donation: FallingDonation; restPos: THREE.Vector3 }
  | { phase: 'regrowing'; startTime: number };

interface Props {
  branch: BranchTip;
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

const HANG_DROP = 0.34;
// Keep the fruit attached to its branch-relative slot while placing its face
// just beyond the nearest leaf layer, reducing partial foliage occlusion.
function logoSize(aspect: number, alphaCoverage: number, mark: CouponData['mark']) {
  // Normalize by the visible ink rather than broad aspect buckets. This keeps
  // dense emblems and open wordmarks at comparable perceived weight while
  // preserving every mark's exact native proportions.
  const targetInkArea = mark === 'emblem' ? 0.48 : 0.31;
  const planeArea = targetInkArea / THREE.MathUtils.clamp(alphaCoverage, 0.18, 0.92);
  let width = Math.sqrt(planeArea * aspect);
  let height = width / aspect;
  const maxWidth = mark === 'emblem' ? 1.08 : 1.62;
  const maxHeight = mark === 'emblem' ? 1.02 : 0.72;
  const fit = Math.min(1, maxWidth / width, maxHeight / height);
  width *= fit;
  height *= fit;
  return { width, height };
}

export function CouponFruit({ branch, data, state, groundY, index, onLanded, onRegrown, onClickHanging, isMobile = false, labelSuppressed = false }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const velocityRef = useRef({ y: 0, x: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0 });
  const posRef = useRef(new THREE.Vector3());
  const rotRef = useRef(new THREE.Euler());
  const caughtRef = useRef(false);
  const [sparkle, setSparkle] = useState<{ pos: THREE.Vector3; time: number } | null>(null);
  const [, setLogoRevision] = useState(0);
  const { openStory, spawnPlant } = useInteraction();
  const plantSpawnedRef = useRef(false);
  const hangingPosition = useMemo(() => {
    const branchTip = branch.tip;
    const radial = new THREE.Vector2(branchTip.x, branchTip.z);
    if (radial.lengthSq() < 0.0001) radial.set(Math.cos(index * 2.3998), Math.sin(index * 2.3998));
    radial.normalize();
    return new THREE.Vector3(
      branchTip.x + radial.x * branch.faceOffset,
      branchTip.y - HANG_DROP,
      branchTip.z + radial.y * branch.faceOffset,
    );
  }, [branch, index]);
  const hangingTilt = useMemo(
    () => ({
      x: ((index * 37) % 11 - 5) * 0.025,
      y: ((index * 23) % 13 - 6) * 0.055,
      z: ((index * 19) % 9 - 4) * 0.045,
    }),
    [index],
  );
  useEffect(() => onLogoSettled(data.logo, () => setLogoRevision((n) => n + 1)), [data.logo]);
  const logoEntry = getLogo(data.logo);
  const dimensions = logoSize(logoEntry.aspect, logoEntry.alphaCoverage, data.mark);
  // One shared scale drives hanging, falling, landed, and regrowing artwork.
  const opticalScale = (data.scale ?? 1) * data.sizeFactor;

  // Stable scatter target across the grass, deterministic per coupon slot.
  // Phones frame the tree much tighter, so coupons land in a small ring around
  // the trunk instead of drifting toward (or past) the viewport edges.
  const scatterTarget = useMemo(() => {
    const ang = (index * 2.3998) % (Math.PI * 2);
    const unit = (index * 0.6180339) % 1;
    // Mobile gets a slightly wider ring than before so coupons don't land in
    // one tight cluster under the trunk, while still staying clear of the edges.
    const rad = isMobile ? 1.6 + unit * 1.7 : 1.8 + unit * 3.2;
    return { x: Math.cos(ang) * rad, z: Math.sin(ang) * rad };
  }, [index, isMobile]);

  useEffect(() => {
    if (state.phase === 'falling') {
      caughtRef.current = false;
      plantSpawnedRef.current = false;
      const startY = hangingPosition.y;
      const dropH = Math.max(0.1, startY - groundY);
      const tFall = Math.sqrt((2 * dropH) / 9.8);
      const dx = scatterTarget.x - hangingPosition.x;
      const dz = scatterTarget.z - hangingPosition.z;
      const jitter = isMobile ? 0.06 : 0.12;
      velocityRef.current = {
        y: 0.4,
        x: dx / tFall + (Math.random() - 0.5) * jitter,
        z: dz / tFall + (Math.random() - 0.5) * jitter,
        rotX: (Math.random() - 0.5) * 5,
        rotY: (Math.random() - 0.5) * 3,
        rotZ: (Math.random() - 0.5) * 5,
      };
      posRef.current.copy(hangingPosition);
      rotRef.current.set(0, 0, 0);
    }
  }, [state.phase, groundY, hangingPosition, scatterTarget, isMobile]);

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
  useEffect(() => () => texture.dispose(), [texture]);

  useFrame(({ camera }, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    const t = performance.now() / 1000;

    if (state.phase === 'hanging') {
      // Pendulum sway with mixed sines (perlin-ish)
      const sway = Math.sin(t * 0.7 + index * 1.3) * 0.14 + Math.sin(t * 1.7 + index) * 0.04;
      const swayZ = Math.cos(t * 0.5 + index * 0.7) * 0.07;
      groupRef.current.position.copy(hangingPosition);
      const targetYaw = Math.atan2(
        camera.position.x - hangingPosition.x,
        camera.position.z - hangingPosition.z,
      );
      const yawDelta = Math.atan2(
        Math.sin(targetYaw - groupRef.current.rotation.y),
        Math.cos(targetYaw - groupRef.current.rotation.y),
      );
      const facingYaw = groupRef.current.rotation.y + yawDelta * (1 - Math.exp(-12 * dt));
      groupRef.current.rotation.set(hangingTilt.x + swayZ, facingYaw + sway * 0.18, hangingTilt.z + sway);
      const breathe = 1 + Math.sin(t * 1.2 + index) * 0.02;
      groupRef.current.scale.setScalar(breathe * opticalScale);
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

      if (posRef.current.y <= groundY + dimensions.height / 2) {
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
      groupRef.current.scale.setScalar(opticalScale);
    } else if (state.phase === 'landed') {
      const elapsed = t - state.landTime;
      // Squash & settle
      const settle = Math.min(1, elapsed / 0.4);
      const squash = 1 - Math.sin(settle * Math.PI) * 0.1;
      groupRef.current.position.copy(state.restPos);
      groupRef.current.rotation.set(-Math.PI / 2.1, rotRef.current.y * 0.4, rotRef.current.z * 0.5);
      groupRef.current.scale.set(opticalScale, squash * opticalScale, opticalScale);
      if (elapsed > 5) onRegrown(index);
    } else if (state.phase === 'regrowing') {
      const elapsed = t - state.startTime;
      const dur = 0.9;
      const k = Math.min(1, elapsed / dur);
      // Elastic ease
      const eased = k === 1 ? 1 : 1 - Math.pow(2, -10 * k) * Math.cos((k * 10 - 0.75) * (2 * Math.PI) / 3);
      groupRef.current.position.copy(hangingPosition);
      const targetYaw = Math.atan2(
        camera.position.x - hangingPosition.x,
        camera.position.z - hangingPosition.z,
      );
      const yawDelta = Math.atan2(
        Math.sin(targetYaw - groupRef.current.rotation.y),
        Math.cos(targetYaw - groupRef.current.rotation.y),
      );
      groupRef.current.rotation.set(
        hangingTilt.x * k,
        groupRef.current.rotation.y + yawDelta * (1 - Math.exp(-12 * dt)),
        hangingTilt.z * k,
      );
      groupRef.current.scale.setScalar(Math.max(0, eased) * opticalScale);
      if (k >= 1) onRegrown(index);
    }
  });

  const showLabel =
    !labelSuppressed &&
    state.phase === 'landed' &&
    performance.now() / 1000 - state.landTime < 2.8;
  const safeDonorName =
    state.phase === 'landed'
      ? (state.donation.donorName || 'A generous donor').slice(0, isMobile ? 12 : 14)
      : '';

  return (
    <>
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
        {/* One transparent, aspect-correct vector silhouette for hanging and falling states. */}
        <mesh castShadow>
          <planeGeometry args={[dimensions.width, dimensions.height]} />
          <meshBasicMaterial
            map={texture}
            transparent
            alphaTest={0.12}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
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
            state.restPos.x * (isMobile ? 0.7 : 0.8),
            // Raise the label so the badge isn't clipped at the canvas bottom
            // or overlapped by the bottom-right action button.
            state.restPos.y + (isMobile ? 0.85 : 0.75),
            state.restPos.z * (isMobile ? 0.7 : 0.8),
          ]}
          center
          distanceFactor={isMobile ? 5.5 : 6.5}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #D4A017',
              borderRadius: isMobile ? '12px' : '13px',
              padding: isMobile ? '8px 13px' : '10px 15px',
              fontFamily: 'system-ui, -apple-system, Arial',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 600,
              color: '#1f2937',
              boxShadow: '0 10px 30px rgba(212,160,23,0.35), 0 0 0 4px rgba(212,160,23,0.08)',
              whiteSpace: 'nowrap',
              maxWidth: isMobile ? 170 : 210,
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 8 : 10,
              animation: 'fadeIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div
              style={{
                width: isMobile ? 26 : 29,
                height: isMobile ? 26 : 29,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: isMobile ? 13 : 14,
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
                  maxWidth: isMobile ? 118 : 150,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {safeDonorName}
              </span>
              <span style={{ color: '#6b7280', fontSize: isMobile ? 12 : 12, fontWeight: 500 }}>
                donated{' '}
                <span style={{ color: '#D4A017', fontWeight: 800, fontSize: isMobile ? 13 : 14 }}>
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
