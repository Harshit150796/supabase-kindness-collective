// The CouponDonation team writing to an organizer (admin-contact), and the email log copied from Resend
// (admin-dispatch). Pure functions, unit-tested in team-contact_test.ts.
import { shell, SUPPORT_EMAIL, type RenderedEmail } from './email-layout.ts';

/** The "other side" of every team thread (conversations.kind = 'team'); matches team_inbox_id() in SQL. */
export const TEAM_INBOX_ID = '00000000-0000-4000-8000-00000000c0de';
export const TEAM_SENDER = { from: 'CouponDonation Team <support@coupondonation.com>', replyTo: SUPPORT_EMAIL };
export const SITE = 'https://coupondonation.com';

export type Check<T> = { ok: true; value: T } | { ok: false; error: string };

/** Subject and message the team writes. Plain text only; the email escapes it. */
export function checkTeamMessage(subject: unknown, body: unknown, needSubject: boolean): Check<{ subject: string; body: string }> {
  const s = String(subject ?? '').replace(/\s+/g, ' ').trim();
  const b = String(body ?? '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!b) return { ok: false, error: 'Write a message.' };
  if (b.length > 4000) return { ok: false, error: 'Keep the message under 4,000 characters.' };
  if (needSubject && !s) return { ok: false, error: 'Add a subject for the email.' };
  if (s.length > 150) return { ok: false, error: 'Keep the subject under 150 characters.' };
  return { ok: true, value: { subject: s, body: b } };
}

const firstName = (name: string | null | undefined) => (name ?? '').trim().split(/\s+/)[0] || '';

/** The email copy of a team message. The whole text is in the email (it comes from the company). */
export function renderTeamEmail(opts: {
  subject: string; body: string; name?: string | null; fundraiserTitle: string; replyUrl: string | null;
}): RenderedEmail {
  const hi = firstName(opts.name);
  const paragraphs = opts.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  // When the team opens with their own greeting ("Hi Reigns,"), use it instead of adding a second one.
  const own = paragraphs.length > 1 && paragraphs[0].length <= 60 && /^(hi|hello|hey|dear|good (morning|afternoon|evening))\b/i.test(paragraphs[0])
    ? paragraphs.shift()!.replace(/[,!.:;]\s*$/, '') : null;
  const greeting = own ?? (hi ? `Hi ${hi}` : 'Hi there');
  const replyLine = opts.replyUrl
    ? 'You can reply to this email or answer in your CouponDonation messages.'
    : 'You can reply to this email and a person on our team will answer.';
  const html = shell({
    preheader: paragraphs.join(' ').slice(0, 120), greeting, status: 'From the CouponDonation team',
    headline: opts.subject, paragraphs: [...paragraphs, `This is about your fundraiser "${opts.fundraiserTitle}". ${replyLine}`],
    link: opts.replyUrl ? { label: 'Open your messages', url: opts.replyUrl } : undefined,
  }).replace(/(<td style="padding:0 0 15px;[^"]*">)([^<]*)(<\/td>)/g, (_m, a, t, c) => `${a}${t.replace(/\n/g, '<br>')}${c}`);
  const text = [
    `${greeting},`, '', ...paragraphs.flatMap((p) => [p, '']),
    `This is about your fundraiser "${opts.fundraiserTitle}". ${replyLine}`,
    ...(opts.replyUrl ? ['', `Open your messages: ${opts.replyUrl}`] : []),
    '', '— The CouponDonation team', SUPPORT_EMAIL,
  ].join('\n');
  return { subject: opts.subject, html, text };
}

/** One row of Resend's GET /emails list, reduced to what the log keeps (never the body). */
export type ResendListItem = { id?: string; to?: string[] | string | null; from?: string | null; subject?: string | null; last_event?: string | null; created_at?: string | null };
export function toLogRows(items: ResendListItem[]) {
  const out: Array<{ id: string; to: string; from: string | null; subject: string | null; last_event: string | null; created_at: string | null }> = [];
  for (const it of items ?? []) {
    const to = Array.isArray(it.to) ? it.to : it.to ? [it.to] : [];
    if (!it.id) continue;
    // One row per recipient would change the unique id; the log keeps the first, like Resend's own list.
    const first = to.map((t) => String(t).trim()).find(Boolean);
    if (!first) continue;
    out.push({ id: it.id, to: first, from: it.from ?? null, subject: it.subject ?? null, last_event: it.last_event ?? null, created_at: it.created_at ?? null });
  }
  return out;
}

/** How far back each 5-minute run re-reads the newest emails to refresh their delivery status. */
export const REFRESH_DAYS = 14;
