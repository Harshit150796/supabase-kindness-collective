import { assertEquals } from 'jsr:@std/assert@1';
import { manageableMonthlyGiftStatuses } from '../../../src/lib/monthlyGiftStatus.ts';
import { heroDonations } from '../../../src/lib/heroDonations.ts';

for (const status of ['active', 'pending', 'payment_problem', 'paused']) {
  Deno.test(`${status} monthly gifts keep their cancellation control`, () => {
    assertEquals(manageableMonthlyGiftStatuses.some((value) => value === status), true);
  });
}
Deno.test('canceled monthly gifts are excluded', () => {
  assertEquals(manageableMonthlyGiftStatuses.some((value) => String(value) === 'canceled'), false);
});
Deno.test('empty or failed public donation reads invent no donors', () => {
  assertEquals(heroDonations(null), []);
  assertEquals(heroDonations([]), []);
});
Deno.test('tree preserves the public name and actual dollar amount', () => {
  assertEquals(heroDonations([{ id: 'real', display_name: 'Alex R.', amount: 25 }]), [{ id: 'real', donorName: 'Alex R.', amount: 25 }]);
});
Deno.test('missing public identity stays anonymous', () => {
  assertEquals(heroDonations([{ id: 'real', display_name: null, amount: 10 }]), [{ id: 'real', donorName: 'Anonymous Donor', amount: 10 }]);
});