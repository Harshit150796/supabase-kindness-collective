// Emails that help an organizer market their own fundraiser (founder request, Nov 15, 2026): a gift came
// in, two days with no gift, the first week, halfway, goal reached, gone quiet. Each is sent once per gift
// or fundraiser (claim_account_email), only while its switch in Admin > Emails is on, and never for
// something that happened before the switch was turned on. Donors are never named: an email says
// "a donor" and the amount. Reads fundraisers and donations only; never writes payment tables.
import { shell, escapeHtml, SUPPORT_LINE, type RenderedEmail } from './email-layout.ts';
import { liveShareMessage, sendAccountMail, type Beneficiary } from './account-emails.ts';
import { SHARE_HOST } from './share-preview.ts';
import { isSuppressed, UNSUB_PAGE_URL } from './suppression.ts';

const SITE = 'https://coupondonation.com';
const DAY = 86_400_000;
const enc = encodeURIComponent;
export const usd = (n: number) => `$${Number(n).toFixed(Number(n) % 1 ? 2 : 0)}`;
const people = (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`;

export const ORGANIZER_KINDS = ['organizer_gift', 'organizer_nudge', 'organizer_week', 'organizer_halfway', 'organizer_goal', 'organizer_quiet'] as const;
export type OrganizerKind = typeof ORGANIZER_KINDS[number];
/** Help, not news: at most one every three days per fundraiser, skipped for people who stopped optional emails. */
const SPACED_TIPS: OrganizerKind[] = ['organizer_nudge', 'organizer_week', 'organizer_quiet'];
const OPTIONAL: OrganizerKind[] = [...SPACED_TIPS, 'organizer_halfway'];

export type OrganizerBase = {
  firstName?: string; title: string; slug: string; id: string; stores?: string[]; beneficiary?: Beneficiary;
  /** Optional emails carry a link that stops them. */
  stopUrl?: string; test?: boolean;
};
type Numbers = { raised: number; goal: number; givers: number };

const links = (o: OrganizerBase) => ({
  share: `${SHARE_HOST}/f/${enc(o.slug)}`,
  dashboard: `${SITE}/fundraiser/${o.id}`,
});
const hi = (o: OrganizerBase) => (o.firstName ? `Hi ${o.firstName}` : 'Hi there');

function build(o: OrganizerBase, m: {
  subject: string; headline: string; preheader: string; paragraphs: string[]; copy?: { label: string; body: string }; closing?: string[];
  link: { label: string; url: string }; secondary?: { label: string; url: string };
}): RenderedEmail {
  const stopHtml = o.stopUrl ? `<a href="${escapeHtml(o.stopUrl)}" style="color:#6f7b74;text-decoration:underline;">Stop these tips</a>` : '';
  const footer = [o.test ? 'This is a test message.' : '', stopHtml].filter(Boolean).join('<br>') || undefined;
  const html = shell({
    preheader: m.preheader, greeting: hi(o), headline: m.headline, paragraphs: m.paragraphs,
    copyBox: m.copy ? { label: m.copy.label, body: m.copy.body } : undefined, closing: m.closing,
    link: m.link, secondaryLink: m.secondary, footer, sample: o.test,
  });
  const text = [
    `${hi(o)},`, '', ...m.paragraphs.flatMap((p) => [p, '']),
    ...(m.copy ? [`${m.copy.label}:`, '', m.copy.body, ''] : []),
    ...(m.closing ?? []).flatMap((p) => [p, '']),
    `${m.link.label}: ${m.link.url}`, ...(m.secondary ? [`${m.secondary.label}: ${m.secondary.url}`] : []), '',
    '— The CouponDonation team', ...(o.test ? ['', 'This is a test message.'] : []), '', SUPPORT_LINE,
    ...(o.stopUrl ? [`Stop these tips: ${o.stopUrl}`] : []),
  ].join('\n');
  // No List-Unsubscribe header (founder request, Nov 21, 2026): Gmail files mail carrying it under Promotions; the
  // "Stop these tips" link in the email does the same job.
  return { subject: m.subject, html, text };
}

/** A gift came in. `count` gifts worth `amount` since we last wrote; `first` when they are the fundraiser's first. */
export function renderOrganizerGift(o: OrganizerBase & Numbers & { amount: number; count: number; first: boolean }): RenderedEmail {
  const { share, dashboard } = links(o);
  const { becomes } = liveShareMessage(o, share);
  // Subjects never carry dollar amounts or store names (they read like gift-card spam); the first line does.
  const one = o.count === 1;
  const subject = o.first ? (one ? 'Your first gift just came in' : 'Your first gifts just came in') : one ? 'A new gift just came in' : `${o.count} new gifts came in`;
  const at = o.goal > 0 ? ` You’re at ${usd(o.raised)} of ${usd(o.goal)}.` : '';
  const p1 = `${one ? `A donor just gave ${usd(o.amount)} to “${o.title}”.` : `${o.count} new gifts, ${usd(o.amount)} in total, came in for “${o.title}”.`}${at}`;
  return build(o, {
    subject, headline: o.first ? 'Your first gift' : one ? 'A new gift' : 'New gifts', preheader: p1,
    paragraphs: [p1,
      `Next: ${one ? 'it becomes' : 'each gift becomes'} the store card you asked for. We’ll email you when it’s ready.`,
      'Share it today. A fundraiser with a new gift is the easiest to give to.'],
    copy: { label: 'Message to copy', body: `Someone just gave to my fundraiser, “${o.title}”. ${becomes}, and gifts start at $10. Will you be next?\n${share}` },
    link: { label: 'Share it now', url: dashboard },
  });
}

/** Two days live and no gift yet. */
export function renderOrganizerNudge(o: OrganizerBase): RenderedEmail {
  const { share, dashboard } = links(o);
  const { chat } = liveShareMessage(o, share);
  return build(o, {
    subject: 'One text can start it', headline: 'One text can start it', preheader: 'The first gift usually comes from one person you message directly.',
    paragraphs: [
      `“${o.title}” is waiting for its first gift. That’s normal.`,
      'The first gift usually comes from one person you text directly. Send this to the person most likely to say yes:'],
    copy: { label: 'Message to copy', body: chat },
    closing: ['Something making it hard to share? Reply and tell us.'],
    link: { label: 'Send a text', url: `sms:?&body=${enc(chat)}` }, secondary: { label: 'Open your dashboard', url: dashboard },
  });
}

/** One week live. */
export function renderOrganizerWeek(o: OrganizerBase & Numbers): RenderedEmail {
  const { share, dashboard } = links(o);
  const { becomes } = liveShareMessage(o, share);
  const some = o.givers > 0 && o.raised > 0;
  const note = ['Hello,', '',
    `I’ve started a fundraiser on CouponDonation: “${o.title}”. Would you be willing to share it with our community, in the bulletin, a newsletter or a group chat?`, '',
    `${becomes}, and gifts start at $10. Here’s the link:`, share, '', 'Thank you,', o.firstName ?? ''].join('\n').trim();
  return build(o, {
    subject: some ? `Your first week: ${people(o.givers)} ${o.givers === 1 ? 'has' : 'have'} given` : 'Your first week, and one new thing to try', headline: 'Your first week',
    preheader: 'This week, ask the group you haven’t asked yet. We wrote the note.',
    paragraphs: [
      some ? `“${o.title}” has been live for a week: ${usd(o.raised)}${o.goal > 0 ? ` of ${usd(o.goal)}` : ''}, from ${people(o.givers)}.`
        : `“${o.title}” has been live for a week and is still waiting for its first gift.`,
      'This week, ask a group you haven’t asked yet: your church, school or work. We wrote the note for you.'],
    closing: ['Want one tip to improve your page? Reply to this email.'],
    link: { label: 'Email your church or group', url: `mailto:?subject=${enc('Could you share my fundraiser?')}&body=${enc(note)}` },
    secondary: { label: 'Open your dashboard', url: dashboard },
  });
}

/** Passed half of the goal. */
export function renderOrganizerHalfway(o: OrganizerBase & Numbers): RenderedEmail {
  const { share, dashboard } = links(o);
  const { becomes } = liveShareMessage(o, share);
  const left = Math.max(0, o.goal - o.raised);
  return build(o, {
    subject: 'You’re halfway to your goal', headline: 'Halfway there', preheader: `${usd(o.raised)} of ${usd(o.goal)}. People like to help finish something.`,
    paragraphs: [`“${o.title}” just passed halfway: ${usd(o.raised)} of ${usd(o.goal)}, from ${people(o.givers)}.`, 'People like to help finish something. Tell them how close you are:'],
    copy: { label: 'Message to copy', body: `We’re halfway there. ${people(o.givers)} ${o.givers === 1 ? 'has' : 'have'} given to “${o.title}”, and ${usd(left)} more gets us to the goal. ${becomes}.\n${share}` },
    link: { label: 'Share your progress', url: dashboard },
  });
}

/** Reached the goal. */
export function renderOrganizerGoal(o: OrganizerBase & Numbers): RenderedEmail {
  const { dashboard } = links(o);
  return build(o, {
    subject: 'You reached your goal', headline: 'You reached your goal', preheader: 'One thing left: thank the people who gave.',
    paragraphs: [
      `“${o.title}” reached its goal: ${usd(o.raised)} from ${people(o.givers)}.`,
      'We’ll email you as each card is ready to open.',
      'One thing left: thank the people who gave with a short update.'],
    link: { label: 'Post a thank-you', url: dashboard },
  });
}

/** Three weeks live and no gift for ten days. */
export function renderOrganizerQuiet(o: OrganizerBase): RenderedEmail {
  const { dashboard } = links(o);
  return build(o, {
    subject: 'A short update brings people back', headline: 'A short update brings people back', preheader: 'What restarts a fundraiser is news. Two or three sentences is enough.',
    paragraphs: [
      `It’s been a while since “${o.title}” had a new gift.`,
      'A short update brings people back: what changed, what gifts paid for, what’s still needed. Then share it again.'],
    closing: ['Want to pause or close it? Reply and we’ll do it for you.'],
    link: { label: 'Post an update', url: dashboard },
  });
}

// ---- Which emails are due (pure, tested in organizer-emails_test.ts) ----

export type OrgFundraiser = { id: string; created_at: string; status: string; goal: number };
export type OrgGift = { id: string; fundraiser_id: string; amount: number; created_at: string };
export type OrgMail = { kind: string; source_id: string; status: string; sent_at: string | null; claimed_at?: string | null };
export type Switches = Record<string, { enabled: boolean; enabled_at: string } | undefined>;
export type OrganizerDue = { kind: OrganizerKind; source_id: string; fundraiser_id: string; count?: number; amount?: number; first?: boolean };

const ms = (iso: string | null | undefined) => (iso ? Date.parse(iso) : NaN);

export function organizerDue(now: number, fundraisers: OrgFundraiser[], gifts: OrgGift[], mails: OrgMail[], switches: Switches): OrganizerDue[] {
  const on = (k: OrganizerKind) => (switches[k]?.enabled ? ms(switches[k]!.enabled_at) : NaN);
  const giftFundraiser = new Map(gifts.map((g) => [g.id, g.fundraiser_id]));
  const handled = mails.filter((m) => m.status !== 'failed');
  const out: OrganizerDue[] = [];
  for (const f of fundraisers) {
    const mine = gifts.filter((g) => g.fundraiser_id === f.id).sort((a, b) => ms(a.created_at) - ms(b.created_at));
    const sent = handled.filter((m) => (m.kind === 'organizer_gift' ? giftFundraiser.get(m.source_id) === f.id : m.source_id === f.id));
    const has = (k: OrganizerKind) => sent.some((m) => m.kind === k);
    const lastAt = (kinds: OrganizerKind[]) => Math.max(-Infinity, ...sent.filter((m) => (kinds as string[]).includes(m.kind)).map((m) => ms(m.claimed_at ?? m.sent_at)).filter((t) => !Number.isNaN(t)));
    const created = ms(f.created_at);
    const age = now - created;
    const raised = mine.reduce((s, g) => s + Number(g.amount), 0);
    const lastGift = mine.length ? ms(mine[mine.length - 1].created_at) : NaN;
    const active = f.status === 'active';

    // A gift came in: at once for the first, then at most one email a day covering every gift since the last one.
    const giftOn = on('organizer_gift');
    if (!Number.isNaN(giftOn) && (active || f.status === 'completed')) {
      const lastMail = lastAt(['organizer_gift']);
      const fresh = mine.filter((g) => ms(g.created_at) >= giftOn && ms(g.created_at) > lastMail && !sent.some((m) => m.kind === 'organizer_gift' && m.source_id === g.id));
      if (fresh.length && (lastMail === -Infinity || now - lastMail >= DAY)) {
        out.push({ kind: 'organizer_gift', source_id: fresh[fresh.length - 1].id, fundraiser_id: f.id, count: fresh.length,
          amount: fresh.reduce((s, g) => s + Number(g.amount), 0), first: fresh.length === mine.length });
      }
    }

    // Goal reached, or halfway there (never both for the same gift).
    if (f.goal > 0 && mine.length) {
      const goalOn = on('organizer_goal'), halfOn = on('organizer_halfway');
      if (raised >= f.goal) {
        if (!Number.isNaN(goalOn) && lastGift >= goalOn && !has('organizer_goal') && (active || f.status === 'completed')) out.push({ kind: 'organizer_goal', source_id: f.id, fundraiser_id: f.id });
      } else if (raised >= f.goal / 2 && active && !Number.isNaN(halfOn) && lastGift >= halfOn && !has('organizer_halfway') && !has('organizer_goal')) {
        out.push({ kind: 'organizer_halfway', source_id: f.id, fundraiser_id: f.id });
      }
    }

    // Tips: one at a time, at most one every three days, only while the fundraiser is live and below its goal.
    if (!active || (f.goal > 0 && raised >= f.goal)) continue;
    if (now - lastAt(SPACED_TIPS) < 3 * DAY) continue;
    const nudgeOn = on('organizer_nudge'), weekOn = on('organizer_week'), quietOn = on('organizer_quiet');
    const lastActivity = Number.isNaN(lastGift) ? created : Math.max(created, lastGift);
    if (!Number.isNaN(nudgeOn) && !mine.length && age >= 2 * DAY && age < 7 * DAY && created + 2 * DAY >= nudgeOn && !has('organizer_nudge')) {
      out.push({ kind: 'organizer_nudge', source_id: f.id, fundraiser_id: f.id });
    } else if (!Number.isNaN(weekOn) && age >= 7 * DAY && age < 14 * DAY && created + 7 * DAY >= weekOn && !has('organizer_week')) {
      out.push({ kind: 'organizer_week', source_id: f.id, fundraiser_id: f.id });
    } else if (!Number.isNaN(quietOn) && age >= 21 * DAY && now - lastActivity >= 10 * DAY && Math.max(created + 21 * DAY, lastActivity + 10 * DAY) >= quietOn && !has('organizer_quiet')) {
      out.push({ kind: 'organizer_quiet', source_id: f.id, fundraiser_id: f.id });
    }
  }
  return out;
}

// ---- Dispatcher side ----
// deno-lint-ignore no-explicit-any
type Db = any;

/** Everything due right now (admin-dispatch, every 5 minutes). Nothing is due while every switch is off. */
export async function dueOrganizerEmails(admin: Db, now = Date.now()): Promise<OrganizerDue[]> {
  const { data: rows } = await admin.from('email_automations').select('key, enabled, enabled_at').in('key', ORGANIZER_KINDS as unknown as string[]);
  const switches: Switches = Object.fromEntries(((rows ?? []) as { key: string; enabled: boolean; enabled_at: string }[]).map((r) => [r.key, r]));
  if (!Object.values(switches).some((s) => s?.enabled)) return [];
  const { data: frs } = await admin.from('fundraisers').select('id, created_at, status, monthly_goal').in('status', ['active', 'completed']).not('is_example', 'is', true).limit(1000);
  const fundraisers = ((frs ?? []) as { id: string; created_at: string; status: string; monthly_goal: number | null }[]).map((f) => ({ id: f.id, created_at: f.created_at, status: f.status, goal: Number(f.monthly_goal ?? 0) }));
  if (!fundraisers.length) return [];
  const ids = fundraisers.map((f) => f.id);
  const gifts: OrgGift[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await admin.from('donations').select('id, fundraiser_id, amount, created_at').in('fundraiser_id', ids.slice(i, i + 200)).in('status', ['completed', 'succeeded']).limit(5000);
    gifts.push(...((data ?? []) as OrgGift[]));
  }
  const { data: mails } = await admin.from('account_emails').select('kind, source_id, status, sent_at, claimed_at').in('kind', ORGANIZER_KINDS as unknown as string[]).limit(10000);
  return organizerDue(now, fundraisers, gifts, (mails ?? []) as OrgMail[], switches).slice(0, 20);
}

const firstOf = (n?: string | null) => (n ?? '').trim().split(/\s+/)[0] || '';

/** Claim then send one organizer email. Returns 'sent' | 'not_due' | 'no_recipient' | 'unsubscribed' | 'failed'. */
export async function processOrganizerEmail(admin: Db, key: string | undefined, due: OrganizerDue, by: string) {
  const { data: claimed, error } = await admin.rpc('claim_account_email', { _kind: due.kind, _source: due.source_id, _by: by });
  if (error || !claimed) return 'not_due';
  const mark = (patch: Record<string, unknown>) => admin.from('account_emails').update(patch).eq('kind', due.kind).eq('source_id', due.source_id);
  try {
    const { data: f } = await admin.from('fundraisers').select('id, title, unique_slug, user_id, preferred_brands, beneficiary_type, monthly_goal').eq('id', due.fundraiser_id).maybeSingle();
    const { data: p } = f ? await admin.from('profiles').select('email, full_name').eq('user_id', f.user_id).maybeSingle() : { data: null };
    if (!f?.unique_slug || !p?.email) { await mark({ status: 'skipped', last_error: 'No recipient email' }); return 'no_recipient'; }
    const optional = OPTIONAL.includes(due.kind);
    if (optional && await isSuppressed(admin, p.email)) { await mark({ status: 'skipped', last_error: 'Unsubscribed' }); return 'unsubscribed'; }
    const { data: totals } = await admin.rpc('get_fundraiser_totals', { _fundraiser_id: f.id });
    const t = (Array.isArray(totals) ? totals[0] : totals) ?? {};
    const numbers = { raised: Number(t.total_raised ?? 0), goal: Number(f.monthly_goal ?? 0), givers: Number(t.donations_count ?? 0) };
    let stopUrl: string | undefined;
    if (optional) {
      const { data: stop } = await admin.from('unsubscribe_requests').insert({ email: p.email.trim().toLowerCase() }).select('token').single();
      if (stop?.token) stopUrl = `${UNSUB_PAGE_URL}?c=${stop.token}`;
    }
    const base: OrganizerBase = { firstName: firstOf(p.full_name), title: f.title, slug: f.unique_slug, id: f.id, stores: f.preferred_brands ?? [], beneficiary: f.beneficiary_type, stopUrl };
    // A fundraiser that has already reached its goal gets the goal email, not "halfway".
    if (due.kind === 'organizer_halfway' && numbers.goal > 0 && numbers.raised >= numbers.goal) { await mark({ status: 'skipped', last_error: 'Already at goal' }); return 'not_due'; }
    const mail = due.kind === 'organizer_gift' ? renderOrganizerGift({ ...base, ...numbers, amount: Number(due.amount ?? 0), count: Number(due.count ?? 1), first: !!due.first })
      : due.kind === 'organizer_nudge' ? renderOrganizerNudge(base)
      : due.kind === 'organizer_week' ? renderOrganizerWeek({ ...base, ...numbers })
      : due.kind === 'organizer_halfway' ? renderOrganizerHalfway({ ...base, ...numbers })
      : due.kind === 'organizer_goal' ? renderOrganizerGoal({ ...base, ...numbers })
      : renderOrganizerQuiet(base);
    if (!key) throw new Error('Missing Resend key');
    const rid = await sendAccountMail(key, p.email, mail);
    await mark({ status: 'sent', resend_id: rid, sent_at: new Date().toISOString(), last_error: null });
    return 'sent';
  } catch (e) {
    await mark({ status: 'failed', last_error: String(e).slice(0, 500) });
    return 'failed';
  }
}
