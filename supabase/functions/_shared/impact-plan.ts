export const USED_SETTLE_MS = 10 * 60_000; // let receipts finish uploading before the "used" email
export type Ev = { id: string; donation_id: string; coupon_id: string; kind: string; created_at: string };

/** Pure grouping rule (exported for tests): which donations get an email this run, and of which kind. */
export function planEmails(events: Ev[], now: number) {
  const by = new Map<string, Ev[]>();
  for (const e of events) by.set(e.donation_id, [...(by.get(e.donation_id) ?? []), e]);
  const out: { donation_id: string; kind: 'received' | 'used' | 'combined'; events: Ev[] }[] = [];
  for (const [donation_id, evs] of by) {
    // Hold the whole donation while a recent "used" settles, so received+used never go out minutes apart.
    if (evs.some((e) => e.kind === 'used' && now - new Date(e.created_at).getTime() < USED_SETTLE_MS)) continue;
    const hasR = evs.some((e) => e.kind === 'received'), hasU = evs.some((e) => e.kind === 'used');
    out.push({ donation_id, kind: hasR && hasU ? 'combined' : hasU ? 'used' : 'received', events: evs });
  }
  return out;
}

