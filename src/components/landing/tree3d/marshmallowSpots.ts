import { heroCamera, canopyTopPx, trunkBasePx } from '@/lib/heroBackdrop';
import { signpostLayout, type Box } from '@/lib/heroSignpost';
import { gardenDistanceFactor } from './gardenMoments';

/**
 * Where the Halloween marshmallows stand (founder request, Nov 2026): small glowing groups on the
 * grass at the back of the hill, left and right of the tree. Each group has a few candidate spots,
 * best first; on every hero size the first one that is fully on screen, not hidden behind the
 * canopy or trunk, and clear of the Pause button, the Talk to Coupon button, the phone signpost,
 * the walking deer and the other group is used. A group with no clear spot is left out.
 */
export interface Spot { x: number; z: number }

/**
 * Halloween season (founder's choice, Nov 2026): October 1 to November 15 by the visitor's own date,
 * back every October. `?halloween=1` or `?halloween=0` forces them on or off for checks.
 */
export function isHalloweenSeason(now: Date, search = ''): boolean {
  const forced = new URLSearchParams(search).get('halloween');
  if (forced === '1' || forced === '0') return forced === '1';
  const month = now.getMonth();
  return month === 9 || (month === 10 && now.getDate() <= 15);
}
export type GroupId = 'trio-a' | 'trio-b' | 'pair' | 'single';
export interface PlacedGroup { id: GroupId; at: Spot }

/** HalloweenMarshmallows draws each group at this size over the garden's scale. */
export const MM_SCALE = 1.3;
/** Drawn art around a group's anchor at the garden's scale 1 (HalloweenMarshmallows draws to these). */
const ART_BOX: Record<GroupId, Box> = {
  'trio-a': { x1: -42, y1: -46, x2: 42, y2: 3 },
  'trio-b': { x1: -44, y1: -46, x2: 44, y2: 3 },
  pair: { x1: -31, y1: -44, x2: 23, y2: 3 },
  single: { x1: -15, y1: -30, x2: 15, y2: 3 },
};
const GROUP_BOX = Object.fromEntries(Object.entries(ART_BOX).map(([k, b]) => [k, { x1: b.x1 * MM_SCALE, y1: b.y1 * MM_SCALE, x2: b.x2 * MM_SCALE, y2: b.y2 * MM_SCALE }])) as Record<GroupId, Box>;

/** Phone spots, best first (scanned over 320-430px phones: the small ones fit only the pair or one). */
const PHONE_LEFT: Spot[] = [{ x: -3.0, z: -1.4 }, { x: -3.2, z: -2.2 }, { x: -3.6, z: -2.6 }, { x: -4.4, z: -2.2 }, { x: -2.8, z: -2.6 }];
const PHONE_RIGHT: Spot[] = [{ x: 2.0, z: -1.4 }, { x: 1.6, z: -1.4 }, { x: 2.0, z: -0.6 }, { x: 1.6, z: -0.2 }, { x: 2.0, z: -2.2 }];

/** One place a group can stand: its spots, best first, and its art, biggest first. */
interface Slot { options: GroupId[]; candidates: Spot[] }

/** Laptops, tablets and landscape phones: a group of three each side of the tree. */
const WIDE: Slot[] = [
  { options: ['trio-a', 'pair'], candidates: [{ x: -5.6, z: -2.2 }, { x: -5.2, z: -1.2 }, { x: -4.8, z: -1.8 }, { x: -4.4, z: -1.0 }, { x: -4.4, z: 0.2 }, { x: -4.0, z: 1.0 }] },
  { options: ['trio-b', 'pair', 'single'], candidates: [{ x: 5.6, z: -2.6 }, { x: 5.2, z: -1.5 }, { x: 4.8, z: -2.2 }, { x: 4.4, z: -1.4 }, { x: 4.4, z: -0.2 }, { x: 4.0, z: 1.0 }] },
];
/** Phones: three (or two) on the left, one pumpkin on the right where the signpost leaves room. */
const PHONE: Slot[] = [
  { options: ['trio-a', 'pair', 'single'], candidates: PHONE_LEFT },
  { options: ['single'], candidates: PHONE_RIGHT },
];

/** Life on the hill (HillLife): where each actor stands and the area it covers, moves included. */
const DEER = { x: -8.6, z: -2.6, box: { x1: -90 - 23, y1: -42 - 17, x2: 100 + 23, y2: 4 } };
const HILL_WIDE = [
  { x: -4.3, z: 3.3, box: { x1: -21 - 28, y1: -31 - 12, x2: 21, y2: 2 } }, // rabbit hopping
  { x: -5.1, z: 3.9, box: { x1: -19, y1: -28, x2: 19, y2: 2 } }, // rabbit grazing
  { x: 3.4, z: 3.5, box: { x1: -24, y1: -27, x2: 26, y2: 2 } }, // birds
  { x: 8.2, z: -1.2, box: { x1: -26, y1: -160, x2: 140, y2: 2 } }, // kids and kite
];
const HILL_PHONE = [
  { x: -1.9, z: 3.0, box: { x1: -21 - 28, y1: -31 - 12, x2: 21, y2: 2 } },
  { x: 2.2, z: 4.1, box: { x1: -24, y1: -27, x2: 26, y2: 2 } },
];
/**
 * The canopy's half width with its coupons, and how low its leaves reach between its top and the
 * trunk's foot: 75% at the sides on phone framing (as in heroSignpost), a little lower on wider
 * framings (measured on portrait-tablet frames).
 */
const CANOPY_HALF = 3.9;
const CANOPY_LOW = { phone: 0.75, wide: 0.85 };
const TRUNK_HALF = 0.7;
const MARGIN = 6;
/** Room kept between a group and the screen's sides. */
const EDGE = 14;

type Vec = [number, number, number];
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const hit = (a: Box, b: Box) => Math.min(a.x2, b.x2) > Math.max(a.x1, b.x1) && Math.min(a.y2, b.y2) > Math.max(a.y1, b.y1);

/** A point on the grass in px from the hero's top-left, and the drei Html scale of art standing there. */
function project(width: number, height: number, phone: boolean, x: number, y: number, z: number) {
  const { position: c, forward: f, up: u, tanHalf } = heroCamera(width, height, phone);
  const rel: Vec = [x - c[0], y - c[1], z - c[2]];
  const depth = dot(rel, f);
  const focal = height / 2 / tanHalf;
  const scale = gardenDistanceFactor(height, phone) / (2 * tanHalf * Math.hypot(...rel));
  return { x: width / 2 + (rel[0] / depth) * focal, y: height / 2 - (dot(rel, u) / depth) * focal, scale };
}

function placedBox(width: number, height: number, phone: boolean, at: Spot, box: Box): Box {
  const p = project(width, height, phone, at.x, 0, at.z);
  return { x1: p.x + box.x1 * p.scale, y1: p.y + box.y1 * p.scale, x2: p.x + box.x2 * p.scale, y2: p.y + box.y2 * p.scale };
}

/**
 * Whether a group's art fits at a spot on a hero of this size, clear of `taken` (other groups'
 * boxes); returns its box when it does. `phone` is the scene's phone framing (useIsMobile); `deer`
 * is true where HillLife shows the deer (full tier, not phones).
 */
export function fitter(width: number, height: number, phone: boolean, deer: boolean) {
  const top = canopyTopPx(width, height, phone);
  const base = trunkBasePx(width, height, phone);
  const left = project(width, height, phone, -CANOPY_HALF, 0, 0).x;
  const right = project(width, height, phone, CANOPY_HALF, 0, 0).x;
  const trunkL = project(width, height, phone, -TRUNK_HALF, 0, 0).x;
  const trunkR = project(width, height, phone, TRUNK_HALF, 0, 0).x;
  const low = top + (phone ? CANOPY_LOW.phone : CANOPY_LOW.wide) * (base - top);
  const tree: Box[] = [{ x1: left, y1: top, x2: right, y2: low }, { x1: trunkL, y1: low - 4, x2: trunkR, y2: base }];
  const keepOut: Box[] = [{ x1: 10, y1: height - 62, x2: 62, y2: height - 10 }]; // Pause animations
  if (phone) {
    const sign = signpostLayout(width, height).rect;
    keepOut.push({ x1: sign.x1 - MARGIN, y1: sign.y1 - MARGIN, x2: sign.x2 + MARGIN, y2: sign.y2 + MARGIN });
  } else {
    keepOut.push({ x1: width - 196, y1: height - 70, x2: width - 8, y2: height - 8 }); // Talk to Coupon
    if (deer) keepOut.push(placedBox(width, height, phone, DEER, DEER.box));
  }
  for (const a of phone ? HILL_PHONE : HILL_WIDE) keepOut.push(placedBox(width, height, phone, a, a.box));

  return (at: Spot, id: GroupId, taken: Box[]): Box | null => {
    const b = placedBox(width, height, phone, at, GROUP_BOX[id]);
    if (b.x1 < EDGE || b.x2 > width - EDGE || b.y2 > height - MARGIN) return null;
    // Art behind the tree would be drawn over it (it is a page layer, not part of the 3D scene).
    if (at.z < 0.5 && tree.some((t) => hit(b, t))) return null;
    if (keepOut.some((k) => hit(b, k)) || taken.some((t) => hit(b, t))) return null;
    return b;
  };
}

/** The groups for a hero of this size (see fitter). A slot with no clear spot is left out. */
export function marshmallowSpots(width: number, height: number, phone: boolean, deer: boolean): PlacedGroup[] {
  if (width < 1 || height < 1) return [];
  const fits = fitter(width, height, phone, deer);
  const placed: PlacedGroup[] = [];
  const taken: Box[] = [];
  // The best spot first, with the biggest group that fits there.
  for (const slot of phone ? PHONE : WIDE) {
    let done = false;
    for (const at of slot.candidates) {
      for (const id of slot.options) {
        const b = fits(at, id, taken);
        if (!b) continue;
        placed.push({ id, at });
        taken.push(b);
        done = true;
        break;
      }
      if (done) break;
    }
  }
  return placed;
}
