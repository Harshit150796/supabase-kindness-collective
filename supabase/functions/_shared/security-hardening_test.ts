import { assert, assertEquals, assertFalse } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { timingSafeEqual, UUID_RE } from './auth.ts';
import { EMAIL_RE, isEmail, likeExact, whereEmail } from './email-exists.ts';
import { ipKey } from './rate-limit.ts';
import { isSiteUrl, isWebUrl } from './link-sign.ts';

const read = (path: string) => Deno.readTextFileSync(path);
const fn = (name: string) => read(`supabase/functions/${name}/index.ts`);

Deno.test('money-spending and mass-mail functions need the service key or a staff account', () => {
  for (const name of ['procure-coupons', 'send-newsletter']) {
    assert(fn(name).includes('serviceOrStaff(req, supabase)'), name);
  }
});

Deno.test('checkouts take the donor from the sign-in, not from the request body', () => {
  for (const name of ['create-donation-checkout', 'create-square-payment']) {
    const src = fn(name);
    assert(src.includes('requestUser(req,'), name);
    assertFalse(/\buserId\b[^;\n]*\}\s*=\s*(body|await req\.json\(\))/.test(src), name);
    assertFalse(src.includes('metadata.donor_id = String(userId)'), name);
  }
  // Return addresses come from an allowlist, never from a caller's Origin header as-is.
  assert(fn('create-donation-checkout').includes('returnOrigin(req)'));
  assertFalse(fn('create-donation-checkout').includes('req.headers.get("origin") ||'));
  // Card-testing limits on the on-page card form.
  const card = fn('create-square-payment');
  assert(card.includes('"card-pay-ip"') && card.includes('"card-decline-ip"') && card.includes('"card-decline-all"'));
  // Only real declines count, and a burst of them pauses guest card payments only: nobody can switch
  // card payments off for everyone by sending junk.
  assert(card.includes('if (isCardDecline(payData)) {') && card.includes('e?.category === "PAYMENT_METHOD_ERROR"'));
  assert(card.includes('if (!signedUser && (await recentCount(db, "card-decline-all", "all", HOUR)) >= 50)'));
  assertFalse(/recentCount\(db, "card-decline-all", "all", HOUR\)\) >= \d+\) return/.test(card));
  assert(card.includes('!SOURCE_RE.test(sourceId)'));
});

Deno.test('the Square webhook compares signatures in constant time and never wildcards emails', () => {
  const src = fn('square-webhook');
  assert(src.includes('timingSafeEqual(expected, signature)'));
  assertFalse(src.includes('expected === signature'));
  assertFalse(/ilike\("email", (row\.donor_email|email)\)/.test(src));
  // Guest gifts link only to an account that confirmed the same address, matched without wildcards.
  assert(src.includes('whereEmail(supabase.from("profiles").select("user_id"), "email", email)') && src.includes('data?.user?.email_confirmed_at'));
  assertFalse(src.includes('likeExact('));
  // A guest gift matched by email never puts a card on that account.
  assert(src.includes('const uid = row.user_id as string | null;'));
});

Deno.test('accounts are created on the server after the code is verified', () => {
  assert(fn('create-account').includes("eq('verified', true)") && fn('create-account').includes('email_confirm: true'));
  assert(read('supabase/config.toml').includes('[functions.create-account]'));
  const auth = read('src/hooks/useAuth.tsx');
  assert(auth.includes("supabase.functions.invoke('create-account'"));
  assertFalse(auth.includes('supabase.auth.signUp('));
  assert(read('src/components/auth/OTPVerification.tsx').includes('onVerified(code)'));
  // An unconfirmed, never-used account for the address (opened through the sign-up API by someone
  // who can't read the inbox) doesn't block the real owner: it is replaced.
  assert(fn('create-account').includes('signupBlocked(admin, email)') && fn('create-account').includes('deleteUser(existing.replaceId)'));
  assert(fn('send-otp').includes('signupBlocked(supabase, email)'));
  // The address goes on the sign-up allowlist just before the account is created (the publish-time
  // sign-up lock refuses email accounts that aren't on it).
  const ca = fn('create-account');
  assert(ca.indexOf("from('allowed_signups')") > 0 && ca.indexOf("from('allowed_signups')") < ca.indexOf('admin.auth.admin.createUser('));
  const helper = read('supabase/functions/_shared/email-exists.ts');
  assert(helper.includes('!user.email_confirmed_at && !user.last_sign_in_at'));
});

Deno.test('sign-in codes come from the cryptographic generator and addresses are lower-cased', () => {
  const send = fn('send-otp');
  assert(send.includes('crypto.getRandomValues'));
  assertFalse(send.includes('Math.random()'));
  assert(send.includes('.toLowerCase()') && send.includes('"otp-send-email"'));
  assert(send.includes('isEmail(email)'));
  // Each code gets five tries, counted under a lock before the comparison.
  assert(fn('verify-otp').includes('supabase.rpc("otp_check"'));
});

Deno.test('password reset finds every account and limits requests', () => {
  for (const name of ['send-password-reset', 'verify-password-reset']) {
    const src = fn(name);
    assert(src.includes('findAuthUserByEmail('), name);
    assertFalse(src.includes('auth.admin.listUsers();'), name);
  }
  assert(fn('send-password-reset').includes('"reset-ip"') && fn('send-password-reset').includes('"reset-email"'));
});

Deno.test('an anonymous opt-in never lifts an unsubscribe', () => {
  const src = fn('public-submit');
  assert(src.includes("if (existing || await isSuppressed(admin, email)) return json({ ok: true });"));
});

Deno.test('newsletter clicks forward only to signed links or our own site', () => {
  assert(fn('send-newsletter').includes('&k=${sigs.get(href)}'));
  const click = fn('email-track-click');
  assert(click.includes('linkSig(c, u)') && click.includes('isSiteUrl(u)'));
  // Older, unsigned emails reach outside links only when that campaign's own content has them.
  assert(click.includes('!k && UUID_RE.test(c) && (await inCampaign(supabase, c, u))') && click.includes('html.includes(`"${url}"`)'));
  assertFalse(click.includes('decodeURIComponent(u)'));
  assert(isSiteUrl('https://www.coupondonation.com/f/abc'));
  assertFalse(isSiteUrl('https://coupondonation.com.evil.example/'));
  assertFalse(isSiteUrl('http://coupondonation.com/'));
  assertFalse(isWebUrl('javascript:alert(1)'));
});

Deno.test('emails are matched exactly, and only sensible addresses are accepted', () => {
  // The database API treats * as a wildcard in like/ilike, so such an address is matched as written.
  const calls: string[] = [];
  const q = { in: (c: string, v: string[]) => { calls.push(`in ${c} ${v.join('|')}`); return q; }, ilike: (c: string, v: string) => { calls.push(`ilike ${c} ${v}`); return q; } };
  whereEmail(q, 'email', 'A*@x.com');
  whereEmail(q, 'email', 'john_doe@x.com');
  assertEquals(calls, ['in email A*@x.com|a*@x.com', 'ilike email john\\_doe@x.com']);
  for (const ok of ['a@b.co', "o'neil+tag@mail.example.org", 'first.last@sub.domain.com']) assert(isEmail(ok), ok);
  for (const bad of ['a*@gmail.com', '%@gmail.com', 'a b@x.com', '"q"@x.com', 'a@x', '.a@x.com', 'a..b@x.com']) assertFalse(EMAIL_RE.test(bad), bad);
  for (const name of ['check-email-exists', 'send-otp']) assert(fn(name).includes('isEmail('), name);
  assertFalse(fn('check-email-exists').includes('error.message'));
  const supp = read('supabase/functions/_shared/suppression.ts');
  assert(supp.includes("whereEmail(db.from('email_subscribers')") && !supp.includes(".ilike('email', e)"));
  assert(read('supabase/functions/_shared/email-exists.ts').includes('whereEmail(\n    supabaseAdmin.from("profiles")'));
});

Deno.test('request limits are taken in one locked step and IPv6 counts per /64', () => {
  const rl = read('supabase/functions/_shared/rate-limit.ts');
  assert(rl.includes('admin.rpc("rate_limit_take"'));
  assertEquals(ipKey('2001:db8:1234:5678:aaaa:bbbb:cccc:dddd'), '2001:db8:1234:5678::/64');
  assertEquals(ipKey('2001:db8:1234:5678::1'), '2001:db8:1234:5678::/64');
  assertEquals(ipKey('2001:0db8::abcd'), '2001:db8:0:0::/64');
  assertEquals(ipKey('[2001:db8:1:2::9]'), '2001:db8:1:2::/64');
  assertEquals(ipKey('::ffff:203.0.113.9'), '203.0.113.9');
  assertEquals(ipKey('203.0.113.9'), '203.0.113.9');
});

Deno.test('helpers behave', () => {
  assert(timingSafeEqual('abc', 'abc'));
  assertFalse(timingSafeEqual('abc', 'abd'));
  assertFalse(timingSafeEqual('abc', 'abcd'));
  assertEquals(likeExact('a_b%c@x.com'), 'a\\_b\\%c@x.com');
  assert(UUID_RE.test('3641b9a8-53c7-44ac-9c94-6032b9d89582'));
  assertFalse(UUID_RE.test('3641b9a8,status.eq.completed'));
});

Deno.test('the website renders campaign HTML in a sandbox and sets a baseline security policy', () => {
  const news = read('src/pages/admin/AdminNewsletters.tsx');
  assert(news.includes('sandbox=""') && !news.includes('dangerouslySetInnerHTML'));
  const html = read('index.html');
  assert(html.includes("base-uri 'self'; object-src 'none'; form-action 'self'"));
});

Deno.test('the AI chat keeps requests small and has a ceiling for everyone together', () => {
  const chat = fn('coupon-chat');
  assert(chat.includes('allMessages.slice(-20)') && chat.includes('"coupon-chat-all"'));
  assert(chat.includes('.length > 24_000') && chat.includes('stepCountIs(4)') && chat.includes('maxOutputTokens: 1024'));
});

Deno.test('anonymous opt-ins have a site-wide ceiling on new addresses', () => {
  const src = fn('public-submit');
  assert(src.indexOf("if (existing || await isSuppressed(admin, email)) return json({ ok: true });") < src.indexOf("overLimit(admin, 'consent-all', 'all', 200, HOUR)"));
});
