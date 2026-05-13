import { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';
import type { FallingDonation } from '@/hooks/useFallingDonations';
import type { CouponData } from './couponDesign';

export type TimeOfDay = 'day' | 'sunset' | 'night';

export interface ShakeEvent { id: number; time: number; }
export interface RippleEvent { id: number; time: number; }
export interface BirdEvent { id: number; time: number; }

export interface PlantEvent {
  uid: number;
  id: string;
  position: [number, number, number];
  amount: number;
  accentColor: string;
  donation: FallingDonation;
  data: CouponData;
}

export interface InteractionState {
  timeOfDay: TimeOfDay;
  cycleTimeOfDay: () => void;

  windRef: React.MutableRefObject<{ value: number }>;
  bumpWind: (v: number) => void;

  shakeEvent: ShakeEvent | null;
  triggerShake: () => void;

  ripples: RippleEvent[];
  spawnRipple: () => void;

  birdEvent: BirdEvent | null;
  triggerBird: () => void;

  selectedDonation: FallingDonation | null;
  openStory: (d: FallingDonation) => void;
  closeStory: () => void;

  transparencyOpen: boolean;
  toggleTransparency: () => void;
  closeTransparency: () => void;

  parallaxBoostRef: React.MutableRefObject<{ value: number }>;
  setParallaxBoost: (b: boolean) => void;

  plantEvent: PlantEvent | null;
  /**
   * Try to spawn a plant. Internally throttled to one spawn every 3 seconds.
   * Returns true if accepted (a plant will grow), false if rate-limited.
   */
  spawnPlant: (
    donation: FallingDonation,
    data: CouponData,
    position: [number, number, number],
    accentColor: string
  ) => boolean;
}

const Ctx = createContext<InteractionState | null>(null);

const PLANT_COOLDOWN_S = 3;

export function InteractionProvider({ children }: { children: ReactNode }) {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [shakeEvent, setShakeEvent] = useState<ShakeEvent | null>(null);
  const [ripples, setRipples] = useState<RippleEvent[]>([]);
  const [birdEvent, setBirdEvent] = useState<BirdEvent | null>(null);
  const [selectedDonation, setSelectedDonation] = useState<FallingDonation | null>(null);
  const [transparencyOpen, setTransparencyOpen] = useState(false);

  const windRef = useRef({ value: 0 });
  const parallaxBoostRef = useRef({ value: 1 });
  const lastBirdRef = useRef(0);
  const lastPlantRef = useRef(0);
  const idRef = useRef(1);

  const cycleTimeOfDay = useCallback(() => {
    setTimeOfDay((p) => (p === 'day' ? 'sunset' : p === 'sunset' ? 'night' : 'day'));
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
    (
      donation: FallingDonation,
      data: CouponData,
      position: [number, number, number],
      accentColor: string
    ): boolean => {
      const now = performance.now() / 1000;
      if (now - lastPlantRef.current < PLANT_COOLDOWN_S) return false;
      lastPlantRef.current = now;
      setPlantEvent({
        uid: idRef.current++,
        id: donation.id,
        position,
        amount: donation.amount,
        accentColor,
        donation,
        data,
      });
      return true;
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
