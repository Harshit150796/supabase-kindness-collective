import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { phoneOk, showPhone, telHref, toStoredPhone } from '../../../src/lib/phone.ts';

const read = (path: string) => Deno.readTextFileSync(new URL(`../../../${path}`, import.meta.url));

Deno.test('account phone numbers are optional US numbers, stored as +1 and ten digits', () => {
  assertEquals(toStoredPhone('(315) 555-0123'), '+13155550123');
  assertEquals(toStoredPhone('1 315 555 0123'), '+13155550123');
  assertEquals(toStoredPhone(''), null);
  assertEquals(toStoredPhone('555-0123'), null);
  assert(phoneOk('') && phoneOk('315-555-0123') && !phoneOk('123'));
  assertEquals(showPhone('+13155550123'), '(315) 555-0123');
  assertEquals(showPhone('+44 20 7946 0958'), '+44 20 7946 0958');
  assertEquals(telHref('+13155550123'), 'tel:+13155550123');
});

Deno.test('sign-up, launching a fundraiser and Settings each offer the optional phone field (founder request, Nov 12, 2026)', () => {
  assert(read('src/pages/Auth.tsx').includes('<PhoneField id="signup-phone"'));
  const apply = read('src/pages/ApplyRecipient.tsx');
  assert(apply.includes('phone={phone}') && apply.includes('toStoredPhone(phone)') && apply.includes('Finish your phone number, or leave it blank'));
  assert(read('src/components/apply/steps/ReviewStep.tsx').includes('id="apply-phone"'));
  assert(read('src/pages/Settings.tsx').includes('<PhoneSettingsCard'));
  const create = read('supabase/functions/create-account/index.ts');
  assert(create.includes("update({ phone })") && create.includes('function usPhone('));
});

Deno.test('the team sees organizer and account phone numbers in the admin portal', () => {
  assert(read('src/pages/admin/AdminFundraisers.tsx').includes('<PhoneLink phone={r.organizer_phone}'));
  assert(read('src/pages/admin/AdminUsers.tsx').includes('useProfilePhones'));
  assert(read('src/pages/admin/AdminVerifications.tsx').includes('<PhoneLink'));
  assert(read('src/components/admin/AdminRecordDrawer.tsx').includes('<PhoneLink'));
  assert(read('supabase/functions/admin-dispatch/index.ts').includes("select('user_id, full_name, email, phone')"));
});
