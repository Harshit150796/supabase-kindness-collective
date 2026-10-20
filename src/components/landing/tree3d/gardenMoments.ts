import { useThree } from '@react-three/fiber';

/**
 * The garden under the tree (founder-chosen): when a coupon lands, the donor's name arrives one of
 * two ways, taking turns. "Dandelion wish": a dandelion grows, its seeds lift toward the canopy and
 * carry the name with them. "Butterfly": a white cosmos opens and a butterfly flies down from the
 * tree carrying the name tag. The plants stay on the grass (one per landing spot).
 */
export type MomentKind = 'dandelion' | 'butterfly';

/** One name moment, landing to fade-out. The CSS keyframes in garden.css run over the same time. */
export const MOMENT_SECONDS = 7.6;
/** How long a moment stays mounted: its timeline plus the last seed's stagger. */
export const MOMENT_LIFETIME_MS = 9200;
/** When the dandelion's seeds leave its head (47% of the CSS timeline). */
export const BLOW_AT = 3.6;

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function formatGift(amount: number): string {
  return money.format(Number.isFinite(amount) ? amount : 0);
}

/** Donor names are short display names; anonymous gifts arrive already worded ("Anonymous Donor"). */
export function displayDonor(name: string | undefined): string {
  const clean = (name ?? '').trim() || 'A generous donor';
  return clean.length > 22 ? `${clean.slice(0, 21).trimEnd()}…` : clean;
}

export function nextMoment(previous: MomentKind): MomentKind {
  return previous === 'dandelion' ? 'butterfly' : 'dandelion';
}

/**
 * drei <Html> scales its content by distanceFactor / (2·tan(fov/2)·distance), which ignores the
 * hero's height. The garden art is drawn at the 1440×666 hero's scale (78px per world unit at the
 * front of the hill), so the factor follows the canvas height, with a floor so names stay legible
 * in short windows and on phones.
 */
export function useGardenDistanceFactor(isMobile: boolean): number {
  const height = useThree((state) => state.size.height);
  return isMobile ? Math.max((height / 78) * 1.35, 8.7) : Math.max(height / 78, 5.8);
}
