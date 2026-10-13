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
