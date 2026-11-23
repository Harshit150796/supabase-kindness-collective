// Emails new applicants actually see (founder request, Nov 22, 2026): the sign-in code as two lines of plain text,
// Google sign-in on the apply form, the "Text it to 5 people now" screen with a hello to support@, and the first
// emails spaced out. Gmail tests that day: links to coupondonation.com went to Spam for people who had never
// written to us; short plain notes reached the inbox; after one email to support@, link emails did too.
import { assert, assertEquals, assertStringIncludes } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { renderOtpEmail } from './email-layout.ts';
import { liveShareMessage as fromEmails } from './account-emails.ts';
import { liveShareMessage } from './share-message.ts';
import { SAMPLE_EMAILS } from './email-catalog.ts';

const root = new URL('../../../', import.meta.url);
const read = (path: string) => Deno.readTextFileSync(new URL(path, root));

Deno.test('the code email is two lines of plain text, sent with no HTML part', () => {
  const mail = renderOtpEmail({ code: '418273', expiresInMinutes: 10 });
  assertEquals(mail.subject, 'Your CouponDonation code');
  assertEquals(mail.text, "Your CouponDonation code is 418273. It expires in 10 minutes.\n\nIf you didn't ask for it, you can ignore this email. Need help? Just reply to this email.");
  assertEquals(mail.plainText, true);
  assertEquals(/https?:|www\.|\.com|@/.test(mail.text), false, 'no links or addresses');
  // The HTML is only the Admin > Emails preview: same words, no logo, no links.
  assertEquals(/<img|href=/.test(mail.html), false);
  assertStringIncludes(mail.html, 'Your CouponDonation code is 418273.');
  assertEquals(SAMPLE_EMAILS.sign_in_code().plainText, true);
  assertStringIncludes(read('supabase/functions/send-otp/index.ts'), '...(rendered.plainText ? {} : { html: rendered.html }),');
  assertStringIncludes(read('supabase/functions/admin-contact/index.ts'), '...(mail.plainText ? {} : { html: mail.html }), text: mail.text });');
});

Deno.test('Google signs applicants in on the form, so their answers stay and the application carries on', () => {
  const apply = read('src/pages/ApplyRecipient.tsx');
  assertEquals(apply.includes('signInWithOAuth'), false, 'no redirect away from the form');
  assert(/const handleGoogleStart = \(\) => \{\s+preserveOnAuthRef\.current = true;/.test(apply));
  assertStringIncludes(apply, 'const fundraiserData = await createFundraiserForUser(googleUser.id);');
  assertStringIncludes(apply, 'onGoogleSignedIn={handleGoogleSignedIn}');
  const dialog = read('src/components/apply/AccountDialog.tsx');
  assertStringIncludes(dialog, '<GoogleSignIn onBeforeSignIn={onGoogleStart} onSignedIn={onGoogleSignedIn} />');
  // The agreement line stays right under Google's button.
  assert(dialog.indexOf('<AgreementNotice google') > dialog.indexOf('<GoogleSignIn'));
  const google = read('src/components/auth/GoogleSignIn.tsx');
  assert(google.indexOf('before.current?.()') < google.indexOf('signInWithIdToken('));
  assert(google.indexOf('after.current?.(data.user)') > google.indexOf('signInWithIdToken('));
});

Deno.test('the share screen sends the same message as the live email, and a hello to support@', () => {
  assertEquals(fromEmails, liveShareMessage, 'one message for the emails and the screen');
  const screen = read('src/components/apply/ShareScreen.tsx');
  assertStringIncludes(screen, "import { liveShareMessage } from \"../../../supabase/functions/_shared/share-message.ts\";");
  assertEquals(/^import /m.test(read('supabase/functions/_shared/share-message.ts')), false, 'no imports, so the site can bundle it');
  for (const words of ['Text it to 5 people now', 'Get gift alerts in your inbox, not Spam', 'Hi CouponDonation, please keep me posted about my fundraiser.', 'Go to my fundraiser', 'sms:?&body=', 'https://wa.me/?text=', 'navigator.share', 'mailto:${SUPPORT}', 'https://mail.google.com/mail/?view=cm&fs=1&to=', 'const SUPPORT = "support@coupondonation.com";', 'prepareShareCard(slug)']) {
    assertStringIncludes(screen, words);
  }
  assertEquals(/charity|nonprofit|tax-deductible|guarantee/i.test(screen), false);
  const apply = read('src/pages/ApplyRecipient.tsx');
  assertStringIncludes(apply, 'stores={stores.map((id) => findRetailer(id).name)}');
  assertStringIncludes(apply, 'onGoToFundraiser={handleGoToDashboard}');
});

Deno.test('the live email waits 10 minutes; the welcome skips applicants and waits an hour', () => {
  const sql = read('supabase/migrations/20261122140000_new_applicant_email_timing.sql');
  assertStringIncludes(sql, "WHERE f.status = 'active' AND f.created_at <= now() - interval '10 minutes'");
  assertStringIncludes(sql, "WHERE u.email_confirmed_at IS NOT NULL AND u.created_at <= now() - interval '1 hour'\n      AND NOT EXISTS (SELECT 1 FROM fundraisers f WHERE f.user_id = u.id)");
  assert(/ELSIF _kind = 'welcome' THEN[\s\S]+?AND NOT EXISTS \(SELECT 1 FROM fundraisers f WHERE f\.user_id = u\.id\)\) INTO ok;/.test(sql));
  // Everything else is as before, and only the server can call them.
  assertStringIncludes(sql, "(SELECT 'donation_confirmation'::text, d.id FROM donations d, account_email_state s");
  for (const fn of ['claim_account_email(text, uuid, text)', 'due_account_emails()']) {
    assertStringIncludes(sql, `REVOKE ALL ON FUNCTION public.${fn} FROM PUBLIC, anon, authenticated;`);
    assertStringIncludes(sql, `GRANT EXECUTE ON FUNCTION public.${fn} TO service_role;`);
  }
  const catalog = read('src/lib/emailCatalog.ts');
  assertStringIncludes(catalog, "when: 'About 10 minutes after a fundraiser goes live.");
  assertStringIncludes(catalog, "when: 'An hour after someone opens an account, unless they started a fundraiser");
});
