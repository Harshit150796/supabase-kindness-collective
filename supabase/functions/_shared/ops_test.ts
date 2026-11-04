import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { renderOutsideGiftEmail } from './impact-email.ts';
import { REFRESH_DAYS } from './team-contact.ts';
import { buildLink, describeMetric, etStart, METRICS, PAGES } from './admin-ask.ts';

const root = new URL('../../../', import.meta.url);
const read = (path: string) => Deno.readTextFileSync(new URL(path, root));

Deno.test('Outside-gift follow-ups say what happened, never the code', () => {
  const got = renderOutsideGiftEmail({ kind: 'received', brand: 'Walmart', value: 10, fundraiserTitle: 'Help Feed My Family', fundraiserUrl: 'https://coupondonation.com/f/help',
    organizer: 'Reigns R.', at: '2026-11-03T22:39:08Z', firstName: 'Dana' });
  assertEquals(got.subject, 'Your gift reached the organizer');
  assert(got.text.includes('Reigns R. opened the $10 Walmart card') && got.text.includes('November 3, 2026'));
  assert(got.html.includes('never included in email'));
  const used = renderOutsideGiftEmail({ kind: 'used', brand: 'Walmart', value: 10, fundraiserTitle: 'T', fundraiserUrl: null, organizer: 'Reigns R.', at: '2026-11-04T15:00:00Z', category: 'Groceries' });
  assertEquals(used.subject, 'Your gift made an impact');
  assert(used.text.includes('went toward groceries') && !used.text.includes('See the fundraiser'));
});

Deno.test('Reminders and donor follow-ups cover company and outside coupons', () => {
  const d = read('supabase/functions/impact-dispatch/index.ts');
  assert(d.includes("rpc('coupon_fundraiser'"), 'the 7-day reminder finds outside coupons');
  assert(d.indexOf("rpc('coupon_fundraiser'") < d.indexOf("reveal_reminder_sent_at: new Date()"), 'only claimed once the fundraiser is known');
  assert(d.includes('reveal_reminder_resend_id: rid'), 'the reminder email is recorded');
  assert(d.includes("rpc('queue_outside_gift_events')") && d.includes('renderOutsideGiftEmail('), 'outside givers get follow-ups');
  assert(d.includes("from('impact_email_optouts')") && d.includes('isSuppressed(admin, email)'), 'opt-outs respected');
  assert(REFRESH_DAYS >= 14, 'opens are caught for two weeks');
});

Deno.test('AI search only picks from a fixed list and never sees records', () => {
  const f = read('supabase/functions/admin-ask/index.ts');
  assert(f.includes("rpc('is_admin_any'"), 'team only');
  assert(f.includes('overLimit('), 'rate-limited');
  assert(f.includes("rpc('admin_ask_metric'"), 'numbers come from the database, not the model');
  assert(!/admin_search|from\('(donations|profiles|fundraisers|email_log)'\)/.test(f), 'no records are read or sent to the model');
  assert(f.includes('json_schema'), 'structured output only');
});


Deno.test('Ask box: links only to known pages and filters; answers come from numbers', () => {
  assertEquals(buildLink({ page: 'fundraisers', filter: 'pending', q: null }), { label: 'Open fundraisers', url: '/admin/fundraisers?status=pending' });
  assertEquals(buildLink({ page: 'fundraisers', filter: 'hacked', q: 'maria' })?.url, '/admin/fundraisers?q=maria');
  assertEquals(buildLink({ page: 'followups', filter: 'waiting', q: null })?.url, '/admin/emails?view=followups&stage=waiting');
  assertEquals(buildLink({ page: 'email_topics', filter: 'outreach', q: null })?.url, '/admin/emails?topic=outreach&category=outreach');
  assertEquals(buildLink({ page: 'emails', filter: 'problem', q: 'gmail.com' })?.url, '/admin/emails?status=problem&q=gmail.com');
  assertEquals(buildLink({ page: 'nowhere', filter: null, q: null }), null);
  assertEquals(buildLink({ page: 'audit', filter: null, q: 'x' })?.url, '/admin/audit', 'pages without search ignore q');
  for (const [k, p] of Object.entries(PAGES)) assert(p.path.startsWith('/admin'), k);
  for (const [k, m] of Object.entries(METRICS)) assert(m.link.startsWith('/admin'), k);
  const d = describeMetric('donations', { count: 3, amount: 125.5, donors: 2, from: '2026-11-02T05:00:00Z', to: '2026-11-05T05:00:00Z' });
  assertEquals(d, '3 completed donations totaling $125.50 from 2 donors, Nov 2, 2026 – Nov 4, 2026.');
  assertEquals(describeMetric('fundraisers_now', { count: 1, by_status: { pending: 1 } }), '1 fundraiser right now: 1 pending.');
  assertEquals(etStart('2026-11-04'), '2026-11-04T05:00:00.000Z', 'EST');
  assertEquals(etStart('2026-07-04'), '2026-07-04T04:00:00.000Z', 'EDT');
  assertEquals(etStart('nope'), null);
});
