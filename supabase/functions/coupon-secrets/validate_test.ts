import { assert, assertEquals } from 'jsr:@std/assert@1';
import { validateSecret } from '../_shared/coupon-validate.ts';

Deno.test('prepaid card numbers and CVVs are always rejected', () => {
  assert(validateSecret('prepaid_card' as never, { number: '4111111111111111' })?.includes('not accepted'));
  assert(validateSecret('gift_card', { number: '6006491234567890', pin: '1234', cvv: '123' } as never)?.includes('not accepted'));
  assert(validateSecret('prepaid_link', { number: '4111111111111111' }, { url: 'https://x.example' })?.includes('only the link'));
});
Deno.test('code, gift card and hosted link rules', () => {
  assertEquals(validateSecret('code', { code: 'ABC-123' }), null);
  assertEquals(validateSecret('code', { code: 'AB' }), 'Code needs 3–200 characters');
  assert(validateSecret('gift_card', { number: '6006491234567890' }) !== null, 'gift card needs PIN');
  assertEquals(validateSecret('gift_card', { number: '6006491234567890', pin: '1234' }), null);
  assertEquals(validateSecret('prepaid_link', {}, { url: 'https://x.example/card' }), null);
  assert(validateSecret('code', { code: 'ABC-123' }, { url: 'http://x' }) !== null);
});
