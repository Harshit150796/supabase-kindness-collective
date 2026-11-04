// Fixed lists for the admin "Ask" box (admin-ask): the numbers it can look up and the pages it can open.
// Pure functions, unit-tested in ops_test.ts. The AI may only pick from these.

export type AskPlan = {
  action: 'count' | 'open' | 'search';
  metric: string | null; status: string | null; from: string | null; to: string | null;
  page: string | null; q: string | null; filter: string | null; understood: string;
};

export const METRICS: Record<string, { help: string; dated: boolean; link: string }> = {
  donations: { help: 'completed donations: count, total dollars and donors in a period', dated: true, link: '/admin/donations' },
  new_fundraisers: { help: 'fundraisers created in a period (optionally only one status)', dated: true, link: '/admin/fundraisers' },
  fundraisers_now: { help: 'how many fundraisers exist right now by status (optionally one status, e.g. pending review)', dated: false, link: '/admin/fundraisers' },
  coupons_delivered: { help: 'coupons/cards delivered to families in a period', dated: true, link: '/admin/emails?view=followups' },
  coupons_revealed: { help: 'coupons families opened (revealed) in a period', dated: true, link: '/admin/emails?view=followups&stage=revealed' },
  coupons_used: { help: 'coupons families marked used in a period', dated: true, link: '/admin/emails?view=followups&stage=used' },
  coupons_waiting: { help: 'coupons delivered that the family has not opened yet (right now)', dated: false, link: '/admin/emails?view=followups&stage=waiting' },
  emails: { help: 'site emails sent in a period, with delivered, opened and bounced', dated: true, link: '/admin/emails' },
  outreach_emails: { help: 'church outreach emails sent in a period, delivered and bounced', dated: true, link: '/admin/emails?category=outreach' },
  new_people: { help: 'new accounts created in a period', dated: true, link: '/admin/users' },
  card_donations: { help: 'gift cards donated on the Donate a card page in a period, by status', dated: true, link: '/admin/card-donations' },
  monthly_gifts: { help: 'active monthly gifts right now and their monthly total', dated: false, link: '/admin/monthly' },
  contact_messages: { help: 'messages from the contact form in a period, by status', dated: true, link: '/admin/contact' },
  open_tasks: { help: 'team tasks still open', dated: false, link: '/admin/tasks' },
};

export const PAGES: Record<string, { path: string; help: string; param?: string }> = {
  overview: { path: '/admin', help: 'the dashboard' },
  analytics: { path: '/admin/analytics', help: 'traffic and conversion charts' },
  fundraisers: { path: '/admin/fundraisers', help: 'fundraisers (campaigns, "ads", requests for help)', param: 'status' },
  donations: { path: '/admin/donations', help: 'donations and payments' },
  donors: { path: '/admin/donors', help: 'donors' },
  monthly: { path: '/admin/monthly', help: 'monthly (recurring) gifts' },
  coupons: { path: '/admin/coupons', help: 'coupon stock and batches' },
  procurement: { path: '/admin/procurement', help: 'buying coupons and code usage' },
  card_donations: { path: '/admin/card-donations', help: 'donated gift cards to review' },
  gold_coins: { path: '/admin/gold-coins', help: 'Gold Coins rewards' },
  partners: { path: '/admin/partners', help: 'partner inquiries from organizations' },
  moderation: { path: '/admin/moderation', help: 'reports and flagged content' },
  messages: { path: '/admin/messages', help: 'conversations between supporters, organizers and the team', param: 'status' },
  profiles: { path: '/admin/profiles', help: 'public profiles' },
  contact: { path: '/admin/contact', help: 'contact form messages' },
  emails: { path: '/admin/emails', help: 'every email sent, with delivered/opened/bounced', param: 'status' },
  email_topics: { path: '/admin/emails', help: 'emails of one kind (sign-in, donor follow-ups, coupons to families, fundraiser, messages, team-written, alerts, outreach)', param: 'topic' },
  followups: { path: '/admin/emails?view=followups', help: 'coupon follow-ups: each coupon sent to a family, whether they opened it, reminders, donor updates', param: 'stage' },
  visitor_followups: { path: '/admin/followups', help: 'automatic follow-up emails to site visitors' },
  tasks: { path: '/admin/tasks', help: 'team tasks' },
  notifications: { path: '/admin/notifications', help: 'admin notifications' },
  users: { path: '/admin/users', help: 'accounts and roles' },
  team: { path: '/admin/team', help: 'team members and access' },
  audit: { path: '/admin/audit', help: 'audit log of admin actions' },
  settings: { path: '/admin/settings', help: 'settings' },
};

/** Allowed filter values per page (the URL parameter is PAGES[page].param). */
export const PARAM_VALUES: Record<string, string[]> = {
  fundraisers: ['pending', 'active', 'paused', 'completed', 'rejected', 'archived'],
  messages: ['open', 'blocked', 'removed', 'flagged', 'team'],
  emails: ['delivered', 'opened', 'not_opened', 'problem', 'pending'],
  email_topics: ['account', 'donor', 'family', 'fundraiser', 'messages', 'team', 'alerts', 'outreach'],
  followups: ['waiting', 'revealed', 'reminder_due', 'used'],
};

/** Pages whose lists take a ?q= search. */
const SEARCHABLE = new Set(['fundraisers', 'donations', 'donors', 'monthly', 'messages', 'profiles', 'emails', 'email_topics', 'users']);

export function buildLink(p: Pick<AskPlan, 'page' | 'filter' | 'q'>): { label: string; url: string } | null {
  const page = p.page ? PAGES[p.page] : null;
  if (!page || !p.page) return null;
  const url = new URL(page.path, 'https://x.invalid');
  if (page.param && p.filter && PARAM_VALUES[p.page]?.includes(p.filter)) url.searchParams.set(page.param, p.filter);
  if (p.page === 'email_topics' && p.filter === 'outreach') url.searchParams.set('category', 'outreach');
  const q = (p.q ?? '').trim().slice(0, 100);
  if (q && SEARCHABLE.has(p.page)) url.searchParams.set('q', q);
  const label = p.page === 'followups' ? 'Open coupon follow-ups' : p.page === 'email_topics' ? 'Open these emails' : `Open ${p.page.replace(/_/g, ' ')}`;
  return { label, url: url.pathname + url.search };
}

const n = (v: unknown) => Number(v ?? 0);
const usd = (v: unknown) => `$${n(v).toLocaleString('en-US', { minimumFractionDigits: n(v) % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
const DAY = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric' });
const period = (d: Record<string, unknown>) => {
  const a = new Date(String(d.from)), b = new Date(new Date(String(d.to)).getTime() - 1);
  return `${DAY.format(a)} – ${DAY.format(b)}`;
};
const statuses = (s: unknown) => Object.entries((s ?? {}) as Record<string, number>).map(([k, v]) => `${v} ${k.replace(/_/g, ' ')}`).join(', ');
const plural = (k: number, one: string, many = `${one}s`) => `${k.toLocaleString('en-US')} ${k === 1 ? one : many}`;

/** The answer sentence, built from the database's numbers (never the AI's). */
export function describeMetric(metric: string, d: Record<string, unknown>): string {
  switch (metric) {
    case 'donations': return `${plural(n(d.count), 'completed donation')} totaling ${usd(d.amount)} from ${plural(n(d.donors), 'donor')}, ${period(d)}.`;
    case 'new_fundraisers': return `${plural(n(d.count), 'new fundraiser')}, ${period(d)}${n(d.count) ? ` (${statuses(d.by_status)})` : ''}.`;
    case 'fundraisers_now': return `${plural(n(d.count), 'fundraiser')} right now${n(d.count) ? `: ${statuses(d.by_status)}` : ''}.`;
    case 'coupons_delivered': return `${plural(n(d.count), 'coupon')} worth ${usd(d.amount)} delivered to families, ${period(d)}.`;
    case 'coupons_revealed': return `Families opened ${plural(n(d.count), 'coupon')} worth ${usd(d.amount)}, ${period(d)}.`;
    case 'coupons_used': return `Families marked ${plural(n(d.count), 'coupon')} worth ${usd(d.amount)} as used, ${period(d)}.`;
    case 'coupons_waiting': return `${plural(n(d.count), 'coupon')} worth ${usd(d.amount)} delivered but not opened by the family yet.`;
    case 'emails': return `${plural(n(d.count), 'site email')} sent, ${period(d)}: ${n(d.delivered)} delivered, ${n(d.opened)} opened, ${n(d.bounced)} bounced or blocked.`;
    case 'outreach_emails': return `${plural(n(d.count), 'outreach email')} sent, ${period(d)}: ${n(d.delivered)} delivered, ${n(d.bounced)} bounced or blocked.`;
    case 'new_people': return `${plural(n(d.count), 'new account')}, ${period(d)}.`;
    case 'card_donations': return `${plural(n(d.count), 'donated card')}, ${period(d)}${n(d.count) ? ` (${statuses(d.by_status)})` : ''}.`;
    case 'monthly_gifts': return `${plural(n(d.count), 'active monthly gift')}, ${usd(d.monthly_amount)} a month in gifts.`;
    case 'contact_messages': return `${plural(n(d.count), 'contact message')}, ${period(d)}${n(d.count) ? ` (${statuses(d.by_status)})` : ''}.`;
    case 'open_tasks': return `${plural(n(d.count), 'open task')}.`;
    default: return 'Done.';
  }
}

/** Midnight in US Eastern on a YYYY-MM-DD date, as an ISO time (handles daylight saving). */
export function etStart(ymd: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd ?? '');
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (y < 2020 || y > 2100) return null;
  for (const h of [4, 5]) {
    const t = new Date(Date.UTC(y, mo - 1, d, h));
    const hour = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hourCycle: 'h23' }).format(t);
    if (Number(hour) === 0) return t.toISOString();
  }
  return null;
}
