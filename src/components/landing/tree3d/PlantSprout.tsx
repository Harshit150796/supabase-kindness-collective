import { useMemo, useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useInteraction } from './InteractionContext';
import type { CouponData } from './couponDesign';
import { brandLogos } from '@/data/brandLogos';
import type { FallingDonation } from '@/hooks/useFallingDonations';

export type PlantArchetype = 'sprout' | 'rose' | 'bush';

export interface PlantSpec {
  id: string;
  position: [number, number, number];
  archetype: PlantArchetype;
  accentColor: string;
  bornAt: number;
  fadingOut?: boolean;
  onFadedOut?: (id: string) => void;
  seed: number;
  donation: FallingDonation;
  data: CouponData;
}

// ---- shared cached resources --------------------------------------------------
let stemGeomCache: THREE.CylinderGeometry | null = null;
function getStemGeom() {
  if (!stemGeomCache) {
    stemGeomCache = new THREE.CylinderGeometry(0.022, 0.034, 1, 7, 1);
    stemGeomCache.translate(0, 0.5, 0);
  }
  return stemGeomCache;
}

// Wider, slightly serrated rose-style leaf.
let leafGeomCache: THREE.ShapeGeometry | null = null;
function getLeafGeom() {
  if (!leafGeomCache) {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(0.10, 0.05, 0.16, 0.18, 0.04, 0.30);
    s.lineTo(0, 0.34);
    s.lineTo(-0.04, 0.30);
    s.bezierCurveTo(-0.16, 0.18, -0.10, 0.05, 0, 0);
    leafGeomCache = new THREE.ShapeGeometry(s, 14);
  }
  return leafGeomCache;
}

// Curled rose petal shape.
let petalGeomCache: THREE.ShapeGeometry | null = null;
function getPetalGeom() {
  if (!petalGeomCache) {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(0.11, 0.04, 0.13, 0.18, 0, 0.22);
    s.bezierCurveTo(-0.13, 0.18, -0.11, 0.04, 0, 0);
    petalGeomCache = new THREE.ShapeGeometry(s, 14);
  }
  return petalGeomCache;
}

let centerGeomCache: THREE.SphereGeometry | null = null;
function getCenterGeom() {
  if (!centerGeomCache) centerGeomCache = new THREE.SphereGeometry(0.045, 12, 10);
  return centerGeomCache;
}

const STEM_COLOR = '#3f8a4a';
const LEAF_COLOR = '#52b15c';
const LEAF_COLOR_DARK = '#2f7a3c';
const CENTER_COLOR = '#f5d75b';

function pastelize(hex: string, amount = 0.3): string {
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color('#ffffff'), amount);
  return `#${c.getHexString()}`;
}

function deepen(hex: string, amount = 0.18): string {
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color('#000000'), amount);
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
  height: number;
  leaves: { yFrac: number; angle: number; scale: number; tilt: number }[];
  // Extra stems for the bush archetype (each topped with a smaller bloom)
  stems: { x: number; z: number; height: number; tilt: number; bloomScale: number }[];
}

function buildShape(archetype: PlantArchetype, seed: number): ArchetypeShape {
  const rand = (i: number) => {
    const x = Math.sin(seed * 9301 + i * 49297) * 233280;
    return x - Math.floor(x);
  };

  if (archetype === 'sprout') {
    return {
      height: 0.48 + rand(1) * 0.12,
      leaves: [
        { yFrac: 0.45, angle: 0, scale: 1.05, tilt: 0.35 },
        { yFrac: 0.45, angle: Math.PI, scale: 1.05, tilt: 0.35 },
        { yFrac: 0.7, angle: rand(2) * Math.PI * 2, scale: 0.85, tilt: 0.2 },
      ],
      stems: [],
    };
  }

  if (archetype === 'rose') {
    return {
      height: 0.78 + rand(1) * 0.12,
      leaves: [
        { yFrac: 0.28, angle: rand(2) * Math.PI * 2, scale: 1.1, tilt: 0.32 },
        { yFrac: 0.45, angle: rand(3) * Math.PI * 2, scale: 1.0, tilt: 0.28 },
        { yFrac: 0.6, angle: rand(4) * Math.PI * 2, scale: 0.9, tilt: 0.22 },
        { yFrac: 0.74, angle: rand(5) * Math.PI * 2, scale: 0.8, tilt: 0.18 },
      ],
      stems: [],
    };
  }

  // bush (rose bush)
  const stems: ArchetypeShape['stems'] = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + rand(10 + i) * 0.5;
    const r = 0.12 + rand(20 + i) * 0.06;
    stems.push({
      x: Math.cos(a) * r,
      z: Math.sin(a) * r,
      height: 0.5 + rand(30 + i) * 0.18,
      tilt: (rand(40 + i) - 0.5) * 0.3,
      bloomScale: 0.55 + rand(50 + i) * 0.15,
    });
  }
  return {
    height: 0.65 + rand(1) * 0.15,
    leaves: [
      { yFrac: 0.32, angle: rand(2) * Math.PI * 2, scale: 0.95, tilt: 0.32 },
      { yFrac: 0.5, angle: rand(3) * Math.PI * 2, scale: 0.95, tilt: 0.28 },
      { yFrac: 0.68, angle: rand(4) * Math.PI * 2, scale: 0.85, tilt: 0.22 },
    ],
    stems,
  };
}

// Sub-component: a small rose bloom that frames the donor coupon card.
function RoseBloom({
  accent,
  innerColor,
  outerColor,
  scale,
  growK,
  showCard,
  data,
  donation,
  onClickBloom,
}: {
  accent: string;
  innerColor: string;
  outerColor: string;
  scale: number;
  growK: number;
  showCard: boolean;
  data: CouponData;
  donation: FallingDonation;
  onClickBloom: () => void;
}) {
  const petalGeom = getPetalGeom();
  const centerGeom = getCenterGeom();
  const texture = useMemo(() => drawCouponTexture(data), [data]);
  const logo = brandLogos[data.brand]?.logo;

  // 3 layered rings of petals, fanning around (and slightly behind) the card.
  const rings = [
    { count: 7, radius: 0.18, scale: 1.0, tilt: 0.55, color: outerColor, z: -0.01 },
    { count: 6, radius: 0.13, scale: 0.85, tilt: 0.4, color: accent, z: 0.01 },
    { count: 5, radius: 0.09, scale: 0.7, tilt: 0.25, color: innerColor, z: 0.025 },
  ];

  // Card sits flat at the front of the bloom, scaled small enough to read but
  // small enough to look like a flower head.
  const cardScale = 0.42;

  return (
    <group scale={scale * Math.max(0.0001, growK)}>
      {/* Petal rings */}
      {rings.map((ring, ri) => (
        <group key={ri} position={[0, 0, ring.z]}>
          {Array.from({ length: ring.count }).map((_, i) => {
            const a = (i / ring.count) * Math.PI * 2 + ri * 0.2;
            const x = Math.cos(a) * ring.radius;
            const y = Math.sin(a) * ring.radius;
            return (
              <mesh
                key={i}
                geometry={petalGeom}
                position={[x, y, 0]}
                rotation={[ring.tilt * 0.3, 0, a - Math.PI / 2]}
                scale={ring.scale}
              >
                <meshStandardMaterial
                  color={ring.color}
                  roughness={0.55}
                  side={THREE.DoubleSide}
                  transparent
                />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* Golden center bead behind the card */}
      <mesh geometry={centerGeom} position={[0, 0, 0.018]}>
        <meshStandardMaterial color={CENTER_COLOR} roughness={0.5} />
      </mesh>

      {/* Donor coupon card as the bloom centerpiece */}
      {showCard && (
        <Html
          transform
          sprite
          occlude={false}
          position={[0, 0, 0.06]}
          scale={cardScale / 460}
          style={{
            pointerEvents: 'auto',
            userSelect: 'none',
            cursor: 'pointer',
          }}
          zIndexRange={[10, 0]}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onClickBloom();
            }}
            style={{
              width: 460,
              height: 300,
              borderRadius: 28,
              background: '#FFFFFF',
              border: '8px solid #D4A017',
              boxSizing: 'border-box',
              overflow: 'hidden',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
            }}
          >
            <div
              style={{
                background: data.color,
                color: '#FFFFFF',
                height: 84,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '0 14px',
              }}
            >
              {logo && (
                <img
                  src={logo}
                  alt=""
                  crossOrigin="anonymous"
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 10,
                    background: '#fff',
                    padding: 5,
                    objectFit: 'contain',
                    flexShrink: 0,
                  }}
                />
              )}
              <span
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  letterSpacing: 1,
                  lineHeight: 1,
                  textTransform: 'uppercase',
                }}
              >
                {data.brand}
              </span>
            </div>
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px 10px',
              }}
            >
              <div
                style={{
                  color: '#D4A017',
                  fontSize: 92,
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                ${donation.amount}
              </div>
              <div
                style={{
                  color: '#059669',
                  fontSize: 22,
                  fontWeight: 800,
                  marginTop: 6,
                  maxWidth: 380,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {(donation.donorName || 'A generous donor').slice(0, 22)}
              </div>
              <div
                style={{
                  color: '#6B7280',
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: 2,
                  marginTop: 2,
                }}
              >
                BLOOMED INTO HOPE
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
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
  donation,
  data,
}: PlantSpec) {
  const groupRef = useRef<THREE.Group>(null);
  const fadeStartRef = useRef<number | null>(null);
  const removedRef = useRef(false);
  const { windRef, openStory } = useInteraction();
  const [growState, setGrowState] = useState({ stem: 0, leaf: 0, bloom: 0, opacity: 1 });

  const shape = useMemo(() => buildShape(archetype, seed), [archetype, seed]);
  const stemGeom = getStemGeom();
  const leafGeom = getLeafGeom();
  const accent = accentColor;
  const innerAccent = useMemo(() => pastelize(accentColor, 0.45), [accentColor]);
  const outerAccent = useMemo(() => deepen(accentColor, 0.18), [accentColor]);

  useFrame(() => {
    if (!groupRef.current || removedRef.current) return;
    const t = performance.now() / 1000;

    const stemDur = 1.4;
    const leafDur = 1.1;
    const bloomDur = 1.0;
    const ageStem = t - bornAt;
    const ageLeaf = ageStem - 0.35;
    const ageBloom = ageStem - 1.0;

    const stemK = easeOutElastic(Math.min(1, ageStem / stemDur));
    const leafK = easeOutCubic(Math.min(1, ageLeaf / leafDur));
    const bloomK = easeOutElastic(Math.min(1, ageBloom / bloomDur));

    const wind = windRef.current.value;
    const swayBase =
      (Math.sin(t * 1.3 + seed) * 0.05 + Math.sin(t * 0.7 + seed * 0.5) * 0.03) *
      (1 + wind * 1.5);

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

    const g = groupRef.current;
    g.rotation.z = swayBase * 0.6;
    g.rotation.x = -swayBase * 0.4;

    g.children.forEach((child) => {
      const ud = (child as any).userData;
      if (!ud) return;
      if (ud.kind === 'stem') {
        child.scale.set(1, (ud.height as number) * stemK, 1);
      } else if (ud.kind === 'leaf') {
        child.scale.setScalar(Math.max(0.0001, (ud.scale as number) * leafK));
      }
    });

    if (
      Math.abs(growState.bloom - bloomK) > 0.01 ||
      Math.abs(growState.opacity - opacity) > 0.01
    ) {
      setGrowState({ stem: stemK, leaf: leafK, bloom: bloomK, opacity });
    }
  });

  const handleClickBloom = () => openStory(donation);

  return (
    <group ref={groupRef} position={position}>
      {/* Main stem */}
      <mesh
        geometry={stemGeom}
        userData={{ kind: 'stem', height: shape.height }}
        castShadow={false}
      >
        <meshStandardMaterial color={STEM_COLOR} roughness={0.85} transparent opacity={growState.opacity} />
      </mesh>

      {/* Bush extra stems */}
      {shape.stems.map((s, i) => (
        <mesh
          key={`s${i}`}
          geometry={stemGeom}
          position={[s.x, 0, s.z]}
          rotation={[s.tilt, 0, s.tilt * 0.7]}
          userData={{ kind: 'stem', height: s.height }}
        >
          <meshStandardMaterial color={STEM_COLOR} roughness={0.85} transparent opacity={growState.opacity} />
        </mesh>
      ))}

      {/* Leaves */}
      {shape.leaves.map((lf, i) => {
        const y = lf.yFrac * shape.height;
        return (
          <mesh
            key={`l${i}`}
            geometry={leafGeom}
            position={[0, y, 0]}
            rotation={[lf.tilt, lf.angle, 0]}
            userData={{ kind: 'leaf', scale: lf.scale }}
          >
            <meshStandardMaterial
              color={i % 2 === 0 ? LEAF_COLOR : LEAF_COLOR_DARK}
              roughness={0.7}
              side={THREE.DoubleSide}
              transparent
              opacity={growState.opacity}
            />
          </mesh>
        );
      })}

      {/* Main bloom at the top of main stem */}
      <group position={[0, shape.height + 0.02, 0]} rotation={[0, 0, 0]}>
        <RoseBloom
          accent={accent}
          innerColor={innerAccent}
          outerColor={outerAccent}
          scale={1.0}
          growK={growState.bloom}
          showCard={archetype !== 'bush' && growState.bloom > 0.4}
          data={data}
          donation={donation}
          onClickBloom={handleClickBloom}
        />
      </group>

      {/* Bush: smaller blooms on extra stems (no card to avoid duplicates) */}
      {shape.stems.map((s, i) => (
        <group key={`bb${i}`} position={[s.x, s.height + 0.02, s.z]}>
          <RoseBloom
            accent={accent}
            innerColor={innerAccent}
            outerColor={outerAccent}
            scale={s.bloomScale}
            growK={growState.bloom}
            showCard={false}
            data={data}
            donation={donation}
            onClickBloom={handleClickBloom}
          />
        </group>
      ))}
    </group>
  );
}

export function pickArchetype(amount: number): PlantArchetype {
  if (amount >= 50) return 'bush';
  if (amount >= 10) return 'rose';
  return 'sprout';
}
