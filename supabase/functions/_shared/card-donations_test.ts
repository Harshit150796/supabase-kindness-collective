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
  assert(read('src/components/landing/DonationFlow.tsx').includes('to="/donate-a-card"'));
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
