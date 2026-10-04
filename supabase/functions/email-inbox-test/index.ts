// Temporary founder-only delivery test. This function is deleted after one invocation.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { NOTIFY_SENDER } from '../_shared/email-layout.ts';
import { renderImpactEmail, renderUseReminderEmail } from '../_shared/impact-email.ts';
import { renderOwnerCouponEmail } from '../_shared/owner-alerts.ts';

const TO = 'haagrawa123@gmail.com';
const SITE = 'https://coupondonation.com';
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

async function send(key: string, mail: { subject: string; html: string; text: string }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: NOTIFY_SENDER.from, reply_to: NOTIFY_SENDER.replyTo, to: [TO], ...mail }),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`[${response.status}] ${body}`);
  return JSON.parse(body).id as string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return json({ error: 'Missing Resend key' }, 500);
  const now = Date.now(), hour = 3_600_000;
  const fundraiserTitle = 'Help Our Family With Groceries This Month';
  const common = { fundraiserTitle, organizer: 'Maria G.', donorFirstName: 'Alex', donatedAt: new Date(now - 26 * hour).toISOString(), impactUrl: `${SITE}/impact/sample`, thankUrl: `${SITE}/impact/sample#thanks`, stopUrl: `${SITE}/impact/sample`, sample: true };
  try {
    const owner = await send(key, renderOwnerCouponEmail({ fundraiserTitle, firstName: 'Maria', test: true, dashboardUrl: `${SITE}/my-fundraisers`, items: [{ brand: 'DoorDash', value: 20, type: 'code' }] }));
    const received = await send(key, renderImpactEmail({ ...common, kind: 'received', items: [{ brand: 'DoorDash', value: 20, createdAt: new Date(now - 25 * hour).toISOString(), receivedAt: new Date(now - 5 * 60_000).toISOString() }] }));
    const used = await send(key, renderImpactEmail({ ...common, kind: 'used', items: [{ brand: 'DoorDash', value: 20, createdAt: new Date(now - 25 * hour).toISOString(), receivedAt: new Date(now - 4 * hour).toISOString(), usedAt: new Date(now - 10 * 60_000).toISOString(), category: 'Meals', note: 'Dinner for the kids after a long week. Thank you so much.', hasReceipt: true }] }));
    const reminder = await send(key, renderUseReminderEmail({ brand: 'DoorDash', fundraiserTitle, firstName: 'Maria', dashboardUrl: `${SITE}/my-fundraisers`, sample: true }));
    return json({ to: TO, owner, received, used, reminder });
  } catch (error) {
    return json({ error: String(error) }, 502);
  }
});