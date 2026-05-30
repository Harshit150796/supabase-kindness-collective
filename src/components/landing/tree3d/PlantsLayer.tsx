import { useEffect, useRef, useState } from 'react';
import { useInteraction } from './InteractionContext';
import { PlantSprout, pickArchetype, type PlantArchetype } from './PlantSprout';

interface Plant {
  id: string;
  position: [number, number, number];
  archetype: PlantArchetype;
  accentColor: string;
  bornAt: number;
  fadingOut: boolean;
  seed: number;
}

export function PlantsLayer({ cap = 40 }: { cap?: number }) {
  const { plantEvent } = useInteraction();
  const [plants, setPlants] = useState<Plant[]>([]);
  const lastIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!plantEvent) return;
    if (lastIdRef.current === plantEvent.uid) return;
    lastIdRef.current = plantEvent.uid;

    setPlants((prev) => {
      // dedupe by donation id (one plant per donation)
      if (prev.some((p) => p.id === plantEvent.id && !p.fadingOut)) return prev;

      let seed = 0;
      for (let i = 0; i < plantEvent.id.length; i++) seed = (seed + plantEvent.id.charCodeAt(i) * (i + 1)) | 0;
      seed = Math.abs(seed) || 1;
      const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

      // Scatter plants across the full grass disc (annulus 2.0 – 9.5m around trunk)
      // instead of clustering at the coupon landing spot.
      const angle = rand() * Math.PI * 2;
      const radius = 2.0 + rand() * 7.5;
      const groundYPos = plantEvent.position[1];

      const next: Plant = {
        id: plantEvent.id + ':' + plantEvent.uid,
        position: [Math.cos(angle) * radius, groundYPos, Math.sin(angle) * radius],
        archetype: pickArchetype(plantEvent.amount),
        accentColor: plantEvent.accentColor,
        bornAt: performance.now() / 1000,
        fadingOut: false,
        seed,
      };


      let merged = [...prev, next];
      // FIFO cap: mark oldest non-fading as fading
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
        />
      ))}
    </>
  );
}
