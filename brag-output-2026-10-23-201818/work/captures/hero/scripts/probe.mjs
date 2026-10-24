// Probe: how much fake time does the tree need to be ready, and does the CSS timeline freeze?
import { launch, step, state, shot } from './hero-lib.mjs';
const OUT = '/home/user/supabase-kindness-collective/brag-output-2026-10-23-201818/work/captures/hero/probe';
const { browser, page, errors, url } = await launch({});
const t0 = Date.now();
await page.goto(url, { waitUntil: 'commit' });
for (let i = 0; i < 60; i++) {
  await page.waitForTimeout(i < 5 ? 1500 : 700);
  const tl = await page.evaluate(() => [document.timeline.currentTime, document.getAnimations().map(a => a.animationName || a.transitionProperty || 'waapi').join(',')]);
  await step(page, 16);
  const s = await state(page);
  console.log(i, ((Date.now() - t0) / 1000).toFixed(1) + 's', JSON.stringify({ ...s, tags: undefined }), 'timeline', tl[0], tl[1].slice(0, 120));
  if (i % 5 === 0) await shot(page, `${OUT}/p${String(i).padStart(2, '0')}.jpg`, { quality: 70 });
  if (s.treeReady && s.cls.includes('cd-fly')) break;
}
console.log(errors.slice(0, 10));
await browser.close();
