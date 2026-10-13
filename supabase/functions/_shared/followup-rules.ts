// Pure decision rules for visitor follow-up emails (shared by followup-dispatch and tests).
export const COOLDOWN_DAYS = 14;
export const RUN_EVERY_MINUTES = 15;

export type Consent = { consent_status: string; opted_out_at: string | null; last_emailed_at: string | null };
export type Persona = { id: string; approved: boolean; signals: unknown; subject: string | null; body: string | null };

/** Signals are page path prefixes, e.g. ["/start-fundraiser", "/how-it-works"]. */
export function signalPrefixes(signals: unknown): string[] {
  if (!Array.isArray(signals)) return [];
  return signals.map((s) => (typeof s === 'string' ? s : (s as { path?: string })?.path)).filter((s): s is string => !!s && s.startsWith('/'));
}

/** Best approved persona for the pages viewed (most matched signals), or null. */
export function matchPersona(pages: string[], personas: Persona[]): Persona | null {
  let best: Persona | null = null; let score = 0;
  for (const p of personas) {
    if (!p.approved || !p.subject?.trim() || !p.body?.trim()) continue;
    const pre = signalPrefixes(p.signals);
    const n = pre.filter((x) => pages.some((pg) => pg === x || pg.startsWith(x.endsWith('/') ? x : `${x}/`) || pg === x)).length;
    if (n > score) { best = p; score = n; }
  }
  return best;
}

export type Decision = { send: true } | { send: false; reason: string };

export function decide(opts: { live: boolean; consent: Consent; alreadySent: boolean; now: Date }): Decision {
  const { live, consent, alreadySent, now } = opts;
  if (consent.opted_out_at || consent.consent_status === 'opted_out') return { send: false, reason: 'unsubscribed' };
  if (consent.consent_status !== 'opted_in') return { send: false, reason: 'not opted in' };
  if (alreadySent) return { send: false, reason: 'already got this one' };
  if (consent.last_emailed_at && now.getTime() - new Date(consent.last_emailed_at).getTime() < COOLDOWN_DAYS * 86400_000) {
    return { send: false, reason: 'emailed in last 14 days' };
  }
  if (!live) return { send: false, reason: 'live sending is off' };
  return { send: true };
}

export function shouldRun(lastRunAt: string | null, now: Date): boolean {
  return !lastRunAt || now.getTime() - new Date(lastRunAt).getTime() >= (RUN_EVERY_MINUTES - 1) * 60_000;
}

export function withUnsubscribe(body: string, token: string): string {
  return `${body.trim()}\n\nDon't want these emails? Unsubscribe: https://coupondonation.com/unsubscribe?f=${token}`;
}

/** Fill {first_name}; unknown names become "there". */
export function fillName(text: string, firstName: string | null | undefined): string {
  const n = (firstName ?? '').trim().split(/\s+/)[0];
  return text.replace(/\{first_name\}/g, n && /^[\p{L}'-]{1,30}$/u.test(n) ? n : 'there');
}

const LINK_RE = /https?:\/\/[^\s)]+/g;

/** AI rewrite must keep the base's single link, add no amounts/exclamations, keep the sign-off, stay short. */
export function validateAiEmail(base: string, ai: { subject: string; body: string }): boolean {
  const s = ai.subject?.trim() ?? '', b = ai.body?.trim() ?? '';
  if (!s || !b || s.length > 80 || b.split(/\s+/).length > 140) return false;
  if (/[!$€£]|\d+\s?%|[\u{1F300}-\u{1FAFF}]/u.test(s + b)) return false;
  if (/\b[A-Z]{4,}\b/.test(s)) return false;
  const want = base.match(LINK_RE) ?? [], got = b.match(LINK_RE) ?? [];
  if (got.length !== want.length || got.some((l, i) => l !== want[i])) return false;
  if (got.some((l) => !/^https:\/\/coupondonation\.com\//.test(l))) return false;
  return b.endsWith('— The CouponDonation team');
}

export const QUIET_MINUTES = 30;
export const NONCE_MINUTES = 60;

/** A person is ready only after 30 quiet minutes since their last activity. */
export function isQuiet(lastActivityAt: string | null, now: Date): boolean {
  return !!lastActivityAt && now.getTime() - new Date(lastActivityAt).getTime() >= QUIET_MINUTES * 60_000;
}

/** Renewed activity after the reservation means the job must be cancelled, not sent. */
export function activityRenewed(reservedActivity: string | null, latestActivity: string | null): boolean {
  if (!latestActivity) return false;
  return !reservedActivity || new Date(latestActivity).getTime() > new Date(reservedActivity).getTime();
}

/** Prior-outreach rule: unknown CRM history stops sending, like any earlier email. */
export function outreachBlock(h: { readable: boolean; priorEmails: number }): string | null {
  if (!h.readable) return "couldn't read HubSpot history";
  if (h.priorEmails > 0) return 'earlier email found in HubSpot';
  return null;
}

/** Stable hash binding a nonce to the exact email text. */
export async function contentHash(email: string, subject: string, body: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${email.toLowerCase()}\n${subject}\n${body}`));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function newNonce(): string {
  const a = new Uint8Array(32); crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}
