// Single scheduled dispatcher (pg_cron every 5 min). Never touches payment tables or webhooks:
// it only READS fundraisers/donations, records exactly-once markers in admin_email_events,
// creates pending-approval auto-tasks by polling, then fans out to notify-dispatch and email-scheduler.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { ADMIN_SENDER, shell } from '../_shared/email-layout.ts';
import { dueChecklistEmails, processAccountEmail, type AccountEmailKind } from '../_shared/account-emails.ts';
import { syncEmailLog } from '../_shared/email-log.ts';

const SUPA = Deno.env.get('SUPABASE_URL')!;
const SITE = 'https://coupondonation.com';
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const shortName = (n: string | null) => {
  const p = (n ?? '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return 'Supporter';
  return p.length > 1 ? `${p[0]} ${p[1][0].toUpperCase()}.` : p[0];
};
const usd = (n: number) => `$${Number(n).toFixed(2)}`;

type Ev = { id: string; kind: string; source_id: string; payload: Record<string, string> };
const when = (at: string) => new Date(at).toUTCString();

/** One line of the team digest, its portal link, and the matching Admin > Notifications entry. */
function describe(e: Ev): { line: string; path: string; title: string } {
  const p = e.payload;
  switch (e.kind) {
    case 'partner': return { line: `Partner inquiry: ${p.title} · ${p.status} · ${when(p.at)}`, path: `/admin/partners?id=${e.source_id}`, title: `Partner inquiry: ${p.title}` };
    case 'fundraiser': return { line: `New fundraiser: "${p.title}" (${p.status})${p.by ? ` by ${p.by}` : ''} · ${when(p.at)}`, path: `/admin/fundraisers?id=${e.source_id}`, title: `New fundraiser: ${p.title}` };
    case 'team_reply': return { line: `${p.name} replied to the team about "${p.title}": "${p.excerpt}" · ${when(p.at)}`, path: `/admin/fundraisers?id=${p.fundraiser_id}&tab=contact`, title: `Reply from ${p.name}: ${p.title}` };
    default: return { line: `Donation ${usd(Number(p.amount))} from ${p.name} → ${p.target} · ${when(p.at)}`, path: `/admin/donations?id=${e.source_id}`, title: `Donation ${usd(Number(p.amount))} from ${p.name}` };
  }
}

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
    const html = shell({ preheader: 'There is new account activity to review.', greeting: 'Hi team', status: 'Admin notice', headline: 'Account activity needs review', paragraphs: [`There ${items.length === 1 ? 'is one account item' : `are ${items.length} account items`} ready for review.`, ...items.map((i) => i.line)], valueCard: { label: 'Review queue', value: `${items.length}`, details: [items.length === 1 ? 'item ready' : 'items ready'] }, link: { label: 'Open the admin portal', url: `${SITE}/admin` }, footer: 'Internal account notification. Manage recipients in Admin Settings.', recipient: false });
    const text = ['Hi team,', '', `There ${items.length === 1 ? 'is one account item' : `are ${items.length} account items`} ready for review.`, '', ...items.map((i) => `- ${i.line}`), '', `Open the admin portal: ${SITE}/admin`, '', '— The CouponDonation team'].join('\n');
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: ADMIN_SENDER.from, reply_to: ADMIN_SENDER.replyTo, to: recipients, subject, html, text }),
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
      const id = await send('CouponDonation account activity', [
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

  // 1b) Gold Coins: exactly-once credits and refund reversals (reads donations only).
  const gc = await admin.rpc('credit_gold_coins');
  report.gold_coins = gc.error ? String(gc.error.message) : gc.data;

  // 1b2) Sealed copies of conversations and messages the team removed are deleted after one year.
  const purge = await admin.rpc('purge_removed_conversations');
  report.purged_messages = purge.error ? String(purge.error.message) : purge.data;

  // 1c) Partner inquiries -> auto-task + admin email event.
  const { data: inq } = await admin.from('partner_inquiries').select('id, org_name, org_type, families_count, created_at').eq('status', 'new').limit(100);
  const inqClaims = (inq ?? []).map((i) => ({ kind: 'partner', source_id: i.id, payload: { title: `${i.org_name} (${i.org_type})`, status: `${i.families_count ?? '?'} families`, at: i.created_at } }));
  for (const i of inq ?? []) await admin.rpc('admin_auto_task', { _key: `partner:${i.id}`, _title: `Partner inquiry: ${i.org_name}`, _priority: 'medium', _type: 'partner', _id: i.id, _link: `/admin/partners?id=${i.id}` });
  if (inqClaims.length) await admin.from('admin_email_events').upsert(inqClaims, { onConflict: 'kind,source_id', ignoreDuplicates: true });

  // 1d) Donor confirmations + "fundraiser is live" emails (polling; exactly once via claim_account_email).
  const { data: dueMail } = await admin.rpc('due_account_emails');
  const acct: Record<string, number> = {};
  for (const m of (dueMail ?? []) as { kind: AccountEmailKind; source_id: string }[]) {
    const r = await processAccountEmail(admin, key, m.kind, m.source_id, 'dispatcher');
    acct[`${m.kind}:${r}`] = (acct[`${m.kind}:${r}`] ?? 0) + 1;
  }
  report.account_emails = acct;

  // 1e) The first-gifts checklist, once, for fundraisers that were live before it existed (founder request,
  // Nov 9, 2026). Up to 10 a run, spaced out for Resend's rate limit; nothing is due once all are sent.
  const checklist: Record<string, number> = {};
  for (const id of await dueChecklistEmails(admin)) {
    const r = await processAccountEmail(admin, key, 'fundraiser_checklist', id, 'dispatcher');
    checklist[r] = (checklist[r] ?? 0) + 1;
    await new Promise((done) => setTimeout(done, 700));
  }
  report.checklist_emails = checklist;

  // 2) Claim new events since watermark (2h look-back overlap; unique markers prevent duplicates).
  const { data: st } = await admin.from('admin_dispatch_state').select('*').eq('id', 1).single();
  const since = new Date(new Date(st.fundraiser_watermark).getTime() - 2 * 3600_000).toISOString();
  const runStart = new Date().toISOString();
  const claims: { kind: string; source_id: string; payload: Record<string, string> }[] = [];
  if (settings?.email_new_fundraiser) {
    const { data: frs } = await admin.from('fundraisers').select('id, title, status, created_at, user_id').gte('created_at', since).limit(200);
    // Who created it, so the team can reach them straight from the alert.
    const ids = [...new Set((frs ?? []).map((f) => f.user_id).filter(Boolean))];
    const { data: owners } = ids.length ? await admin.from('profiles').select('user_id, full_name, email').in('user_id', ids) : { data: [] };
    const byId = new Map((owners ?? []).map((o: { user_id: string; full_name: string | null; email: string | null }) => [o.user_id, o]));
    for (const f of frs ?? []) {
      const o = byId.get(f.user_id);
      const by = o ? [o.full_name?.trim(), o.email ? `(${o.email})` : ''].filter(Boolean).join(' ') : '';
      claims.push({ kind: 'fundraiser', source_id: f.id, payload: { title: f.title, status: f.status ?? '', at: f.created_at, by } });
    }
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
    const items = evs.map((e) => { const d = describe(e); return { line: d.line, link: `${SITE}${d.path}` }; });
    const only = evs.length === 1 ? evs[0].kind : null;
    const subject = only === 'partner' ? 'A partner inquiry needs review' : only === 'fundraiser' ? 'A fundraiser needs review'
      : only === 'team_reply' ? `${evs[0].payload.name} replied to the CouponDonation team` : evs.length === 1 ? 'New account activity' : 'CouponDonation account activity';
    try {
      const id = await send(subject, items);
      await admin.from('admin_email_events').update({ sent_at: new Date().toISOString(), resend_id: id, last_error: null }).in('id', evs.map((e) => e.id));
      for (const e of evs) { const d = describe(e); await admin.from('admin_notifications').upsert({ kind: e.kind, title: d.title, link: d.path, source_key: `${e.kind}:${e.source_id}` }, { onConflict: 'source_key', ignoreDuplicates: true }); }
      report.email = { resend_id: id, events: evs.length };
    } catch (e) {
      await admin.from('admin_email_events').update({ last_error: String(e).slice(0, 500) }).in('id', evs.map((x) => x.id));
      report.email_error = String(e);
    }
  }

  // 3b) Copy Resend's log of sent emails (with delivery status) into email_log for Admin > Emails.
  report.email_log = await syncEmailLog(admin, key);

  // 4) Fan out to the other dispatchers with the same secret.
  for (const fn of ['notify-dispatch', 'email-scheduler', 'impact-dispatch', 'followup-dispatch']) {
    try {
      const r = await fetch(`${SUPA}/functions/v1/${fn}`, { method: 'POST', headers: { 'x-dispatch-secret': secret!, 'Content-Type': 'application/json' }, body: '{}' });
      report[fn] = r.status;
    } catch (e) { report[fn] = String(e); }
  }
  return json(report);
});
