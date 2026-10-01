import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { moderate } from '../_shared/moderation.ts';

const blocked = [
  'Send it to my venmo @jane-doe',
  'cash app me at $JaneD',
  'You can zelle me instead',
  'paypal.me/janedoe',
  'Use Western Union please',
  'MoneyGram works',
  'Please wire transfer the funds',
  'Can you buy me a gift card and send the code',
  'BTC wallet address bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  'eth 0x52908400098527886E0F7030069857D2E4169EE7',
  'routing number 021000021',
  'IBAN GB82 WEST 1234 5698 7654 32',
];
const allowed = [
  'Thank you so much for your support!',
  'We raised $50 today, amazing',
  'Our kids loved the groceries from Walmart',
  'Sending prayers your way',
];

for (const t of blocked) Deno.test(`blocks: ${t}`, () => assert(moderate(t).blocked, t));
for (const t of allowed) Deno.test(`allows: ${t}`, () => {
  const r = moderate(t); assertEquals(r.blocked, false, `${t} -> ${r.blockRules}`); assertEquals(r.redactRules, []);
});
Deno.test('redacts phone', () => {
  const r = moderate('Call me at (315) 555-1234 tonight');
  assertEquals(r.blocked, false); assertEquals(r.redactRules, ['phone']); assert(!r.text.includes('555'));
});
Deno.test('redacts email', () => {
  const r = moderate('write to jane@example.com');
  assertEquals(r.redactRules, ['email']); assert(r.text.includes('[removed]'));
});
Deno.test('strips html', () => assertEquals(moderate('<b>hi</b><script>x</script>').text, 'hix'));
