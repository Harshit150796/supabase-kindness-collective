// One place that turns off every optional email for a person.
//  - POST JSON { kind: 'newsletter'|'followup'|'impact'|'confirm', token }  (the /unsubscribe page)
//  - POST JSON { kind: 'request', email }  (no link: sends a one-time confirm link; never reveals whether the address is known)
//  - POST ?n=<newsletter token> | ?f=<follow-up token>  (Gmail/Apple one-click, RFC 8058)
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { NOTIFY_SENDER } from '../_shared/email-layout.ts';
import { norm, suppress, UNSUB_PAGE_URL } from '../_shared/suppression.ts';

const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const Body = z.discriminatedUnion('kind', [
  z.object({ kind: z.enum(['newsletter', 'followup', 'impact', 'confirm']), token: z.string().min(8).max(200) }),
  z.object({ kind: z.literal('request'), email: z.string().trim().email().max(320) }),
]);

async function sha256(s: string) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('');
}
const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

// deno-lint-ignore no-explicit-any
async function emailFor(db: any, kind: string, token: string): Promise<string | null> {
  if (kind === 'newsletter') return (await db.from('email_subscribers').select('email').eq('unsubscribe_token', token).maybeSingle()).data?.email ?? null;
  if (kind === 'followup') return isUuid(token) ? (await db.from('visitor_consents').select('email').eq('unsubscribe_token', token).maybeSingle()).data?.email ?? null : null;
  if (kind === 'confirm') {
    if (!isUuid(token)) return null;
    const { data } = await db.from('unsubscribe_requests').select('email, created_at, used_at').eq('token', token).maybeSingle();
    if (!data || Date.now() - new Date(data.created_at).getTime() > 7 * 86400_000) return null;
    await db.from('unsubscribe_requests').update({ used_at: new Date().toISOString() }).eq('token', token);
    return data.email;
  }
  // impact
  const did = (await db.rpc('_impact_token_donation', { _hash: await sha256(token) })).data as string | null;
  if (!did) return null;
  const { data: d } = await db.from('donations').select('donor_email, donor_id').eq('id', did).maybeSingle();
  if (d?.donor_email) return d.donor_email;
  return d?.donor_id ? (await db.from('profiles').select('email').eq('user_id', d.donor_id).maybeSingle()).data?.email ?? null : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const url = new URL(req.url);

  // Mail-app one-click button.
  const qn = url.searchParams.get('n'), qf = url.searchParams.get('f');
  if (qn || qf) {
    const email = await emailFor(db, qn ? 'newsletter' : 'followup', (qn ?? qf)!);
    if (email) await suppress(db, email, qn ? 'newsletter' : 'followup');
    return json({ success: !!email }, email ? 200 : 404);
  }

  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return json({ error: 'bad request' }, 400);

  if (p.data.kind === 'request') {
    const email = norm(p.data.email);
    const since = new Date(Date.now() - 86400_000).toISOString();
    const { count } = await db.from('unsubscribe_requests').select('token', { count: 'exact', head: true }).eq('email', email).gte('created_at', since);
    if ((count ?? 0) < 3) {
      const { data: row } = await db.from('unsubscribe_requests').insert({ email }).select('token').single();
      const key = Deno.env.get('RESEND_API_KEY');
      if (row && key) {
        const link = `${UNSUB_PAGE_URL}?c=${row.token}`;
        const text = `Hi,\n\nSomeone asked to stop CouponDonation emails to this address. To confirm, open this link:\n${link}\n\nIf this wasn't you, ignore this email and nothing changes.\n\n— The CouponDonation team`;
        const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#13201a;max-width:520px"><p>Hi,</p><p>Someone asked to stop CouponDonation emails to this address. To confirm, use this link:</p><p><a href="${link}" style="color:#2e7d32;font-weight:600">Confirm unsubscribe</a></p><p>If this wasn't you, ignore this email and nothing changes.</p><p>— The CouponDonation team</p></div>`;
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: NOTIFY_SENDER.from, reply_to: NOTIFY_SENDER.replyTo, to: [email], subject: 'Confirm you want to stop CouponDonation emails', html, text }),
        }).catch((e) => { console.error('confirm email error', e); return null; });
        if (r && !r.ok) console.error('confirm email failed', r.status, (await r.text()).slice(0, 300));
      }
    }
    return json({ success: true, requested: true });
  }

  const email = await emailFor(db, p.data.kind, p.data.token);
  if (!email) return json({ success: false }, 404);
  await suppress(db, email, p.data.kind);
  return json({ success: true, email });
});
