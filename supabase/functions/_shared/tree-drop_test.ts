import { assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { facing, pickDropSlot, type DropSlot } from '../../../src/components/landing/tree3d/dropChoice.ts';

const camera = { x: 0, z: 15 };
const slots: DropSlot[] = Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * Math.PI * 2;
  return { x: Math.sin(a) * 2, z: Math.cos(a) * 2, hanging: true, hungAt: -100 };
});
let seed = 7;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x100000000);

Deno.test('the timer never drops a logo from the back of the tree', () => {
  for (let n = 0; n < 1000; n++) {
    const i = pickDropSlot(slots, camera, -1, 0, rand);
    assert(facing(slots[i], camera) >= -0.15);
  }
});

Deno.test('the same spot never falls twice in a row', () => {
  let last = -1;
  for (let n = 0; n < 1000; n++) {
    const i = pickDropSlot(slots, camera, last, 0, rand);
    assert(i !== last);
    last = i;
  }
});

Deno.test('at least 80% of drops come from the logos facing the visitor', () => {
  let front = 0;
  for (let n = 0; n < 1000; n++) if (facing(slots[pickDropSlot(slots, camera, -1, 0, rand)], camera) >= 0.35) front++;
  assert(front >= 800, String(front));
});

Deno.test('a freshly regrown logo is not dropped while others can fall', () => {
  const fresh = slots.map((s, i) => ({ ...s, hungAt: i === 0 ? 0 : -100 }));
  for (let n = 0; n < 300; n++) assert(pickDropSlot(fresh, camera, -1, 2, rand) !== 0);
});
