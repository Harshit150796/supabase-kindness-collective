import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useInteraction } from './InteractionContext';

export type PlantArchetype = 'sprout' | 'flower' | 'bush';

export interface PlantSpec {
  id: string;
  position: [number, number, number];
  archetype: PlantArchetype;
  accentColor: string;
  bornAt: number;
  fadingOut?: boolean;
  onFadedOut?: (id: string) => void;
  seed: number;
}

// ---- shared cached resources --------------------------------------------------
let stemGeomCache: THREE.CylinderGeometry | null = null;
function getStemGeom() {
  if (!stemGeomCache) {
    stemGeomCache = new THREE.CylinderGeometry(0.012, 0.018, 1, 6, 1);
    stemGeomCache.translate(0, 0.5, 0); // pivot at base
  }
  return stemGeomCache;
}

let leafGeomCache: THREE.ShapeGeometry | null = null;
function getLeafGeom() {
  if (!leafGeomCache) {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(0.05, 0.04, 0.09, 0.12, 0.0, 0.18);
    s.bezierCurveTo(-0.09, 0.12, -0.05, 0.04, 0, 0);
    leafGeomCache = new THREE.ShapeGeometry(s, 12);
  }
  return leafGeomCache;
}

let petalGeomCache: THREE.ShapeGeometry | null = null;
function getPetalGeom() {
  if (!petalGeomCache) {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(0.04, 0.02, 0.05, 0.07, 0, 0.09);
    s.bezierCurveTo(-0.05, 0.07, -0.04, 0.02, 0, 0);
    petalGeomCache = new THREE.ShapeGeometry(s, 10);
  }
  return petalGeomCache;
}

let budGeomCache: THREE.SphereGeometry | null = null;
function getBudGeom() {
  if (!budGeomCache) budGeomCache = new THREE.SphereGeometry(0.025, 10, 8);
  return budGeomCache;
}

const STEM_COLOR = '#3f8a4a';
const LEAF_COLOR = '#52b15c';
const LEAF_COLOR_DARK = '#2f7a3c';
const CENTER_COLOR = '#f5d75b';

function pastelize(hex: string): string {
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color('#ffffff'), 0.35);
  return `#${c.getHexString()}`;
}

function easeOutElastic(k: number): number {
  if (k <= 0) return 0;
  if (k >= 1) return 1;
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * c4) + 1;
}

function easeOutCubic(k: number): number {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
}

interface ArchetypeShape {
  height: number;            // final stem height (m)
  leaves: { yFrac: number; angle: number; scale: number; tilt: number }[];
  flowers: { yFrac: number; petals: number; size: number; offsetAngle: number }[];
  buds: { yFrac: number; offset: [number, number]; size: number }[];
  stems: { x: number; z: number; height: number; tilt: number }[]; // extra stems for bush
}

function buildShape(archetype: PlantArchetype, seed: number): ArchetypeShape {
  const rand = (i: number) => {
    const x = Math.sin(seed * 9301 + i * 49297) * 233280;
    return x - Math.floor(x);
  };

  if (archetype === 'sprout') {
    return {
      height: 0.22 + rand(1) * 0.06,
      leaves: [
        { yFrac: 0.55, angle: 0, scale: 1.0, tilt: 0.35 },
        { yFrac: 0.55, angle: Math.PI, scale: 1.0, tilt: 0.35 },
        { yFrac: 0.85, angle: rand(2) * Math.PI * 2, scale: 0.7, tilt: 0.15 },
      ],
      flowers: [],
      buds: [],
      stems: [],
    };
  }

  if (archetype === 'flower') {
    return {
      height: 0.36 + rand(1) * 0.08,
      leaves: [
        { yFrac: 0.35, angle: rand(2) * Math.PI * 2, scale: 1.0, tilt: 0.3 },
        { yFrac: 0.55, angle: rand(3) * Math.PI * 2, scale: 0.9, tilt: 0.25 },
        { yFrac: 0.72, angle: rand(4) * Math.PI * 2, scale: 0.8, tilt: 0.2 },
      ],
      flowers: [{ yFrac: 1.0, petals: 5, size: 1.0, offsetAngle: rand(5) * Math.PI * 2 }],
      buds: [],
      stems: [],
    };
  }

  // bush
  const stems: ArchetypeShape['stems'] = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + rand(10 + i) * 0.5;
    const r = 0.06 + rand(20 + i) * 0.04;
    stems.push({
      x: Math.cos(a) * r,
      z: Math.sin(a) * r,
      height: 0.22 + rand(30 + i) * 0.1,
      tilt: (rand(40 + i) - 0.5) * 0.25,
    });
  }
  return {
    height: 0.3 + rand(1) * 0.08,
    leaves: [
      { yFrac: 0.4, angle: rand(2) * Math.PI * 2, scale: 0.85, tilt: 0.3 },
      { yFrac: 0.6, angle: rand(3) * Math.PI * 2, scale: 0.85, tilt: 0.25 },
      { yFrac: 0.78, angle: rand(4) * Math.PI * 2, scale: 0.7, tilt: 0.2 },
    ],
    flowers: [],
    buds: [
      { yFrac: 0.95, offset: [0, 0], size: 1.0 },
      { yFrac: 0.85, offset: [0.05, 0.02], size: 0.8 },
      { yFrac: 0.9, offset: [-0.04, -0.03], size: 0.85 },
    ],
    stems,
  };
}

export function PlantSprout({
  id,
  position,
  archetype,
  accentColor,
  bornAt,
  fadingOut,
  onFadedOut,
  seed,
}: PlantSpec) {
  const groupRef = useRef<THREE.Group>(null);
  const fadeStartRef = useRef<number | null>(null);
  const removedRef = useRef(false);
  const { windRef } = useInteraction();

  const shape = useMemo(() => buildShape(archetype, seed), [archetype, seed]);
  const stemGeom = getStemGeom();
  const leafGeom = getLeafGeom();
  const petalGeom = getPetalGeom();
  const budGeom = getBudGeom();
  const accent = useMemo(() => pastelize(accentColor), [accentColor]);

  // Per-instance materials so we can fade opacity independently without
  // mutating other plants. Cheap — 4 small materials per plant.
  const mats = useMemo(() => {
    return {
      stem: new THREE.MeshStandardMaterial({ color: STEM_COLOR, roughness: 0.85, transparent: true }),
      leaf: new THREE.MeshStandardMaterial({
        color: LEAF_COLOR,
        roughness: 0.7,
        side: THREE.DoubleSide,
        transparent: true,
      }),
      leafDark: new THREE.MeshStandardMaterial({
        color: LEAF_COLOR_DARK,
        roughness: 0.8,
        side: THREE.DoubleSide,
        transparent: true,
      }),
      petal: new THREE.MeshStandardMaterial({
        color: accent,
        roughness: 0.55,
        side: THREE.DoubleSide,
        transparent: true,
      }),
      center: new THREE.MeshStandardMaterial({
        color: CENTER_COLOR,
        roughness: 0.5,
        transparent: true,
      }),
      bud: new THREE.MeshStandardMaterial({
        color: accent,
        roughness: 0.55,
        transparent: true,
      }),
    };
  }, [accent]);

  useFrame(() => {
    if (!groupRef.current || removedRef.current) return;
    const t = performance.now() / 1000;

    // Growth phases
    const stemDur = 1.2;
    const leafDur = 1.0;
    const flowerDur = 0.9;
    const ageStem = t - bornAt;
    const ageLeaf = ageStem - 0.3;
    const ageFlower = ageStem - 0.9;

    const stemK = easeOutElastic(Math.min(1, ageStem / stemDur));
    const leafK = easeOutCubic(Math.min(1, ageLeaf / leafDur));
    const flowerK = easeOutElastic(Math.min(1, ageFlower / flowerDur));

    // Sway driven by shared wind value
    const wind = windRef.current.value;
    const swayBase = (Math.sin(t * 1.3 + seed) * 0.05 + Math.sin(t * 0.7 + seed * 0.5) * 0.03) * (1 + wind * 1.5);

    // Fade
    let opacity = 1;
    if (fadingOut) {
      if (fadeStartRef.current == null) fadeStartRef.current = t;
      const fk = Math.min(1, (t - fadeStartRef.current) / 0.6);
      opacity = 1 - fk;
      if (fk >= 1 && !removedRef.current) {
        removedRef.current = true;
        onFadedOut?.(id);
        return;
      }
    }
    mats.stem.opacity = opacity;
    mats.leaf.opacity = opacity;
    mats.leafDark.opacity = opacity;
    mats.petal.opacity = opacity;
    mats.center.opacity = opacity;
    mats.bud.opacity = opacity;

    // Walk children to apply growth scales + sway. Children layout matches the
    // JSX render order below; we use refs via traverse for simplicity.
    const g = groupRef.current;
    g.rotation.z = swayBase * 0.6;
    g.rotation.x = -swayBase * 0.4;

    // Per-child userData drives the scale logic.
    g.children.forEach((child) => {
      const ud = (child as any).userData;
      if (!ud) return;
      if (ud.kind === 'stem') {
        const targetH = ud.height as number;
        child.scale.set(1, targetH * stemK, 1);
      } else if (ud.kind === 'leaf') {
        const s = (ud.scale as number) * leafK;
        child.scale.setScalar(Math.max(0.0001, s));
      } else if (ud.kind === 'flower') {
        const s = (ud.scale as number) * flowerK;
        child.scale.setScalar(Math.max(0.0001, s));
      }
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Main stem */}
      <mesh
        geometry={stemGeom}
        material={mats.stem}
        userData={{ kind: 'stem', height: shape.height }}
        castShadow={false}
      />

      {/* Extra bush stems */}
      {shape.stems.map((s, i) => (
        <mesh
          key={`s${i}`}
          geometry={stemGeom}
          material={mats.stem}
          position={[s.x, 0, s.z]}
          rotation={[s.tilt, 0, s.tilt * 0.7]}
          userData={{ kind: 'stem', height: s.height }}
        />
      ))}

      {/* Leaves */}
      {shape.leaves.map((lf, i) => {
        const y = lf.yFrac * shape.height;
        return (
          <mesh
            key={`l${i}`}
            geometry={leafGeom}
            material={i % 2 === 0 ? mats.leaf : mats.leafDark}
            position={[0, y, 0]}
            rotation={[lf.tilt, lf.angle, 0]}
            userData={{ kind: 'leaf', scale: lf.scale }}
          />
        );
      })}

      {/* Flowers */}
      {shape.flowers.map((fl, i) => {
        const y = fl.yFrac * shape.height + 0.01;
        return (
          <group
            key={`f${i}`}
            position={[0, y, 0]}
            rotation={[0, fl.offsetAngle, 0]}
            userData={{ kind: 'flower', scale: fl.size }}
          >
            {Array.from({ length: fl.petals }).map((_, p) => {
              const a = (p / fl.petals) * Math.PI * 2;
              return (
                <mesh
                  key={p}
                  geometry={petalGeom}
                  material={mats.petal}
                  rotation={[Math.PI / 2.4, 0, a]}
                />
              );
            })}
            <mesh geometry={budGeom} material={mats.center} scale={[0.7, 0.7, 0.7]} />
          </group>
        );
      })}

      {/* Buds (bush) */}
      {shape.buds.map((b, i) => {
        const y = b.yFrac * shape.height;
        return (
          <mesh
            key={`b${i}`}
            geometry={budGeom}
            material={mats.bud}
            position={[b.offset[0], y, b.offset[1]]}
            userData={{ kind: 'flower', scale: b.size }}
          />
        );
      })}
    </group>
  );
}

export function pickArchetype(amount: number): PlantArchetype {
  if (amount >= 50) return 'bush';
  if (amount >= 10) return 'flower';
  return 'sprout';
}
