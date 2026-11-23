// Admin > Emails (founder request, Nov 23, 2026): click an email to see it as it went out and from which address;
// "not opened" only where opens were tracked; the one-time resend never doubles a new fundraiser's live email.
import { assert, assertEquals, assertStringIncludes } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { contentColumns, CONTENT_DAYS } from './email-log.ts';
import { renderPasswordResetEmail } from './email-layout.ts';
import { SHARE_AGAIN_BEFORE, shareAgainDue } from './account-emails.ts';
import { HIDDEN } from './email-redact.ts';

const root = new URL('../../../', import.meta.url);
const read = (path: string) => Deno.readTextFileSync(new URL(path, root));

Deno.test('a saved copy hides one-time links, keeps the reply-to, and marks plain-text emails as untracked', () => {
  const reset = renderPasswordResetEmail({ resetUrl: 'https://www.coupondonation.com/reset-password?token=SECRET', expiresInMinutes: 60 });
  const cols = contentColumns({ subject: reset.subject, html: reset.html, text: reset.text, reply_to: ['support@coupondonation.com'] }, reset.subject) as Record<string, unknown>;
  assertEquals(cols.content_state, 'saved');
  assertEquals(cols.reply_to, 'support@coupondonation.com');
  assertEquals(String(cols.content_html).includes('SECRET') || String(cols.content_text).includes('SECRET'), false);
  assertStringIncludes(String(cols.content_html), `token=${HIDDEN}`);
  assertEquals('opens_tracked' in cols, false, 'an HTML email keeps its tracking state');
  assertEquals((contentColumns({ subject: 'Your CouponDonation code', text: 'Your CouponDonation code is 123456.' }, null) as Record<string, unknown>).opens_tracked, false);
  assertEquals(contentColumns('gone', null).content_state, 'gone');
  assert(CONTENT_DAYS < 30, 'Resend keeps about 30 days');
});

Deno.test('the sync saves copies and reads the tracking switch, without ever stopping the list update', () => {
  const src = read('supabase/functions/_shared/email-log.ts');
  assertStringIncludes(src, "for (const category of ['site', 'team', 'outreach'])");
  assertStringIncludes(src, "if (tracking !== null) await db.from('email_log_sync').update({ open_tracking: tracking");
  assert(src.indexOf("console.error('email contents', e)") < src.indexOf("last_run_at: new Date().toISOString(), last_error: null"));
});

Deno.test('staff read one email through admin-contact, audited, with codes and links already hidden', () => {
  const src = read('supabase/functions/admin-contact/index.ts');
  assertStringIncludes(src, "if (action === 'email_view') {");
  assertStringIncludes(src, "action: 'email.view', table_name: 'email_log', record_id: id");
  // The whole function is staff-only before any action runs.
  assert(src.indexOf("teamRpc(req, 'is_admin_staff'") < src.indexOf("action === 'email_view'"));
  const viewer = read('src/components/admin/emails/EmailViewer.tsx');
  // The email can't run code, load trackers or follow links.
  assertStringIncludes(viewer, 'sandbox="allow-same-origin"');
  assertEquals(/allow-scripts|allow-popups|allow-top-navigation/.test(viewer), false);
  assertStringIncludes(viewer, "img-src https://coupondonation.com https://www.coupondonation.com data:");
  assertStringIncludes(viewer, 'a{pointer-events:none;cursor:default}');
  for (const words of ['From', 'Replies to', 'To', 'As sent', 'Plain text', 'Links in this email']) assertStringIncludes(viewer, words);
  assertStringIncludes(read('src/pages/admin/AdminEmails.tsx'), '<EmailViewer email={open}');
  assertStringIncludes(read('src/components/admin/FundraiserContactTab.tsx'), '<EmailViewer email={viewing}');
});

Deno.test('"not opened" only where opens were tracked, and the tracking switch is shown', () => {
  const sql = read('supabase/migrations/20261123100000_email_viewer.sql');
  assertStringIncludes(sql, "OR (_status = 'not_opened' AND e.last_event = 'delivered' AND coalesce(e.opens_tracked, false))");
  assertStringIncludes(sql, "'tracked', (SELECT count(*) FROM e WHERE last_event IN ('delivered', 'opened', 'clicked') AND coalesce(opens_tracked, false))");
  assertStringIncludes(sql, "'open_tracking', (SELECT open_tracking FROM public.email_log_sync WHERE id = 1)");
  assertStringIncludes(sql, 'GRANT EXECUTE ON FUNCTION public.admin_email_log(text, text, text, uuid, uuid, int, int, text, int) TO authenticated, service_role;');
  assertStringIncludes(sql, "your coupondonation code");
  const status = read('src/components/admin/EmailStatus.tsx');
  assertStringIncludes(status, "if (typeof row.opens_tracked === 'boolean') return row.opens_tracked;");
  assertStringIncludes(read('src/pages/admin/AdminEmails.tsx'), 'Opens aren’t being tracked right now.');
});

Deno.test('the one-time sharing resend skips fundraisers opened after it went out', () => {
  const before = { id: 'old', created_at: '2026-11-20T10:00:00Z' };
  const after = { id: 'new', created_at: '2026-11-23T05:40:00Z' };
  assertEquals(shareAgainDue([before, after], []), ['old']);
  assertEquals(SHARE_AGAIN_BEFORE, '2026-11-21T15:31:01Z');
  assertStringIncludes(read('supabase/functions/_shared/account-emails.ts'), ".lt('created_at', SHARE_AGAIN_BEFORE)");
});
