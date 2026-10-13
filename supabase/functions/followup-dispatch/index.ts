// Visitor follow-ups. Called by admin-dispatch every 5 minutes with the dispatch secret; runs at most every 15.
// Reads opted-in people's recent page views from PostHog, matches an approved visitor type, and asks PostHog
// Workflows to send it (event `followup_email_requested`). Each send is noted on the HubSpot contact.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { decide, matchPersona, shouldRun, withUnsubscribe, type Persona } from '../_shared/followup-rules.ts';

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const HS = 'https://connector-gateway.lovable.dev/hubspot';
const HS_V = '2026-09';
const hsPath = { search: `/crm/objects/${HS_V}/contacts/search`, contacts: `/crm/objects/${HS_V}/contacts`, notes: `/crm/objects/${HS_V}/notes` };

async function hubspot(path: string, body: unknown) {
  const lk = Deno.env.get('LOVABLE_API_KEY'), hk = Deno.env.get('HUBSPOT_API_KEY');
  if (!lk || !hk) throw new Error('HubSpot not configured');
  const r = await fetch(`${HS}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${lk}`, 'X-Connection-Api-Key': hk, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const t = await r.text();
  if (!r.ok) throw new Error(`HubSpot [${r.status}]: ${t.slice(0, 300)}`);
  return JSON.parse(t);
}

async function hubspotNote(email: string, known: string | null, text: string) {
  let id = known;
  if (!id) {
    const s = await hubspot(hsPath.search, { filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }], limit: 1 });
    id = s.results?.[0]?.id ?? (await hubspot(hsPath.contacts, { properties: { email } })).id;
  }
  const note = await hubspot(hsPath.notes, {
    properties: { hs_timestamp: new Date().toISOString(), hs_note_body: text },
    associations: [{ to: { id }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }] }],
  });
  return { contactId: id as string, noteId: note.id as string };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: ok } = await admin.rpc('dispatch_secret_ok', { _s: req.headers.get('x-dispatch-secret') });
  if (!ok) return json({ error: 'Unauthorized' }, 401);

  const now = new Date();
  const { data: settings } = await admin.from('admin_settings').select('followup_live_sending, followup_last_run_at').eq('id', 1).single();
  if (!shouldRun(settings?.followup_last_run_at ?? null, now)) return json({ skipped: 'not due' });
  await admin.from('admin_settings').update({ followup_last_run_at: now.toISOString() }).eq('id', 1);

  const { data: personas } = await admin.from('followup_personas').select('id, approved, signals, subject, body, version, label, persona_key').eq('approved', true);
  if (!personas?.length) return json({ skipped: 'no approved visitor types' });

  const { data: consents } = await admin.from('visitor_consents')
    .select('id, email, consent_status, opted_out_at, last_emailed_at, posthog_distinct_id, hubspot_contact_id, unsubscribe_token')
    .not('posthog_distinct_id', 'is', null).limit(500);
  if (!consents?.length) return json({ checked: 0 });

  const personal = Deno.env.get('POSTHOG_PERSONAL_API_KEY'), projectId = Deno.env.get('POSTHOG_PROJECT_ID');
  const region = Deno.env.get('POSTHOG_REGION') || 'us';
  const app = region === 'eu' ? 'https://eu.posthog.com' : 'https://us.posthog.com';
  const ingest = region === 'eu' ? 'https://eu.i.posthog.com' : 'https://us.i.posthog.com';
  if (!personal || !projectId) return json({ error: 'PostHog reading key missing' }, 500);

  const ids = consents.map((c) => c.posthog_distinct_id!.replace(/'/g, ''));
  const q = await fetch(`${app}/api/projects/${projectId}/query/`, {
    method: 'POST', headers: { Authorization: `Bearer ${personal}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query:
      `SELECT distinct_id, groupUniqArray(properties.$pathname) FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL 7 DAY AND distinct_id IN (${ids.map((i) => `'${i}'`).join(',')}) GROUP BY distinct_id` } }),
  });
  if (!q.ok) { const t = await q.text(); console.error('PostHog query failed', q.status, t.slice(0, 300)); return json({ error: 'PostHog query failed', status: q.status, details: t.slice(0, 300) }, 502); }
  const pagesBy = new Map<string, string[]>(((await q.json()).results ?? []).map((r: [string, string[]]) => [r[0], (r[1] ?? []).filter(Boolean).slice(0, 50)]));

  const { data: prior } = await admin.from('followup_sends').select('consent_id, persona_id, status').in('consent_id', consents.map((c) => c.id));
  const sentKey = new Set((prior ?? []).filter((p) => p.status === 'sent').map((p) => `${p.consent_id}:${p.persona_id}`));
  const report = { checked: 0, sent: 0, skipped: 0, errors: 0 };
  const token = Deno.env.get('POSTHOG_API_KEY');

  for (const c of consents) {
    const pages = pagesBy.get(c.posthog_distinct_id!);
    if (!pages?.length) continue;
    const persona = matchPersona(pages, personas as Persona[]) as (typeof personas)[number] | null;
    if (!persona) continue;
    report.checked++;
    const d = decide({ live: !!settings?.followup_live_sending, consent: c, alreadySent: sentKey.has(`${c.id}:${persona.id}`), now });
    if (!d.send) {
      report.skipped++;
      if (d.reason !== 'already got this one') await admin.from('followup_sends').upsert({ consent_id: c.id, persona_id: persona.id, persona_version: persona.version, status: 'skipped', reason: d.reason, pages, updated_at: now.toISOString() }, { onConflict: 'consent_id,persona_id' });
      continue;
    }
    try {
      const r = await fetch(`${ingest}/i/v0/e/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        api_key: token, event: 'followup_email_requested', distinct_id: c.posthog_distinct_id,
        properties: { email: c.email, subject: persona.subject, body: withUnsubscribe(persona.body!, c.unsubscribe_token), persona_key: persona.persona_key, $set: { email: c.email } },
      }) });
      if (!r.ok) throw new Error(`PostHog [${r.status}]: ${(await r.text()).slice(0, 200)}`);
      await admin.from('followup_sends').upsert({ consent_id: c.id, persona_id: persona.id, persona_version: persona.version, status: 'sent', reason: null, pages, sent_at: now.toISOString(), updated_at: now.toISOString() }, { onConflict: 'consent_id,persona_id' });
      await admin.from('visitor_consents').update({ last_emailed_at: now.toISOString() }).eq('id', c.id);
      report.sent++;
      try {
        const hs = await hubspotNote(c.email, c.hubspot_contact_id, `CouponDonation follow-up sent: "${persona.subject}" (${persona.label}). Pages viewed: ${pages.join(', ')}`);
        await admin.from('visitor_consents').update({ hubspot_contact_id: hs.contactId }).eq('id', c.id);
        await admin.from('followup_sends').update({ hubspot_note_id: hs.noteId }).eq('consent_id', c.id).eq('persona_id', persona.id);
      } catch (e) { console.error('HubSpot note failed', String(e)); }
    } catch (e) {
      report.errors++;
      await admin.from('followup_sends').upsert({ consent_id: c.id, persona_id: persona.id, persona_version: persona.version, status: 'skipped', reason: `send failed: ${String(e).slice(0, 200)}`, pages, updated_at: now.toISOString() }, { onConflict: 'consent_id,persona_id' });
    }
  }
  return json(report);
});
