// Emails that help organizers market their own fundraiser (founder request, Nov 15, 2026).
import { assert, assertEquals, assertStringIncludes } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { organizerDue, renderOrganizerGift, renderOrganizerGoal, renderOrganizerHalfway, renderOrganizerNudge, renderOrganizerQuiet, renderOrganizerWeek, ORGANIZER_KINDS, type OrgMail, type Switches } from './organizer-emails.ts';
import { SAMPLE_EMAILS } from './email-catalog.ts';

const root = new URL('../../../', import.meta.url);
const read = (path: string) => Deno.readTextFileSync(new URL(path, root));
const DAY = 86_400_000;
const NOW = Date.parse('2026-12-01T12:00:00Z');
const ago = (days: number) => new Date(NOW - days * DAY).toISOString();
const allOn = (since = ago(60)): Switches => Object.fromEntries(ORGANIZER_KINDS.map((k) => [k, { enabled: true, enabled_at: since }]));
const f = (id: string, days: number, goal = 500, status = 'active') => ({ id, created_at: ago(days), status, goal });
const gift = (id: string, fid: string, amount: number, days: number) => ({ id, fundraiser_id: fid, amount, created_at: ago(days) });
const kinds = (list: { kind: string; source_id: string }[]) => list.map((d) => `${d.kind}:${d.source_id}`);
const base = { firstName: 'Maria', title: 'Groceries for our family', slug: 'groceries', id: '11111111-2222-4333-8444-555555555555', stores: ['Walmart'], beneficiary: 'family' };

Deno.test('a gift email goes out at once for the first gift, then at most once a day, covering every gift since', () => {
  const first = organizerDue(NOW, [f('a', 1)], [gift('g1', 'a', 25, 0.01)], [], allOn());
  assertEquals(first, [{ kind: 'organizer_gift', source_id: 'g1', fundraiser_id: 'a', count: 1, amount: 25, first: true }]);
  // One hour after that email, two more gifts wait; a day later one email covers both.
  const sent: OrgMail[] = [{ kind: 'organizer_gift', source_id: 'g1', status: 'sent', sent_at: ago(0.04), claimed_at: ago(0.04) }];
  const gifts = [gift('g1', 'a', 25, 0.05), gift('g2', 'a', 40, 0.03), gift('g3', 'a', 10, 0.02)];
  assertEquals(organizerDue(NOW, [f('a', 1)], gifts, sent, allOn()), []);
  const later = organizerDue(NOW + DAY, [f('a', 1)], gifts, sent, allOn());
  assertEquals(later, [{ kind: 'organizer_gift', source_id: 'g3', fundraiser_id: 'a', count: 2, amount: 50, first: false }]);
  // Gifts from before the switch was turned on are never emailed late.
  assertEquals(organizerDue(NOW, [f('a', 30)], [gift('old', 'a', 25, 20)], [], allOn(ago(1))), []);
});

Deno.test('tips come one at a time, at the right age, and never for what happened before the switch', () => {
  assertEquals(kinds(organizerDue(NOW, [f('a', 3)], [], [], allOn())), ['organizer_nudge:a']);
  assertEquals(organizerDue(NOW, [f('a', 1)], [], [], allOn()), [], 'too early');
  assertEquals(organizerDue(NOW, [f('a', 3)], [gift('g', 'a', 25, 2.5)], [{ kind: 'organizer_gift', source_id: 'g', status: 'sent', sent_at: ago(2.5), claimed_at: ago(2.5) }], allOn()), [], 'it has a gift');
  assertEquals(kinds(organizerDue(NOW, [f('a', 8)], [], [{ kind: 'organizer_nudge', source_id: 'a', status: 'sent', sent_at: ago(6), claimed_at: ago(6) }], allOn())), ['organizer_week:a']);
  assertEquals(organizerDue(NOW, [f('a', 8)], [], [{ kind: 'organizer_nudge', source_id: 'a', status: 'sent', sent_at: ago(1), claimed_at: ago(1) }], allOn()), [], 'a tip went out a day ago');
  assertEquals(kinds(organizerDue(NOW, [f('a', 30)], [], [], allOn())), ['organizer_quiet:a']);
  assertEquals(organizerDue(NOW, [f('a', 30)], [], [], allOn(ago(1))), [], 'it went quiet before the switch was on');
  assertEquals(organizerDue(NOW, [f('a', 3, 500, 'paused')], [], [], allOn()), [], 'paused fundraisers get no tips');
  // A failed send is retried; a sent or skipped one is not.
  assertEquals(kinds(organizerDue(NOW, [f('a', 3)], [], [{ kind: 'organizer_nudge', source_id: 'a', status: 'failed', sent_at: null, claimed_at: ago(0.5) }], allOn())), ['organizer_nudge:a']);
  assertEquals(organizerDue(NOW, [f('a', 3)], [], [{ kind: 'organizer_nudge', source_id: 'a', status: 'skipped', sent_at: null, claimed_at: ago(0.5) }], allOn()), []);
});

Deno.test('halfway and goal are sent once each, and a switch that is off sends nothing', () => {
  const covered: OrgMail[] = [{ kind: 'organizer_gift', source_id: 'g', status: 'sent', sent_at: ago(0.1), claimed_at: ago(0.1) }];
  assertEquals(kinds(organizerDue(NOW, [f('a', 5)], [gift('g', 'a', 250, 0.2)], covered, allOn())), ['organizer_halfway:a']);
  assertEquals(kinds(organizerDue(NOW, [f('a', 5)], [gift('g', 'a', 500, 0.2)], covered, allOn())), ['organizer_goal:a']);
  assertEquals(organizerDue(NOW, [f('a', 5)], [gift('g', 'a', 500, 0.2)], [...covered, { kind: 'organizer_goal', source_id: 'a', status: 'sent', sent_at: ago(0.1), claimed_at: ago(0.1) }], allOn()), []);
  assertEquals(organizerDue(NOW, [f('a', 5, 0)], [gift('g', 'a', 500, 0.2)], covered, allOn()), [], 'no goal, no milestones');
  const off: Switches = { ...allOn(), organizer_halfway: { enabled: false, enabled_at: ago(60) } };
  assertEquals(organizerDue(NOW, [f('a', 5)], [gift('g', 'a', 250, 0.2)], covered, off), []);
  assertEquals(organizerDue(NOW, [f('a', 3)], [], [], {}), []);
});

Deno.test('organizer emails never name a donor, keep amounts and stores out of the subject, and carry a ready message', () => {
  const numbers = { raised: 115, goal: 500, givers: 3 };
  const mails = [
    renderOrganizerGift({ ...base, ...numbers, amount: 25, count: 1, first: true }),
    renderOrganizerGift({ ...base, ...numbers, amount: 90, count: 3, first: false }),
    renderOrganizerNudge({ ...base, stopUrl: 'https://coupondonation.com/unsubscribe?c=x' }),
    renderOrganizerWeek({ ...base, ...numbers }), renderOrganizerWeek({ ...base, raised: 0, goal: 500, givers: 0 }),
    renderOrganizerHalfway({ ...base, raised: 250, goal: 500, givers: 6 }), renderOrganizerGoal({ ...base, raised: 500, goal: 500, givers: 11 }), renderOrganizerQuiet(base),
  ];
  for (const m of mails) {
    assertEquals(/\$|walmart|gift card|coupon|free|!|\p{Extended_Pictographic}/iu.test(m.subject), false, m.subject);
    assertStringIncludes(m.html, 'Hi Maria,');
    assertStringIncludes(m.html, 'mailto:support@coupondonation.com');
    assertEquals(/SECRETCODE|card number|PIN:/i.test(m.html + m.text), false);
    assertEquals(/<style|display:flex|display:grid/i.test(m.html), false);
  }
  assertEquals(mails[0].subject, 'Your first gift just came in');
  assertStringIncludes(mails[0].text, 'A donor just gave $25 to “Groceries for our family”.');
  assertEquals(mails[1].subject, '3 new gifts came in');
  assertStringIncludes(mails[1].text, 'Will you be next?\nhttps://share.coupondonation.com/f/groceries');
  assertStringIncludes(mails[2].html, 'href="sms:?&amp;body=');
  assertStringIncludes(mails[2].html, 'Stop these tips');
  assertEquals(mails[0].html.includes('Stop these tips'), false, 'news about a gift has no stop link');
  assertEquals(mails[3].subject, 'Your first week: 3 people have given');
  assertEquals(mails[4].subject, 'Your first week, and one new thing to try');
  assertStringIncludes(mails[5].text, '$250 more gets us to the goal');
  assertStringIncludes(mails[6].text, 'reached its goal: $500 from 11 people');
});

Deno.test('the dispatcher sends them, each has a switch, and every automatic email has a sample for Admin > Emails', () => {
  const dispatch = read('supabase/functions/admin-dispatch/index.ts');
  assertStringIncludes(dispatch, 'dueOrganizerEmails(admin)');
  const src = read('supabase/functions/_shared/organizer-emails.ts');
  assertStringIncludes(src, "rpc('claim_account_email'");
  assertStringIncludes(src, "from('email_automations')");
  assertStringIncludes(src, 'isSuppressed(admin, p.email)');
  for (const k of ORGANIZER_KINDS) assert(SAMPLE_EMAILS[k], `sample for ${k}`);
  for (const [key, make] of Object.entries(SAMPLE_EMAILS)) {
    const m = make();
    assert(m.subject && m.html.includes('role="presentation"') && m.text, key);
    // The contact receipt asks people to leave card numbers out, so it names them.
    if (key !== 'contact_receipt') assertEquals(/SECRETCODE|card number|PIN:/i.test(m.html + m.text), false, key);
  }
  const contact = read('supabase/functions/admin-contact/index.ts');
  for (const action of ["'automations'", "'set_automation'", "'preview'", "'test'"]) assertStringIncludes(contact, `action === ${action}`);
  assertStringIncludes(contact, "teamRpc(req, 'is_admin_staff'");
});
