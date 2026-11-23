// Copies Resend's log of sent emails into email_log (admin-dispatch, every 5 minutes), so the admin
// portal can show every email the site sent and whether it arrived. Two passes per run:
//   1. the newest emails, back REFRESH_DAYS (two weeks), so new ones appear and later opens, clicks and
//      bounces are caught;
//   2. older history, a few pages per run, until Resend has nothing older (email_log_sync.backfill_done).
// Since Nov 23, 2026 (founder request) each run also saves a copy of up to CONTENT_PER_RUN emails' text, with
// sign-in codes and one-time links hidden first (email-redact.ts), so the team can read exactly what was sent
// after Resend lets it go (about 30 days), and reads whether Resend's open tracking is on for the site's domain.
import { REFRESH_DAYS, toLogRows, type ResendListItem } from './team-contact.ts';
import { redactEmail } from './email-redact.ts';

// deno-lint-ignore no-explicit-any
type Db = any;
type Page = { data?: ResendListItem[]; has_more?: boolean };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The site's sending domain, whose open-tracking switch decides whether "opened" can be known. */
export const SITE_DOMAIN = 'coupondonation.com';
/** Emails whose text is saved per 5-minute run (Resend allows a few requests a second). */
export const CONTENT_PER_RUN = 25;
/** Resend keeps an email about 30 days; older ones are marked gone without asking. */
export const CONTENT_DAYS = 29;
const CONTENT_MAX = 300_000;

type ResendEmail = { from?: string | null; subject?: string | null; html?: string | null; text?: string | null; reply_to?: string[] | string | null };

/** One email's full text from Resend, or 'gone' when Resend no longer has it. */
export async function fetchEmail(key: string, resendId: string): Promise<ResendEmail | 'gone'> {
  const r = await fetch(`https://api.resend.com/emails/${encodeURIComponent(resendId)}`, { headers: { Authorization: `Bearer ${key}` } });
  if (r.status === 404) return 'gone';
  if (!r.ok) throw new Error(`Resend email ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return await r.json() as ResendEmail;
}

/** The columns to save for one email: its text with codes and one-time links hidden. */
export function contentColumns(e: ResendEmail | 'gone', subject: string | null) {
  if (e === 'gone') return { content_state: 'gone', content_saved_at: new Date().toISOString() };
  const r = redactEmail({ subject: e.subject ?? subject, html: e.html ?? null, text: e.text ?? null });
  const reply = Array.isArray(e.reply_to) ? e.reply_to.filter(Boolean).join(', ') : e.reply_to ?? null;
  return {
    content_html: r.html ? r.html.slice(0, CONTENT_MAX) : null,
    content_text: r.text ? r.text.slice(0, CONTENT_MAX) : null,
    reply_to: reply || null,
    content_state: 'saved',
    content_saved_at: new Date().toISOString(),
    // A plain-text email has no image to load, so an open can't be seen.
    ...(r.html ? {} : { opens_tracked: false }),
  };
}

/** Whether Resend's open tracking is on for the site's domain (null when Resend doesn't say). */
export async function readOpenTracking(key: string): Promise<boolean | null> {
  // deno-lint-ignore no-explicit-any
  const flag = (d: any): boolean | null => typeof d?.open_tracking === 'boolean' ? d.open_tracking : typeof d?.openTracking === 'boolean' ? d.openTracking : typeof d?.tracking?.open === 'boolean' ? d.tracking.open : null;
  const list = await fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${key}` } });
  if (!list.ok) return null;
  // deno-lint-ignore no-explicit-any
  const domain = ((await list.json())?.data ?? []).find((d: any) => d?.name === SITE_DOMAIN);
  if (!domain?.id) return null;
  if (flag(domain) !== null) return flag(domain);
  const one = await fetch(`https://api.resend.com/domains/${encodeURIComponent(domain.id)}`, { headers: { Authorization: `Bearer ${key}` } });
  return one.ok ? flag(await one.json()) : null;
}

/** Saves the text of the newest emails that don't have it yet (site and team emails before outreach). */
export async function saveEmailContents(db: Db, key: string, limit = CONTENT_PER_RUN) {
  const since = new Date(Date.now() - CONTENT_DAYS * 86_400_000).toISOString();
  // Too old for Resend: nothing to fetch.
  await db.from('email_log').update({ content_state: 'gone', content_saved_at: new Date().toISOString() })
    .is('content_state', null).lt('sent_at', since).is('body', null);
  let saved = 0;
  for (const category of ['site', 'team', 'outreach']) {
    if (saved >= limit) break;
    const { data: todo } = await db.from('email_log').select('id, resend_id, subject').is('content_state', null).not('resend_id', 'is', null)
      .eq('category', category).gte('sent_at', since).order('sent_at', { ascending: false }).limit(limit - saved);
    for (const row of (todo ?? []) as { id: string; resend_id: string; subject: string | null }[]) {
      const e = await fetchEmail(key, row.resend_id);
      await db.from('email_log').update(contentColumns(e, row.subject)).eq('id', row.id);
      saved++;
      await sleep(550);
    }
  }
  return saved;
}

async function listPage(key: string, after: string | null): Promise<Page> {
  const url = new URL('https://api.resend.com/emails');
  url.searchParams.set('limit', '100');
  if (after) url.searchParams.set('after', after);
  const r = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  if (!r.ok) throw new Error(`Resend list ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return await r.json() as Page;
}

export async function syncEmailLog(db: Db, key: string | undefined, opts: { headPages?: number; backfillPages?: number } = {}) {
  if (!key) return { skipped: 'no key' };
  const headPages = opts.headPages ?? 6;
  const backfillPages = opts.backfillPages ?? 4;
  const { data: st } = await db.from('email_log_sync').select('*').eq('id', 1).maybeSingle();
  const cutoff = Date.now() - REFRESH_DAYS * 86_400_000;
  let written = 0, read = 0;
  try {
    // 1) Newest first, until emails are older than the refresh window.
    let after: string | null = null;
    for (let i = 0; i < headPages; i++) {
      const page = await listPage(key, after);
      const items = page.data ?? [];
      read += items.length;
      const { data: n } = await db.rpc('email_log_upsert', { _rows: toLogRows(items) });
      written += Number(n ?? 0);
      const last = items[items.length - 1];
      if (!page.has_more || !last?.id || (last.created_at && new Date(last.created_at).getTime() < cutoff)) break;
      after = last.id;
      await sleep(600);
    }
    // 2) History, picking up where the last run stopped.
    if (!st?.backfill_done) {
      let cursor: string | null = st?.backfill_after ?? null;
      let done = false;
      for (let i = 0; i < backfillPages; i++) {
        await sleep(600);
        const page = await listPage(key, cursor);
        const items = page.data ?? [];
        read += items.length;
        const { data: n } = await db.rpc('email_log_upsert', { _rows: toLogRows(items) });
        written += Number(n ?? 0);
        const last = items[items.length - 1];
        if (!page.has_more || !last?.id) { done = true; break; }
        cursor = last.id;
      }
      await db.from('email_log_sync').update({ backfill_after: cursor, backfill_done: done }).eq('id', 1);
    }
    // 3) Open tracking on or off, and the text of new emails. Failures here never stop the list from updating.
    let saved = 0;
    try {
      const tracking = await readOpenTracking(key);
      if (tracking !== null) await db.from('email_log_sync').update({ open_tracking: tracking, open_tracking_checked_at: new Date().toISOString() }).eq('id', 1);
      saved = await saveEmailContents(db, key);
    } catch (e) {
      console.error('email contents', e);
    }
    await db.from('email_log_sync').update({ last_run_at: new Date().toISOString(), last_error: null }).eq('id', 1);
    return { read, written, saved };
  } catch (e) {
    await db.from('email_log_sync').update({ last_run_at: new Date().toISOString(), last_error: String(e).slice(0, 500) }).eq('id', 1);
    return { read, written, error: String(e) };
  }
}
