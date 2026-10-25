/**
 * Which hanging logo the tree lets fall next. Logos facing the camera fall most (about 85% of
 * drops), side logos sometimes, back-of-tree logos never, so every name in the garden follows a
 * fall the visitor could see. The same slot never falls twice in a row, and freshly regrown
 * logos hang a while first.
 */
export interface DropSlot { x: number; z: number; hanging: boolean; hungAt: number }

export const FRONT_SHARE = 0.85;
export const MIN_HANG_SECONDS = 6;
const FRONT = 0.35;
const SIDE = -0.15;

export function facing(slot: { x: number; z: number }, camera: { x: number; z: number }): number {
  const sl = Math.hypot(slot.x, slot.z) || 1;
  const cl = Math.hypot(camera.x, camera.z) || 1;
  return (slot.x / sl) * (camera.x / cl) + (slot.z / sl) * (camera.z / cl);
}

export function pickDropSlot(
  slots: DropSlot[],
  camera: { x: number; z: number },
  last: number,
  now: number,
  rand: () => number = Math.random,
): number {
  const ready = (i: number) => slots[i].hanging && i !== last && now - slots[i].hungAt >= MIN_HANG_SECONDS;
  const scored = slots.map((s, i) => ({ i, f: facing(s, camera) })).filter(({ i }) => ready(i));
  let front = scored.filter((s) => s.f >= FRONT);
  let side = scored.filter((s) => s.f >= SIDE && s.f < FRONT);
  if (!front.length && !side.length) {
    // Everything visible just fell: allow fresh regrowths, still never the back.
    const loose = slots.map((s, i) => ({ i, f: facing(s, camera) })).filter(({ i, f }) => slots[i].hanging && i !== last && f >= SIDE);
    front = loose.filter((s) => s.f >= FRONT);
    side = loose.filter((s) => s.f < FRONT);
  }
  const pool = front.length && (!side.length || rand() < FRONT_SHARE) ? front : side;
  if (!pool.length) return -1;
  // Within the group, logos that face the camera more squarely are a little likelier.
  const weights = pool.map((s) => 0.5 + Math.max(0, s.f));
  let r = rand() * weights.reduce((a, b) => a + b, 0);
  for (let k = 0; k < pool.length; k++) { r -= weights[k]; if (r <= 0) return pool[k].i; }
  return pool[pool.length - 1].i;
}
