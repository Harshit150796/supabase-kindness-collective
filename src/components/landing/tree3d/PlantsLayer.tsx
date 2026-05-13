import { useEffect, useRef, useState } from 'react';
import { useInteraction } from './InteractionContext';
import { PlantSprout, pickArchetype, type PlantArchetype } from './PlantSprout';
import type { FallingDonation } from '@/hooks/useFallingDonations';
import type { CouponData } from './couponDesign';

interface Plant {
  id: string;
  position: [number, number, number];
  archetype: PlantArchetype;
  accentColor: string;
  bornAt: number;
  fadingOut: boolean;
  seed: number;
  donation: FallingDonation;
  data: CouponData;
}

const TRUNK_EXCLUSION = 0.4;
const MIN_SPACING = 0.35;

export function PlantsLayer({ cap = 8 }: { cap?: number }) {
  const { plantEvent } = useInteraction();
  const [plants, setPlants] = useState<Plant[]>([]);
  const lastIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!plantEvent) return;
    if (lastIdRef.current === plantEvent.uid) return;
    lastIdRef.current = plantEvent.uid;

    setPlants((prev) => {
      if (prev.some((p) => p.id === plantEvent.id && !p.fadingOut)) return prev;

      let seed = 0;
      for (let i = 0; i < plantEvent.id.length; i++) {
        seed = (seed + plantEvent.id.charCodeAt(i) * (i + 1)) | 0;
      }
      seed = Math.abs(seed) || 1;
      const rng = () => (((seed = (seed * 9301 + 49297) % 233280) / 233280) - 0.5) * 0.24;

      let x = plantEvent.position[0] + rng();
      let z = plantEvent.position[2] + rng();

      // Trunk exclusion: push outward if too close to origin.
      const dTrunk = Math.hypot(x, z);
      if (dTrunk < TRUNK_EXCLUSION) {
        const angle = Math.atan2(z || 0.001, x || 0.001);
        x = Math.cos(angle) * TRUNK_EXCLUSION;
        z = Math.sin(angle) * TRUNK_EXCLUSION;
      }

      // Min-spacing: nudge away from existing active plants.
      for (const p of prev) {
        if (p.fadingOut) continue;
        const dx = x - p.position[0];
        const dz = z - p.position[2];
        const d = Math.hypot(dx, dz);
        if (d < MIN_SPACING && d > 0.0001) {
          const push = (MIN_SPACING - d) + 0.05;
          x += (dx / d) * push;
          z += (dz / d) * push;
        }
      }

      const next: Plant = {
        id: plantEvent.id + ':' + plantEvent.uid,
        position: [x, plantEvent.position[1], z],
        archetype: pickArchetype(plantEvent.amount),
        accentColor: plantEvent.accentColor,
        bornAt: performance.now() / 1000,
        fadingOut: false,
        seed,
        donation: plantEvent.donation,
        data: plantEvent.data,
      };

      let merged = [...prev, next];
      const activeCount = merged.filter((p) => !p.fadingOut).length;
      if (activeCount > cap) {
        const idx = merged.findIndex((p) => !p.fadingOut);
        if (idx >= 0) merged[idx] = { ...merged[idx], fadingOut: true };
      }
      return merged;
    });
  }, [plantEvent, cap]);

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
          accentColor={p.accentColor}
          bornAt={p.bornAt}
          fadingOut={p.fadingOut}
          onFadedOut={handleFaded}
          seed={p.seed}
          donation={p.donation}
          data={p.data}
        />
      ))}
    </>
  );
}
