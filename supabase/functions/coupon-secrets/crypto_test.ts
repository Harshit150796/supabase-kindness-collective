import { assert, assertEquals, assertNotEquals, assertRejects } from 'jsr:@std/assert@1';
import { CouponCrypto, KeyMissingError } from '../_shared/coupon-crypto.ts';
import { luhn, expiryOk, validateSecret, last4Of } from '../_shared/coupon-validate.ts';

// Temporary key that exists only inside this test run; never stored anywhere.
const tempKey = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(64))));
const vault = new CouponCrypto((n) => (n === 'COUPON_SECRET_KEY_V1' ? tempKey : undefined));

Deno.test('ciphertext hides the card number and round-trips', async () => {
  const pan = '4111111111111111';
  const c = await vault.encrypt('number', pan);
  assert(/^v1:k1:[A-Za-z0-9_-]{16}:[A-Za-z0-9_-]{20,}$/.test(c), 'format matches the DB check');
  assert(!c.includes('4111') && !c.includes('1111'), 'no digits leak');
  assertNotEquals(c, await vault.encrypt('number', pan), 'random IV per value');
  assertEquals(await vault.decrypt('number', c), pan);
});
Deno.test('a value cannot be moved to another field (AAD)', async () => {
  const c = await vault.encrypt('cvv', '123');
  await assertRejects(() => vault.decrypt('pin', c));
});
Deno.test('wrong key cannot decrypt', async () => {
  const other = new CouponCrypto((n) => (n === 'COUPON_SECRET_KEY_V1' ? btoa('x'.repeat(64)) : undefined));
  const c = await vault.encrypt('code', 'ABC-123');
  await assertRejects(() => other.decrypt('code', c));
});
Deno.test('fails closed with no key', async () => {
  const none = new CouponCrypto(() => undefined);
  assertEquals(none.currentKid(), null);
  await assertRejects(() => none.encrypt('code', 'ABC-123'), KeyMissingError);
});
Deno.test('Luhn, CVV, expiry and type rules', () => {
  assert(luhn('4111 1111 1111 1111')); assert(!luhn('4111111111111112')); assert(!luhn('1234'));
  const now = new Date('2026-10-04T00:00:00Z');
  assert(expiryOk('10/26', now)); assert(!expiryOk('09/26', now)); assert(!expiryOk('13/27', now));
  assertEquals(validateSecret('prepaid_card', { number: '4111111111111111', cvv: '12' }, { card_exp: '12/28', now }), 'CVV must be 3 or 4 digits');
  assertEquals(validateSecret('prepaid_card', { number: '4111111111111112', cvv: '123' }, { card_exp: '12/28', now }), 'That card number is not valid (check digit failed)');
  assertEquals(validateSecret('prepaid_card', { number: '4111111111111111', cvv: '1234' }, { card_exp: '09/26', now }), 'Expiry must be MM/YY and not in the past');
  assertEquals(validateSecret('prepaid_card', { number: '4111111111111111', cvv: '123' }, { card_exp: '12/28', now }), null);
  assert(validateSecret('prepaid_link', { number: '4111111111111111' }, { url: 'https://x.example' })?.includes('only the link'));
  assertEquals(validateSecret('prepaid_link', {}, { url: 'https://x.example/card' }), null);
  assert(validateSecret('gift_card', { number: '6006491234567890' }) !== null, 'gift card needs PIN');
  assertEquals(last4Of('prepaid_card', { number: '4111-1111-1111-1234' }), '1234');
});
