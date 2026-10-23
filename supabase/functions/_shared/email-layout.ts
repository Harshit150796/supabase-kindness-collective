/** One email-safe renderer for every non-marketing message. */
const LOGO_URL = 'https://coupondonation.com/favicon-192.png';
export const SUPPORT_EMAIL = 'support@coupondonation.com';
export const SUPPORT_LINE = 'Questions or concerns? Email support@coupondonation.com and a person will reply.';
export const SECURITY_SUPPORT_LINE = "Didn't request this? Email support@coupondonation.com right away.";
const INK = '#102017';
const BODY = '#435149';
const MUTED = '#6f7b74';
const GREEN = '#2e7d32';
const BLUE = '#1565c0';
const SOFT = '#f2f7f3';
const LINE = '#dbe5dd';
const FONT = "'Instrument Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif";
const SERIF = "'Instrument Serif',Georgia,'Times New Roman',serif";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}

export type TimelineStep = { label: string; detail?: string; complete: boolean };
export type ValueCard = { label: string; value: string; details?: string[] };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const table = (content: string, attrs = '') => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ${attrs}>${content}</table>`;
const row = (content: string, style = '') => `<tr><td style="${style}">${content}</td></tr>`;

export function shell(opts: {
  preheader: string; greeting?: string; status?: string; headline?: string; paragraphs: string[];
  valueCard?: ValueCard; timeline?: TimelineStep[]; link?: { label: string; url: string };
  secondaryLink?: { label: string; url: string }; footer?: string; sample?: boolean; code?: string;
  recipient?: boolean; security?: boolean;
}): string {
  const greeting = `${opts.greeting ?? 'Hi there'},`;
  const status = opts.status ? row(escapeHtml(opts.status.toUpperCase()), `padding:0 0 10px;font-family:${FONT};font-size:11px;line-height:16px;font-weight:700;letter-spacing:1.2px;color:${GREEN};`) : '';
  const headline = opts.headline ? row(escapeHtml(opts.headline), `padding:0 0 22px;font-family:${SERIF};font-size:34px;line-height:39px;font-weight:400;color:${INK};`) : '';
  const paragraphs = opts.paragraphs.map((p) => row(escapeHtml(p), `padding:0 0 15px;font-family:${FONT};font-size:15px;line-height:23px;color:${BODY};`)).join('');
  const card = opts.valueCard ? row(table(
    row(escapeHtml(opts.valueCard.label.toUpperCase()), `padding:20px 22px 5px;font-family:${FONT};font-size:10px;line-height:15px;font-weight:700;letter-spacing:1px;color:${MUTED};`) +
    row(escapeHtml(opts.valueCard.value), `padding:0 22px 8px;font-family:${SERIF};font-size:30px;line-height:36px;color:${INK};`) +
    (opts.valueCard.details ?? []).map((d) => row(escapeHtml(d), `padding:0 22px 7px;font-family:${FONT};font-size:13px;line-height:19px;color:${BODY};`)).join('') +
    row('&nbsp;', 'height:12px;font-size:1px;line-height:1px;'), `bgcolor="${SOFT}" style="background:${SOFT};border:1px solid ${LINE};"`), 'padding:5px 0 22px;') : '';
  const timeline = opts.timeline?.length ? row(table(opts.timeline.map((step, i) => {
    const dot = `<div style="width:10px;height:10px;border-radius:10px;border:2px solid ${step.complete ? GREEN : '#aab5ae'};background:${step.complete ? GREEN : '#ffffff'};"></div>`;
    const stem = i < (opts.timeline?.length ?? 0) - 1 ? `<div style="width:2px;height:27px;background:${step.complete ? '#9fc8a3' : LINE};margin:3px 0 0 5px;"></div>` : '';
    return `<tr><td width="24" valign="top" style="width:24px;padding:2px 0 0;">${dot}${stem}</td><td valign="top" style="padding:0 0 15px;font-family:${FONT};font-size:14px;line-height:20px;color:${step.complete ? INK : MUTED};"><strong style="font-weight:600;">${escapeHtml(step.label)}</strong>${step.detail ? `<br><span style="font-size:12px;color:${MUTED};">${escapeHtml(step.detail)}</span>` : ''}</td></tr>`;
  }).join('')), 'padding:0 4px 20px;') : '';
  const code = opts.code ? row(`<span style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',monospace;font-size:32px;line-height:40px;letter-spacing:4px;color:${INK};">${escapeHtml(opts.code)}</span>`, 'padding:8px 0 24px;') : '';
  const cta = opts.link ? row(table(row(`<a href="${escapeHtml(opts.link.url)}" style="display:inline-block;padding:12px 20px;font-family:${FONT};font-size:14px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;background:${GREEN};border-radius:4px;">${escapeHtml(opts.link.label)}</a>`), `bgcolor="${GREEN}" style="background:${GREEN};border-radius:4px;text-align:center;"`), 'padding:2px 0 18px;') : '';
  const secondary = opts.secondaryLink ? row(`<a href="${escapeHtml(opts.secondaryLink.url)}" style="font-family:${FONT};font-size:13px;line-height:20px;color:${INK};text-decoration:underline;">${escapeHtml(opts.secondaryLink.label)}</a>`, 'padding:0 0 18px;') : '';
  const banner = opts.sample ? row('SAMPLE EMAIL · sample data, not a real donation', `padding:9px 12px;font-family:${FONT};font-size:10px;line-height:15px;font-weight:700;letter-spacing:.7px;color:${INK};background:${SOFT};border:1px solid ${LINE};`) : '';
  const lockup = table(`<tr><td width="44" valign="middle"><img src="${LOGO_URL}" width="36" height="36" alt="CouponDonation" style="display:block;width:36px;height:36px;border:0;"></td><td valign="middle" style="font-family:${FONT};font-size:17px;line-height:22px;font-weight:700;"><span style="color:${GREEN};">Coupon</span><span style="color:${BLUE};">Donation</span></td></tr>`);
  const supportCopy = opts.security ? "Didn't request this? Email " : 'Questions or concerns? Email ';
  const supportEnd = opts.security ? ' right away.' : ' and a person will reply.';
  const support = opts.recipient === false ? '' : `${opts.footer ? '<br>' : ''}${escapeHtml(supportCopy)}<a href="mailto:${SUPPORT_EMAIL}" style="color:${MUTED};text-decoration:underline;">${SUPPORT_EMAIL}</a>${escapeHtml(supportEnd)}`;
  const footer = opts.footer || support ? row(`${opts.footer ?? ''}${support}`, `padding:24px 0 0;font-family:${FONT};font-size:11px;line-height:17px;color:${MUTED};`) : '';
  const body = banner + row(lockup, 'padding:22px 0 34px;') + status + headline + row(escapeHtml(greeting), `padding:0 0 16px;font-family:${FONT};font-size:15px;line-height:23px;color:${INK};`) + paragraphs + code + card + timeline + cta + secondary + row('— The CouponDonation team', `padding:3px 0 0;font-family:${FONT};font-size:15px;line-height:23px;color:${INK};`) + footer;
  return `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light"><title>CouponDonation</title></head><body bgcolor="#f4f7f5" style="margin:0;padding:0;background:#f4f7f5;">${table(row(`<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(opts.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;</div>${table(row(table(body, 'style="max-width:600px;background:#ffffff;"'), 'padding:0 24px 34px;'), 'width="600" bgcolor="#ffffff" style="width:100%;max-width:600px;background:#ffffff;"')}`, 'padding:20px 0;background:#f4f7f5;',), 'bgcolor="#f4f7f5"')} </body></html>`;
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

export const EMAIL_SENDER = {
  from: "CouponDonation <notifications@coupondonation.com>",
  replyTo: SUPPORT_EMAIL,
};

/** Generic notification email (messages, invites, updates). Text is escaped. */
export function renderNoticeEmail(opts: {
  subject: string; heading: string; intro: string; ctaLabel: string; ctaUrl: string; footerNote?: string; firstName?: string;
}): RenderedEmail {
  const html = shell({
    preheader: opts.intro.slice(0, 120), greeting: opts.firstName ? `Hi ${opts.firstName}` : 'Hi there',
    status: 'Account update', headline: opts.heading, paragraphs: [opts.intro], link: { label: opts.ctaLabel, url: opts.ctaUrl }, footer: opts.footerNote ? escapeHtml(opts.footerNote) : undefined,
  });
  const text = [opts.firstName ? `Hi ${opts.firstName},` : 'Hi there,', '', opts.intro, '', `${opts.ctaLabel}: ${opts.ctaUrl}`, '', '— The CouponDonation team', '', opts.footerNote ?? '', SUPPORT_LINE].filter(Boolean).join('\n');
  return { subject: opts.subject, html, text };
}

export const NOTIFY_SENDER = { from: 'CouponDonation <notifications@coupondonation.com>', replyTo: SUPPORT_EMAIL };
export const ADMIN_SENDER = { from: 'CouponDonation <notifications@coupondonation.com>', replyTo: 'connect@coupondonation.com' };
