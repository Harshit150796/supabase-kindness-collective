// Single scheduled dispatcher (pg_cron every 5 min). Never touches payment tables or webhooks:
// it only READS fundraisers/donations, records exactly-once markers in admin_email_events,
// creates pending-approval auto-tasks by polling, then fans out to notify-dispatch and email-scheduler.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { NOTIFY_SENDER } from '../_shared/email-layout.ts';

const SUPA = Deno.env.get('SUPABASE_URL')!;
const SITE = 'https://coupondonation.com';
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const shortName = (n: string | null) => {
  const p = (n ?? '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return 'Supporter';
  return p.length > 1 ? `${p[0]} ${p[1][0].toUpperCase()}.` : p[0];
};
const usd = (n: number) => `$${Number(n).toFixed(2)}`;

type Ev = { id: string; kind: string; source_id: string; payload: Record<string, string> };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const admin = createClient(SUPA, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const secret = req.headers.get('x-dispatch-secret');
  const { data: ok } = await admin.rpc('dispatch_secret_ok', { _s: secret });
  if (!ok) return json({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => ({}));
  const report: Record<string, unknown> = {};
  const { data: settings } = await admin.from('admin_settings').select('*').eq('id', 1).single();
  const recipients: string[] = settings?.notification_recipients ?? [];
  const key = Deno.env.get('RESEND_API_KEY');

  const send = async (subject: string, items: { line: string; link: string }[]) => {
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#13201a;max-width:560px">
      <h2 style="font-weight:600;font-size:18px;margin:0 0 12px">${esc(subject)}</h2>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
      ${items.map((i) => `<tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:14px">${esc(i.line)}<br><a href="${esc(i.link)}" style="color:#2e7d32">Open in admin</a></td></tr>`).join('')}
      </table><p style="font-size:12px;color:#6b7280;margin-top:16px">Internal CouponDonation operations notice. Manage recipients in Admin → Settings.</p></div>`;
    const text = [subject, '', ...items.map((i) => `- ${i.line}\n  ${i.link}`)].join('\n');
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: NOTIFY_SENDER.from, to: recipients, subject, html, text }),
    });
    const t = await r.text();
    if (!r.ok) throw new Error(`[${r.status}] ${t}`);
    return JSON.parse(t).id as string;
  };

  // Delivery check: read an email's last_event from Resend.
  if (typeof body?.status_id === 'string' && /^[0-9a-f-]{36}$/.test(body.status_id)) {
    const r = await fetch(`https://api.resend.com/emails/${body.status_id}`, { headers: { Authorization: `Bearer ${key}` } });
    const j = await r.json().catch(() => ({}));
    return json({ status: r.status, id: j.id, last_event: j.last_event, to: j.to, created_at: j.created_at });
  }

  // Test mode: one real digest, not recorded as events.
  if (body?.test) {
    if (!key || !recipients.length) return json({ error: 'Missing Resend key or recipients' }, 400);
    try {
      const id = await send('Test digest — CouponDonation admin notifications', [
        { line: 'This is a delivery test of the admin notification dispatcher.', link: `${SITE}/admin` },
      ]);
      return json({ test: true, resend_id: id, to: recipients });
    } catch (e) { return json({ error: String(e) }, 502); }
  }

  // 1) Pending-approval auto-tasks via polling (no UPDATE trigger on fundraisers).
  const { data: pend } = await admin.from('fundraisers').select('id, title').eq('status', 'pending').limit(200);
  for (const f of pend ?? []) {
    await admin.rpc('admin_auto_task', { _key: `fundraiser-pending:${f.id}`, _title: `Approve fundraiser: ${f.title}`, _priority: 'high', _type: 'fundraiser', _id: f.id, _link: `/admin/fundraisers?id=${f.id}` });
  }
  report.pending_tasks_checked = pend?.length ?? 0;

  // 2) Claim new events since watermark (2h look-back overlap; unique markers prevent duplicates).
  const { data: st } = await admin.from('admin_dispatch_state').select('*').eq('id', 1).single();
  const since = new Date(new Date(st.fundraiser_watermark).getTime() - 2 * 3600_000).toISOString();
  const runStart = new Date().toISOString();
  const claims: { kind: string; source_id: string; payload: Record<string, string> }[] = [];
  if (settings?.email_new_fundraiser) {
    const { data: frs } = await admin.from('fundraisers').select('id, title, status, created_at').gte('created_at', since).limit(200);
    for (const f of frs ?? []) claims.push({ kind: 'fundraiser', source_id: f.id, payload: { title: f.title, status: f.status ?? '', at: f.created_at } });
  }
  if (settings?.email_new_donation) {
    const { data: ds } = await admin.from('donations').select('id, amount, donor_name, is_anonymous, brand_partner, fundraiser_id, created_at, fundraisers(title)')
      .in('status', ['completed', 'succeeded']).gte('created_at', since).limit(500);
    for (const d of ds ?? []) claims.push({ kind: 'donation', source_id: d.id, payload: {
      name: d.is_anonymous ? 'Anonymous' : shortName(d.donor_name), amount: String(d.amount),
      target: (d as any).fundraisers?.title ?? d.brand_partner ?? 'General fund', at: d.created_at } });
  }
  if (claims.length) await admin.from('admin_email_events').upsert(claims, { onConflict: 'kind,source_id', ignoreDuplicates: true });
  await admin.from('admin_dispatch_state').update({ fundraiser_watermark: runStart, donation_watermark: runStart, last_run_at: runStart }).eq('id', 1);

  // 3) Send all unsent (includes retries of previous failures) — single email or one digest.
  const { data: unsent } = await admin.from('admin_email_events').select('id, kind, source_id, payload').is('sent_at', null).order('created_at').limit(100);
  const evs = (unsent ?? []) as Ev[];
  if (evs.length && key && recipients.length) {
    const items = evs.map((e) => e.kind === 'fundraiser'
      ? { line: `New fundraiser: "${e.payload.title}" (${e.payload.status}) · ${new Date(e.payload.at).toUTCString()}`, link: `${SITE}/admin/fundraisers?id=${e.source_id}` }
      : { line: `Donation ${usd(Number(e.payload.amount))} from ${e.payload.name} → ${e.payload.target} · ${new Date(e.payload.at).toUTCString()}`, link: `${SITE}/admin/donations?id=${e.source_id}` });
    const nF = evs.filter((e) => e.kind === 'fundraiser').length, nD = evs.length - nF;
    const subject = evs.length === 1 ? (nF ? 'New fundraiser created' : 'New donation completed')
      : `CouponDonation digest: ${nD} donation${nD === 1 ? '' : 's'}, ${nF} new fundraiser${nF === 1 ? '' : 's'}`;
    try {
      const id = await send(subject, items);
      await admin.from('admin_email_events').update({ sent_at: new Date().toISOString(), resend_id: id, last_error: null }).in('id', evs.map((e) => e.id));
      for (const e of evs) await admin.from('admin_notifications').upsert({ kind: e.kind, title: e.kind === 'fundraiser' ? `New fundraiser: ${e.payload.title}` : `Donation ${usd(Number(e.payload.amount))} from ${e.payload.name}`, link: e.kind === 'fundraiser' ? `/admin/fundraisers?id=${e.source_id}` : `/admin/donations?id=${e.source_id}`, source_key: `${e.kind}:${e.source_id}` }, { onConflict: 'source_key', ignoreDuplicates: true });
      report.email = { resend_id: id, events: evs.length };
    } catch (e) {
      await admin.from('admin_email_events').update({ last_error: String(e).slice(0, 500) }).in('id', evs.map((x) => x.id));
      report.email_error = String(e);
    }
  }

  // 4) Fan out to the other dispatchers with the same secret.
  for (const fn of ['notify-dispatch', 'email-scheduler']) {
    try {
      const r = await fetch(`${SUPA}/functions/v1/${fn}`, { method: 'POST', headers: { 'x-dispatch-secret': secret!, 'Content-Type': 'application/json' }, body: '{}' });
      report[fn] = r.status;
    } catch (e) { report[fn] = String(e); }
  }
  return json(report);
});
