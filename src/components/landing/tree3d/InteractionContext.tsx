import { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';
import type { FallingDonation } from '@/hooks/useFallingDonations';

export type TimeOfDay = 'day' | 'night';

export interface ShakeEvent {
  id: number;
  time: number;
}

export interface RippleEvent {
  id: number;
  time: number;
}

export interface BirdEvent {
  id: number;
  time: number;
}

export interface PlantEvent {
  uid: number;
  id: string; // donation id
  position: [number, number, number];
  amount: number;
  accentColor: string;
}

export interface InteractionState {
  // Time of day
  timeOfDay: TimeOfDay;
  cycleTimeOfDay: () => void;

  // Wind (driven by mouse velocity, decays)
  windRef: React.MutableRefObject<{ value: number }>;
  bumpWind: (v: number) => void;

  // Shake events (trunk click)
  shakeEvent: ShakeEvent | null;
  triggerShake: () => void;

  // Ripple events (any click)
  ripples: RippleEvent[];
  spawnRipple: () => void;

  // Bird (canopy hold)
  birdEvent: BirdEvent | null;
  triggerBird: () => void;

  // Story panel (coupon click)
  selectedDonation: FallingDonation | null;
  openStory: (d: FallingDonation) => void;
  closeStory: () => void;

  // Transparency popover (root click)
  transparencyOpen: boolean;
  toggleTransparency: () => void;
  closeTransparency: () => void;

  // Parallax boost (mouse held)
  parallaxBoostRef: React.MutableRefObject<{ value: number }>;
  setParallaxBoost: (b: boolean) => void;

  // Plant spawn (coupon landed)
  plantEvent: PlantEvent | null;
  spawnPlant: (donation: { id: string; amount: number }, position: [number, number, number], accentColor: string) => void;
}

const Ctx = createContext<InteractionState | null>(null);

/**
 * One sky per page load: night 70% of the time, blue day 30% (founder decision).
 * The inline opening script draws it into <html data-sky> for every page so the
 * hero backdrop, cursor and live tree agree; ?time3d=day|night forces one for QA.
 */
function getTimeOfDayForLoad(): TimeOfDay {
  if (typeof document !== 'undefined') {
    const forced = new URLSearchParams(window.location.search).get('time3d');
    if (forced === 'day' || forced === 'night') return forced;
    const chosen = document.documentElement.dataset.sky;
    if (chosen === 'day' || chosen === 'night') return chosen;
    const picked: TimeOfDay = Math.random() < 0.7 ? 'night' : 'day';
    document.documentElement.dataset.sky = picked;
    return picked;
  }
  return 'night';
}

export function InteractionProvider({ children }: { children: ReactNode }) {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() => getTimeOfDayForLoad());
  const [shakeEvent, setShakeEvent] = useState<ShakeEvent | null>(null);
  const [ripples, setRipples] = useState<RippleEvent[]>([]);
  const [birdEvent, setBirdEvent] = useState<BirdEvent | null>(null);
  const [selectedDonation, setSelectedDonation] = useState<FallingDonation | null>(null);
  const [transparencyOpen, setTransparencyOpen] = useState(false);

  const windRef = useRef({ value: 0 });
  const parallaxBoostRef = useRef({ value: 1 });
  const lastBirdRef = useRef(0);
  const idRef = useRef(1);

  // The sky stays as chosen for the visit; tapping it toggles between night and day.
  const cycleTimeOfDay = useCallback(() => {
    setTimeOfDay((p) => {
      const next: TimeOfDay = p === 'day' ? 'night' : 'day';
      document.documentElement.dataset.sky = next;
      return next;
    });
  }, []);

  const bumpWind = useCallback((v: number) => {
    windRef.current.value = Math.min(1.5, windRef.current.value + v);
  }, []);

  const triggerShake = useCallback(() => {
    setShakeEvent({ id: idRef.current++, time: performance.now() / 1000 });
  }, []);

  const spawnRipple = useCallback(() => {
    setRipples((prev) => {
      const next: RippleEvent = { id: idRef.current++, time: performance.now() / 1000 };
      const filtered = prev.filter((r) => performance.now() / 1000 - r.time < 1.5);
      return [...filtered, next].slice(-5);
    });
  }, []);

  const triggerBird = useCallback(() => {
    const now = performance.now() / 1000;
    if (now - lastBirdRef.current < 5) return;
    lastBirdRef.current = now;
    setBirdEvent({ id: idRef.current++, time: now });
  }, []);

  const openStory = useCallback((d: FallingDonation) => setSelectedDonation(d), []);
  const closeStory = useCallback(() => setSelectedDonation(null), []);

  const toggleTransparency = useCallback(() => setTransparencyOpen((p) => !p), []);
  const closeTransparency = useCallback(() => setTransparencyOpen(false), []);

  const setParallaxBoost = useCallback((b: boolean) => {
    parallaxBoostRef.current.value = b ? 2.5 : 1;
  }, []);

  const [plantEvent, setPlantEvent] = useState<PlantEvent | null>(null);
  const spawnPlant = useCallback(
    (donation: { id: string; amount: number }, position: [number, number, number], accentColor: string) => {
      setPlantEvent({
        uid: idRef.current++,
        id: donation.id,
        position,
        amount: donation.amount,
        accentColor,
      });
    },
    []
  );

  return (
    <Ctx.Provider
      value={{
        timeOfDay,
        cycleTimeOfDay,
        windRef,
        bumpWind,
        shakeEvent,
        triggerShake,
        ripples,
        spawnRipple,
        birdEvent,
        triggerBird,
        selectedDonation,
        openStory,
        closeStory,
        transparencyOpen,
        toggleTransparency,
        closeTransparency,
        parallaxBoostRef,
        setParallaxBoost,
        plantEvent,
        spawnPlant,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useInteraction() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useInteraction must be used inside InteractionProvider');
  return v;
}
