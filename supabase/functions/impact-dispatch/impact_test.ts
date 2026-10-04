import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { planEmails } from '../_shared/impact-plan.ts';
import { inspectImage } from '../_shared/image-meta.ts';
import { renderImpactEmail } from '../_shared/impact-email.ts';

const old = new Date(Date.now() - 3600_000).toISOString();
const ev = (id: string, d: string, kind: string, at = old) => ({ id, donation_id: d, coupon_id: `c${id}`, kind, created_at: at });

Deno.test('four received coupons of one donation -> one email', () => {
  const p = planEmails([ev('1', 'A', 'received'), ev('2', 'A', 'received'), ev('3', 'A', 'received'), ev('4', 'A', 'received')], Date.now());
  assertEquals(p.length, 1); assertEquals(p[0].events.length, 4); assertEquals(p[0].kind, 'received');
});
Deno.test('received + used pending in one run -> one combined email', () => {
  const p = planEmails([ev('1', 'A', 'received'), ev('2', 'A', 'used')], Date.now());
  assertEquals(p.length, 1); assertEquals(p[0].kind, 'combined');
});
Deno.test('fresh used event holds the whole donation (no two emails minutes apart)', () => {
  assertEquals(planEmails([ev('1', 'A', 'received'), ev('2', 'A', 'used', new Date().toISOString())], Date.now()).length, 0);
});
Deno.test('two donations -> two emails', () => {
  assertEquals(planEmails([ev('1', 'A', 'received'), ev('2', 'B', 'received')], Date.now()).length, 2);
});
Deno.test('server flags GPS/EXIF in original photo', () => {
  const m = inspectImage(Deno.readFileSync(new URL('./fixtures/gps.jpg', import.meta.url)));
  assertEquals(m.type, 'jpeg'); assertEquals(m.metadata.includes('EXIF'), true);
});
Deno.test('cleaned receipt has no metadata', () => {
  const m = inspectImage(Deno.readFileSync(new URL('./fixtures/clean.webp', import.meta.url)));
  assertEquals(m.type, 'webp'); assertEquals(m.metadata.length, 0);
});
Deno.test('impact email never contains a coupon code', () => {
  const m = renderImpactEmail({ kind: 'combined', fundraiserTitle: 'T', organizer: 'Maria G.', donatedAt: old, impactUrl: 'https://x', thankUrl: 'https://x', stopUrl: 'https://x',
    items: [{ brand: 'DoorDash', value: 20, createdAt: old, receivedAt: old, usedAt: old, category: 'Meals', note: 'n' }] });
  assertEquals(m.html.includes('SECRETCODE') || m.text.includes('SECRETCODE'), false);
  assertEquals(m.html.includes('Stop impact emails'), true);
});
Deno.test('impact subjects contain no amount, retailer, product term, or punctuation hype', () => {
  for (const kind of ['received', 'used', 'combined'] as const) {
    const mail = renderImpactEmail({ kind, fundraiserTitle: 'Family Grocery Support', organizer: 'Maria G.', donatedAt: old, impactUrl: 'https://coupondonation.com/impact/example', thankUrl: 'https://coupondonation.com/impact/example#thanks', stopUrl: 'https://coupondonation.com/impact/example?stop=1',
      items: [{ brand: 'DoorDash', value: 20, createdAt: old, receivedAt: old, usedAt: kind === 'received' ? null : old }] });
    assertEquals(/\$|doordash|gift card|coupon|free|deal|offer|save|!|\p{Extended_Pictographic}/iu.test(mail.subject), false);
    assert(mail.html.includes('Hi there,'));
    assert(mail.html.includes('— The CouponDonation team'));
    assertEquals(mail.html.includes('/brands/'), false);
  }
});
