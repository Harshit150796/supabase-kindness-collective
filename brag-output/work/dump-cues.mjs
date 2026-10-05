// Export the film's cue table (window.compT) so the score follows the picture exactly.
import { chromium } from 'playwright';
import fs from 'node:fs';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const PAGE = process.env.PAGE || 'index';
await p.goto(`http://127.0.0.1:5173/brag-output/work/comic/${PAGE}.html?f=h`, { waitUntil: 'load' });
await p.waitForFunction(() => window.compT, null, { timeout: 60000 });
const cues = await p.evaluate(() => window.compT);
fs.writeFileSync(`${PAGE === 'index' ? 'comic' : PAGE}-cues.json`, JSON.stringify(cues, null, 1));
console.log('DUR', cues.DUR, 'scenes', Object.keys(cues.SC).length);
await b.close();
