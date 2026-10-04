// TEMPORARY: founder-only samples. Deleted after use.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { renderDonationConfirmation, renderFundraiserLive, sendAccountMail } from '../_shared/account-emails.ts';

const TO = 'haagrawa123@gmail.com';
const json = (b: unknown) => new Response(JSON.stringify(b), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const key = Deno.env.get('RESEND_API_KEY')!;
  const body = await req.json().catch(() => ({}));
  if (typeof body?.status_id === 'string') {
    const r = await fetch(`https://api.resend.com/emails/${body.status_id}`, { headers: { Authorization: `Bearer ${key}` } });
    const j = await r.json();
    return json({ id: j.id, to: j.to, from: j.from, reply_to: j.reply_to, subject: j.subject, last_event: j.last_event });
  }
  if (body?.go !== 'send-once-2026-10-04') return json({ error: 'no' });
  const at = new Date(Date.now() - 3 * 60_000).toISOString();
  const fr = await sendAccountMail(key, TO, { ...renderDonationConfirmation({ firstName: 'Alex', amount: 25, at, donationId: '7c41e2a9-5b3d-4f10-9e2a-1d6b8c0f3a77',
    fundraiserTitle: 'Help Our Family With Groceries This Month', organizer: 'Maria', coins: { kind: 'credited', coins: 250 },
    link: { label: 'View your donations', url: 'https://coupondonation.com/dashboard/giving' }, test: true }) });
  const rt = await sendAccountMail(key, TO, renderDonationConfirmation({ firstName: 'Alex', amount: 30, at, donationId: '2f9a0c13-8d4e-4b6a-a1c7-5e3d9b2f6c08',
    retailers: ['Walmart', 'Kroger'], coins: { kind: 'pending', coins: 300 },
    link: { label: 'Follow your donation', url: 'https://coupondonation.com/impact/sample' }, test: true }));
  const live = await sendAccountMail(key, TO, renderFundraiserLive({ firstName: 'Maria', title: 'Help Our Family With Groceries This Month', slug: 'help-our-family-with-groceries', test: true }));
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: c } = await admin.from('email_campaigns').insert({ subject: 'What your support made possible this autumn', audience_type: 'single', test_recipients: [TO], status: 'draft', tracking_enabled: false,
    html_content: '<p>Hi {{first_name}},</p><p>Thank you for being part of CouponDonation this season. Families in our community are using your support for groceries and everyday essentials.</p><p><a href="https://coupondonation.com/stories">Read their stories</a></p><p>This is a test message.</p>' }).select('id').single();
  const nl = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-newsletter`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` }, body: JSON.stringify({ campaign_id: c!.id }) });
  const nlRes = await nl.json();
  await admin.from('email_campaigns').delete().eq('id', c!.id);
  return json({ fundraiser_confirmation: fr, retailer_confirmation: rt, live, newsletter: nlRes });
});
