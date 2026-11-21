// Export the composition's picture cues (lines, plates, taps, numerals...) for the score.   CUT=full|short node dump-cues.mjs
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const CUT = process.env.CUT || 'main';
const ORIGIN = process.env.ORIGIN || 'http://127.0.0.1:5173';
const here = path.dirname(fileURLToPath(import.meta.url));
const rel = path.relative('/home/user/supabase-kindness-collective', here);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.route(/supabase\.co/, (r) => r.abort());
await page.goto(`${ORIGIN}/${rel}/composition/index.html?cut=${CUT}`, { waitUntil: 'load' });
await page.waitForFunction(() => window.compReady || window.compError, null, { timeout: 120000 });
const err = await page.evaluate(() => window.compError);
if (err) { console.log('compError', err); process.exit(1); }
const T = await page.evaluate(() => window.compT);
fs.writeFileSync(`cues-${CUT}.json`, JSON.stringify(T, null, 1));
console.log(`cues-${CUT}.json`, T.dur, 'plates', T.plates.length, 'lines', T.lines.length, 'cues', T.cues.length);
await browser.close();
