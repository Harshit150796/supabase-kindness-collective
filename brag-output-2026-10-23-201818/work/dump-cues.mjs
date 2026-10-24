// Export the film's cue table (window.compT) so the score follows the picture exactly.
import { chromium } from '/home/user/supabase-kindness-collective/brag-output/work/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.route(/supabase\.co/, (r) => r.abort());
await p.goto(`${process.env.ORIGIN || 'http://127.0.0.1:5173'}/brag-output-2026-10-23-201818/work/composition/index.html`, { waitUntil: 'load' });
await p.waitForFunction(() => window.compT, null, { timeout: 60000 });
const cues = await p.evaluate(() => window.compT);
fs.writeFileSync(new URL('./cues.json', import.meta.url), JSON.stringify(cues, null, 1));
console.log('DUR', cues.DUR, 'scenes', Object.keys(cues.SC).length);
await b.close();
