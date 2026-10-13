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
