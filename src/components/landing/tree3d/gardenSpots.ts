import * as THREE from 'three';
import { signpostLayout, type Box } from '@/lib/heroSignpost';
import { gardenDistanceFactor } from './gardenMoments';

/**
 * Where the garden grows. Coupons no longer land in a ring at the trunk's feet: each falling coupon
 * is given the open spot on the visible hill that is farthest from every standing plant and every
 * coupon already in the air, so the few plants there are spread evenly over the whole plain
 * (founder request). Spots are checked against the live camera, so phones and wide screens each
 * use only the grass they can see.
 *
 * Phones (founder request, Oct 2026: nothing piling up on a small screen): a spot is used only when
 * its plant and either name tag it may carry (the dandelion's beside the head, the butterfly's
 * hanging below the bloom) stay on screen and clear of the signpost and the Pause button.
 */
export interface Spot { x: number; z: number }
/** The canvas (= hero) size, given on phones only. */
export interface Canvas { width: number; height: number }

/** Life on the hill stands here (HillLife's DESKTOP and PHONE spots); plants keep clear of it. */
export const HILL_LIFE_SPOTS: Spot[] = [
  { x: -8.6, z: -2.6 }, { x: -4.3, z: 3.3 }, { x: -5.1, z: 3.9 }, { x: 3.4, z: 3.5 }, { x: 8.2, z: -1.2 },
  { x: -1.9, z: 3.0 }, { x: 2.2, z: 4.1 },
];

const TRUNK_CLEAR = 2.2;
const DISC_EDGE = 10.6;
const MIN_GAP = 1.6;

// A jittered grid over the ground disc, fixed for the visit.
const CANDIDATES: Spot[] = (() => {
  const out: Spot[] = [];
  let i = 0;
  for (let z = -4.5; z <= 7; z += 1.25) {
    for (let x = -9.5; x <= 9.5; x += 1.25) {
      const jx = Math.sin(i * 12.9898) * 0.35;
      const jz = Math.cos(i * 78.233) * 0.35;
      i++;
      const p = { x: x + jx, z: z + jz };
      const r = Math.hypot(p.x, p.z);
      if (r < TRUNK_CLEAR || r > DISC_EDGE) continue;
      // Behind the trunk and the lower canopy a plant would be hidden.
      if (p.z < -0.6 && Math.abs(p.x) < 3.4) continue;
      if (HILL_LIFE_SPOTS.some((s) => Math.hypot(s.x - p.x, s.z - p.z) < 1.9)) continue;
      out.push(p);
    }
  }
  return out;
})();

const held = new Map<string, Spot>();
const v = new THREE.Vector3();

function visible(camera: THREE.Camera, p: Spot, phone: boolean): boolean {
  v.set(p.x, 0, p.z).project(camera);
  if (v.z > 1 || Math.abs(v.x) > 0.84 || v.y < -0.9) return false;
  // Keep clear of the round "Talk to Coupon" button in the bottom-right corner (not shown on phones).
  if (!phone && v.x > 0.5 && v.y < -0.58) return false;
  return true;
}

export interface TagPlacement {
  /** +1 when the plant stands right of the trunk, -1 when left. */
  side: 1 | -1;
  /** Which side of the plant the dandelion's tag opens. */
  tagSide: 1 | -1;
  /** Near a screen edge the butterfly's hanging tag opens inward. */
  edge: 'l' | 'r' | null;
}

/** The name tag at its drawn size before drei Html scales it: garden.css caps a phone name at 170px
 * (.gm-phone .gm-name) plus 30px padding; 9 + 24 + 3 + 15 + 10px tall. */
const TAG_W = 200;
const TAG_H = 61;
/** garden.css: the dandelion's tag starts 32px beside the head; the butterfly's hangs 35.5px below the bloom. */
const DANDELION_GAP = 32;
const HANG_TOP = 35.5;
/** The dandelion's head and the cosmos's main bloom stand about this high (world units). */
const HEAD_Y = 1.4;
const PAUSE: Box = { x1: 12, y1: -56, x2: 56, y2: -12 }; // MotionPauseButton, from the hero's bottom
const MARGIN = 6;

const hit = (a: Box, b: Box) => Math.min(a.x2, b.x2) > Math.max(a.x1, b.x1) && Math.min(a.y2, b.y2) > Math.max(a.y1, b.y1);
const grow = (b: Box, m: number): Box => ({ x1: b.x1 - m, y1: b.y1 - m, x2: b.x2 + m, y2: b.y2 + m });

function toPx(camera: THREE.Camera, canvas: Canvas, x: number, y: number, z: number) {
  v.set(x, y, z);
  const dist = v.distanceTo(camera.position);
  v.project(camera);
  return { x: (v.x + 1) / 2 * canvas.width, y: (1 - v.y) / 2 * canvas.height, dist };
}

/** Where a plant at `p` and its name tag would land on a phone, and whether all of it is clear. */
function phoneFit(camera: THREE.Camera, canvas: Canvas, p: Spot, place: TagPlacement): { clear: boolean; dandelionClear: (side: 1 | -1) => boolean; dandelionSpill: (side: 1 | -1) => number; spill: number } {
  const { width: w, height: h } = canvas;
  const ground = toPx(camera, canvas, p.x, 0, p.z);
  const head = toPx(camera, canvas, p.x, HEAD_Y, p.z);
  const fov = (camera as THREE.PerspectiveCamera).fov ?? 32;
  const s = gardenDistanceFactor(h, true) / (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2) * head.dist);
  const keepOut = [grow(signpostLayout(w, h).rect, MARGIN), grow({ ...PAUSE, y1: h + PAUSE.y1, y2: h + PAUSE.y2 }, MARGIN)];
  const ok = (b: Box) => b.x1 >= 4 && b.x2 <= w - 4 && b.y2 <= h - 4 && !keepOut.some((k) => hit(b, k));
  // How much of a box falls on the keep-outs or off the hero (used when no spot is fully clear).
  const spill = (b: Box) => {
    const area = (x1: number, y1: number, x2: number, y2: number) => Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const out = area(b.x1, b.y1, b.x2, b.y2) - area(Math.max(b.x1, 4), Math.max(b.y1, 0), Math.min(b.x2, w - 4), Math.min(b.y2, h - 4));
    return out + keepOut.reduce((sum, k) => sum + area(Math.max(b.x1, k.x1), Math.max(b.y1, k.y1), Math.min(b.x2, k.x2), Math.min(b.y2, k.y2)), 0);
  };
  const plant: Box = { x1: ground.x - 14, y1: head.y - 14, x2: ground.x + 14, y2: ground.y + 4 };
  const dandelion = (side: 1 | -1): Box => side > 0
    ? { x1: head.x + DANDELION_GAP * s, y1: head.y - (TAG_H / 2) * s, x2: head.x + (DANDELION_GAP + TAG_W) * s, y2: head.y + (TAG_H / 2) * s }
    : { x1: head.x - (DANDELION_GAP + TAG_W) * s, y1: head.y - (TAG_H / 2) * s, x2: head.x - DANDELION_GAP * s, y2: head.y + (TAG_H / 2) * s };
  const [bx1, bx2] = place.edge === 'l' ? [head.x - 18 * s, head.x + (TAG_W - 18) * s]
    : place.edge === 'r' ? [head.x - (TAG_W - 18) * s, head.x + 18 * s]
    : [head.x - (TAG_W / 2) * s, head.x + (TAG_W / 2) * s];
  const butterfly: Box = { x1: bx1, y1: head.y + HANG_TOP * s, x2: bx2, y2: head.y + (HANG_TOP + TAG_H) * s };
  const dandelionClear = (side: 1 | -1) => ok(dandelion(side));
  return {
    clear: ok(plant) && ok(butterfly) && (dandelionClear(place.tagSide) || dandelionClear(place.tagSide > 0 ? -1 : 1)),
    dandelionClear,
    dandelionSpill: (side: 1 | -1) => spill(dandelion(side)),
    spill: spill(plant) + spill(butterfly) + Math.min(spill(dandelion(1)), spill(dandelion(-1))),
  };
}

/**
 * Which way a plant's name tag opens: away from the trunk, inward near the screen's edges. On phones
 * the dandelion's tag turns to the other side when its usual side would run into the signpost or off
 * the screen.
 */
export function tagPlacement(camera: THREE.Camera, p: Spot, canvas: Canvas | null): TagPlacement {
  v.set(p.x, 0, p.z).project(camera);
  const side: 1 | -1 = p.x >= 0 ? 1 : -1;
  const edge = Math.abs(v.x) > 0.42 ? (v.x > 0 ? 'r' : 'l') : null;
  const place: TagPlacement = { side, tagSide: edge ? (edge === 'r' ? -1 : 1) : side, edge };
  if (!canvas) return place;
  const { dandelionClear, dandelionSpill } = phoneFit(camera, canvas, p, place);
  const other: 1 | -1 = place.tagSide > 0 ? -1 : 1;
  // Turn when the usual side is blocked and the other is clear (or, on a tiny screen, blocked less).
  if (!dandelionClear(place.tagSide) && (dandelionClear(other) || dandelionSpill(other) < dandelionSpill(place.tagSide))) place.tagSide = other;
  return place;
}

/**
 * The open visible spot farthest from everything already standing or falling; held under `key`.
 * `canvas` is given on phones, where a spot must also leave its plant and name tag clear.
 */
export function pickGardenSpot(camera: THREE.Camera, key: string, canvas: Canvas | null = null): Spot | null {
  held.delete(key);
  const taken = [...held.values()];
  let best: Spot | null = null;
  let bestScore = -Infinity;
  // Phones: when every clear spot is near something already standing, take the roomiest clear one
  // anyway rather than the fallback ring (which can land on the signpost).
  for (const minGap of canvas ? [MIN_GAP, 0] : [MIN_GAP]) {
    for (const c of CANDIDATES) {
      if (!visible(camera, c, !!canvas)) continue;
      if (canvas && !phoneFit(camera, canvas, c, tagPlacement(camera, c, null)).clear) continue;
      const gap = taken.length ? Math.min(...taken.map((t) => Math.hypot(t.x - c.x, t.z - c.z))) : 6;
      if (gap < minGap) continue;
      // Prefer the biggest gap; a little randomness keeps successive gifts from walking in a line.
      const score = Math.min(gap, 6) + Math.random() * 0.9;
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    if (best) break;
  }
  // A very small phone hero may have no fully clear spot: take the visible one that spills least.
  if (!best && canvas) {
    let least = Infinity;
    for (const c of CANDIDATES) {
      if (!visible(camera, c, true)) continue;
      const gap = taken.length ? Math.min(...taken.map((t) => Math.hypot(t.x - c.x, t.z - c.z))) : 6;
      const score = phoneFit(camera, canvas, c, tagPlacement(camera, c, null)).spill - Math.min(gap, 6) * 40;
      if (score < least) { least = score; best = c; }
    }
  }
  if (best) held.set(key, best);
  return best;
}

export function holdSpot(key: string, spot: Spot) {
  held.set(key, spot);
}

export function releaseSpot(key: string) {
  held.delete(key);
}
