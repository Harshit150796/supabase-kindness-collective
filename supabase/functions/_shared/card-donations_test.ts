import { assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const root = new URL('../../../', import.meta.url);
const read = (path: string) => Deno.readTextFileSync(new URL(path, root));
Deno.test('Donate a card has its page, admin queue and links, including the homepage and the menu', () => {
  const app = read('src/App.tsx');
  assert(app.includes('path="/donate-a-card"'));
  assert(app.includes("'/admin/card-donations'"));
  assert(read('src/pages/admin/adminPages.ts').includes("'/admin/card-donations'"));
  assert(read('src/components/layout/Footer.tsx').includes('to="/donate-a-card"'));
  // The donate section (homepage and /donate) and the site menu both offer it (founder request).
  assert(read('src/components/landing/DonationFlow.tsx').includes('<DonateCardPromo />'));
  assert(read('src/components/landing/donate/DonateCardPromo.tsx').includes('to="/donate-a-card"'));
  assert(read('src/components/navigation/siteLinks.ts').includes("to: '/donate-a-card'"));
  assert(read('src/components/fundraiser/campaign/RequestedHelp.tsx').includes('/donate-a-card?fundraiser='));
  assert(read('public/sitemap.xml').includes('https://coupondonation.com/donate-a-card'));
});

Deno.test('cards go through the checked flow: digital only, confirmed, never codes in the browser', () => {
  const page = read('src/pages/DonateCard.tsx');
  assert(page.includes("rpc('submit_card_donation'"));
  assert(page.includes('data-card-confirm') && page.includes('<AgreementNotice'));
  assert(page.includes('Physical cards and paper coupons'));
  assert(page.includes('reportfraud.ftc.gov'));
  assert(!/from\('card_donation_secrets'\)/.test(page));
  const admin = read('src/pages/admin/AdminCardDonations.tsx');
  assert(admin.includes("rpc<Secret>('admin_card_donation_secret'") && admin.includes("rpc('admin_review_card_donation'"));
  assert(read('src/pages/Terms.tsx').includes("id: 'donated-cards'"));
  assert(read('src/pages/Privacy.tsx').includes('If you donate a card'));
});

Deno.test('anyone can donate a card without an account, and anonymously (founder request, Nov 2026)', () => {
  const page = read('src/pages/DonateCard.tsx');
  // No sign-in wall: the form shows for guests too, with an anonymous choice and optional name and email.
  assert(!page.includes('Sign in to donate a card'));
  assert(page.includes('<CardForm userId={user?.id ?? null}'));
  assert(page.includes('data-card-anonymous') && page.includes('Give anonymously') && page.includes('Your email (optional)'));
  assert(page.includes("callFn('public-submit', {\n          action: 'card'") && page.includes("action: 'card_photo'"));
  // Guests go through public-submit, with a honeypot, fill time and limits per network, per email and site-wide.
  const fn = read('supabase/functions/public-submit/index.ts');
  for (const s of ["action: z.literal('card')", "overLimit(admin, 'card-ip'", "overLimit(admin, 'card-email'", "overLimit(admin, 'card-guests', 'all'",
    "createSignedUploadUrl(path)", "rpc('_card_donation_insert'", '_uid: null']) assert(fn.includes(s), s);
  // One insert for both paths, closed to browsers; guests' screenshots only in guest/.
  const sql = Deno.readDirSync(new URL('supabase/migrations/', root));
  const all = [...sql].map((e) => read(`supabase/migrations/${e.name}`)).join('\n');
  assert(/revoke all on function public\._card_donation_insert\([^)]*\) from public, anon, authenticated/.test(all));
  assert(all.includes("coalesce(_uid::text, 'guest') || '/%'"));
  assert(read('src/pages/Privacy.tsx').includes('Without an account, also the name and email you choose to give'));
});
