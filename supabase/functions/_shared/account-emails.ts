// Donation confirmations and "fundraiser is live" emails. Exactly once per source via
// claim_account_email (unique kind+source_id). Reads payment tables only; never writes them.
import { shell, escapeHtml, NOTIFY_SENDER, SUPPORT_LINE, type RenderedEmail } from './email-layout.ts';

const SITE = 'https://coupondonation.com';
const TOKEN_DAYS = 30;
export const CHARITY_LINE = 'CouponDonation is not a registered charity, so this donation is not tax-deductible.';
export const NO_FUNDRAISER_NEXT =
  'Your donation becomes coupons for the retailers you chose. Once they are ready, they go into our shared pool, where verified families can claim them from their voucher wallet.';
export const FUNDRAISER_NEXT = (organizer: string) =>
  `Your donation becomes coupons for ${organizer}, and we will email you when they receive it.`;

const first = (n?: string | null) => (n ?? '').trim().split(/\s+/)[0] || '';
const money = (n: number) => `$${Number(n).toFixed(2)}`;
export const formatET = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso)) + ' ET';
export const shortRef = (id: string) => id.replace(/-/g, '').slice(0, 8).toUpperCase();

export function renderDonationConfirmation(o: {
  firstName?: string; amount: number; at: string; donationId: string; fundraiserTitle?: string | null; organizer?: string | null;
  retailers?: string[]; coins?: { kind: 'credited' | 'pending'; coins: number } | null; link: { label: string; url: string }; test?: boolean;
}): RenderedEmail {
  const forLine = o.fundraiserTitle ? `For: “${o.fundraiserTitle}”` : `For: ${(o.retailers?.length ? o.retailers : ['the retailers you chose']).join(', ')}`;
  const next = o.fundraiserTitle ? FUNDRAISER_NEXT(o.organizer || 'the organizer') : NO_FUNDRAISER_NEXT;
  const coinLine = !o.coins || o.coins.coins <= 0 ? null : o.coins.kind === 'credited'
    ? `${o.coins.coins.toLocaleString('en-US')} Gold Coins were added to your account for this donation.`
    : `You have ${o.coins.coins.toLocaleString('en-US')} Gold Coins waiting. Sign in with this email address to claim them.`;
  const details = [`Amount charged: ${money(o.amount)}`, `Date: ${formatET(o.at)}`, forLine, `Reference: ${shortRef(o.donationId)}`];
  const subject = o.fundraiserTitle ? 'Your fundraiser donation is confirmed' : 'Your direct donation is confirmed';
  const footerLines = [CHARITY_LINE, 'Questions? Just reply to this email.', ...(o.test ? ['This is a test message.'] : [])];
  const greeting = o.firstName ? `Hi ${o.firstName}` : 'Hi there';
  const html = shell({
    preheader: 'Thank you. Here are the details of your donation.', greeting,
    status: 'Donation confirmed', headline: 'Your donation is recorded',
    paragraphs: ['Thank you for your donation.', next, ...(coinLine ? [coinLine] : [])],
    valueCard: { label: 'Donation record', value: money(o.amount), details: [formatET(o.at), forLine, `Reference ${shortRef(o.donationId)}`] },
    timeline: [
      { label: 'Donated', detail: formatET(o.at), complete: true },
      { label: 'Coupon created', detail: 'We will update you when it is ready.', complete: false },
      { label: 'Received', complete: false },
      { label: 'Used', complete: false },
    ],
    link: o.link, footer: footerLines.map(escapeHtml).join('<br>'), sample: o.test,
  });
  const text = [`${greeting},`, '', 'Thank you for your donation.', '', ...details, '', next, ...(coinLine ? ['', coinLine] : []), '',
    `${o.link.label}: ${o.link.url}`, '', '— The CouponDonation team', '', ...footerLines, SUPPORT_LINE].join('\n');
  return { subject, html, text };
}

export function renderFundraiserLive(o: { firstName?: string; title: string; slug: string; test?: boolean }): RenderedEmail {
  const url = `${SITE}/f/${o.slug}`;
  const greeting = o.firstName ? `Hi ${o.firstName}` : 'Hi there';
  const p1 = `Your fundraiser “${o.title}” is approved and now visible to donors.`;
  const p2 = 'You can manage it any time from your dashboard.';
  const html = shell({ preheader: 'Your fundraiser is now visible to donors.', greeting, status: 'Fundraiser live', headline: 'Your fundraiser is ready to share', paragraphs: [p1, p2],
    valueCard: { label: 'Fundraiser', value: o.title, details: ['Approved and visible to donors'] },
    link: { label: 'View your fundraiser', url }, footer: o.test ? 'This is a test message.' : undefined, sample: o.test });
  const text = [`${greeting},`, '', p1, '', `View your fundraiser: ${url}`, '', p2, '', '— The CouponDonation team', ...(o.test ? ['', 'This is a test message.'] : []), '', SUPPORT_LINE].join('\n');
  return { subject: 'Your fundraiser is live', html, text };
}

export async function sendAccountMail(key: string, to: string, mail: RenderedEmail) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: NOTIFY_SENDER.from, reply_to: NOTIFY_SENDER.replyTo, to: [to], ...mail }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`[${r.status}] ${t}`);
  return JSON.parse(t).id as string;
}

async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
const newToken = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// deno-lint-ignore no-explicit-any
async function buildDonation(admin: any, id: string): Promise<{ to: string | null; mail: RenderedEmail | null }> {
  const { data: d } = await admin.from('donations').select('id, amount, created_at, donor_email, donor_id, donor_name, brand_partner, fundraiser_id, fundraisers(title, user_id)').eq('id', id).maybeSingle();
  if (!d) return { to: null, mail: null };
  const { data: prof } = d.donor_id ? await admin.from('profiles').select('email, full_name').eq('user_id', d.donor_id).maybeSingle() : { data: null };
  const to = d.donor_email || prof?.email || null;
  if (!to) return { to: null, mail: null };
  let organizer: string | null = null;
  if (d.fundraisers?.user_id) {
    const { data: op } = await admin.from('profiles').select('full_name').eq('user_id', d.fundraisers.user_id).maybeSingle();
    organizer = first(op?.full_name) || null;
  }
  const { data: brands } = await admin.from('donation_brands').select('brand_name').eq('donation_id', id);
  const retailers = (brands ?? []).map((b: { brand_name: string }) => b.brand_name).filter(Boolean);
  if (!retailers.length && d.brand_partner) retailers.push(...String(d.brand_partner).split(',').map((s: string) => s.trim()).filter(Boolean));
  const { data: led } = await admin.from('gold_coin_ledger').select('coins, status').eq('donation_id', id).eq('entry_type', 'credit').maybeSingle();
  const coins = led?.status === 'credited' ? { kind: 'credited' as const, coins: led.coins } : led?.status === 'pending' && !d.donor_id ? { kind: 'pending' as const, coins: led.coins } : null;
  let link = { label: 'View your donations', url: `${SITE}/dashboard/giving` };
  if (!d.donor_id) {
    const token = newToken();
    await admin.from('donation_impact_tokens').insert({ donation_id: id, token_hash: await sha256(token), expires_at: new Date(Date.now() + TOKEN_DAYS * 86400_000).toISOString() });
    link = { label: 'Follow your donation', url: `${SITE}/impact/${token}` };
  }
  return { to, mail: renderDonationConfirmation({ firstName: first(d.donor_name) || first(prof?.full_name), amount: Number(d.amount), at: d.created_at, donationId: d.id,
    fundraiserTitle: d.fundraisers?.title ?? null, organizer, retailers, coins, link }) };
}

// deno-lint-ignore no-explicit-any
async function buildLive(admin: any, id: string) {
  const { data: f } = await admin.from('fundraisers').select('title, unique_slug, user_id').eq('id', id).maybeSingle();
  if (!f?.unique_slug) return { to: null, mail: null };
  const { data: p } = await admin.from('profiles').select('email, full_name').eq('user_id', f.user_id).maybeSingle();
  return { to: p?.email ?? null, mail: renderFundraiserLive({ firstName: first(p?.full_name), title: f.title, slug: f.unique_slug }) };
}

/** Claim then send. Returns 'sent' | 'not_due' | 'no_recipient' | 'failed'. */
// deno-lint-ignore no-explicit-any
export async function processAccountEmail(admin: any, key: string | undefined, kind: 'donation_confirmation' | 'fundraiser_live', id: string, by: string) {
  const { data: claimed, error } = await admin.rpc('claim_account_email', { _kind: kind, _source: id, _by: by });
  if (error || !claimed) return 'not_due';
  const mark = (patch: Record<string, unknown>) => admin.from('account_emails').update(patch).eq('kind', kind).eq('source_id', id);
  try {
    if (kind === 'donation_confirmation') await admin.rpc('credit_gold_coins');
    const { to, mail } = kind === 'donation_confirmation' ? await buildDonation(admin, id) : await buildLive(admin, id);
    if (!to || !mail) { await mark({ status: 'skipped', last_error: 'No recipient email' }); return 'no_recipient'; }
    if (!key) throw new Error('Missing Resend key');
    const rid = await sendAccountMail(key, to, mail);
    await mark({ status: 'sent', resend_id: rid, sent_at: new Date().toISOString(), last_error: null });
    return 'sent';
  } catch (e) {
    await mark({ status: 'failed', last_error: String(e).slice(0, 500) });
    return 'failed';
  }
}
