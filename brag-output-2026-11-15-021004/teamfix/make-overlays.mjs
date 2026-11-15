// Render the fix overlays (transparent 1080x1920 PNGs) from overlays.html. Needs: npx vite --port 5173
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'node:fs';
fs.mkdirSync('ov', { recursive: true });
const b = await chromium.launch({ args: ['--disable-lcd-text'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto('http://127.0.0.1:5173/brag-output-2026-11-15-021004/teamfix/overlays.html', { waitUntil: 'load' });
await p.waitForFunction(() => window.ready === true);
await p.addStyleTag({ content: 'html,body{background:transparent !important}' });
for (const id of ['zeffy', 'campaigns', 'hoax', 'four', 'trail', 'end']) { await (await p.$('#' + id)).screenshot({ path: `ov/${id}.png`, omitBackground: true }); console.log(id); }
await b.close();
