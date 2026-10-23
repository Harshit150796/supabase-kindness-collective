// Captures every homepage section below the hero at 1920x1080 in the REAL state of this
// environment (all *.supabase.co requests aborted, so data-driven parts show their fallbacks).
// Writes only into the sections research folder.
import { chromium } from '/home/user/supabase-kindness-collective/brag-output/work/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const OUT = '/home/user/supabase-kindness-collective/brag-output-2026-10-23-201818/work/research/sections';
const PAGE_URL = 'http://127.0.0.1:5173/?intro=0&time3d=night';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const note = (...a) => { const s = a.join(' '); log.push(s); console.log(s); };
for (const d of ['text', 'frames/what-we-do-card-deal', 'frames/every-dollar-fill', 'frames/donation-flow-states']) fs.mkdirSync(path.join(OUT, d), { recursive: true });

const browser = await chromium.launch({ args: ['--disable-lcd-text'] });
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, userAgent: UA,
  colorScheme: 'light', reducedMotion: 'no-preference', locale: 'en-US', timezoneId: 'America/New_York',
});
await ctx.addInitScript(() => {
  try { localStorage.setItem('cd_privacy_consent', JSON.stringify({ accepted: false, choice: 'essential', at: new Date().toISOString() })); } catch {}
});
const blocked = new Set();
await ctx.route(/supabase\.co/, (route) => { blocked.add(new globalThis.URL(route.request().url()).pathname); return route.abort(); });
const page = await ctx.newPage();
const consoleLines = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consoleLines.push(`[${m.type()}] ${m.text()}`.slice(0, 300)); });
page.on('pageerror', (e) => consoleLines.push(`[pageerror] ${e.message}`.slice(0, 300)));

await page.goto(PAGE_URL, { waitUntil: 'load', timeout: 90_000 });
await sleep(4000);

async function slowScroll(step = 360, pause = 220) {
  let y = 0;
  for (let i = 0; i < 300; i++) {
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    if (y > h) break;
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await sleep(pause);
    y += step;
  }
}
await slowScroll();
note('first scroll done; waiting 45s for query retries to settle into their fallback states');
await sleep(45_000);
await slowScroll();
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(2000);

// ---- Full page reference (nav visible, as a visitor sees the top) ----
await page.addStyleTag({ content: '.cursor-trail{display:none!important}[data-sonner-toaster]{display:none!important}' });
const fullH = await page.evaluate(() => document.documentElement.scrollHeight);
await page.screenshot({ path: path.join(OUT, '00-homepage-full.png'), fullPage: true });
note('full page height', fullH);

// Hide the fixed nav for clean section frames.
await page.addStyleTag({ content: 'nav[data-site-header]{visibility:hidden!important}' });

const sections = [
  { key: '01-live-activity-bar', sel: () => document.querySelector('section[aria-labelledby="redeemable-at-heading"]') },
  { key: '02-what-we-do', sel: () => [...document.querySelectorAll('main section')].find((s) => s.querySelector('h2')?.textContent?.includes('Give what people need')) },
  { key: '03a-impact-stories', sel: () => document.querySelector('section[aria-labelledby="fundraisers-heading"]') },
  { key: '03b-completed-campaigns', sel: () => document.querySelector('section[aria-labelledby="completed-heading"]') },
  { key: '04-trust-transparency-every-dollar', sel: () => document.querySelector('section[data-every-dollar]') },
  { key: '05-track-the-money-line', sel: () => [...document.querySelectorAll('main section')].find((s) => s.textContent?.trim().startsWith("We don't track the person")) },
  { key: '06-donation-flow', sel: () => document.querySelector('#donation-flow') },
  { key: '07-security-badges', sel: () => [...document.querySelectorAll('main section')].find((s) => s.querySelector('h2')?.textContent?.includes('Security without shortcuts')) },
  { key: '08-testimonials-voices', sel: () => document.querySelector('section[data-voices]') ?? [...document.querySelectorAll('main section')].find((s) => /Gathering their words|Their stories are taking longer|Every story starts with someone/.test(s.textContent || '')) },
  { key: '09-impact-dashboard-leaderboard', sel: () => document.querySelector('section[aria-labelledby="impact-figures-heading"]') },
  { key: '10-cta', sel: () => [...document.querySelectorAll('main section[data-cursor="light"]')].pop() },
  { key: '11-footer', sel: () => document.querySelector('footer') },
];

async function rectOf(el) {
  return el.evaluate((n) => { const r = n.getBoundingClientRect(); return { top: Math.round(r.top + window.scrollY), height: Math.round(r.height), width: Math.round(r.width) }; });
}

const manifest = [];
for (const s of sections) {
  const el = (await page.evaluateHandle(s.sel)).asElement();
  if (!el) { note('NOT RENDERED', s.key); manifest.push({ key: s.key, rendered: false }); continue; }
  let box = await rectOf(el);
  // Tall sections: top-aligned. Short sections: centred in the 1080 frame.
  const target = (b) => (b.height >= 1080 ? b.top : Math.max(0, Math.round(b.top - (1080 - b.height) / 2)));
  await page.evaluate((t) => window.scrollTo(0, t), target(box));
  await sleep(2600);
  box = await rectOf(el);
  await page.evaluate((t) => window.scrollTo(0, t), target(box));
  await sleep(1600);
  await page.screenshot({ path: path.join(OUT, `${s.key}.png`) });
  await page.screenshot({ path: path.join(OUT, `${s.key}-element.png`), fullPage: true, clip: { x: 0, y: box.top, width: 1920, height: box.height } });
  const html = await el.evaluate((n) => { const c = n.cloneNode(true); c.querySelectorAll('script').forEach((x) => x.remove()); return c.outerHTML; });
  fs.writeFileSync(path.join(OUT, `${s.key}.html`), html);
  fs.writeFileSync(path.join(OUT, 'text', `${s.key}.txt`), await el.evaluate((n) => n.innerText));
  const js = await el.evaluate((n) => ({
    canvases: n.querySelectorAll('canvas').length,
    runningAnimations: (n.getAnimations ? n.getAnimations({ subtree: true }) : []).map((a) => ({ kind: a.constructor.name, name: a.animationName || '', state: a.playState, target: String(a.effect?.target?.getAttribute?.('class') ?? '').slice(0, 70) })),
    revealWrappers: n.querySelectorAll('[data-reveal]').length,
    images: [...new Set([...n.querySelectorAll('img, image')].map((i) => i.getAttribute('src') || i.getAttribute('href')).filter(Boolean))],
  }));
  manifest.push({ key: s.key, rendered: true, ...box, ...js });
  note('captured', s.key, JSON.stringify(box));
}

// ---- WhatWeDo card deal: deterministic frames by seeking the Web Animations ----
{
  const list = await page.$('ol[data-giving-steps="deal"]');
  await page.evaluate(() => window.scrollTo(0, 0)); // row below the viewport -> it re-stacks
  await sleep(1500);
  const top = await list.evaluate((n) => n.getBoundingClientRect().top + window.scrollY);
  const section = await (await page.evaluateHandle(sections[1].sel)).asElement();
  const secTop = await section.evaluate((n) => n.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((t) => window.scrollTo(0, t), Math.round(secTop));
  // wait for the deal to start, then freeze and seek
  let anims = 0;
  for (let i = 0; i < 40 && !anims; i++) { await sleep(50); anims = await list.evaluate((n) => n.getAnimations({ subtree: true }).length); }
  note('deal animations found', anims, 'list top', Math.round(top));
  if (anims) {
    await list.evaluate((n) => { window.__deal = n.getAnimations({ subtree: true }); window.__deal.forEach((a) => a.pause()); });
    const total = await list.evaluate(() => Math.max(...window.__deal.map((a) => { const t = a.effect.getComputedTiming(); return t.endTime; })));
    note('deal total ms', total);
    let f = 0;
    for (let t = 0; t <= total + 1; t += 100) {
      await list.evaluate((n, tt) => window.__deal.forEach((a) => { a.currentTime = tt; }), t);
      await sleep(60);
      await page.screenshot({ path: path.join(OUT, 'frames/what-we-do-card-deal', `deal-${String(f++).padStart(3, '0')}-${t}ms.png`) });
    }
    await list.evaluate(() => window.__deal.forEach((a) => a.play()));
    await sleep(800);
  }
}

// ---- Every dollar: the 100% fills with scroll (spring), capture a scroll sweep ----
{
  const sec = await (await page.evaluateHandle(sections[4].sel)).asElement();
  const top = await sec.evaluate((n) => n.getBoundingClientRect().top + window.scrollY);
  let f = 0;
  for (const off of [-900, -750, -600, -450, -300, -150, 0]) {
    await page.evaluate((t) => window.scrollTo(0, t), Math.round(top + off));
    await sleep(1800);
    await page.screenshot({ path: path.join(OUT, 'frames/every-dollar-fill', `fill-${f++}-offset${off}.png`) });
  }
}

// ---- Donate card states (UI only, donor-chosen sample amount; nothing is sent) ----
{
  const sec = await page.$('#donation-flow');
  const card = await page.$('[data-donate-card]');
  const shoot = async (name) => {
    const top = await sec.evaluate((n) => n.getBoundingClientRect().top + window.scrollY);
    await page.evaluate((t) => window.scrollTo(0, t), Math.round(top));
    await sleep(1400);
    await page.screenshot({ path: path.join(OUT, 'frames/donation-flow-states', `${name}.png`) });
    { const r = await card.evaluate((n) => { const b = n.getBoundingClientRect(); return { x: b.left, y: b.top + window.scrollY, width: b.width, height: b.height }; }); await page.screenshot({ path: path.join(OUT, 'frames/donation-flow-states', `${name}-card.png`), fullPage: true, clip: r }); }
    fs.writeFileSync(path.join(OUT, 'frames/donation-flow-states', `${name}.txt`), await card.evaluate((n) => n.innerText));
    fs.writeFileSync(path.join(OUT, 'frames/donation-flow-states', `${name}.html`), await card.evaluate((n) => n.outerHTML));
  };
  await shoot('step1-retailers-empty');
  await page.click('[data-retailer-tile="walmart"]');
  await page.click('[data-retailer-tile="target"]');
  await sleep(500);
  await shoot('step1-two-retailers-chosen');
  await page.click('[data-donate-continue]');
  await sleep(900);
  await shoot('step2-amount-none');
  const fifty = await page.$('#donation-flow [role="radiogroup"][aria-label="Donation amount"] >> text=$50');
  if (fifty) { await fifty.click(); await sleep(1200); await shoot('step2-amount-50-ledger-open'); }
  await page.click('[data-donate-continue]').catch(() => {});
  await sleep(1200);
  await shoot('step3-review');
}

const css = await page.evaluate(() => {
  const out = [];
  for (const sheet of document.styleSheets) {
    try { out.push(`/* ${sheet.href || sheet.ownerNode?.getAttribute?.('data-vite-dev-id') || 'inline'} */\n` + [...sheet.cssRules].map((r) => r.cssText).join('\n')); } catch { out.push(`/* unreadable ${sheet.href} */`); }
  }
  return out.join('\n\n');
});
fs.writeFileSync(path.join(OUT, 'app-styles.css'), css);
const rootInfo = await page.evaluate(() => ({ htmlAttrs: [...document.documentElement.attributes].map((a) => `${a.name}=${a.value}`), fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight} ${f.style}`) }));
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({ url: PAGE_URL, viewport: '1920x1080', state: 'real (Supabase aborted)', fullPageHeight: fullH, rootInfo, blockedSupabasePaths: [...blocked], sections: manifest }, null, 2));
fs.writeFileSync(path.join(OUT, 'console.log'), consoleLines.join('\n'));
fs.writeFileSync(path.join(OUT, 'capture.log'), log.join('\n'));
await browser.close();
note('done');
