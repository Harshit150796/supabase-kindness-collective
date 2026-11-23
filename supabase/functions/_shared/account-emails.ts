// Donation confirmations, "fundraiser is live" and welcome emails. Exactly once per source via
// claim_account_email (unique kind+source_id). Reads payment tables only; never writes them.
import { shell, escapeHtml, INBOX_LINE, NOTIFY_SENDER, SUPPORT_EMAIL, SUPPORT_LINE, type RenderedEmail } from './email-layout.ts';
import { SHARE_HOST } from './share-preview.ts';
import { isSuppressed } from './suppression.ts';
import { liveShareMessage, type Beneficiary } from './share-message.ts';

const SITE = 'https://coupondonation.com';
const TOKEN_DAYS = 30;
export const CHARITY_LINE = 'This donation is not tax-deductible.';
export const NO_FUNDRAISER_NEXT =
  'Next: it becomes coupons for the stores you chose, for families who asked for help.';
export const FUNDRAISER_NEXT =
  'Next: it becomes a gift card for the store they asked for. We’ll email you when they receive it.';

const first = (n?: string | null) => (n ?? '').trim().split(/\s+/)[0] || '';
const money = (n: number) => `$${Number(n).toFixed(2)}`;
const short = (n: number) => `$${Number(n).toFixed(Number(n) % 1 ? 2 : 0)}`;
export const formatET = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso)) + ' ET';
export const shortRef = (id: string) => id.replace(/-/g, '').slice(0, 8).toUpperCase();

export function renderDonationConfirmation(o: {
  firstName?: string; amount: number; at: string; donationId: string; fundraiserTitle?: string | null; fundraiserUrl?: string | null;
  retailers?: string[]; coins?: { kind: 'credited' | 'pending'; coins: number } | null; link: { label: string; url: string }; test?: boolean;
}): RenderedEmail {
  const forLine = o.fundraiserTitle ? `For: “${o.fundraiserTitle}”` : `For: ${(o.retailers?.length ? o.retailers : ['the retailers you chose']).join(', ')}`;
  const thanks = o.fundraiserTitle ? `Thank you. Your ${short(o.amount)} for “${o.fundraiserTitle}” is confirmed.` : `Thank you. Your ${short(o.amount)} donation is confirmed.`;
  const next = o.fundraiserTitle ? FUNDRAISER_NEXT : NO_FUNDRAISER_NEXT;
  const coinLine = !o.coins || o.coins.coins <= 0 ? null : o.coins.kind === 'credited'
    ? `${o.coins.coins.toLocaleString('en-US')} Gold Coins were added to your account for this donation.`
    : `You have ${o.coins.coins.toLocaleString('en-US')} Gold Coins waiting. Sign in with this email address to claim them.`;
  const shareLine = null as string | null; // kept short (founder request, Nov 21, 2026)
  const details = [`Amount charged: ${money(o.amount)}`, `Date: ${formatET(o.at)}`, forLine, `Reference: ${shortRef(o.donationId)}`];
  const subject = o.fundraiserTitle ? 'Thank you. Your donation is on its way.' : 'Thank you. Your donation is confirmed.';
  const footerLines = [CHARITY_LINE, ...(o.test ? ['This is a test message.'] : [])];
  const greeting = o.firstName ? `Hi ${o.firstName}` : 'Hi there';
  const html = shell({
    preheader: thanks, greeting, headline: 'Your donation is confirmed',
    paragraphs: [thanks, next, ...(coinLine ? [coinLine] : [])],
    valueCard: { label: 'Amount', value: money(o.amount), details: [formatET(o.at), forLine, `Reference ${shortRef(o.donationId)}`] },
    closing: shareLine ? [shareLine] : undefined,
    link: o.link, footer: footerLines.map(escapeHtml).join('<br>'), sample: o.test, inboxLine: true,
  });
  const text = [`${greeting},`, '', thanks, '', next, ...(coinLine ? ['', coinLine] : []), '', ...details, '',
    `${o.link.label}: ${o.link.url}`, ...(shareLine ? ['', shareLine] : []), '', '— The CouponDonation team', '', ...footerLines, INBOX_LINE, SUPPORT_LINE].join('\n');
  return { subject, html, text };
}

// The organizer's ready-made message lives in share-message.ts (the site's share screen uses it too).
export { liveShareMessage, type Beneficiary } from './share-message.ts';

/**
 * "Your fundraiser is live" (rewritten Nov 21–22, 2026, founder request: our emails should reach Gmail's
 * Primary tab, and the "Message to copy" stays). The old version (a three-step checklist with SMS, Facebook
 * and email-draft links plus the message) went to Promotions from every sender. Tests of this note with and
 * without the message to copy always landed in the same tab as each other: the reader's history with our
 * sender decided it, not the message. So it is a short note: what happened, the one thing to do today (text
 * the link to five people), the link, the message to copy, and an offer to help with the words. Same note,
 * worded for where they are, for fundraisers that were already live (`already`) and for ones that have gifts
 * (`hasGifts`).
 */
export function renderFundraiserLive(o: {
  firstName?: string; title: string; slug: string; id?: string; stores?: string[]; beneficiary?: Beneficiary; test?: boolean;
  /** Sent to a fundraiser that was already live before the checklist existed. */
  already?: boolean;
  /** It already has gifts: the email is about more gifts, not the first ones. */
  hasGifts?: boolean;
}): RenderedEmail {
  const shareUrl = `${SHARE_HOST}/f/${encodeURIComponent(o.slug)}`;
  const greeting = o.firstName ? `Hi ${o.firstName}` : 'Hi there';
  const p1 = o.hasGifts ? `Gifts are coming in for “${o.title}”. Thank you for trusting us with it.`
    : o.already ? `“${o.title}” is live on CouponDonation. Thank you for trusting us with it.`
    : `“${o.title}” is live. Thank you for trusting us with it.`;
  const p2 = o.hasGifts
    ? 'More gifts almost always come from people who know you, so the best thing you can do today is text your link to five more people, one at a time.'
    : 'The first gifts almost always come from people who know you, so the best thing you can do today is text your link to five people, one at a time.';
  const { chat } = liveShareMessage(o, shareUrl);
  const help = 'Want different words? Just reply and we’ll help you write them.';
  const html = shell({
    preheader: p1, greeting, headline: o.hasGifts ? 'Gifts are coming in' : 'Your fundraiser is live', paragraphs: [p1, p2],
    linkLine: { lead: 'Here’s your link:', label: shareUrl.replace(/^https:\/\//, ''), url: shareUrl },
    copyBox: { label: 'Message to copy', body: chat }, closing: [help],
    footer: o.test ? 'This is a test message.' : undefined, sample: o.test, inboxLine: true,
  });
  const text = [
    `${greeting},`, '', p1, '', p2, '', `Here’s your link: ${shareUrl}`, '', 'Message to copy:', '', chat, '', help, '',
    '— The CouponDonation team', '', ...(o.test ? ['This is a test message.'] : []), INBOX_LINE, SUPPORT_LINE,
  ].join('\n');
  // Subjects say what happened and match email_topic() ('your fundraiser is live' → fundraiser emails).
  return { subject: o.hasGifts ? 'Your fundraiser is live and gifts are coming in' : 'Your fundraiser is live', html, text };
}

/**
 * The welcome email (founder request, Nov 22, 2026): sent by the site, once, a few minutes after someone opens
 * an account, while its switch in Admin > Emails > Automatic emails is on. The founder's approved wording, first
 * sent by hand; people who unsubscribed are skipped. Its subject is filed under account emails (email_topic).
 */
export const WELCOME_PARAGRAPHS = [
  'Welcome to CouponDonation. Thank you for joining us.',
  'On CouponDonation, donations become store gift cards and coupons for what a family needs, like groceries, travel or health costs. You can start a fundraiser or give to one at coupondonation.com.',
  'You can reply to this email and a person on our team will answer.',
];
export function renderWelcome(o: { firstName?: string; test?: boolean }): RenderedEmail {
  const greeting = o.firstName ? `Hi ${o.firstName}` : 'Hi there';
  const html = shell({
    preheader: WELCOME_PARAGRAPHS[0], greeting, headline: 'Welcome to CouponDonation', paragraphs: WELCOME_PARAGRAPHS,
    footer: o.test ? 'This is a test message.' : undefined, sample: o.test, inboxLine: true,
  });
  const text = [
    `${greeting},`, '', ...WELCOME_PARAGRAPHS.flatMap((p) => [p, '']),
    '— The CouponDonation team', '', ...(o.test ? ['This is a test message.'] : []), INBOX_LINE, SUPPORT_LINE,
  ].join('\n');
  return { subject: 'Welcome to CouponDonation', html, text };
}

export async function sendAccountMail(key: string, to: string, mail: RenderedEmail, bcc?: string[]) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: NOTIFY_SENDER.from, reply_to: NOTIFY_SENDER.replyTo, to: [to], ...(bcc?.length ? { bcc } : {}), ...mail }),
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
  const { data: d } = await admin.from('donations').select('id, amount, created_at, donor_email, donor_id, donor_name, brand_partner, fundraiser_id, fundraisers(title, unique_slug)').eq('id', id).maybeSingle();
  if (!d) return { to: null, mail: null };
  const { data: prof } = d.donor_id ? await admin.from('profiles').select('email, full_name').eq('user_id', d.donor_id).maybeSingle() : { data: null };
  const to = d.donor_email || prof?.email || null;
  if (!to) return { to: null, mail: null };
  const fundraiserUrl = d.fundraisers?.unique_slug ? `${SHARE_HOST}/f/${encodeURIComponent(d.fundraisers.unique_slug)}` : null;
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
    fundraiserTitle: d.fundraisers?.title ?? null, fundraiserUrl, retailers, coins, link }) };
}

// deno-lint-ignore no-explicit-any
async function buildLive(admin: any, id: string) {
  const { data: f } = await admin.from('fundraisers').select('id, title, unique_slug, user_id, preferred_brands, beneficiary_type').eq('id', id).maybeSingle();
  if (!f?.unique_slug) return { to: null, mail: null };
  const { data: p } = await admin.from('profiles').select('email, full_name').eq('user_id', f.user_id).maybeSingle();
  return { to: p?.email ?? null, mail: renderFundraiserLive({ firstName: first(p?.full_name), title: f.title, slug: f.unique_slug, id: f.id, stores: f.preferred_brands ?? [], beneficiary: f.beneficiary_type }) };
}

/**
 * One-time checklist for fundraisers that were live before the checklist email existed (founder request,
 * Nov 9, 2026): every active, non-example fundraiser except those whose "is live" email was sent at or after
 * CHECKLIST_SINCE (they got the checklist already). Sent once each (claim_account_email kind
 * 'fundraiser_checklist'); people who unsubscribed from our emails are skipped.
 */
export const CHECKLIST_SINCE = '2026-11-09T21:08:04Z';
type MailRow = { kind: string; source_id: string; status: string; sent_at: string | null };
export function checklistDue(fundraisers: { id: string }[], rows: MailRow[], since = CHECKLIST_SINCE, limit = 10): string[] {
  const has = (id: string, test: (r: MailRow) => boolean) => rows.some((r) => r.source_id === id && test(r));
  return fundraisers.map((f) => f.id).filter((id) =>
    !has(id, (r) => r.kind === 'fundraiser_checklist' && r.status !== 'failed') &&
    !has(id, (r) => r.kind === 'fundraiser_live' && r.status === 'sent' && !!r.sent_at && Date.parse(r.sent_at) >= Date.parse(since)),
  ).slice(0, limit);
}

// deno-lint-ignore no-explicit-any
export async function dueChecklistEmails(admin: any): Promise<string[]> {
  const { data: live } = await admin.from('fundraisers').select('id').eq('status', 'active').not('is_example', 'is', true).limit(500);
  const ids = ((live ?? []) as { id: string }[]).map((f) => f.id);
  if (!ids.length) return [];
  const { data: rows } = await admin.from('account_emails').select('kind, source_id, status, sent_at').in('kind', ['fundraiser_live', 'fundraiser_checklist']).in('source_id', ids);
  return checklistDue(live ?? [], (rows ?? []) as MailRow[]);
}

// deno-lint-ignore no-explicit-any
async function buildChecklist(admin: any, id: string): Promise<{ to: string | null; mail: RenderedEmail | null; unsubscribed?: boolean }> {
  const { data: f } = await admin.from('fundraisers').select('id, title, unique_slug, user_id, preferred_brands, beneficiary_type, is_example').eq('id', id).maybeSingle();
  if (!f?.unique_slug || f.is_example) return { to: null, mail: null };
  const { data: p } = await admin.from('profiles').select('email, full_name').eq('user_id', f.user_id).maybeSingle();
  if (!p?.email) return { to: null, mail: null };
  if (await isSuppressed(admin, p.email)) return { to: p.email, mail: null, unsubscribed: true };
  const { data: totals } = await admin.rpc('get_fundraiser_totals', { _fundraiser_id: id });
  const gifts = Number((Array.isArray(totals) ? totals[0] : totals)?.donations_count ?? 0);
  return { to: p.email, mail: renderFundraiserLive({ firstName: first(p.full_name), title: f.title, slug: f.unique_slug, id: f.id, stores: f.preferred_brands ?? [], beneficiary: f.beneficiary_type, already: true, hasGifts: gifts > 0 }) };
}

// deno-lint-ignore no-explicit-any
async function buildWelcome(admin: any, userId: string): Promise<{ to: string | null; mail: RenderedEmail | null; unsubscribed?: boolean }> {
  const { data: p } = await admin.from('profiles').select('email, full_name').eq('user_id', userId).maybeSingle();
  if (!p?.email) return { to: null, mail: null };
  if (await isSuppressed(admin, p.email)) return { to: p.email, mail: null, unsubscribed: true };
  return { to: p.email, mail: renderWelcome({ firstName: first(p.full_name) }) };
}

export type AccountEmailKind = 'donation_confirmation' | 'fundraiser_live' | 'fundraiser_checklist' | 'fundraiser_share_again' | 'welcome';

/** Claim then send. Returns 'sent' | 'not_due' | 'no_recipient' | 'unsubscribed' | 'failed'. */
// deno-lint-ignore no-explicit-any
export async function processAccountEmail(admin: any, key: string | undefined, kind: AccountEmailKind, id: string, by: string) {
  const { data: claimed, error } = await admin.rpc('claim_account_email', { _kind: kind, _source: id, _by: by });
  if (error || !claimed) return 'not_due';
  const mark = (patch: Record<string, unknown>) => admin.from('account_emails').update(patch).eq('kind', kind).eq('source_id', id);
  try {
    if (kind === 'donation_confirmation') await admin.rpc('credit_gold_coins');
    const built: { to: string | null; mail: RenderedEmail | null; unsubscribed?: boolean } = kind === 'donation_confirmation' ? await buildDonation(admin, id)
      : kind === 'fundraiser_checklist' || kind === 'fundraiser_share_again' ? await buildChecklist(admin, id)
      : kind === 'welcome' ? await buildWelcome(admin, id) : await buildLive(admin, id);
    const { to, mail } = built;
    if (built.unsubscribed) { await mark({ status: 'skipped', last_error: 'Unsubscribed' }); return 'unsubscribed'; }
    if (!to || !mail) { await mark({ status: 'skipped', last_error: 'No recipient email' }); return 'no_recipient'; }
    if (!key) throw new Error('Missing Resend key');
    // The one-time resend also goes to the support mailbox (blind copy), so the team sees each one in Zoho.
    const rid = await sendAccountMail(key, to, mail, kind === 'fundraiser_share_again' ? [SUPPORT_EMAIL] : undefined);
    await mark({ status: 'sent', resend_id: rid, sent_at: new Date().toISOString(), last_error: null });
    return 'sent';
  } catch (e) {
    await mark({ status: 'failed', last_error: String(e).slice(0, 500) });
    return 'failed';
  }
}

/**
 * The sharing checklist sent once more, in the new plain layout, to every open, non-example fundraiser
 * (founder request, Nov 21, 2026). Claimed once per fundraiser as account email kind 'fundraiser_share_again';
 * people who unsubscribed are skipped; a blind copy goes to support@ so the team sees each one in Zoho.
 * Up to 10 a dispatcher run, so the whole batch goes out over the next hour or so.
 * Only fundraisers that were open when it went out (created before SHARE_AGAIN_BEFORE): new ones already get
 * "Your fundraiser is live", and without this cutoff they got the same email twice, a second apart (seen in
 * Admin > Emails, Nov 23, 2026).
 */
export const SHARE_AGAIN_BEFORE = '2026-11-21T15:31:01Z';
export function shareAgainDue(fundraisers: { id: string; created_at?: string | null }[], rows: MailRow[], limit = 10, before = SHARE_AGAIN_BEFORE): string[] {
  const done = new Set(rows.filter((r) => r.kind === 'fundraiser_share_again' && r.status !== 'failed').map((r) => r.source_id));
  return fundraisers.filter((f) => !f.created_at || Date.parse(f.created_at) < Date.parse(before))
    .map((f) => f.id).filter((id) => !done.has(id)).slice(0, limit);
}

// deno-lint-ignore no-explicit-any
export async function dueShareAgainEmails(admin: any): Promise<string[]> {
  const { data: live } = await admin.from('fundraisers').select('id, created_at').eq('status', 'active').not('is_example', 'is', true)
    .lt('created_at', SHARE_AGAIN_BEFORE).order('created_at', { ascending: true }).limit(500);
  const ids = ((live ?? []) as { id: string }[]).map((f) => f.id);
  if (!ids.length) return [];
  const { data: rows } = await admin.from('account_emails').select('kind, source_id, status, sent_at').eq('kind', 'fundraiser_share_again').in('source_id', ids);
  return shareAgainDue(live ?? [], (rows ?? []) as MailRow[]);
}
