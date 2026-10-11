/**
 * Contact form messages (the closing section of the site footer): US-only validation shared with
 * the form in src/lib/contactForm.ts, and the two emails each message sends — one to
 * support@coupondonation.com (reply goes straight to the sender) and a short confirmation to the sender.
 * The confirmation never repeats what was written, so the form cannot be used to send someone else text.
 */
import { escapeHtml, shell, SUPPORT_EMAIL, SUPPORT_LINE, type RenderedEmail } from './email-layout.ts';

export const SITE_URL = 'https://www.coupondonation.com';

/** Mirrors src/data/usStates.ts (checked by contact-form_test.ts). */
export const US_REGIONS: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan',
  MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
  WI: 'Wisconsin', WY: 'Wyoming', DC: 'Washington, D.C.',
  AS: 'American Samoa', GU: 'Guam', MP: 'Northern Mariana Islands', PR: 'Puerto Rico', VI: 'U.S. Virgin Islands',
};

/** Mirrors CONTACT_TOPICS in src/lib/contactForm.ts. */
export const CONTACT_TOPICS = {
  donation: 'A donation', fundraiser: 'A fundraiser', recipient: 'Getting help',
  account: 'My account', feedback: 'Feedback', other: 'Something else',
} as const;
export type ContactTopic = keyof typeof CONTACT_TOPICS;
export const CONTACT_TOPIC_VALUES = Object.keys(CONTACT_TOPICS) as [ContactTopic, ...ContactTopic[]];

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;
export const MIN_FILL_MS = 3000;
export const PER_IP_PER_HOUR = 5;
export const PER_EMAIL_PER_DAY = 5;

/** '+1XXXXXXXXXX' for a valid North American number, null when empty, 'invalid' otherwise. */
export function normalizeUsPhone(raw?: string | null): string | null | 'invalid' {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (!digits) return null;
  const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(national) ? `+1${national}` : 'invalid';
}

export function formatUsPhone(e164?: string | null): string {
  const d = (e164 ?? '').replace(/^\+1/, '');
  return d.length === 10 ? `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : '';
}

/** One line, no markup or control characters (names, subjects). */
export function cleanLine(value?: string | null, max = 120): string {
  return (value ?? '').replace(/<[^>]*>/g, '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Keeps paragraphs: normalises line endings, drops control characters, caps blank lines at one. */
export function cleanMessage(value?: string | null): string {
  return (value ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, ' ')
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** A greeting name only when it looks like a first name; anything else gets "Hi there". */
export function greetingName(name: string): string | null {
  const first = cleanLine(name, 60).split(' ')[0] ?? '';
  return /^[\p{L}][\p{L}'’.-]{0,29}$/u.test(first) ? first : null;
}

export type ContactMessage = {
  id: string; name: string; email: string; phone: string | null; state: string;
  topic: ContactTopic; message: string; page: string | null; createdAt: string; signedIn: boolean;
};

const WHEN = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/New_York' });
const regionLabel = (code: string) => `${US_REGIONS[code] ?? code} (${code})`;

/** The copy that lands in support@coupondonation.com (Zoho). Reply-To is the sender. */
export function renderSupportEmail(m: ContactMessage): RenderedEmail {
  const topic = CONTACT_TOPICS[m.topic];
  const when = `${WHEN.format(new Date(m.createdAt))} ET`;
  const adminUrl = `${SITE_URL}/admin/contact?id=${encodeURIComponent(m.id)}`;
  const rows: [string, string][] = [
    ['From', m.name], ['Email', m.email], ['Phone', formatUsPhone(m.phone) || 'Not given'], ['State', regionLabel(m.state)],
    ['About', topic], ['Sent', when], ['Page', m.page ? `${SITE_URL}${m.page}` : 'Not recorded'], ['Account', m.signedIn ? 'Signed in' : 'Not signed in'],
  ];
  const cell = 'padding:7px 0;font-family:Arial,sans-serif;font-size:14px;line-height:20px;vertical-align:top;';
  const table = rows.map(([label, value]) => `<tr><td style="${cell}width:96px;color:#6f7b74;">${label}</td><td style="${cell}color:#102017;">${escapeHtml(value)}</td></tr>`).join('');
  const body = escapeHtml(m.message).replace(/\n/g, '<br>');
  const html = `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New website message</title></head>
<body style="margin:0;padding:0;background:#f4f7f5;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f7f5;"><tr><td style="padding:24px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;background:#ffffff;"><tr><td style="padding:28px 28px 8px;font-family:Arial,sans-serif;">
<p style="margin:0 0 6px;font-size:13px;line-height:18px;color:#2e7d32;font-weight:700;">New message from the website contact form</p>
<p style="margin:0 0 18px;font-size:22px;line-height:28px;color:#102017;">${escapeHtml(topic)} &middot; ${escapeHtml(m.name)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${table}</table>
<div style="margin:18px 0 0;padding:16px 18px;background:#f2f7f3;font-size:15px;line-height:23px;color:#102017;">${body}</div>
<p style="margin:18px 0 0;font-size:14px;line-height:21px;color:#435149;">Reply to this email to answer ${escapeHtml(m.name)} directly at ${escapeHtml(m.email)}. Once you have replied, mark it as replied in the <a href="${escapeHtml(adminUrl)}" style="color:#1565c0;">admin panel</a>.</p>
</td></tr><tr><td style="padding:16px 28px 26px;font-family:Arial,sans-serif;font-size:12px;line-height:18px;color:#6f7b74;">Sent through coupondonation.com. The sender also received a short confirmation that does not include their message.</td></tr></table>
</td></tr></table></body></html>`;
  const text = [
    'New message from the website contact form', '',
    ...rows.map(([label, value]) => `${label}: ${value}`), '',
    m.message, '',
    `Reply to this email to answer ${m.name} directly at ${m.email}.`,
    `Admin panel: ${adminUrl}`,
  ].join('\n');
  return { subject: `New message: ${topic} from ${cleanLine(m.name, 60)} (${m.state})`, html, text };
}

/** The confirmation the sender receives. It never repeats their message. */
export function renderContactConfirmation(m: Pick<ContactMessage, 'name' | 'topic' | 'state' | 'createdAt'>): RenderedEmail {
  const first = greetingName(m.name);
  const topic = CONTACT_TOPICS[m.topic];
  const when = `${WHEN.format(new Date(m.createdAt))} ET`;
  const paragraphs = [
    'Thanks for writing to CouponDonation. Your message is with our support team, and a person will reply to this email address.',
    'To add anything, reply to this email. Please leave out card numbers, coupon codes and PINs; we never ask for them by email.',
  ];
  const html = shell({
    preheader: 'Your message is with our support team. A person will reply to this email address.',
    greeting: first ? `Hi ${first}` : 'Hi there', status: 'Support', headline: 'We received your message',
    paragraphs, valueCard: { label: 'Your message', value: topic, details: [`Sent ${when}`, `State: ${US_REGIONS[m.state] ?? m.state}`] },
  });
  const text = [`${first ? `Hi ${first}` : 'Hi there'},`, '', ...paragraphs.flatMap((p) => [p, '']), `About: ${topic}`, `Sent: ${when}`, '', '— The CouponDonation team', '', SUPPORT_LINE].join('\n');
  return { subject: 'We received your message', html, text };
}

export { SUPPORT_EMAIL };
