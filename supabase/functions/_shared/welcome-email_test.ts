// The welcome email, sent by the site, and the "move it to your inbox" line (founder request, Nov 22, 2026).
import { assert, assertEquals, assertStringIncludes } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { renderDonationConfirmation, renderFundraiserLive, renderWelcome, WELCOME_PARAGRAPHS } from './account-emails.ts';
import { INBOX_LINE, escapeHtml } from './email-layout.ts';
import { SAMPLE_EMAILS } from './email-catalog.ts';

const root = new URL('../../../', import.meta.url);
const read = (path: string) => Deno.readTextFileSync(new URL(path, root));

Deno.test('the welcome is the approved wording, plain, with the inbox line', () => {
  const mail = renderWelcome({ firstName: 'Maria' });
  assertEquals(mail.subject, 'Welcome to CouponDonation');
  assertStringIncludes(mail.html, 'Hi Maria,');
  assertStringIncludes(mail.text, 'Hi Maria,');
  for (const p of WELCOME_PARAGRAPHS) { assertStringIncludes(mail.html, escapeHtml(p)); assertStringIncludes(mail.text, p); }
  assertStringIncludes(WELCOME_PARAGRAPHS[1], 'donations become store gift cards and coupons for what a family needs, like groceries, travel or health costs.');
  assertStringIncludes(mail.html, escapeHtml(INBOX_LINE));
  assertStringIncludes(mail.text, INBOX_LINE);
  assertEquals((mail.html.match(/href="/g) ?? []).length, 1, 'only the support address');
  assertEquals((mail.html.match(/<img/g) ?? []).length, 1, 'the logo, once');
  assertEquals(/charity|nonprofit|tax-deductible|SECRETCODE|PIN:/i.test(mail.html + mail.text), false);
  assertStringIncludes(renderWelcome({}).html, 'Hi there,');
});

Deno.test('the live email and the donation confirmation carry the inbox line too', () => {
  const live = renderFundraiserLive({ firstName: 'Maria', title: 'Groceries', slug: 'groceries' });
  const thanks = renderDonationConfirmation({ amount: 25, at: '2026-11-22T12:00:00Z', donationId: '11111111-2222-4333-8444-555555555555', link: { label: 'Follow your donation', url: 'https://coupondonation.com/impact/x' } });
  for (const m of [live, thanks]) {
    assertStringIncludes(m.html, escapeHtml(INBOX_LINE));
    assertStringIncludes(m.text, INBOX_LINE);
  }
  // In the small footer, before the support line.
  assert(thanks.html.indexOf(escapeHtml(INBOX_LINE)) < thanks.html.indexOf('Questions or concerns?'));
});

Deno.test('the site sends the welcome once per new account, with a switch in Admin > Emails', () => {
  assert(SAMPLE_EMAILS.welcome, 'a sample for the preview');
  assertStringIncludes(read('src/lib/emailCatalog.ts'), "sample: 'welcome', name: 'Welcome'");
  assertStringIncludes(read('src/lib/emailCatalog.ts'), "switchKey: 'welcome', countKey: 'welcome'");
  assertStringIncludes(read('supabase/functions/admin-contact/index.ts'), "'organizer_quiet', 'welcome'];");
  const src = read('supabase/functions/_shared/account-emails.ts');
  assertStringIncludes(src, "kind === 'welcome' ? await buildWelcome(admin, id)");
  assertStringIncludes(src, 'if (await isSuppressed(admin, p.email)) return { to: p.email, mail: null, unsubscribed: true };\n  return { to: p.email, mail: renderWelcome(');
  const sql = read('supabase/migrations/20261122090000_welcome_email.sql');
  assertStringIncludes(sql, "INSERT INTO public.email_automations (key) VALUES ('welcome')");
  assert(/ELSIF _kind = 'welcome' THEN\s+SELECT EXISTS \(SELECT 1 FROM auth\.users u JOIN email_automations a ON a\.key = _kind AND a\.enabled AND u\.created_at >= a\.enabled_at\s+WHERE u\.id = _source AND u\.email_confirmed_at IS NOT NULL\)/.test(sql));
  assertStringIncludes(sql, "(SELECT 'welcome'::text, u.id FROM auth.users u");
  assertStringIncludes(sql, "AND NOT EXISTS (SELECT 1 FROM account_emails e WHERE e.kind = 'welcome' AND e.source_id = u.id AND e.status <> 'failed')");
  // Admin > Emails files the subject under account emails.
  assertStringIncludes(read('supabase/migrations/20261116062153_27c793e6-a741-4e6e-a9cb-6b8d0de25638.sql'), 'welcome to coupondonation)');
});
