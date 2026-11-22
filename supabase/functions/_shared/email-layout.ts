/**
 * One renderer for every non-marketing message, written to read like a note from a person (founder request,
 * Nov 21, 2026: our emails were landing in Gmail's Promotions tab). Gmail sorts by how a message looks, so
 * this layout leaves out what newsletters carry: no coloured panels or background, no button-shaped links,
 * no hidden preview text, no capitals labels, and one image only, the small logo at the top (founder's
 * request). Plain left-aligned text: the logo, a bold line with the news, a few short lines, ordinary blue
 * links, one signature and a small footer. Keep the words to what matters (founder request, same day).
 */
const LOGO_URL = 'https://coupondonation.com/favicon-192.png';
export const SUPPORT_EMAIL = 'support@coupondonation.com';
export const SUPPORT_LINE = 'Questions or concerns? Email support@coupondonation.com and a person will reply.';
export const SECURITY_SUPPORT_LINE = "Didn't request this? Email support@coupondonation.com right away.";
const INK = '#1f2421';
const MUTED = '#5f6662';
const LINK = '#1a5fb4';
const GREEN = '#2e7d32';
const BLUE = '#1565c0';
const FONT = 'Arial,Helvetica,sans-serif';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}

export type TimelineStep = { label: string; detail?: string; complete: boolean };
/** A to-do with one-tap links (open the phone's texts, WhatsApp, an email draft…). */
export type ChecklistStep = { title: string; detail: string; actions?: { label: string; url: string }[] };
/** Words the reader can copy as they are (a message to send, a note to forward). */
export type CopyBox = { label: string; body: string; hint?: string };
export type ValueCard = { label: string; value: string; details?: string[] };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const P = `margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:22px;color:${INK};`;
const para = (html: string, extra = '') => `<p style="${P}${extra}">${html}</p>`;
/** Escaped text with its single line breaks kept (staff-written notes use them). */
const lines = (value: string) => escapeHtml(value).replace(/\n/g, '<br>');
const link = (label: string, url: string) => `<a href="${escapeHtml(url)}" style="color:${LINK};text-decoration:underline;">${escapeHtml(label)}</a>`;

export function shell(opts: {
  preheader: string; greeting?: string; status?: string; headline?: string; paragraphs: string[];
  valueCard?: ValueCard; timeline?: TimelineStep[]; checklist?: ChecklistStep[]; copyBox?: CopyBox; closing?: string[];
  link?: { label: string; url: string };
  /** One plain sentence with the link, right after the paragraphs ("Here’s your link: share.coupondonation.com/f/…"). */
  linkLine?: { lead: string; label: string; url: string };
  secondaryLink?: { label: string; url: string }; footer?: string; sample?: boolean; code?: string;
  recipient?: boolean; security?: boolean;
}): string {
  // `preheader` and `status` stay in the signature for callers, but are not drawn: hidden preview text and
  // small capitals labels are newsletter traits. The first line of the email is the preview.
  const parts: string[] = [];
  if (opts.sample) parts.push(para('SAMPLE EMAIL · sample data, not a real donation', `color:${MUTED};font-size:13px;`));
  parts.push(`<p style="margin:0 0 22px;font-family:${FONT};font-size:18px;line-height:36px;font-weight:700;"><img src="${LOGO_URL}" width="36" height="36" alt="" style="width:36px;height:36px;border:0;vertical-align:middle;margin-right:10px;"><span style="vertical-align:middle;color:${GREEN};">Coupon</span><span style="vertical-align:middle;color:${BLUE};">Donation</span></p>`);
  if (opts.headline) parts.push(`<p style="margin:0 0 16px;font-family:${FONT};font-size:20px;line-height:27px;font-weight:700;color:${INK};">${escapeHtml(opts.headline)}</p>`);
  parts.push(para(`${escapeHtml(opts.greeting ?? 'Hi there')},`));
  parts.push(...opts.paragraphs.map((p) => para(lines(p))));
  if (opts.linkLine) parts.push(para(`${escapeHtml(opts.linkLine.lead)} ${link(opts.linkLine.label, opts.linkLine.url)}`));
  if (opts.code) parts.push(para(`<strong style="font-size:24px;line-height:32px;letter-spacing:3px;">${escapeHtml(opts.code)}</strong>`));
  if (opts.valueCard) {
    const v = opts.valueCard;
    parts.push(para([`${escapeHtml(v.label)}: <strong>${escapeHtml(v.value)}</strong>`, ...(v.details ?? []).map(escapeHtml)].join('<br>')));
  }
  if (opts.timeline?.length) {
    parts.push(para(opts.timeline.map((t) => `${t.complete ? '&#10003;' : '&middot;'} ${escapeHtml(t.label)}${t.detail ? ` (${escapeHtml(t.detail)})` : ''}`).join('<br>')));
  }
  if (opts.checklist?.length) {
    opts.checklist.forEach((step, i) => {
      const actions = step.actions?.length ? `<br>${step.actions.map((a) => link(a.label, a.url)).join(' &middot; ')}` : '';
      parts.push(para(`${i + 1}. <strong>${escapeHtml(step.title)}</strong><br>${escapeHtml(step.detail)}${actions}`));
    });
  }
  if (opts.copyBox) {
    const c = opts.copyBox;
    parts.push(para(`${escapeHtml(c.label)}:`));
    parts.push(`<p style="${P}margin-left:16px;color:${INK};">${escapeHtml(c.body).replace(/\n/g, '<br>')}</p>`);
    if (c.hint) parts.push(para(escapeHtml(c.hint), `color:${MUTED};font-size:13px;`));
  }
  parts.push(...(opts.closing ?? []).map((p) => para(lines(p))));
  if (opts.link) parts.push(para(`<strong>${link(opts.link.label, opts.link.url)}</strong>`));
  if (opts.secondaryLink) parts.push(para(link(opts.secondaryLink.label, opts.secondaryLink.url)));
  parts.push(para('— The CouponDonation team'));
  const supportCopy = opts.security ? "Didn't request this? Email " : 'Questions or concerns? Email ';
  const supportEnd = opts.security ? ' right away.' : ' and a person will reply.';
  const support = opts.recipient === false ? '' : `${opts.footer ? '<br>' : ''}${escapeHtml(supportCopy)}<a href="mailto:${SUPPORT_EMAIL}" style="color:${MUTED};">${SUPPORT_EMAIL}</a>${escapeHtml(supportEnd)}`;
  if (opts.footer || support) parts.push(`<p style="margin:22px 0 0;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED};">${opts.footer ?? ''}${support}</p>`);
  return `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CouponDonation</title></head><body style="margin:0;padding:16px;"><div style="max-width:560px;">${parts.join('')}</div></body></html>`;
}

/** Verification code (OTP) email. */
export function renderOtpEmail(opts: { code: string; expiresInMinutes: number }): RenderedEmail {
  const { code, expiresInMinutes } = opts;
  const html = shell({
    preheader: `Use this code to confirm your CouponDonation account.`,
    paragraphs: [`Use this verification code to confirm your email address. It expires in ${expiresInMinutes} minutes.`], code, security: true,
  });

  const text = [
    "Hi there,", "", `Your verification code is ${code}. It expires in ${expiresInMinutes} minutes.`, "", "Enter it on CouponDonation to confirm your email address.", "", "— The CouponDonation team", "", SECURITY_SUPPORT_LINE,
  ].join("\n");

  return { subject: "Your CouponDonation verification code", html, text };
}

/** Password reset email. */
export function renderPasswordResetEmail(opts: {
  resetUrl: string;
  expiresInMinutes: number;
}): RenderedEmail {
  const { resetUrl, expiresInMinutes } = opts;
  const minutesLabel =
    expiresInMinutes % 60 === 0
      ? `${expiresInMinutes / 60} hour${expiresInMinutes === 60 ? "" : "s"}`
      : `${expiresInMinutes} minutes`;

  const html = shell({
    preheader: "Use this link to reset your CouponDonation password.",
    status: 'Account security', headline: 'Reset your password',
    paragraphs: [`We received a request to reset your CouponDonation password. This link expires in ${minutesLabel} and can be used once.`],
    link: { label: "Reset your password", url: resetUrl },
    security: true,
  });

  const text = [
    "Hi there,", "", `We received a request to reset your CouponDonation password. This link expires in ${minutesLabel} and can be used once.`, "", `Reset your password: ${resetUrl}`, "", "— The CouponDonation team", "", SECURITY_SUPPORT_LINE,
  ].join("\n");

  return { subject: "Reset your CouponDonation password", html, text };
}

/**
 * Every site email comes from support@, the address people reply to (founder request, Nov 21, 2026, Primary
 * tab): Gmail learns a sender is someone you know when you write to it, and replies went to support@ while
 * the mail came from notifications@, so that address never earned it. One address for both. The newsletter
 * keeps its own sender (news@, send-newsletter).
 */
const SITE_SENDER = 'CouponDonation <support@coupondonation.com>';
export const EMAIL_SENDER = {
  from: SITE_SENDER,
  replyTo: SUPPORT_EMAIL,
};

/** Generic notification email (messages, invites, updates). Text is escaped. `quote` is a second paragraph (the first lines of an update). */
export function renderNoticeEmail(opts: {
  subject: string; heading?: string; intro: string; quote?: string; ctaLabel: string; ctaUrl: string; footerNote?: string; firstName?: string;
}): RenderedEmail {
  const paragraphs = [opts.intro, ...(opts.quote ? [opts.quote] : [])];
  const html = shell({
    preheader: opts.intro.slice(0, 120), greeting: opts.firstName ? `Hi ${opts.firstName}` : 'Hi there',
    headline: opts.heading, paragraphs, link: { label: opts.ctaLabel, url: opts.ctaUrl }, footer: opts.footerNote ? escapeHtml(opts.footerNote) : undefined,
  });
  const text = [opts.firstName ? `Hi ${opts.firstName},` : 'Hi there,', '', ...paragraphs.flatMap((p) => [p, '']), `${opts.ctaLabel}: ${opts.ctaUrl}`, '', '— The CouponDonation team', '', opts.footerNote ?? '', SUPPORT_LINE].filter((l, i, all) => l !== '' || all[i - 1] !== '').join('\n');
  return { subject: opts.subject, html, text };
}

export const NOTIFY_SENDER = { from: SITE_SENDER, replyTo: SUPPORT_EMAIL };
export const ADMIN_SENDER = { from: SITE_SENDER, replyTo: 'connect@coupondonation.com' };
