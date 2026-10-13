import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { withoutSuppressed } from './suppression.ts';
import { decide, withUnsubscribe } from './followup-rules.ts';

const now = new Date('2026-10-13T12:00:00Z');
const ok = { consent_status: 'opted_in', opted_out_at: null, last_emailed_at: null };

Deno.test('newsletter audience drops unsubscribed people, any letter case', () => {
  const rows = [{ email: 'A@x.com' }, { email: 'b@x.com' }];
  assertEquals(withoutSuppressed(rows, new Set(['a@x.com'])).map((r) => r.email), ['b@x.com']);
});

Deno.test('follow-up is not sent to someone on the shared unsubscribed list', () => {
  assertEquals(decide({ live: true, consent: { ...ok, suppressed: true }, alreadySent: false, now }), { send: false, reason: 'unsubscribed' });
});

Deno.test('follow-up still sends to an opted-in person not on the list', () => {
  assertEquals(decide({ live: true, consent: { ...ok, suppressed: false }, alreadySent: false, now }), { send: true });
});

Deno.test('every follow-up carries its unsubscribe link', () => {
  assertEquals(withUnsubscribe('Hi', 'abc').endsWith('https://coupondonation.com/unsubscribe?f=abc'), true);
});
