// "Your fundraiser is live" carries the first-gifts checklist (founder request, Nov 9, 2026).
import { assert, assertEquals, assertStringIncludes } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { liveShareMessage, renderFundraiserLive } from './account-emails.ts';

const root = new URL('../../../', import.meta.url);
const read = (path: string) => Deno.readTextFileSync(new URL(path, root));
const base = { firstName: 'Maria', title: 'Groceries for the Ortiz family', slug: 'groceries-ortiz', id: '11111111-2222-4333-8444-555555555555', stores: ['Walmart', 'Kroger', 'Aldi'], beneficiary: 'family' };

Deno.test('the live email is the three-step checklist with one-tap sharing', () => {
  const mail = renderFundraiserLive(base);
  assertEquals(mail.subject, 'Your fundraiser is live: 3 steps to your first gifts');
  // Admin > Emails still files it under fundraiser emails.
  assert(/(your fundraiser is live|update about your fundraiser)/i.test(mail.subject));
  for (const step of ['Send it to five people who know you', 'Post it in your family group chat', 'Ask your church or community group']) {
    assertStringIncludes(mail.html, step);
    assertStringIncludes(mail.text, step);
  }
  const share = 'https://share.coupondonation.com/f/groceries-ortiz';
  assertStringIncludes(mail.html, 'href="sms:?&amp;body=');
  assertStringIncludes(mail.html, 'href="https://wa.me/?text=');
  assertStringIncludes(mail.html, `href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(share)}"`);
  assertStringIncludes(mail.html, 'href="mailto:?subject=Could%20you%20share%20my%20fundraiser%3F&amp;body=');
  assertStringIncludes(mail.html, share);
  assertStringIncludes(mail.html, 'href="https://coupondonation.com/f/groceries-ortiz"');
  assertStringIncludes(mail.html, `href="https://coupondonation.com/fundraiser/${base.id}"`);
  assertStringIncludes(mail.text, 'A note for your church or group:');
  assertStringIncludes(mail.html, 'mailto:support@coupondonation.com');
  assertEquals(/SECRETCODE|card number|PIN:/i.test(mail.html + mail.text), false);
});

Deno.test('the ready-made message fits who the fundraiser is for and only names stores that were asked for', () => {
  const url = 'https://share.coupondonation.com/f/x';
  assertStringIncludes(liveShareMessage({ title: 'T', stores: ['Walmart'], beneficiary: 'yourself' }, url).chat, 'a gift card for a store I need, like Walmart, and gifts start at $10');
  assertStringIncludes(liveShareMessage({ title: 'T', stores: ['Walmart', 'Kroger', 'Aldi'], beneficiary: 'family' }, url).chat, 'a store my family needs, like Walmart or Kroger,');
  assertStringIncludes(liveShareMessage({ title: 'T', stores: [], beneficiary: 'organization' }, url).chat, 'Every gift becomes a store gift card for the people our group helps, and gifts start at $10');
  assertEquals(liveShareMessage({ title: 'T', stores: [] }, url).chat.includes(' like '), false);
  assert(liveShareMessage({ title: 'T' }, url).chat.endsWith(`\n${url}`));
});

Deno.test('titles are escaped in the email and encoded in its links', () => {
  const mail = renderFundraiserLive({ ...base, title: 'Rent & "food" <b>now</b>' });
  assertEquals(mail.html.includes('<b>now</b>'), false);
  assertStringIncludes(mail.html, 'Rent &amp; &quot;food&quot; &lt;b&gt;now&lt;/b&gt;');
  for (const href of mail.html.match(/href="[^"]*"/g) ?? []) assertEquals(/[<>]/.test(href), false, href);
});

Deno.test('the dispatcher fills the checklist from the fundraiser itself', () => {
  const src = read('supabase/functions/_shared/account-emails.ts');
  assertStringIncludes(src, "select('id, title, unique_slug, user_id, preferred_brands, beneficiary_type')");
  assertStringIncludes(src, 'stores: f.preferred_brands ?? [], beneficiary: f.beneficiary_type');
});

Deno.test('campaigns that were already live get the same checklist, worded for where they are', async () => {
  const { checklistDue, CHECKLIST_SINCE } = await import('./account-emails.ts');
  const none = renderFundraiserLive({ ...base, already: true });
  assertEquals(none.subject, 'Your fundraiser is live: 3 steps to your first gifts');
  assertStringIncludes(none.html, '“Groceries for the Ortiz family” is live on CouponDonation, and we’ve put together a short checklist');
  assertEquals(none.html.includes('approved'), false);
  const some = renderFundraiserLive({ ...base, already: true, hasGifts: true });
  assertEquals(some.subject, 'Your fundraiser is live: 3 steps to more gifts');
  assertStringIncludes(some.html, 'Three steps to more gifts');
  assertStringIncludes(some.text, 'thank the people who have given');
  assertEquals(some.html.includes('first gifts'), false);
  for (const step of ['Send it to five people who know you', 'Post it in your family group chat', 'Ask your church or community group']) assertStringIncludes(some.html, step);
  // Who gets it: once each, retried after a failure, never twice, and not those already sent the checklist at approval.
  const after = new Date(Date.parse(CHECKLIST_SINCE) + 60_000).toISOString();
  const before = new Date(Date.parse(CHECKLIST_SINCE) - 60_000).toISOString();
  const rows = [
    { kind: 'fundraiser_live', source_id: 'a', status: 'skipped', sent_at: null },
    { kind: 'fundraiser_live', source_id: 'b', status: 'sent', sent_at: before },
    { kind: 'fundraiser_live', source_id: 'c', status: 'sent', sent_at: after },
    { kind: 'fundraiser_checklist', source_id: 'd', status: 'sent', sent_at: after },
    { kind: 'fundraiser_checklist', source_id: 'e', status: 'failed', sent_at: null },
  ];
  assertEquals(checklistDue(['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({ id })), rows), ['a', 'b', 'e', 'f']);
  assertEquals(checklistDue([{ id: 'a' }, { id: 'b' }], [], CHECKLIST_SINCE, 1), ['a']);
});

Deno.test('the dispatcher sends the one-time checklist only to real, live fundraisers and skips unsubscribed people', () => {
  const src = read('supabase/functions/_shared/account-emails.ts');
  assertStringIncludes(src, ".eq('status', 'active').not('is_example', 'is', true)");
  assertStringIncludes(src, "if (await isSuppressed(admin, p.email)) return { to: p.email, mail: null, unsubscribed: true };");
  assertStringIncludes(src, "rpc('get_fundraiser_totals', { _fundraiser_id: id })");
  const dispatch = read('supabase/functions/admin-dispatch/index.ts');
  assertStringIncludes(dispatch, "processAccountEmail(admin, key, 'fundraiser_checklist', id, 'dispatcher')");
  const sql = [...Deno.readDirSync(new URL('supabase/migrations/', root))].map((e) => read(`supabase/migrations/${e.name}`)).join('\n');
  assert(/ELSIF _kind = 'fundraiser_checklist' THEN\s+SELECT EXISTS \(SELECT 1 FROM fundraisers f WHERE f\.id = _source AND f\.status = 'active' AND NOT COALESCE\(f\.is_example, false\)\)/.test(sql));
});
