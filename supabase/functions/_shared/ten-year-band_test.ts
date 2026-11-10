import { assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';

// Founder's pick (Nov 10, 2026): "F. Ten-year bezel" replaces the receipt band and the two links under
// "Give what people need." (src/components/landing/TenYearBand.tsx).
const read = (path: string) => Deno.readTextFileSync(path);

Deno.test('the ten-year band follows the steps, and the receipt card, the two links and the cue are gone', () => {
  const what = read('src/components/landing/WhatWeDo.tsx');
  assert(what.includes('<TenYearBand still={still} />'));
  for (const gone of ['ProofReceipt', 'I want to help someone', 'I need help', 'Real people are asking', 'DonateDoorIcon']) {
    assert(!what.includes(gone), `${gone} should be gone`);
  }
});

Deno.test('the years come from the visitor clock, never a fixed year', () => {
  const band = read('src/components/landing/TenYearBand.tsx');
  assert(band.includes('const from = new Date().getFullYear();') && band.includes('const to = from + 10;'));
  assert(band.includes('Give $10 today. Check where it went in {to}.'));
  assert(!/20[2-9]\d/.test(band.replace(/Nov \d+, 2026/g, '')), 'no hard-coded year');
});

Deno.test('the line draws once with a transform, and Pause animations shows it drawn', () => {
  const band = read('src/components/landing/TenYearBand.tsx');
  assert(band.includes("transform: drawn ? 'scaleX(1)' : 'scaleX(0)'"));
  assert(band.includes("transition: still ? 'none'"));
  assert(band.includes('const drawn = still || seen;'));
  assert(band.includes('observer.disconnect()'));
});
