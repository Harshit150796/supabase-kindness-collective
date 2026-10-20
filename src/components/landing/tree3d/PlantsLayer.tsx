import { useEffect, useRef, useState } from 'react';
import { useInteraction } from './InteractionContext';
import { PlantSprout, type PlantArchetype } from './PlantSprout';
import { NameMoment } from './NameMoment';
import { MOMENT_LIFETIME_MS, nextMoment, type MomentKind } from './gardenMoments';

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
}

/** A new plant this close to an older one takes its place: one plant per landing spot. */
const SAME_SPOT = 0.95;

/**
 * The garden: every landed coupon grows a plant where it fell and plays its donor's name moment,
 * dandelion and butterfly taking turns. Plants stay (one per spot, `cap` at most); on phones only
 * the newest moment plays, so tags never stack on a narrow screen.
 */
export function PlantsLayer({ cap = 40, isMobile = false, gentle = false }: { cap?: number; isMobile?: boolean; gentle?: boolean }) {
  const { plantEvent } = useInteraction();
  const [plants, setPlants] = useState<Plant[]>([]);
  const lastIdRef = useRef<number | null>(null);
  const momentRef = useRef<MomentKind>(Math.random() < 0.5 ? 'dandelion' : 'butterfly');
  const timersRef = useRef(new Set<number>());

  useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  useEffect(() => {
    if (!plantEvent) return;
    if (lastIdRef.current === plantEvent.uid) return;
    lastIdRef.current = plantEvent.uid;

    const moment = momentRef.current;
    momentRef.current = nextMoment(moment);

    let seed = 0;
    for (let i = 0; i < plantEvent.id.length; i++) seed = (seed + plantEvent.id.charCodeAt(i) * (i + 1)) | 0;
    seed = (Math.abs(seed) || 1) + plantEvent.uid * 7;
    let s = seed;
    const jitter = () => (((s = (s * 9301 + 49297) % 233280) / 233280) - 0.5) * 0.4;

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
    const next: Plant = {
      id,
      position: [px, plantEvent.position[1], pz],
      archetype: moment === 'dandelion' ? 'dandelion' : 'cosmos',
      bornAt: performance.now() / 1000,
      fadingOut: false,
      seed,
      donorName: plantEvent.donorName,
      amount: plantEvent.amount,
      moment,
      side: px >= 0 ? 1 : -1,
    };

    setPlants((prev) => {
      let merged = prev.map((p) => {
        if (p.fadingOut) return p;
        const near = Math.hypot(p.position[0] - px, p.position[2] - pz) < SAME_SPOT;
        if (near) return { ...p, fadingOut: true, moment: null };
        return isMobile && p.moment ? { ...p, moment: null } : p;
      });
      merged = [...merged, next];
      // FIFO cap: the oldest standing plant fades.
      const standing = merged.filter((p) => !p.fadingOut);
      if (standing.length > cap) {
        const oldest = standing[0].id;
        merged = merged.map((p) => (p.id === oldest ? { ...p, fadingOut: true, moment: null } : p));
      }
      return merged;
    });

    const timer = window.setTimeout(() => {
      timersRef.current.delete(timer);
      setPlants((prev) => prev.map((p) => (p.id === id && p.moment ? { ...p, moment: null } : p)));
    }, MOMENT_LIFETIME_MS);
    timersRef.current.add(timer);
  }, [plantEvent, cap, isMobile]);

  const handleFaded = (uid: string) => {
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
            <NameMoment kind={p.moment} donorName={p.donorName} amount={p.amount} side={p.side} isMobile={isMobile} still={gentle} />
          )}
        </PlantSprout>
      ))}
    </>
  );
}
