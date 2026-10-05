import { chromium } from 'playwright';
for (const args of [[], ['--use-angle=swiftshader','--enable-unsafe-swiftshader'], ['--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']]) {
  const b = await chromium.launch({ args });
  const p = await b.newPage();
  const r = await p.evaluate(() => { const c = document.createElement('canvas'); const g = c.getContext('webgl2') || c.getContext('webgl'); if (!g) return 'none'; const d = g.getExtension('WEBGL_debug_renderer_info'); return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'gl ok'; });
  console.log(JSON.stringify(args), r);
  await b.close();
}
