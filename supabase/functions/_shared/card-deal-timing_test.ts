import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { CARD_DEAL_TIMING, cardDealEligible, cardDealThreshold } from '../../../src/lib/cardDealTiming.ts';

Deno.test('cards wait for meaningful visibility rather than a row edge', () => {
  assertEquals(cardDealEligible(20, 400, 800), false);
  assertEquals(cardDealEligible(139, 400, 800), false);
  assertEquals(cardDealEligible(140, 400, 800), true);
});
Deno.test('short windows can reach the card visibility gate', () => {
  assertEquals(cardDealThreshold(600, 400), 140 / 600);
  assertEquals(cardDealEligible(140, 600, 400), true);
  assertEquals(cardDealEligible(0, 0, 400), false);
});
Deno.test('four cards have distinct beats after the visibility hold', () => {
  assertEquals(CARD_DEAL_TIMING.hold, 120);
  assertEquals(Array.from({ length: 4 }, (_, i) => i * CARD_DEAL_TIMING.stagger), [0, 300, 600, 900]);
  assertEquals(CARD_DEAL_TIMING.duration, 520);
});