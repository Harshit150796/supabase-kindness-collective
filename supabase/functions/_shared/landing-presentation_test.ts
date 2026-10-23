import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { figureDisplay, fundraiserRetryPolicy } from '../../../src/lib/landingPresentation.ts';

Deno.test('counts below ten show their real value from the first render', () => {
  for (const value of [1, 2, 9]) {
    assertEquals(figureDisplay(value, 0, false, false), value);
    assertEquals(figureDisplay(value, 0.1, false, true), value);
  }
});

Deno.test('reduced motion always displays final counts', () => {
  assertEquals(figureDisplay(1484, 0, true, true), 1484);
  assertEquals(figureDisplay(1, 0, true, false), 1);
});

Deno.test('animated larger counts round and never show a false zero', () => {
  assertEquals(figureDisplay(20, 10.6, false, true), 11);
  assertEquals(figureDisplay(20, 0, false, true), 1);
  assertEquals(figureDisplay(20, 0, false, false), 20);
  assertEquals(figureDisplay(0, 0, false, true), 0);
});

Deno.test('fundraiser loading allows three thirty-second attempts with backoff', () => {
  assertEquals(fundraiserRetryPolicy.attemptTimeout, 30_000);
  assertEquals(fundraiserRetryPolicy.retry + 1, 3);
  assertEquals(fundraiserRetryPolicy.retryDelay(0), 2_000);
  assertEquals(fundraiserRetryPolicy.retryDelay(1), 4_000);
  assertEquals(fundraiserRetryPolicy.retryDelay(10), 8_000);
});