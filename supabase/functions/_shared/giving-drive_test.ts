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
  // Founder-confirmed facts (Nov 6, 2026): 100 gifts of $1,000, a real gold coin for the top 5, no NY or FL.
  assert(drive.includes('gifts: { count: 100, value: 1000 }') && drive.includes('giftCards: { count: 5, value: 500 }'));
  assert(drive.includes("goldCoins: { count: 5, name: 'real gold coin' }"));
  assert(drive.includes('minGift: 10,'));
  assert(drive.includes("excludedStates: ['New York', 'Florida']"));
});

Deno.test('the drive bar is the header\'s first row, the sticker sits on Donate, and one pop-up serves both', async () => {
  const navbar = await read('src/components/layout/Navbar.tsx');
  assert(/className=\{`site-header[^>]+>\s*<DriveBar \/>/.test(navbar), 'DriveBar must be the first row inside the header');
  const hero = await read('src/components/landing/hero/HeroHeadline.tsx');
  assert(hero.includes('{DRIVE_LIVE && (') && hero.includes('className="hero-sticker"') && hero.includes('onClick={openDriveTerms}'));
  assert(hero.indexOf('hero-half-give') < hero.indexOf('hero-sticker') && hero.indexOf('hero-sticker') < hero.indexOf('hero-half-ask'));
  const bar = await read('src/components/drive/DriveBar.tsx');
  assert(bar.includes('onClick={openDriveTerms}') && bar.includes('closeDriveBar()') && bar.includes('data-nosnippet'));
  // "Real gold coin" everywhere, so nobody confuses the prize with the site's Gold Coins points.
  assert(!/win a gold coin/i.test(bar));
  // Founder's wording (Nov 6, 2026): "Donate $10 today and stand a chance to win" all three prizes, with the star.
  // He dropped the prize count ("110 chances to win"), so it stays out.
  for (const text of [
    'const MIN = driveMoney(DRIVE.minGift);',
    '<span className="drive-bar-l1"><strong>Donate {MIN} today</strong> and stand a chance to win</span>',
    'a <strong>{DRIVE.goldCoins.name}</strong>, <span className="drive-bar-a">a </span><strong>{GIFT}<span className="drive-bar-gift"> gift</span></strong> or a <strong>{CARD} gift card</strong><span className="drive-bar-when"> this holiday</span><span className="drive-star">*</span>',
    // The button's name is the words it shows, after the drive's name (label in name; Duck.Design audit, Nov 2026).
    '<span className="sr-only">{DRIVE.name}: </span>',
  ]) assert(bar.includes(text), text);
  assert(!/className="drive-bar-main"[^>]*aria-label=/.test(bar.replace(/\n\s*/g, ' ')));
  assert(!/chances to win|DRIVE_PRIZES/.test(bar));
  const app = await read('src/App.tsx');
  assertEquals(app.split('<DriveTermsHost />').length - 1, 1);
  assert(app.indexOf('<SiteMenuProvider>') < app.indexOf('<DriveTermsHost />'));
  const host = await read('src/components/drive/DriveTermsHost.tsx');
  assert(host.includes('lazy(') && host.includes('useEffect(() => { setOpen(false); }, [pathname]);'));
  // Pages that pin rows under the header count the bar.
  const css = await read('src/index.css');
  assert(css.includes(':root{--drive-bar-h:0px;--site-header-h:calc(4.5rem + var(--drive-bar-h))}'));
  // Under 850px the bar is two lines (44px); one 40px line from 850px. Its height follows the variable.
  assert(css.includes('html[data-drive-bar]{--drive-bar-h:44px}') && css.includes('@media (min-width:850px){html[data-drive-bar]{--drive-bar-h:40px}}'));
  assert(css.includes('height:var(--drive-bar-h);'));
});

Deno.test('the drive terms keep their legal shape: free entry, one entry per person, no guaranteed prize', async () => {
  const terms = await read('src/components/drive/DriveTermsDialog.tsx');
  for (const line of [
    "['No donation necessary.'",
    "giving more doesn't improve your chances of winning one",
    'One entry per person, however many times you give or email.',
    'No prize is guaranteed for any donation',
    'who are 18 or older, except residents of {excluded}. Void in {excluded} and wherever else prohibited.',
    'Open to US residents 18 and older, except in {excluded}.',
    "and a {goldCoins.name} for each of the {goldCoins.count} donors",
    '{COMPANY} pays for every prize. Nothing comes out of donations, so 100% of each gift still reaches the family. Gifts are not tax-deductible.',
    'To enter without giving, email <FreeEmail />',
    'No donation is needed to enter.',
  ]) assert(terms.includes(line), `terms lost: ${line}`);
  // Never call gifts tax-deductible or the company a charity.
  assert(!/(?<!not )tax-deductible/.test(terms.replace('Gifts are not tax-deductible', '')));
  assert(!/nonprofit|charity/i.test(terms));
});
