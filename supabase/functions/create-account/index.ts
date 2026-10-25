// Creates an email + password account, but only for an address whose sign-up code was just
// verified (send-otp, then verify-otp). The account is created already confirmed, so people get
// one email, not two, and nobody can open an account for an address they can't read.
// Before this the browser created accounts itself and the code check happened only in the page,
// so a script could skip it and register any address.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { HOUR, clientIp, overLimit } from '../_shared/rate-limit.ts';
import { signupBlocked } from '../_shared/email-exists.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const Body = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
  full_name: z.string().trim().max(120).optional().default(''),
  code: z.string().trim().regex(/^\d{6}$/),
});

const cardNumber = () => {
  const r = crypto.getRandomValues(new Uint8Array(3));
  return `CD${Date.now().toString(36).toUpperCase()}${Array.from(r, (b) => b.toString(36).toUpperCase().padStart(2, '0')).join('').slice(0, 4)}`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return json({ error: f.password ? 'Use a password of 8 to 72 characters.' : 'Please check your details and try again.' }, 400);
  }
  const p = parsed.data;
  const email = p.email.toLowerCase();
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // 30 an hour per network: enough for a campus or event Wi-Fi, too few to farm accounts.
  if (await overLimit(admin, 'create-account-ip', clientIp(req), 30, HOUR)) {
    return json({ error: 'Too many attempts. Please try again in a little while.' }, 429);
  }

  // The code must have been verified a moment ago for this exact address.
  const addresses = [...new Set([email, p.email])];
  const { data: otp } = await admin.from('otp_codes').select('id')
    .in('email', addresses).eq('code', p.code).eq('verified', true)
    .gt('expires_at', new Date().toISOString()).limit(1).maybeSingle();
  if (!otp) return json({ error: 'Your code has expired. Please request a new one.', code: 'code_expired' }, 400);

  const existing = await signupBlocked(admin, email);
  if (existing.blocked) {
    return json({ error: 'This email is already registered. Please sign in instead.', code: 'email_exists' }, 409);
  }
  // Someone opened an account for this address through the sign-up API without being able to read
  // its inbox (it was never confirmed or used). This person just proved they can, so it goes.
  if (existing.replaceId) {
    const { error: delErr } = await admin.auth.admin.deleteUser(existing.replaceId);
    if (delErr) {
      console.error('could not remove unconfirmed account', delErr.message);
      return json({ error: 'We could not create your account. Please try again.' }, 500);
    }
  }

  // The sign-up lock (a trigger on auth.users, switched on when the new website is published) lets
  // an email account be created only for an address listed here in the last ten minutes.
  const { error: allowErr } = await admin.from('allowed_signups')
    .upsert({ email, created_at: new Date().toISOString() }, { onConflict: 'email' });
  if (allowErr) console.error('allowed_signups write failed', allowErr.message);

  const { data: created, error } = await admin.auth.admin.createUser({
    email, password: p.password, email_confirm: true, user_metadata: { full_name: p.full_name },
    // Marks accounts opened through the verified-code flow (anything else was made another way).
    app_metadata: { signup: 'create-account' },
  });
  if (error || !created?.user) {
    const msg = (error?.message ?? '').toLowerCase();
    if (msg.includes('already')) return json({ error: 'This email is already registered. Please sign in instead.', code: 'email_exists' }, 409);
    if (msg.includes('password')) return json({ error: 'Please choose a stronger password.', code: 'weak_password' }, 400);
    console.error('create-account failed', error?.message);
    return json({ error: 'We could not create your account. Please try again.' }, 500);
  }

  // The code is used up.
  await admin.from('otp_codes').delete().in('email', addresses);
  // Profile, roles and the mailing-list row come from the handle_new_user trigger; the Gold Coins
  // card is made here because the browser isn't signed in yet.
  const { error: cardErr } = await admin.from('loyalty_cards').insert({ user_id: created.user.id, card_number: cardNumber() });
  if (cardErr) console.error('loyalty card insert failed', cardErr.message);

  return json({ ok: true, id: created.user.id });
});
