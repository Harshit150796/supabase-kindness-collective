// The team can read every email the site sent, but never a sign-in code or a one-time link (Nov 23, 2026).
import { assert, assertEquals, assertStringIncludes } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { HIDDEN, redactEmail, redactUrl } from './email-redact.ts';
import { renderOtpEmail, renderPasswordResetEmail } from './email-layout.ts';
import { renderFundraiserLive } from './account-emails.ts';

Deno.test('one-time and private links lose their keys; page links stay as they are', () => {
  assertEquals(redactUrl('https://www.coupondonation.com/reset-password?token=abc123def456').url, `https://www.coupondonation.com/reset-password?token=${HIDDEN}`);
  assertEquals(redactUrl('https://coupondonation.com/team/accept?token=Zm9v').url, `https://coupondonation.com/team/accept?token=${HIDDEN}`);
  assertEquals(redactUrl('https://coupondonation.com/unsubscribe?c=8f2a1b').url, `https://coupondonation.com/unsubscribe?c=${HIDDEN}`);
  assertEquals(redactUrl('https://coupondonation.com/impact/q9X2kL0pZ7vW3rT8').url, `https://coupondonation.com/impact/${HIDDEN}`);
  assertEquals(redactUrl('https://coupondonation.com/impact/q9X2kL0pZ7vW3rT8#thanks').url, `https://coupondonation.com/impact/${HIDDEN}#thanks`);
  assertEquals(redactUrl('https://x.supabase.co/functions/v1/impact-actions?stop=1&amp;k=secret').url, `https://x.supabase.co/functions/v1/impact-actions?stop=${HIDDEN}&amp;k=${HIDDEN}`);
  for (const safe of ['https://share.coupondonation.com/f/groceries-for-the-ortiz-family-7k2m', 'https://coupondonation.com/fundraiser/7c1e2d4a-5b6f-4a8e-9c0d-1e2f3a4b5c6d?share=true', 'https://www.coupondonation.com/apply', 'https://coupondonation.com/impact/sample']) {
    assertEquals(redactUrl(safe), { url: safe, hidden: false });
  }
});

Deno.test('the sign-in code email shows its words, never the code', () => {
  const mail = renderOtpEmail({ code: '418273', expiresInMinutes: 10 });
  const r = redactEmail({ subject: mail.subject, html: mail.html, text: mail.text });
  assert(r.hidden);
  for (const part of [r.html ?? '', r.text ?? '']) {
    assertEquals(part.includes('418273'), false);
    assertStringIncludes(part, '••••••');
  }
  // Other numbers in other emails are untouched.
  assertStringIncludes(redactEmail({ subject: 'Your first week', text: 'You are at $250 of 500000.' }).text!, '500000');
});

Deno.test('a password reset shows where the button goes, without the key', () => {
  const mail = renderPasswordResetEmail({ resetUrl: 'https://www.coupondonation.com/reset-password?token=REALTOKEN123', expiresInMinutes: 60 });
  const r = redactEmail({ subject: mail.subject, html: mail.html, text: mail.text });
  assert(r.hidden);
  assertEquals((r.html! + r.text!).includes('REALTOKEN123'), false);
  assert(r.links.includes(`https://www.coupondonation.com/reset-password?token=${HIDDEN}`));
});

Deno.test('an ordinary email comes through unchanged, with its links listed', () => {
  const mail = renderFundraiserLive({ firstName: 'Maria', title: 'Groceries', slug: 'groceries', stores: ['Walmart'] });
  const r = redactEmail({ subject: mail.subject, html: mail.html, text: mail.text });
  assertEquals(r.hidden, false);
  assertEquals(r.html, mail.html);
  assertEquals(r.text, mail.text);
  assert(r.links.some((l) => l.includes('/f/groceries')));
});
