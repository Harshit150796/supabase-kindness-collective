import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { checkTeamMessage, renderTeamEmail, TEAM_INBOX_ID, toLogRows } from './team-contact.ts';

const root = new URL('../../../', import.meta.url);
const read = (path: string) => Deno.readTextFileSync(new URL(path, root));

Deno.test('Team messages: text required, subject required for email, sensible limits', () => {
  assertEquals(checkTeamMessage('  Receipts ', 'Hi Alice,\r\n\r\n\r\n\r\nPlease upload it. ', true), { ok: true, value: { subject: 'Receipts', body: 'Hi Alice,\n\nPlease upload it.' } });
  assert(checkTeamMessage('', 'Inbox only is fine', false).ok);
  assert(checkTeamMessage('', 'Email needs a subject', true).ok === false);
  assert(checkTeamMessage('x', '   ', false).ok === false);
  assert(checkTeamMessage('x', 'a'.repeat(4001), false).ok === false);
  assert(checkTeamMessage('s'.repeat(151), 'ok', true).ok === false);
});

Deno.test('Team email escapes what staff type and links to the inbox', () => {
  const m = renderTeamEmail({ subject: 'About <your> receipts', body: 'Line one\nline two\n\n<script>alert(1)</script>', name: 'Alice Organizer',
    fundraiserTitle: 'Help Alice', replyUrl: 'https://coupondonation.com/messages?c=abc' });
  assert(!m.html.includes('<script>'), 'no raw HTML from staff text');
  assert(m.html.includes('&lt;script&gt;'));
  assert(m.html.includes('Line one<br>line two'), 'single line breaks kept');
  assert(m.html.includes('Hi Alice,'));
  assert(m.html.includes('https://coupondonation.com/messages?c=abc'));
  assert(m.text.includes('Open your messages: https://coupondonation.com/messages?c=abc'));
  assert(m.text.includes('Help Alice'));
  const own = renderTeamEmail({ subject: 's', body: 'Hello Reigns!\n\nThanks for the photos.', name: 'Reigns Reagan', fundraiserTitle: 'T', replyUrl: null });
  assert(own.text.startsWith('Hello Reigns,\n\nThanks') && !own.text.includes('Hi Reigns'), 'their own greeting replaces ours');
  const noInbox = renderTeamEmail({ subject: 's', body: 'b', fundraiserTitle: 'T', replyUrl: null });
  assert(noInbox.text.startsWith('Hi there,') && !noInbox.text.includes('Open your messages'));
});

Deno.test('Resend list rows keep metadata only, first recipient, skip broken rows', () => {
  const rows = toLogRows([
    { id: 'a', to: ['x@y.org', 'z@y.org'], from: 'CouponDonation <notifications@coupondonation.com>', subject: 'Hi', last_event: 'delivered', created_at: '2026-11-03 20:17:13+00' },
    { id: 'b', to: 'solo@y.org', subject: 'Solo' },
    { id: '', to: ['n@y.org'] },
    { id: 'c', to: [] },
  ]);
  assertEquals(rows.map((r) => r.id), ['a', 'b']);
  assertEquals(rows[0].to, 'x@y.org');
  assert(!('html' in rows[0]) && !('text' in rows[0]), 'never the body');
});

Deno.test('Contact paths stay staff-only, audited and kept apart from supporter threads', () => {
  const contact = read('supabase/functions/admin-contact/index.ts');
  assert(contact.includes("teamRpc(req, 'is_admin_staff'"), 'staff only, checked as the person (team sign-in rule)');
  assert(contact.includes('overLimit('), 'rate-limited');
  assert(contact.includes("action: 'organizer.contact'"), 'audited');
  assert(contact.includes("category: 'team'"), 'team emails are logged with their text');
  assert(contact.includes(TEAM_INBOX_ID.slice(0, 8)) || contact.includes('TEAM_INBOX_ID'));
  const send = read('supabase/functions/send-message/index.ts');
  assert(send.includes("conv.kind === 'team'"), 'send-message knows team threads');
  assert(send.includes("teamThread ? !isTeam"), 'only the fundraiser team replies in a team thread');
  assert(send.includes("kind: 'team_reply'"), 'replies alert the team');
  const sql = read('supabase/functions/_shared/team-contact.ts');
  assert(sql.includes(TEAM_INBOX_ID));
  const dispatch = read('supabase/functions/admin-dispatch/index.ts');
  assert(dispatch.includes('syncEmailLog(admin, key)'), 'the email log is refreshed every run');
  assert(dispatch.includes("case 'team_reply'"), 'team replies show in the digest');
  const log = read('supabase/functions/_shared/email-log.ts');
  assertEquals(log.match(/_rows: toLogRows\(/g)?.length, 2, 'the sync only writes the metadata rows');
  assert(!log.includes('.html'), 'the sync never copies bodies');
});
