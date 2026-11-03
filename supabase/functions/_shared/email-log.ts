// Copies Resend's log of sent emails into email_log (admin-dispatch, every 5 minutes), so the admin
// portal can show every email the site sent and whether it arrived. Two passes per run:
//   1. the newest emails, back REFRESH_DAYS, so new ones appear and recent statuses (delivered, opened,
//      bounced) stay current;
//   2. older history, a few pages per run, until Resend has nothing older (email_log_sync.backfill_done).
// Only metadata is copied (to, from, subject, status, time), never an email's body.
import { REFRESH_DAYS, toLogRows, type ResendListItem } from './team-contact.ts';

// deno-lint-ignore no-explicit-any
type Db = any;
type Page = { data?: ResendListItem[]; has_more?: boolean };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  const headPages = opts.headPages ?? 3;
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
    await db.from('email_log_sync').update({ last_run_at: new Date().toISOString(), last_error: null }).eq('id', 1);
    return { read, written };
  } catch (e) {
    await db.from('email_log_sync').update({ last_run_at: new Date().toISOString(), last_error: String(e).slice(0, 500) }).eq('id', 1);
    return { read, written, error: String(e) };
  }
}
