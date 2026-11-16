// Replies in the admin portal (founder request, Nov 16, 2026).
import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { htmlToText, INBOX_ADDRESS, toInboxRow, wanted } from './email-inbox.ts';

const root = new URL('../../../', import.meta.url);
const read = (path: string) => Deno.readTextFileSync(new URL(path, root));

Deno.test('a reply is stored as capped plain text with who sent it', () => {
  const row = toInboxRow({ id: 'r1', from: 'Maria Gomez <Maria@Example.com>', to: [INBOX_ADDRESS, 'support@coupondonation.com'], subject: ' Re:  You’re live ', text: 'Thank you!\r\nI shared it.', created_at: '2026-11-16T12:00:00Z' })!;
  assertEquals(row.from_email, 'maria@example.com');
  assertEquals(row.from_name, 'Maria Gomez');
  assertEquals(row.to_email, 'support@coupondonation.com');
  assertEquals(row.subject, 'Re: You’re live');
  assertEquals(row.body, 'Thank you!\nI shared it.');
  const html = toInboxRow({ id: 'r2', from: 'a@b.org', to: INBOX_ADDRESS, html: '<style>p{}</style><p>Hello &amp; thanks</p><script>alert(1)</script><div>Bye</div>' })!;
  assertEquals(html.body, 'Hello & thanks\n\nBye'.replace('\n\n', '\n'));
  assertEquals(html.from_name, null);
  assertEquals(toInboxRow({ id: 'r3', from: 'a@b.org', to: INBOX_ADDRESS, text: 'x'.repeat(50_000) })!.body.length, 20_000);
});

Deno.test('opt-outs, bounce notices and our own mail stay out of the inbox', () => {
  assertEquals(wanted({ id: '1', from: 'a@church.org', to: 'unsubscribe@outreach.coupondonation.com' }), false);
  assertEquals(wanted({ id: '2', from: 'MAILER-DAEMON@mx.google.com', to: INBOX_ADDRESS }), false);
  assertEquals(wanted({ id: '3', from: 'CouponDonation <notifications@coupondonation.com>', to: INBOX_ADDRESS }), false);
  assertEquals(wanted({ id: '4', from: 'hello@outreach.coupondonation.com', to: INBOX_ADDRESS }), false);
  assertEquals(wanted({ from: 'a@b.org', to: INBOX_ADDRESS }), false);
  assertEquals(wanted({ id: '5', from: 'a@b.org', to: INBOX_ADDRESS }), true);
  assertEquals(htmlToText('a<br>b'), 'a\nb');
});

Deno.test('the dispatcher copies replies, only staff can read them, and the body is never rendered as HTML', () => {
  assert(read('supabase/functions/admin-dispatch/index.ts').includes('syncInbox(admin, key)'));
  const contact = read('supabase/functions/admin-contact/index.ts');
  for (const action of ["'inbox'", "'inbox_set'"]) assert(contact.includes(`action === ${action}`));
  assert(contact.indexOf("teamRpc(req, 'is_admin_staff'") < contact.indexOf("action === 'inbox'"));
  const ui = read('src/components/admin/emails/EmailInbox.tsx');
  assertEquals(ui.includes('dangerouslySetInnerHTML'), false);
});
