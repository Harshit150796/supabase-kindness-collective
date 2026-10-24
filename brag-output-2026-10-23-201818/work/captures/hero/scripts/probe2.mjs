// Timing probe: one rAF per frame; how long does a frame take?
import { launch, step, state, shot } from './hero-lib.mjs';
const OUT = '/home/user/supabase-kindness-collective/brag-output-2026-10-23-201818/work/captures/hero/probe';
const q = process.argv[2] || 'time3d=night&tier3d=high';
const { browser, page, errors, url } = await launch({ query: q });
const t0 = Date.now();
await page.goto(url, { waitUntil: 'commit' });
console.log('raf patched?', await page.evaluate(() => String(window.requestAnimationFrame).slice(0, 60)));
for (let i = 0; i < 80; i++) {
  await page.waitForTimeout(i < 4 ? 2000 : 300);
  const r = await step(page, 16);
  const s = await state(page);
  if (i % 4 === 0 || s.treeReady) console.log(i, ((Date.now() - t0) / 1000).toFixed(1) + 's', JSON.stringify({ ...s, tags: undefined }), r);
  if (s.treeReady) break;
}
for (let i = 0; i < 12; i++) {
  const a = Date.now();
  const r = await step(page);
  const b = Date.now();
  await shot(page, `${OUT}/t${String(i).padStart(2, '0')}.jpg`);
  const c = Date.now();
  const s = await state(page);
  console.log('frame', i, 'step', b - a, 'shot', c - b, r, s.t, s.cls, s.play);
}
console.log(errors.slice(0, 10));
await browser.close();
