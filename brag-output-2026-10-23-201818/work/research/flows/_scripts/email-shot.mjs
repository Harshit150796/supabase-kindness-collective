import { open, log, OUT } from './lib.mjs';
const { browser, page } = await open();
await page.goto('file://' + OUT + '/email-1.html');
await page.waitForTimeout(1500);
const style = 'body>table>tbody>tr>td>table{margin:0 auto!important}';
await page.screenshot({ path: `${OUT}/email-1.png`, style });
await page.screenshot({ path: `${OUT}/email-1-full.png`, fullPage: true, style });
log('ok');
await browser.close();
