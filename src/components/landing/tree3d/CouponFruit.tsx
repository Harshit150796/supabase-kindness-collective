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
/** Phones: coupons at 86% so neighbouring marks overlap less on the small canopy. */
const PHONE_LOGO_SCALE = 0.86;
/** The logo shivers on its branch this long before it lets go. */
const LOOSEN_SECONDS = 0.5;
/** It rests on the grass, then sinks and fades, before a new brand buds on the branch. */
const LANDED_SECONDS = 1.6;
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
  const canvasSize = useThree((root) => root.size);
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
  // One shared scale drives hanging, falling, landed, and regrowing artwork. Phones draw the
  // coupons a little smaller so the 18 marks crowd each other less on a small canopy (founder, Oct 2026).
  const opticalScale = (data.scale ?? 1) * data.sizeFactor * (isMobile ? PHONE_LOGO_SCALE : 1);

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

  // A drop starts with the logo loosening on its branch; only then does it leave (launch).
  const launchedRef = useRef(false);
  const flightRef = useRef({ start: 0, duration: 1, swayX: 1, swayZ: 0 });
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useEffect(() => {
    if (state.phase === 'falling') {
      caughtRef.current = false;
      plantSpawnedRef.current = false;
      launchedRef.current = false;
      // Phones also keep the plant and its name tag clear of the signpost and the Pause button.
      targetRef.current = pickGardenSpot(camera, fallKey, isMobile ? { width: canvasSize.width, height: canvasSize.height } : null) ?? scatterTarget;
    }
  }, [state.phase, scatterTarget, camera, fallKey, isMobile, canvasSize.width, canvasSize.height]);

  const launch = (t: number) => {
    launchedRef.current = true;
    const target = targetRef.current;
    const startY = hangingPosition.y;
    const landY = groundY + dimensions.height / 2;
    const dx = target.x - hangingPosition.x;
    const dz = target.z - hangingPosition.z;
    // A gentle arc: farther spots get a little more lift, and the flight time is solved so the
    // coupon meets the grass exactly at its spot.
    const vy = Math.min(2.4, 0.3 + 0.28 * Math.hypot(dx, dz));
    const drop = Math.max(0.1, startY - landY);
    const tFall = (vy + Math.sqrt(vy * vy + 19.6 * drop)) / 9.8;
    velocityRef.current = { y: vy, x: dx / tFall, z: dz / tFall, rotX: 0, rotY: 0, rotZ: 0 };
    // Side-to-side flutter runs across the view (camera right), like a falling leaf.
    const fx = camera.position.z, fz = -camera.position.x;
    const fl = Math.hypot(fx, fz) || 1;
    flightRef.current = { start: t, duration: tFall, swayX: fx / fl, swayZ: fz / fl };
    posRef.current.copy(hangingPosition);
    rotRef.current.set(0, groupRef.current?.rotation.y ?? 0, 0);
  };

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
    } else if (state.phase === 'falling' && launchedRef.current && !caughtRef.current) {
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
      if (materialRef.current) materialRef.current.opacity = 1;
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
      if (materialRef.current) materialRef.current.opacity = 1;
      if (!launchedRef.current) {
        // Loosen: the logo shivers and dips on its branch before it lets go.
        const e = t - state.startTime;
        groupRef.current.position.copy(hangingPosition);
        if (e < LOOSEN_SECONDS) {
          const k = Math.max(0, e) / LOOSEN_SECONDS;
          const shiver = Math.sin(e * 46) * 0.09 * k;
          groupRef.current.position.y -= 0.07 * k * k;
          groupRef.current.rotation.z = hangingTilt.z + shiver;
          groupRef.current.rotation.x = hangingTilt.x + shiver * 0.4;
          groupRef.current.scale.setScalar(opticalScale);
          return;
        }
        launch(t);
      }
      velocityRef.current.y -= 9.8 * dt;
      posRef.current.y += velocityRef.current.y * dt;
      posRef.current.x += velocityRef.current.x * dt;
      posRef.current.z += velocityRef.current.z * dt;
      const flight = flightRef.current;
      const e = t - flight.start;
      const p = Math.min(1, e / flight.duration);
      // Leaf-like flutter: sideways drift and rocking that calm as it nears the grass, with the
      // face turned toward the visitor for most of the way down so the brand stays readable.
      const flutter = Math.sin(p * Math.PI * 2.4) * 0.28 * (1 - p);
      const yaw = Math.atan2(camera.position.x - posRef.current.x, camera.position.z - posRef.current.z);
      const yawDelta = Math.atan2(Math.sin(yaw - rotRef.current.y), Math.cos(yaw - rotRef.current.y));
      rotRef.current.y += yawDelta * (1 - Math.exp(-6 * dt));
      groupRef.current.position.set(
        posRef.current.x + flight.swayX * flutter,
        posRef.current.y,
        posRef.current.z + flight.swayZ * flutter,
      );
      groupRef.current.rotation.set(
        Math.sin(e * 3.1 + index) * 0.42 * (1 - p * 0.5) - p * 0.5,
        rotRef.current.y + Math.sin(e * 2.2) * 0.35,
        Math.sin(e * 2.6 + index * 0.7) * 0.5 * (1 - p * 0.6),
      );
      groupRef.current.scale.setScalar(opticalScale);

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
    } else if (state.phase === 'landed') {
      const elapsed = t - state.landTime;
      // Soft bounce, lie on the grass, then sink and fade as the plant opens beneath it.
      const bounce = elapsed < 0.4 ? Math.sin((elapsed / 0.4) * Math.PI) * 0.12 : 0;
      const squash = elapsed < 0.4 ? 1 - Math.sin((elapsed / 0.4) * Math.PI) * 0.12 : 1;
      const fade = THREE.MathUtils.clamp((elapsed - 0.5) / (LANDED_SECONDS - 0.5), 0, 1);
      groupRef.current.position.set(state.restPos.x, state.restPos.y + bounce - fade * 0.06, state.restPos.z);
      groupRef.current.rotation.set(-Math.PI / 2.1, rotRef.current.y, 0);
      groupRef.current.scale.set(opticalScale, squash * opticalScale, opticalScale);
      if (materialRef.current) materialRef.current.opacity = 1 - fade;
      if (elapsed > LANDED_SECONDS) onRegrown(index);
    } else if (state.phase === 'regrowing') {
      if (materialRef.current) materialRef.current.opacity = 1;
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
            ref={materialRef}
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
