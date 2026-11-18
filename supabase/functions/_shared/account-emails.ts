// Donation confirmations and "fundraiser is live" emails. Exactly once per source via
// claim_account_email (unique kind+source_id). Reads payment tables only; never writes them.
import { shell, escapeHtml, NOTIFY_SENDER, SUPPORT_LINE, type RenderedEmail } from './email-layout.ts';
import { SHARE_HOST } from './share-preview.ts';
import { isSuppressed } from './suppression.ts';

const SITE = 'https://coupondonation.com';
const TOKEN_DAYS = 30;
export const CHARITY_LINE = 'This donation is not tax-deductible.';
export const NO_FUNDRAISER_NEXT =
  'What happens next: your donation becomes coupons for the retailers you chose. Once they are ready, they go into our shared pool, where families who have asked for help can claim them.';
export const FUNDRAISER_NEXT =
  'What happens next: we turn it into a gift card for the store they asked for. We’ll email you when it’s received.';

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
  const shareLine = o.fundraiserTitle && o.fundraiserUrl ? `Want it to go further? Send the fundraiser to one person who would care: ${o.fundraiserUrl}` : null;
  const details = [`Amount charged: ${money(o.amount)}`, `Date: ${formatET(o.at)}`, forLine, `Reference: ${shortRef(o.donationId)}`];
  const subject = o.fundraiserTitle ? 'Thank you. Your donation is on its way.' : 'Thank you. Your donation is confirmed.';
  const footerLines = [CHARITY_LINE, 'Questions? Just reply to this email.', ...(o.test ? ['This is a test message.'] : [])];
  const greeting = o.firstName ? `Hi ${o.firstName}` : 'Hi there';
  const html = shell({
    preheader: 'Here is what happens next, and the details of your donation.', greeting, headline: 'Thank you',
    paragraphs: [thanks, next, ...(coinLine ? [coinLine] : [])],
    valueCard: { label: 'Donation record', value: money(o.amount), details: [formatET(o.at), forLine, `Reference ${shortRef(o.donationId)}`] },
    timeline: [
      { label: 'Donated', detail: formatET(o.at), complete: true },
      { label: 'Coupon created', detail: 'We will update you when it is ready.', complete: false },
      { label: 'Received', complete: false },
      { label: 'Used', complete: false },
    ],
    closing: shareLine ? [shareLine] : undefined,
    link: o.link, footer: footerLines.map(escapeHtml).join('<br>'), sample: o.test,
  });
  const text = [`${greeting},`, '', thanks, '', next, ...(coinLine ? ['', coinLine] : []), '', ...details, '',
    `${o.link.label}: ${o.link.url}`, ...(shareLine ? ['', shareLine] : []), '', '— The CouponDonation team', '', ...footerLines, SUPPORT_LINE].join('\n');
  return { subject, html, text };
}

/** Who a fundraiser is for (apply flow): it decides how the organizer's ready-made message reads. */
export type Beneficiary = 'yourself' | 'family' | 'organization' | string | null | undefined;

/**
 * The message an organizer sends friends, family and their church: what the fundraiser is, what a gift becomes
 * and the share link (which shows the fundraiser's photo and title in chats). Every line is true of every
 * fundraiser: gifts become gift cards for the stores asked for, and the smallest gift is $10.
 */
export function liveShareMessage(o: { title: string; stores?: string[]; beneficiary?: Beneficiary }, shareUrl: string) {
  const shops = (o.stores ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 2).join(' or ');
  const becomes = o.beneficiary === 'organization'
    ? `Every gift becomes a store gift card${shops ? ` (like ${shops})` : ''} for the people our group helps`
    : `Every gift becomes a gift card for ${o.beneficiary === 'family' ? 'a store my family needs' : 'a store I need'}${shops ? `, like ${shops}` : ''}`;
  return {
    becomes,
    chat: `Hi! I started a fundraiser on CouponDonation: “${o.title}”. ${becomes}, so you can see where it goes. Gifts start at $10. Would you take a look, and pass it on?\n${shareUrl}`,
  };
}

/**
 * "You're live" (rewritten Nov 15, 2026): sent once, minutes after a fundraiser goes live, with the three
 * things that bring first gifts. Each has one-tap links: a text or an email draft with the message already
 * written, Facebook and Snapchat with the link attached, and Instagram messages (Instagram can't be opened
 * with words filled in, so the message is in the email to copy).
 */
export function renderFundraiserLive(o: {
  firstName?: string; title: string; slug: string; id?: string; stores?: string[]; beneficiary?: Beneficiary; test?: boolean;
  /** Sent to a fundraiser that was already live before the checklist existed. */
  already?: boolean;
  /** It already has gifts: the email is about more gifts, not the first ones. */
  hasGifts?: boolean;
}): RenderedEmail {
  const url = `${SITE}/f/${encodeURIComponent(o.slug)}`;
  const shareUrl = `${SHARE_HOST}/f/${encodeURIComponent(o.slug)}`;
  const dashboardUrl = o.id ? `${SITE}/fundraiser/${o.id}` : `${SITE}/dashboard`;
  const greeting = o.firstName ? `Hi ${o.firstName}` : 'Hi there';
  const { becomes, chat } = liveShareMessage(o, shareUrl);
  const enc = encodeURIComponent;
  const churchNote = [
    'Hello,', '',
    `I’ve started a fundraiser on CouponDonation: “${o.title}”. Would you be willing to share it with our community, in the bulletin, a newsletter or a group chat?`, '',
    `${becomes}, and gifts start at $10. Here’s the link:`, shareUrl, '',
    'Thank you,', o.firstName ?? '',
  ].join('\n').trim();
  const instagram = { label: 'Instagram', url: 'https://www.instagram.com/direct/inbox/' };
  const snapchat = { label: 'Snapchat', url: `https://www.snapchat.com/share?link=${enc(shareUrl)}` };
  const steps = [
    {
      title: 'Text it to five people',
      detail: 'One at a time, by name. A personal message is hard to ignore.',
      actions: [
        { label: 'Text message', url: `sms:?&body=${enc(chat)}` }, instagram,
        { label: 'Email', url: `mailto:?subject=${enc(`“${o.title}” on CouponDonation`)}&body=${enc(chat)}` }, snapchat,
      ],
    },
    {
      title: 'Post it in your family group chat',
      detail: 'Paste the message below and ask everyone to pass it on.',
      actions: [instagram, { label: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}` }, snapchat],
    },
    {
      title: 'Ask your church or friends group to share it',
      detail: 'We wrote the note for you.',
      actions: [{ label: 'Email your church or group', url: `mailto:?subject=${enc('Could you share my fundraiser?')}&body=${enc(churchNote)}` }],
    },
  ];
  const p1 = o.already
    ? `“${o.title}” is live on CouponDonation. Here is a short checklist to help more people see it.`
    : `“${o.title}” is live on CouponDonation.`;
  const p2 = o.hasGifts
    ? 'Gifts usually come from people who know you, or from the people they pass it on to. Each new gift helps your fundraiser show higher in the lists donors browse.'
    : 'First gifts usually come from people who know you. Once one person gives, your fundraiser is shown ahead of those with no gifts yet. So today matters most.';
  const hint = 'For Instagram, copy this message and paste it in. Your link shows your fundraiser’s photo and title.';
  const after = 'Not sure what to say to someone? Reply to this email and we’ll help you word it.';
  const html = shell({
    preheader: 'Text it to five people, post it in your family chat and ask your church. We wrote the message for you.',
    greeting, headline: o.hasGifts ? 'Three steps to more gifts' : 'You’re live', paragraphs: [p1, p2],
    checklist: steps, copyBox: { label: 'A message you can copy', body: chat, hint }, closing: [after],
    link: { label: 'See your fundraiser', url }, secondaryLink: { label: 'Share it from your dashboard', url: dashboardUrl },
    footer: o.test ? 'This is a test message.' : undefined, sample: o.test,
  });
  const text = [
    `${greeting},`, '', p1, '', p2, '',
    ...steps.flatMap((step, i) => [`[ ] ${i + 1}. ${step.title}`, `    ${step.detail}`, '']),
    'A message you can copy:', '', chat, '', hint, '',
    'A note for your church or group:', '', churchNote, '',
    after, '',
    `See your fundraiser: ${url}`, `Share it from your dashboard: ${dashboardUrl}`, '',
    '— The CouponDonation team', ...(o.test ? ['', 'This is a test message.'] : []), '', SUPPORT_LINE,
  ].join('\n');
  return { subject: o.hasGifts ? 'Your fundraiser is live: three steps to more gifts' : 'You’re live. Send it to five people today.', html, text };
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

export type AccountEmailKind = 'donation_confirmation' | 'fundraiser_live' | 'fundraiser_checklist';

/** Claim then send. Returns 'sent' | 'not_due' | 'no_recipient' | 'unsubscribed' | 'failed'. */
// deno-lint-ignore no-explicit-any
export async function processAccountEmail(admin: any, key: string | undefined, kind: AccountEmailKind, id: string, by: string) {
  const { data: claimed, error } = await admin.rpc('claim_account_email', { _kind: kind, _source: id, _by: by });
  if (error || !claimed) return 'not_due';
  const mark = (patch: Record<string, unknown>) => admin.from('account_emails').update(patch).eq('kind', kind).eq('source_id', id);
  try {
    if (kind === 'donation_confirmation') await admin.rpc('credit_gold_coins');
    const built: { to: string | null; mail: RenderedEmail | null; unsubscribed?: boolean } = kind === 'donation_confirmation' ? await buildDonation(admin, id)
      : kind === 'fundraiser_checklist' ? await buildChecklist(admin, id) : await buildLive(admin, id);
    const { to, mail } = built;
    if (built.unsubscribed) { await mark({ status: 'skipped', last_error: 'Unsubscribed' }); return 'unsubscribed'; }
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
