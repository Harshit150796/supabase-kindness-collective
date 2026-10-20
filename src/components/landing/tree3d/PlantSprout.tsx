import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import { useInteraction } from './InteractionContext';
import { BLOW_AT } from './gardenMoments';

/**
 * What grows where a coupon lands (founder-chosen garden): a dandelion (its seeds carry the donor's
 * name up toward the tree) or a white cosmos (a butterfly brings the name to it). Both are about four
 * times the old sprouts and stay on the grass. Every part is a shared, pre-merged geometry, so a
 * plant costs 7–8 draw calls whatever its detail.
 */
export type PlantArchetype = 'dandelion' | 'cosmos';

export interface PlantSpec {
  id: string;
  position: [number, number, number];
  archetype: PlantArchetype;
  /** Kept for callers; the garden uses its own palette. */
  accentColor?: string;
  bornAt: number;
  fadingOut?: boolean;
  onFadedOut?: (id: string) => void;
  seed: number;
  /** Rendered at the plant's anchor (the dandelion's head, the cosmos's main bloom); sways with it. */
  children?: ReactNode;
}

// ---- shared geometry, built once ------------------------------------------------------------

interface Shared {
  stem: THREE.CylinderGeometry;
  rosette: THREE.BufferGeometry;
  cosmosLeaves: THREE.BufferGeometry;
  bloom: THREE.BufferGeometry;
  disc: THREE.CircleGeometry;
  core: THREE.SphereGeometry;
  fluff: THREE.SphereGeometry;
  shadow: THREE.CircleGeometry;
  rays: THREE.BufferGeometry;
  tips: THREE.BufferGeometry;
  dot: THREE.Texture;
}

let shared: Shared | null = null;

function toothedLeaf(): THREE.Shape {
  const s = new THREE.Shape();
  const top: [number, number][] = [[0.06, 0.03], [0.08, 0.012], [0.15, 0.052], [0.17, 0.02], [0.25, 0.066], [0.27, 0.026], [0.36, 0.06], [0.37, 0.022], [0.46, 0.036], [0.5, 0]];
  s.moveTo(0, 0);
  top.forEach(([x, y]) => s.lineTo(x, y));
  [...top].reverse().slice(1).forEach(([x, y]) => s.lineTo(x, -y));
  s.lineTo(0, 0);
  return s;
}

function slenderLeaf(length: number, width: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(length * 0.22, width, length * 0.7, width, length, 0);
  s.bezierCurveTo(length * 0.7, -width, length * 0.22, -width, 0, 0);
  return s;
}

/** A leaf geometry lying on the ground along +x, lifted by `lift` and turned to `yaw`. */
function placedLeaf(shape: THREE.Shape, yaw: number, lift: number, scale = 1): THREE.BufferGeometry {
  const g = new THREE.ShapeGeometry(shape, 8);
  g.rotateX(-Math.PI / 2);
  g.scale(scale, scale, scale);
  g.rotateZ(lift);
  g.rotateY(yaw);
  return g;
}

function getShared(): Shared {
  if (shared) return shared;
  const stem = new THREE.CylinderGeometry(0.013, 0.021, 1, 6, 1);
  stem.translate(0, 0.5, 0);

  const toothed = toothedLeaf();
  const rosette = mergeBufferGeometries(
    [0, 1, 2, 3, 4, 5].map((i) => placedLeaf(toothed, (i / 6) * Math.PI * 2 + (i % 2) * 0.2, 0.34 + (i % 3) * 0.08, 0.9 + (i % 2) * 0.18)),
  )!;

  const slender = slenderLeaf(0.34, 0.045);
  const cosmosLeaves = mergeBufferGeometries(
    [0, 1, 2, 3, 4].map((i) => placedLeaf(slender, (i / 5) * Math.PI * 2 + 0.3, 0.55 + (i % 2) * 0.2, 0.85 + (i % 3) * 0.12)),
  )!;

  // Eight petals around a centre, facing +z: one draw call per bloom.
  const petal = new THREE.Shape();
  petal.moveTo(0, 0.02);
  petal.bezierCurveTo(0.075, 0.06, 0.08, 0.2, 0, 0.245);
  petal.bezierCurveTo(-0.08, 0.2, -0.075, 0.06, 0, 0.02);
  const bloom = mergeBufferGeometries(
    Array.from({ length: 8 }, (_, i) => {
      const g = new THREE.ShapeGeometry(petal, 10);
      g.rotateZ((i / 8) * Math.PI * 2);
      return g;
    }),
  )!;
  const disc = new THREE.CircleGeometry(0.062, 24);

  const core = new THREE.SphereGeometry(0.05, 12, 10);
  const fluff = new THREE.SphereGeometry(0.31, 20, 14);
  const shadow = new THREE.CircleGeometry(0.3, 28);
  shadow.rotateX(-Math.PI / 2);

  // The seed head: fibres from the core to evenly spread tips (a Fibonacci sphere).
  const n = 110;
  const rayPos = new Float32Array(n * 6);
  const tipPos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const y = 1 - ((i + 0.5) / n) * 2;
    const r = Math.sqrt(1 - y * y);
    const phi = i * 2.399963;
    const d = [Math.cos(phi) * r, y, Math.sin(phi) * r];
    const len = 0.29 + ((i * 7) % 5) * 0.008;
    for (let k = 0; k < 3; k++) {
      rayPos[i * 6 + k] = d[k] * 0.045;
      rayPos[i * 6 + 3 + k] = d[k] * len;
      tipPos[i * 3 + k] = d[k] * len;
    }
  }
  const rays = new THREE.BufferGeometry();
  rays.setAttribute('position', new THREE.BufferAttribute(rayPos, 3));
  const tips = new THREE.BufferGeometry();
  tips.setAttribute('position', new THREE.BufferAttribute(tipPos, 3));

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,.9)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);
  const dot = new THREE.CanvasTexture(canvas);

  shared = { stem, rosette, cosmosLeaves, bloom, disc, core, fluff, shadow, rays, tips, dot };
  return shared;
}

// ---- motion helpers -------------------------------------------------------------------------

const clamp01 = (k: number) => Math.max(0, Math.min(1, k));
const easeOutCubic = (k: number) => 1 - Math.pow(1 - clamp01(k), 3);
function easeOutBack(k: number) {
  const x = clamp01(k);
  const c1 = 1.5;
  return 1 + (c1 + 1) * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}
function easeOutElastic(k: number) {
  if (k <= 0) return 0;
  if (k >= 1) return 1;
  return Math.pow(2, -9 * k) * Math.sin((k * 9 - 0.75) * ((2 * Math.PI) / 3)) + 1;
}

const STEM = '#3F7A3A';
const LEAF = '#4C9A48';
const LEAF_DARK = '#3A8538';

export function PlantSprout({ id, position, archetype, bornAt, fadingOut, onFadedOut, seed, children }: PlantSpec) {
  const groupRef = useRef<THREE.Group>(null);
  const stemRefs = useRef<(THREE.Object3D | null)[]>([]);
  const tipRefs = useRef<(THREE.Object3D | null)[]>([]);
  const leavesRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);
  const bloomRefs = useRef<(THREE.Object3D | null)[]>([]);
  const fadeStartRef = useRef<number | null>(null);
  const removedRef = useRef(false);
  const { windRef } = useInteraction();
  const g = getShared();

  // Per-plant variety from the seed: size, lean, which way it faces.
  const shape = useMemo(() => {
    const rand = (i: number) => {
      const x = Math.sin(seed * 9301 + i * 49297) * 233280;
      return x - Math.floor(x);
    };
    const size = 0.92 + rand(1) * 0.18;
    const flip = rand(2) < 0.5 ? 1 : -1;
    return archetype === 'dandelion'
      ? { size, flip, yaw: rand(3) * Math.PI * 2, stems: [{ h: 1.32 + rand(4) * 0.12, lean: (rand(5) - 0.5) * 0.14 }] }
      : { size, flip, yaw: rand(3) * Math.PI * 2, stems: [{ h: 1.26 + rand(4) * 0.1, lean: -0.1 }, { h: 0.9 + rand(5) * 0.1, lean: 0.34 }] };
  }, [archetype, seed]);

  const mats = useMemo(() => {
    const m = {
      shadow: new THREE.MeshBasicMaterial({ color: '#0B1A0C', transparent: true, opacity: 0.12, depthWrite: false }),
      stem: new THREE.MeshStandardMaterial({ color: STEM, roughness: 0.85, transparent: true }),
      leaf: new THREE.MeshStandardMaterial({ color: archetype === 'dandelion' ? LEAF_DARK : LEAF, roughness: 0.75, side: THREE.DoubleSide, transparent: true }),
      petalA: new THREE.MeshBasicMaterial({ color: '#FBFCF6', side: THREE.DoubleSide, transparent: true, toneMapped: false }),
      petalB: new THREE.MeshBasicMaterial({ color: '#E3ECFA', side: THREE.DoubleSide, transparent: true, toneMapped: false }),
      disc: new THREE.MeshBasicMaterial({ color: '#2C4A9A', side: THREE.DoubleSide, transparent: true, toneMapped: false }),
      core: new THREE.MeshStandardMaterial({ color: '#C9CFB8', roughness: 0.9, transparent: true }),
      fluff: new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.2, depthWrite: false, toneMapped: false }),
      rays: new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.95, toneMapped: false }),
      tips: new THREE.PointsMaterial({ color: '#FFFFFF', size: 0.075, map: g.dot, transparent: true, depthWrite: false, toneMapped: false }),
    };
    return m;
  }, [archetype, g.dot]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group || removedRef.current) return;
    const now = performance.now() / 1000;
    const t = now - bornAt;

    let fade = 1;
    if (fadingOut) {
      if (fadeStartRef.current == null) fadeStartRef.current = now;
      const k = clamp01((now - fadeStartRef.current) / 0.8);
      fade = 1 - k;
      if (k >= 1) {
        removedRef.current = true;
        onFadedOut?.(id);
        return;
      }
    }

    const stemK = easeOutCubic(t / 1.15);
    const leafK = easeOutBack(t / 0.9);
    shape.stems.forEach((s, i) => {
      const stemMesh = stemRefs.current[i];
      if (stemMesh) stemMesh.scale.set(1, Math.max(0.0001, s.h * easeOutCubic((t - i * 0.18) / 1.15)), 1);
      const tip = tipRefs.current[i];
      if (tip) tip.position.y = s.h * easeOutCubic((t - i * 0.18) / 1.15);
    });
    if (leavesRef.current) leavesRef.current.scale.setScalar(Math.max(0.0001, leafK));

    if (archetype === 'dandelion') {
      const headK = easeOutElastic((t - 0.85) / 0.8);
      headRef.current?.scale.setScalar(Math.max(0.0001, headK));
      // The seeds leave at BLOW_AT (the name rides them up); a few stay on the head.
      const blown = clamp01((t - BLOW_AT) / 1.3);
      mats.rays.opacity = (0.95 - blown * 0.72) * fade;
      mats.tips.opacity = (1 - blown * 0.78) * fade;
      mats.fluff.opacity = (0.2 - blown * 0.15) * fade;
      mats.core.opacity = fade;
    } else {
      bloomRefs.current.forEach((b, i) => {
        if (b) b.scale.setScalar(Math.max(0.0001, easeOutElastic((t - 0.95 - i * 0.22) / 0.85)));
      });
      mats.petalA.opacity = fade;
      mats.petalB.opacity = fade;
      mats.disc.opacity = fade;
    }
    mats.shadow.opacity = 0.12 * fade * stemK;
    mats.stem.opacity = fade;
    mats.leaf.opacity = fade;

    const wind = windRef.current.value;
    const sway = (Math.sin(now * 1.2 + seed) * 0.045 + Math.sin(now * 0.63 + seed * 0.5) * 0.03) * (1 + wind * 1.5);
    group.rotation.z = sway * 0.6;
    group.rotation.x = -sway * 0.35;
  });

  const s = shape.size;
  return (
    <group position={position}>
      <mesh geometry={g.shadow} material={mats.shadow} position={[0, 0.006, 0]} scale={s} renderOrder={1} />
      <group ref={groupRef} scale={[s * shape.flip, s, s]}>
        <mesh ref={leavesRef} geometry={archetype === 'dandelion' ? g.rosette : g.cosmosLeaves} material={mats.leaf} rotation={[0, shape.yaw, 0]} position={[0, 0.01, 0]} />
        {shape.stems.map((st, i) => (
          <group key={i} rotation={[0, 0, st.lean]}>
            <mesh ref={(el) => { stemRefs.current[i] = el; }} geometry={g.stem} material={mats.stem} />
            <group ref={(el) => { tipRefs.current[i] = el; }}>
              {archetype === 'dandelion' ? (
                <group ref={headRef}>
                  <mesh geometry={g.core} material={mats.core} />
                  <mesh geometry={g.fluff} material={mats.fluff} />
                  <lineSegments geometry={g.rays} material={mats.rays} />
                  <points geometry={g.tips} material={mats.tips} />
                  {children}
                </group>
              ) : (
                // Blooms face the viewer, tipped up a little toward the camera.
                <group rotation={[-0.3, 0, -st.lean]} ref={(el) => { bloomRefs.current[i] = el; }} scale={i === 0 ? 1 : 0.82}>
                  <mesh geometry={g.bloom} material={i === 0 ? mats.petalA : mats.petalB} />
                  <mesh geometry={g.disc} material={mats.disc} position={[0, 0, 0.006]} />
                  {i === 0 && children}
                </group>
              )}
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}
