import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const read = (path: string) => Deno.readTextFile(path);

Deno.test('the Holiday Giving Drive ends at 11:59 PM Eastern on January 15, 2027 and switches itself off', async () => {
  const drive = await read('src/lib/givingDrive.ts');
  const endsAt = drive.match(/endsAt: '([^']+)'/)?.[1];
  assert(endsAt, 'DRIVE.endsAt is missing');
  const eastern = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', dateStyle: 'short', timeStyle: 'medium', hourCycle: 'h23' }).format(new Date(endsAt));
  assertEquals(eastern, '1/15/27, 23:59:59');
  assert(drive.includes("endLabel: 'January 15, 2027'"));
  // After the end nothing shows; ?drive=1 / ?drive=0 force it for checks.
  assert(drive.includes('return now.getTime() <= Date.parse(DRIVE.endsAt);'));
  assert(drive.includes("if (forced === '1') return true;") && drive.includes("if (forced === '0') return false;"));
  // The free entry goes to the support inbox.
  assert(drive.includes("freeEntry: { email: LEGAL_EMAIL, subject: 'Giving Drive entry' }"));
});

Deno.test('the drive bar is the header\'s first row, the sticker sits on Donate, and one pop-up serves both', async () => {
  const navbar = await read('src/components/layout/Navbar.tsx');
  assert(/className=\{`site-header[^>]+>\s*<DriveBar \/>/.test(navbar), 'DriveBar must be the first row inside the header');
  const hero = await read('src/components/landing/hero/HeroHeadline.tsx');
  assert(hero.includes('{DRIVE_LIVE && (') && hero.includes('className="hero-sticker"') && hero.includes('onClick={openDriveTerms}'));
  assert(hero.indexOf('hero-half-give') < hero.indexOf('hero-sticker') && hero.indexOf('hero-sticker') < hero.indexOf('hero-half-ask'));
  const bar = await read('src/components/drive/DriveBar.tsx');
  assert(bar.includes('onClick={openDriveTerms}') && bar.includes('closeDriveBar()') && bar.includes('data-nosnippet'));
  const app = await read('src/App.tsx');
  assertEquals(app.split('<DriveTermsHost />').length - 1, 1);
  assert(app.indexOf('<SiteMenuProvider>') < app.indexOf('<DriveTermsHost />'));
  const host = await read('src/components/drive/DriveTermsHost.tsx');
  assert(host.includes('lazy(') && host.includes('useEffect(() => { setOpen(false); }, [pathname]);'));
  // Pages that pin rows under the header count the bar.
  const css = await read('src/index.css');
  assert(css.includes(':root{--drive-bar-h:0px;--site-header-h:calc(4.5rem + var(--drive-bar-h))}'));
  assert(css.includes('html[data-drive-bar]{--drive-bar-h:36px}'));
});

Deno.test('the drive terms keep their legal shape: free entry, one entry per person, no guaranteed prize', async () => {
  const terms = await read('src/components/drive/DriveTermsDialog.tsx');
  for (const line of [
    "['No donation necessary.'",
    "giving more doesn't improve your chances of winning one",
    'One entry per person, however many times you give or email.',
    'No prize is guaranteed for any donation',
    'Void where prohibited.',
    'who are 18 or older',
    '{COMPANY} pays for every prize. Nothing comes out of donations, so 100% of each gift still reaches the family. Gifts are not tax-deductible.',
    'To enter without giving, email <FreeEmail />',
    'No donation is needed to enter.',
  ]) assert(terms.includes(line), `terms lost: ${line}`);
  // Never call gifts tax-deductible or the company a charity.
  assert(!/(?<!not )tax-deductible/.test(terms.replace('Gifts are not tax-deductible', '')));
  assert(!/nonprofit|charity/i.test(terms));
});
