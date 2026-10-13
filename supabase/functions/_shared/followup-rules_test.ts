import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { decide, matchPersona, shouldRun } from './followup-rules.ts';

const now = new Date('2026-10-13T12:00:00Z');
const ok = { consent_status: 'opted_in', opted_out_at: null, last_emailed_at: null };

Deno.test('nothing sends while live sending is off', () => {
  assertEquals(decide({ live: false, consent: ok, alreadySent: false, now }), { send: false, reason: 'live sending is off' });
});
Deno.test('a person gets each visitor type only once', () => {
  assertEquals(decide({ live: true, consent: ok, alreadySent: true, now }).send, false);
});
Deno.test('no more than one email every 14 days', () => {
  const c13 = { ...ok, last_emailed_at: new Date(now.getTime() - 13 * 86400_000).toISOString() };
  const c15 = { ...ok, last_emailed_at: new Date(now.getTime() - 15 * 86400_000).toISOString() };
  assertEquals(decide({ live: true, consent: c13, alreadySent: false, now }), { send: false, reason: 'emailed in last 14 days' });
  assertEquals(decide({ live: true, consent: c15, alreadySent: false, now }), { send: true });
});
Deno.test('unsubscribed and not-opted-in people never get email', () => {
  assertEquals(decide({ live: true, consent: { ...ok, consent_status: 'opted_out', opted_out_at: now.toISOString() }, alreadySent: false, now }).send, false);
  assertEquals(decide({ live: true, consent: { ...ok, consent_status: 'unknown' }, alreadySent: false, now }).send, false);
});
Deno.test('only approved drafts match', () => {
  const p = { id: 'a', approved: false, signals: ['/start-fundraiser'], subject: 's', body: 'b' };
  assertEquals(matchPersona(['/start-fundraiser'], [p]), null);
  assertEquals(matchPersona(['/start-fundraiser'], [{ ...p, approved: true }])?.id, 'a');
});
Deno.test('runs every 15 minutes', () => {
  assertEquals(shouldRun(new Date(now.getTime() - 5 * 60_000).toISOString(), now), false);
  assertEquals(shouldRun(new Date(now.getTime() - 15 * 60_000).toISOString(), now), true);
});

import { fillName, validateAiEmail } from './followup-rules.ts';
const BASE = 'Hi {first_name},\n\nText.\n\nGive here: https://coupondonation.com/donate\n\n— The CouponDonation team';
Deno.test('fillName uses first word or "there"', () => {
  if (fillName('Hi {first_name},', 'Maya Lee') !== 'Hi Maya,') throw new Error('name');
  if (fillName('Hi {first_name},', null) !== 'Hi there,') throw new Error('fallback');
});
Deno.test('AI email keeping link and sign-off passes', () => {
  if (!validateAiEmail(BASE, { subject: 'A note for you', body: 'Hi Maya,\n\nThanks.\n\nGive here: https://coupondonation.com/donate\n\n— The CouponDonation team' })) throw new Error('should pass');
});
Deno.test('AI email with amounts, exclamation or a new link fails', () => {
  const ok = (body: string) => validateAiEmail(BASE, { subject: 'Note', body: body + '\n\n— The CouponDonation team' });
  if (ok('Give $20 here: https://coupondonation.com/donate')) throw new Error('amount');
  if (ok('Great! https://coupondonation.com/donate')) throw new Error('bang');
  if (ok('See https://evil.com/x')) throw new Error('link');
});

import { activityRenewed, contentHash, isQuiet, outreachBlock } from './followup-rules.ts';
Deno.test('waits 30 quiet minutes after the last visit', () => {
  assertEquals(isQuiet(new Date(now.getTime() - 29 * 60_000).toISOString(), now), false);
  assertEquals(isQuiet(new Date(now.getTime() - 30 * 60_000).toISOString(), now), true);
  assertEquals(isQuiet(null, now), false);
});
Deno.test('a new visit after reserving cancels the send', () => {
  assertEquals(activityRenewed('2026-10-13T11:00:00Z', '2026-10-13T11:20:00Z'), true);
  assertEquals(activityRenewed('2026-10-13T11:00:00Z', '2026-10-13T11:00:00Z'), false);
});
Deno.test('earlier HubSpot email or unreadable history stops sending', () => {
  assertEquals(outreachBlock({ readable: false, priorEmails: 0 }), "couldn't read HubSpot history");
  assertEquals(outreachBlock({ readable: true, priorEmails: 1 }), 'earlier email found in HubSpot');
  assertEquals(outreachBlock({ readable: true, priorEmails: 0 }), null);
});
Deno.test('changing the email text changes its fingerprint', async () => {
  const a = await contentHash('A@x.com', 's', 'b');
  assertEquals(a, await contentHash('a@x.com', 's', 'b'));
  if (a === await contentHash('a@x.com', 's', 'b2')) throw new Error('hash must change');
});
