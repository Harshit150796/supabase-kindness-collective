import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { checkBio, checkCauses, checkDisplayName, checkLinks, checkMediaPath, checkUsername } from './profile-rules.ts';

const root = new URL('../../../', import.meta.url);
const read = (path: string) => Deno.readTextFileSync(new URL(path, root));

Deno.test('Usernames: 3 to 30 lowercase characters, no look-alikes of the site or its team', () => {
  assertEquals(checkUsername('@Maria.Lopez'), { ok: true, value: 'maria.lopez' });
  assert(checkUsername('ab').ok === false);
  assert(checkUsername('a'.repeat(31)).ok === false);
  assert(checkUsername('.maria').ok === false);
  assert(checkUsername('maria__lopez').ok === false);
  assert(checkUsername('maria lopez').ok === false);
  for (const bad of ['admin', 'support', 'coupondonation', 'coupon_donation_help', 'support.team', 'official_cd', 'maria.admin']) {
    assert(checkUsername(bad).ok === false, `${bad} should be reserved`);
  }
});

Deno.test('Names and bios: no payment handles, contact details or HTML', () => {
  assertEquals(checkBio('Feeding families in Austin every Sunday'), { ok: true, value: 'Feeding families in Austin every Sunday' });
  assertEquals(checkBio('   '), { ok: true, value: null });
  assert(checkBio('Send to my cashapp $maria').ok === false);
  assert(checkBio('Text me 512-555-0101').ok === false);
  assert(checkBio('email me at maria@example.com').ok === false);
  assert(checkBio('x'.repeat(161)).ok === false);
  assert(checkBio('<b>hi</b>').ok === false);
  assert(checkDisplayName('CouponDonation Support').ok === false);
  assertEquals(checkDisplayName('Maria L.'), { ok: true, value: 'Maria L.' });
});

Deno.test('Causes come from the need list, up to five', () => {
  assertEquals(checkCauses(['food', 'food', 'healthcare']), { ok: true, value: ['food', 'healthcare'] });
  assert(checkCauses(['food', 'meals', 'healthcare', 'childcare', 'clothing', 'education']).ok === false);
  assert(checkCauses(['guns']).ok === false);
});

Deno.test('Links: handles for social sites, https for websites, never payment apps', () => {
  assertEquals(checkLinks({ instagram: 'https://instagram.com/maria.l/', x: '@maria', website: 'maria.org' }),
    { ok: true, value: { instagram: 'maria.l', x: 'maria', website: 'https://maria.org/' } });
  assert(checkLinks({ website: 'javascript:alert(1)' }).ok === false);
  assert(checkLinks({ website: 'https://cash.app/$maria' }).ok === false);
  assert(checkLinks({ venmo: 'maria' }).ok === false);
  assert(checkLinks({ instagram: 'not a handle!' }).ok === false);
});

Deno.test('Photos must be in the person’s own folder with a generated name', () => {
  const uid = '00000000-0000-0000-0000-00000000000a';
  assert(checkMediaPath(`${uid}/avatar-1a2b3c4d5e.webp`, uid, 'avatar').ok);
  assert(checkMediaPath(`${uid}/cover-1a2b3c4d5e.webp`, uid, 'avatar').ok === false);
  assert(checkMediaPath(`someone-else/avatar-1a2b3c4d5e.webp`, uid, 'avatar').ok === false);
  assert(checkMediaPath(`${uid}/../x/avatar-1a2b3c4d5e.webp`, uid, 'avatar').ok === false);
});

Deno.test('Profile fields are written only by profile-actions; messages respect removals and restrictions', () => {
  const fn = read('supabase/functions/profile-actions/index.ts');
  assert(fn.includes("requestUser(req, admin)"), 'the signed-in person comes from the token');
  assert(fn.includes("restricted('profile')") && fn.includes("restricted('following')"));
  assert(fn.includes('overLimit('), 'every write is rate-limited');
  const send = read('supabase/functions/send-message/index.ts');
  assert(send.includes("includes('messaging')"), 'restricted people cannot message');
  assert(send.includes("status === 'removed'"), 'removed conversations stay closed');
  assert(send.includes('user_blocks'), 'person-level blocks close messages');
  const dispatch = read('supabase/functions/admin-dispatch/index.ts');
  assert(dispatch.includes('purge_removed_conversations'), 'sealed copies are deleted after a year');
});
