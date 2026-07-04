import { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
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

// Adaptive plant cap based on device capability
const getPlantCap = (isMobile: boolean, userCap: number | undefined): number => {
  const baseCap = userCap ?? (isMobile ? 10 : 40);
  
  if (!isMobile) return baseCap;
  
  // On mobile, further reduce based on hardware
  if (typeof navigator !== 'undefined') {
    const cores = navigator.hardwareConcurrency || 2;
    const memory = (navigator as any).deviceMemory || 4; // In GB
    
    // Low-end devices: fewer plants
    if (cores <= 2 || memory <= 2) {
      return Math.max(3, Math.floor(baseCap * 0.25));
    }
    // Mid-range devices
    if (cores <= 4 || memory <= 4) {
      return Math.max(5, Math.floor(baseCap * 0.5));
    }
  }
  
  return baseCap;
};

export function PlantsLayer({ cap = 40 }: { cap?: number }) {
  const isMobile = useIsMobile();
  const effectiveCap = useRef(getPlantCap(isMobile, cap));
  const { plantEvent } = useInteraction();
  const [plants, setPlants] = useState<Plant[]>([]);
  const lastIdRef = useRef<number | null>(null);

  useEffect(() => {
    effectiveCap.current = getPlantCap(isMobile, cap);
  }, [isMobile, cap]);

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
      const jitter = () => (((seed = (seed * 9301 + 49297) % 233280) / 233280) - 0.5) * 0.5;

      let px = plantEvent.position[0] + jitter();
      let pz = plantEvent.position[2] + jitter();
      // Keep plants off the trunk base.
      const r = Math.hypot(px, pz);
      if (r < 1.6) {
        const s = 1.6 / (r || 1);
        px *= s;
        pz *= s;
      }

      const next: Plant = {
        id: plantEvent.id + ':' + plantEvent.uid,
        position: [px, plantEvent.position[1], pz],
        archetype: pickArchetype(plantEvent.amount),
        accentColor: plantEvent.accentColor,
        bornAt: performance.now() / 1000,
        fadingOut: false,
        seed,
      };

      let merged = [...prev, next];
      // FIFO cap: mark oldest non-fading as fading
      const activeCount = merged.filter((p) => !p.fadingOut).length;
      if (activeCount > effectiveCap.current) {
        const idx = merged.findIndex((p) => !p.fadingOut);
        if (idx >= 0) merged[idx] = { ...merged[idx], fadingOut: true };
      }
      return merged;
    });
  }, [plantEvent]);

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
