import { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { drawCouponTexture, getLogo, onLogoSettled, type CouponData } from './couponDesign';
import type { FallingDonation } from '@/hooks/useFallingDonations';
import { useInteraction } from './InteractionContext';
import { SparkleBurst } from './SparkleBurst';
import { pickGardenSpot, releaseSpot } from './gardenSpots';
import { toast } from 'sonner';
import type { BranchTip } from './Tree';
import { useMotionPreference } from '@/hooks/useMotionPreference';

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

export function CouponFruit({ branch, data, state, groundY, index, onLanded, onRegrown, onClickHanging, isMobile = false }: Props) {
  const gentle = useMotionPreference() === 'gentle';
  const groupRef = useRef<THREE.Group>(null);
  const canvas = useThree((root) => root.gl.domElement);
  const camera = useThree((root) => root.camera);
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
    const rad = 1.8 + unit * 3.2;
    return { x: Math.cos(ang) * rad, z: Math.sin(ang) * rad };
  }, [index, isMobile]);

  // Where this fall ends: the open spot on the visible hill farthest from every plant and every
  // other falling coupon (gardenSpots), so the garden spreads evenly; the ring is the fallback.
  const targetRef = useRef(scatterTarget);
  const fallKey = `fall:${index}`;
  useEffect(() => () => releaseSpot(fallKey), [fallKey]);

  useEffect(() => {
    if (state.phase === 'falling') {
      caughtRef.current = false;
      plantSpawnedRef.current = false;
      const target = pickGardenSpot(camera, fallKey) ?? scatterTarget;
      targetRef.current = target;
      const startY = hangingPosition.y;
      const landY = groundY + dimensions.height / 2;
      const dx = target.x - hangingPosition.x;
      const dz = target.z - hangingPosition.z;
      // A gentle arc: farther spots get a little more lift, and the flight time is solved so the
      // coupon meets the grass exactly at its spot.
      const vy = Math.min(3.2, 0.4 + 0.32 * Math.hypot(dx, dz));
      const drop = Math.max(0.1, startY - landY);
      const tFall = (vy + Math.sqrt(vy * vy + 19.6 * drop)) / 9.8;
      velocityRef.current = {
        y: vy,
        x: dx / tFall,
        z: dz / tFall,
        rotX: (Math.random() - 0.5) * 5,
        rotY: (Math.random() - 0.5) * 3,
        rotZ: (Math.random() - 0.5) * 5,
      };
      posRef.current.copy(hangingPosition);
      rotRef.current.set(0, 0, 0);
    }
  }, [state.phase, groundY, hangingPosition, scatterTarget, isMobile, camera, fallKey, dimensions.height]);

  const tryPlant = (pos: THREE.Vector3) => {
    if (plantSpawnedRef.current) return;
    if (state.phase !== 'falling') return;
    plantSpawnedRef.current = true;
    // The landing plants a dandelion or a cosmos, and the donor's name arrives with it (PlantsLayer).
    spawnPlant(
      { id: state.donation.id, amount: state.donation.amount, donorName: state.donation.donorName },
      [pos.x, groundY, pos.z],
      data.color
    );
  };

  const handlePointer = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (gentle) return;
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
        releaseSpot(fallKey);
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
      const sway = gentle ? 0 : Math.sin(t * 0.7 + index * 1.3) * 0.14 + Math.sin(t * 1.7 + index) * 0.04;
      const swayZ = gentle ? 0 : Math.cos(t * 0.5 + index * 0.7) * 0.07;
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
      const breathe = gentle ? 1 : 1 + Math.sin(t * 1.2 + index) * 0.02;
      groupRef.current.scale.setScalar(breathe * opticalScale);
    } else if (state.phase === 'falling') {
      velocityRef.current.y -= 9.8 * dt;
      posRef.current.y += velocityRef.current.y * dt;
      posRef.current.x += velocityRef.current.x * dt;
      posRef.current.z += velocityRef.current.z * dt;
      rotRef.current.x += velocityRef.current.rotX * dt;
      rotRef.current.y += velocityRef.current.rotY * dt;
      rotRef.current.z += velocityRef.current.rotZ * dt;

      if (posRef.current.y <= groundY + dimensions.height / 2) {
        // Settle exactly on its garden spot.
        posRef.current.x = targetRef.current.x;
        posRef.current.z = targetRef.current.z;
        posRef.current.y = groundY + 0.025;
        const restPos = posRef.current.clone();
        releaseSpot(fallKey);
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

  return (
    <>
      <group
        ref={groupRef}
        visible={state.phase !== 'landed'}
        onPointerDown={handlePointer}
        onPointerOver={(e) => {
          e.stopPropagation();
          // On the canvas only: a body cursor change restyled the whole page on every hover.
          canvas.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          canvas.style.cursor = '';
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

    </>
  );
}
