import { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useInteraction } from './InteractionContext';
import { PlantSprout, type PlantArchetype } from './PlantSprout';
import { NameMoment } from './NameMoment';
import { MOMENT_LIFETIME_MS, MOMENT_SECONDS, nextMoment, type MomentKind } from './gardenMoments';
import { holdSpot, releaseSpot } from './gardenSpots';

interface Plant {
  id: string;
  position: [number, number, number];
  archetype: PlantArchetype;
  bornAt: number;
  fadingOut: boolean;
  seed: number;
  donorName: string;
  amount: number;
  /** The name moment playing on this plant, if any. */
  moment: MomentKind | null;
  side: 1 | -1;
  /** Which side of the plant its tag sits: outward, except near the screen's edges (inward). */
  tagSide: 1 | -1;
  /** Set when the plant stands near a screen edge, so its tag opens inward. */
  edge: 'l' | 'r' | null;
}

/** A new plant this close to an older one takes its place: one plant per landing spot. */
const SAME_SPOT = 0.95;
/** Founder request: a few plants, spread evenly (gardenSpots), never a crowd. */
const MAX_PLANTS = { wide: 8, narrow: 6, phone: 5 };
const ndc = new THREE.Vector3();

/**
 * The garden: a landed coupon grows a plant where it fell and plays its donor's name moment,
 * dandelion and butterfly taking turns. One name plays at a time (the tree drops a coupon every
 * 9s, a little longer than a moment); a coupon landing mid-moment grows a quiet plant. A handful
 * of plants stay (8 on laptops, 6 on tablets, 5 on phones, fewer on low tiers), spread over the visible
 * hill by gardenSpots.
 */
export function PlantsLayer({ cap = 40, isMobile = false, gentle = false }: { cap?: number; isMobile?: boolean; gentle?: boolean }) {
  const { plantEvent } = useInteraction();
  const [plants, setPlants] = useState<Plant[]>([]);
  const lastIdRef = useRef<number | null>(null);
  const momentRef = useRef<MomentKind>(Math.random() < 0.5 ? 'dandelion' : 'butterfly');
  const timersRef = useRef(new Set<number>());
  const lastMomentRef = useRef(-Infinity);
  const camera = useThree((state) => state.camera);
  const width = useThree((state) => state.size.width);
  const limit = Math.min(cap, isMobile ? MAX_PLANTS.phone : width < 1100 ? MAX_PLANTS.narrow : MAX_PLANTS.wide);

  useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  useEffect(() => {
    if (!plantEvent) return;
    if (lastIdRef.current === plantEvent.uid) return;
    lastIdRef.current = plantEvent.uid;

    // One name at a time: a coupon landing while a name is still playing (a shake, a tap) grows a
    // quiet plant with no tag.
    const now = performance.now() / 1000;
    const busy = now - lastMomentRef.current < MOMENT_SECONDS - 0.6;
    const moment: MomentKind | null = busy ? null : momentRef.current;
    if (moment) {
      lastMomentRef.current = now;
      momentRef.current = nextMoment(moment);
    }

    let seed = 0;
    for (let i = 0; i < plantEvent.id.length; i++) seed = (seed + plantEvent.id.charCodeAt(i) * (i + 1)) | 0;
    seed = (Math.abs(seed) || 1) + plantEvent.uid * 7;
    let s = seed;
    const jitter = () => (((s = (s * 9301 + 49297) % 233280) / 233280) - 0.5) * 0.12;

    let px = plantEvent.position[0] + jitter();
    let pz = plantEvent.position[2] + jitter();
    // Keep plants off the trunk base.
    const r = Math.hypot(px, pz);
    if (r < 1.7) {
      const k = 1.7 / (r || 1);
      px *= k;
      pz *= k;
    }

    const id = `${plantEvent.id}:${plantEvent.uid}`;
    const side: 1 | -1 = px >= 0 ? 1 : -1;
    ndc.set(px, 0, pz).project(camera);
    const edge = Math.abs(ndc.x) > 0.42 ? (ndc.x > 0 ? 'r' : 'l') : null;
    const tagSide: 1 | -1 = edge ? (edge === 'r' ? -1 : 1) : side;
    holdSpot(`plant:${id}`, { x: px, z: pz });
    const next: Plant = {
      id,
      position: [px, plantEvent.position[1], pz],
      archetype: (moment ?? (seed % 2 ? 'dandelion' : 'butterfly')) === 'dandelion' ? 'dandelion' : 'cosmos',
      bornAt: performance.now() / 1000,
      fadingOut: false,
      seed,
      donorName: plantEvent.donorName,
      amount: plantEvent.amount,
      moment,
      side,
      tagSide,
      edge,
    };

    setPlants((prev) => {
      let merged = prev.map((p) => {
        if (p.fadingOut) return p;
        const near = Math.hypot(p.position[0] - px, p.position[2] - pz) < SAME_SPOT;
        if (near) {
          releaseSpot(`plant:${p.id}`);
          return { ...p, fadingOut: true, moment: null };
        }
        return moment && p.moment ? { ...p, moment: null } : p;
      });
      merged = [...merged, next];
      // FIFO cap: the oldest standing plant fades, and its spot opens up again.
      const standing = merged.filter((p) => !p.fadingOut);
      if (standing.length > limit) {
        const oldest = standing[0].id;
        releaseSpot(`plant:${oldest}`);
        merged = merged.map((p) => (p.id === oldest ? { ...p, fadingOut: true, moment: null } : p));
      }
      return merged;
    });

    if (!moment) return;
    const timer = window.setTimeout(() => {
      timersRef.current.delete(timer);
      setPlants((prev) => prev.map((p) => (p.id === id && p.moment ? { ...p, moment: null } : p)));
    }, MOMENT_LIFETIME_MS);
    timersRef.current.add(timer);
  }, [plantEvent, limit, camera]);

  const handleFaded = (uid: string) => {
    releaseSpot(`plant:${uid}`);
    setPlants((prev) => prev.filter((p) => p.id !== uid));
  };

  return (
    <>
      {plants.map((p) => (
        <PlantSprout
          key={p.id}
          id={p.id}
          position={p.position}
          archetype={p.archetype}
          bornAt={p.bornAt}
          fadingOut={p.fadingOut}
          onFadedOut={handleFaded}
          seed={p.seed}
        >
          {p.moment && (
            <NameMoment kind={p.moment} donorName={p.donorName} amount={p.amount} side={p.side} tagSide={p.tagSide} edge={p.edge} isMobile={isMobile} still={gentle} />
          )}
        </PlantSprout>
      ))}
    </>
  );
}
