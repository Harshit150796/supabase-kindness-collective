import * as THREE from 'three';

/**
 * Where the garden grows. Coupons no longer land in a ring at the trunk's feet: each falling coupon
 * is given the open spot on the visible hill that is farthest from every standing plant and every
 * coupon already in the air, so the few plants there are spread evenly over the whole plain
 * (founder request). Spots are checked against the live camera, so phones and wide screens each
 * use only the grass they can see.
 */
export interface Spot { x: number; z: number }

/** Life on the hill stands here (HillLife's DESKTOP and PHONE spots); plants keep clear of it. */
export const HILL_LIFE_SPOTS: Spot[] = [
  { x: -8.6, z: -2.6 }, { x: -4.3, z: 3.3 }, { x: -5.1, z: 3.9 }, { x: 3.4, z: 3.5 }, { x: 8.2, z: -1.2 },
  { x: -2.3, z: 3.9 }, { x: 2.2, z: 4.1 },
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

function visible(camera: THREE.Camera, p: Spot): boolean {
  v.set(p.x, 0, p.z).project(camera);
  if (v.z > 1 || Math.abs(v.x) > 0.84 || v.y < -0.9) return false;
  // Keep clear of the round "Talk to Coupon" button in the bottom-right corner.
  if (v.x > 0.5 && v.y < -0.58) return false;
  return true;
}

/** The open visible spot farthest from everything already standing or falling; held under `key`. */
export function pickGardenSpot(camera: THREE.Camera, key: string): Spot | null {
  held.delete(key);
  const taken = [...held.values()];
  let best: Spot | null = null;
  let bestScore = -Infinity;
  for (const c of CANDIDATES) {
    if (!visible(camera, c)) continue;
    const gap = taken.length ? Math.min(...taken.map((t) => Math.hypot(t.x - c.x, t.z - c.z))) : 6;
    if (gap < MIN_GAP) continue;
    // Prefer the biggest gap; a little randomness keeps successive gifts from walking in a line.
    const score = Math.min(gap, 6) + Math.random() * 0.9;
    if (score > bestScore) {
      bestScore = score;
      best = c;
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
