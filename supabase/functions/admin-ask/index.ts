// The admin search box's "Ask" (founder request, Nov 2026). A team member types a plain question
// ("how many donations this week?", "fundraisers waiting for review", "emails that bounced"). The AI only
// turns the words into one choice from fixed lists: a number to look up (admin_ask_metric) or a page to
// open with its filters. It never sees a record, and every number in the answer comes from the database.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { requestUser } from '../_shared/auth.ts';
import { overLimit, HOUR } from '../_shared/rate-limit.ts';
import { buildLink, describeMetric, etStart, METRICS, PAGES, PARAM_VALUES, type AskPlan } from '../_shared/admin-ask.ts';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' })
  .formatToParts(new Date()).reduce((o, p) => ({ ...o, [p.type]: p.value }), {} as Record<string, string>);

const nullable = (t: Record<string, unknown>) => ({ anyOf: [t, { type: 'null' }] });
const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['action', 'metric', 'status', 'from', 'to', 'page', 'q', 'filter', 'understood'],
  properties: {
    action: { type: 'string', enum: ['count', 'open', 'search'] },
    metric: nullable({ type: 'string', enum: Object.keys(METRICS) }),
    status: nullable({ type: 'string', enum: ['pending', 'active', 'paused', 'completed', 'rejected'] }),
    from: nullable({ type: 'string', description: 'YYYY-MM-DD, inclusive' }),
    to: nullable({ type: 'string', description: 'YYYY-MM-DD, inclusive' }),
    page: nullable({ type: 'string', enum: Object.keys(PAGES) }),
    q: nullable({ type: 'string', description: 'Words, a name or an email to search for on that page' }),
    filter: nullable({ type: 'string', enum: [...new Set(Object.values(PARAM_VALUES).flat())] }),
    understood: { type: 'string', description: 'One short sentence: what you understood, in plain words' },
  },
};

async function plan(question: string): Promise<AskPlan | null> {
  const key = Deno.env.get('LOVABLE_API_KEY'); if (!key) return null;
  const t = today();
  const instructions = [
    'You turn a question from the CouponDonation operations team into ONE choice. CouponDonation turns donations into store coupons for families who run fundraisers.',
    `Today is ${t.weekday}, ${t.year}-${t.month}-${t.day} (US Eastern). Weeks start on Monday. "This month" means from the 1st until today.`,
    'Use action "count" when they ask how many / how much / totals, choosing one metric:',
    ...Object.entries(METRICS).map(([k, m]) => `- ${k}: ${m.help}`),
    'Use action "open" when they want to see a list or a page, choosing one page, an optional filter from its list, and optional search words q:',
    ...Object.entries(PAGES).map(([k, p]) => `- ${k}: ${p.help}${PARAM_VALUES[k] ? ` Filters: ${PARAM_VALUES[k].join(', ')}.` : ''}`),
    'Use action "search" when they typed a name, email, phone, amount, store or id to look up; put it in q.',
    'Dates: set from/to only when the question gives a time period. Leave anything you do not need as null. Never invent names or numbers.',
  ].join('\n');
  const r = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
    method: 'POST', headers: { 'Lovable-API-Key': key, Authorization: `Bearer ${key}`, 'X-Lovable-AIG-SDK': 'fetch', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-6-astra', stream: true, store: false, reasoning: { effort: 'low' }, max_output_tokens: 600,
      instructions, input: question,
      text: { format: { type: 'json_schema', name: 'plan', strict: true, schema: SCHEMA } },
    }),
  });
  if (!r.ok || !r.body) { console.error('admin-ask AI', r.status, (await r.text()).slice(0, 200)); return null; }
  let out = '', buf = '';
  const reader = r.body.pipeThrough(new TextDecoderStream()).getReader();
  for (;;) {
    const { value, done } = await reader.read(); if (done) break;
    buf += value; const lines = buf.split('\n'); buf = lines.pop() ?? '';
    for (const l of lines) {
      if (!l.startsWith('data:')) continue;
      try { const e = JSON.parse(l.slice(5)); if (e.type === 'response.output_text.delta') out += e.delta; } catch { /* keepalive */ }
    }
  }
  try { return JSON.parse(out) as AskPlan; } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const SUPA = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(SUPA, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const user = await requestUser(req, admin);
  if (!user) return json({ error: 'Please sign in first.' }, 401);
  const { data: team } = await admin.rpc('is_admin_any', { _uid: user.id });
  if (!team) return json({ error: 'Team access required' }, 403);
  const body = await req.json().catch(() => ({})) as { q?: unknown };
  const question = String(body.q ?? '').replace(/\s+/g, ' ').trim().slice(0, 300);
  if (question.length < 3) return json({ error: 'Type a question.' }, 400);
  if (await overLimit(admin, 'admin-ask', user.id, 60, HOUR)) return json({ error: 'Too many questions in an hour. Please wait a little.' }, 429);

  try {
    const p = await plan(question);
    if (!p) return json({ understood: null, search: question, error: 'The AI could not read that question. Showing matching records instead.' });
    const link = buildLink(p);
    if (p.action === 'count' && p.metric && METRICS[p.metric]) {
      // As the signed-in person, so the metric re-checks their team role.
      const asUser = createClient(SUPA, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
      const dated = METRICS[p.metric].dated;
      const from = dated && p.from ? etStart(p.from) : null;
      const toStart = dated && p.to ? etStart(p.to) : null;
      // "to" is inclusive: the end is the next Eastern midnight.
      const to = toStart ? etStart(new Date(new Date(toStart).getTime() + 36 * 3_600_000).toISOString().slice(0, 10)) : null;
      const { data, error } = await asUser.rpc('admin_ask_metric', {
        _metric: p.metric, _from: from, _to: to,
        _status: p.metric.includes('fundraisers') ? p.status : null,
      });
      if (error) { console.error('admin-ask metric', error); return json({ understood: p.understood, error: 'Could not work that out. Try the search results instead.', search: p.q ?? question }); }
      return json({ understood: p.understood, answer: describeMetric(p.metric, data as Record<string, unknown>), link: link ?? METRICS[p.metric].link });
    }
    if (p.action === 'open' && link) return json({ understood: p.understood, link });
    return json({ understood: p.understood, search: p.q?.trim() || question, link });
  } catch (e) {
    console.error('admin-ask', e);
    return json({ understood: null, search: question, error: 'Something went wrong. Showing matching records instead.' });
  }
});
