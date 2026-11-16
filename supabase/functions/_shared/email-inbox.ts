// Replies in the admin portal (founder request, Nov 16, 2026). Mail that people send to the team reaches
// Resend's receiving address (the support mailbox forwards a copy to INBOX_ADDRESS); admin-dispatch copies it
// into email_inbox every 5 minutes so Admin > Emails > Inbox can show it. Plain text only, capped, never HTML.
// deno-lint-ignore no-explicit-any
type Db = any;

/** Where the support mailbox forwards a copy of incoming mail. */
export const INBOX_ADDRESS = 'inbox@outreach.coupondonation.com';
const UNSUBSCRIBE_ADDRESS = 'unsubscribe@outreach.coupondonation.com';
const BODY_MAX = 20_000;
const ADDR = /[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+/g;

export type Received = { id?: string; from?: string | null; to?: string[] | string | null; subject?: string | null; text?: string | null; html?: string | null; created_at?: string | null };
export type InboxRow = { resend_id: string; from_email: string; from_name: string | null; to_email: string | null; subject: string | null; body: string; received_at: string };

const addrs = (v: string[] | string | null | undefined) => (Array.isArray(v) ? v : v ? [v] : []).flatMap((x) => String(x).toLowerCase().match(ADDR) ?? []);

/** Readable text from an HTML email: tags and scripts removed, entities decoded, blank runs collapsed. */
export function htmlToText(html: string): string {
  return html.replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, ' ').replace(/<br\s*\/?>(?!\n)/gi, '\n').replace(/<\/(p|div|tr|li|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Whether a received message belongs in the team inbox (cheap check on the list item, before reading it). */
export function wanted(m: Received): boolean {
  const from = addrs(m.from)[0] ?? '';
  if (!m.id || !from) return false;
  // Opt-outs from church outreach are handled by the outreach itself.
  if (addrs(m.to).includes(UNSUBSCRIBE_ADDRESS)) return false;
  // Bounce notices and our own automatic mail are not replies.
  if (/^(mailer-daemon|postmaster|no-?reply|notifications)@/.test(from)) return false;
  if (/@(outreach\.)?coupondonation\.com$/.test(from)) return false;
  return true;
}

/** The row to store for one received message, or null when it isn't a reply for the team. */
export function toInboxRow(m: Received): InboxRow | null {
  if (!wanted(m)) return null;
  const from = addrs(m.from)[0];
  const name = String(m.from ?? '').replace(/<[^>]*>/g, '').replace(/["']/g, '').trim();
  const text = (m.text ?? '').trim() || htmlToText(m.html ?? '');
  const to = addrs(m.to).find((a) => a !== INBOX_ADDRESS) ?? addrs(m.to)[0] ?? null;
  return {
    resend_id: m.id!, from_email: from, from_name: name && !name.includes('@') ? name.slice(0, 120) : null, to_email: to,
    subject: (m.subject ?? '').replace(/\s+/g, ' ').trim().slice(0, 300) || null,
    body: text.replace(/\r\n?/g, '\n').slice(0, BODY_MAX), received_at: m.created_at ?? new Date().toISOString(),
  };
}

async function get(path: string, key: string) {
  const r = await fetch(`https://api.resend.com${path}`, { headers: { Authorization: `Bearer ${key}` } });
  if (!r.ok) throw new Error(`Resend ${path.split('?')[0]} ${r.status}`);
  return await r.json();
}

/** Copy new received mail into email_inbox. At most `max` new messages a run; a failure never stops the dispatcher. */
export async function syncInbox(db: Db, key: string | undefined, max = 15) {
  if (!key) return { skipped: 'no key' };
  try {
    const list = (await get('/emails/receiving?limit=50', key)) as { data?: Received[] };
    const items = (list.data ?? []).filter(wanted);
    if (!items.length) return { new: 0 };
    const { data: have } = await db.from('email_inbox').select('resend_id').in('resend_id', items.map((m) => m.id));
    const known = new Set(((have ?? []) as { resend_id: string }[]).map((r) => r.resend_id));
    let added = 0;
    for (const m of items.filter((x) => !known.has(x.id!)).slice(0, max)) {
      const full = (await get(`/emails/receiving/${m.id}`, key)) as Received;
      const row = toInboxRow({ ...m, ...full, id: m.id });
      if (!row) continue;
      const { data: p } = await db.from('profiles').select('user_id').ilike('email', row.from_email.replace(/[%_\\]/g, '\\$&')).limit(1).maybeSingle();
      const { error } = await db.from('email_inbox').upsert({ ...row, from_user_id: p?.user_id ?? null }, { onConflict: 'resend_id', ignoreDuplicates: true });
      if (!error) added++;
      await new Promise((done) => setTimeout(done, 300));
    }
    return { new: added };
  } catch (e) {
    console.error('inbox sync', e);
    return { error: String(e).slice(0, 200) };
  }
}
