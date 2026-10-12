import { assert, assertEquals } from 'jsr:@std/assert@1';
import { renderOutsideCouponEmail } from './outside-coupon-email.ts';

Deno.test('outside coupon donor email never includes a code or amount and greets by first name', () => {
  const m = renderOutsideCouponEmail({ donorName: 'Jane Doe', fundraiserTitle: 'Help the Lees', fundraiserUrl: 'https://coupondonation.com/f/lees', brand: 'Target' });
  assert(m.text.startsWith('Hi Jane,'));
  assert(!/\$\d/.test(m.subject + m.text + m.html));
  assert(!/TARGET-SECRET/.test(m.html));
  assertEquals(/[!]/.test(m.subject), false);
});
