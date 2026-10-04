/** Short, personal account mail. No promotional chrome or tracking headers. */

const LOGO_URL = "https://coupondonation.com/favicon-192.png";
const SITE_URL = "https://www.coupondonation.com";
const SUPPORT_EMAIL = "connect@coupondonation.com";
const INK = "#18181b";
const BODY_TEXT = "#52525b";
const MUTED = "#8a8a94";

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(opts: { preheader: string; greeting?: string; paragraphs: string[]; link?: { label: string; url: string }; footer?: string }): string {
  const paragraphs = opts.paragraphs.map((p) => `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:23px;color:${BODY_TEXT};">${p}</p>`).join('');
  const link = opts.link ? `<p style="margin:0 0 18px;font-family:${FONT};font-size:15px;line-height:23px;"><a href="${escapeHtml(opts.link.url)}" style="color:${INK};text-decoration:underline;">${escapeHtml(opts.link.label)}</a></p>` : '';
  return `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CouponDonation</title></head><body style="margin:0;background:#ffffff"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(opts.preheader)}</div><main style="max-width:560px;margin:0 auto;padding:28px 22px;color:${INK}"><img src="${LOGO_URL}" width="32" height="32" alt="CouponDonation" style="display:block;width:32px;height:32px;margin:0 0 24px"><p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:23px;color:${INK};">${escapeHtml(opts.greeting ?? 'Hi there')},</p>${paragraphs}${link}<p style="margin:20px 0 0;font-family:${FONT};font-size:15px;line-height:23px;color:${INK};">— The CouponDonation team</p>${opts.footer ? `<p style="margin:24px 0 0;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED};">${opts.footer}</p>` : ''}</main></body></html>`;
}

/** Verification code (OTP) email. */
export function renderOtpEmail(opts: { code: string; expiresInMinutes: number }): RenderedEmail {
  const { code, expiresInMinutes } = opts;
  const html = shell({
    preheader: `Use this code to confirm your CouponDonation account.`,
    paragraphs: [`Your verification code is <strong>${escapeHtml(code)}</strong>. It expires in ${expiresInMinutes} minutes.`, "Enter it on CouponDonation to confirm your email address. If you didn't request it, you can ignore this message."],
  });

  const text = [
    "Hi there,", "", `Your verification code is ${code}. It expires in ${expiresInMinutes} minutes.`, "", "Enter it on CouponDonation to confirm your email address. If you didn't request it, you can ignore this message.", "", "— The CouponDonation team",
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
    paragraphs: [`We received a request to reset your CouponDonation password. This link expires in ${minutesLabel} and can be used once.`, "If you didn't request this, you can ignore this message."],
    link: { label: "Reset your password", url: resetUrl },
  });

  const text = [
    "Hi there,", "", `We received a request to reset your CouponDonation password. This link expires in ${minutesLabel} and can be used once.`, "", `Reset your password: ${resetUrl}`, "", "If you didn't request this, you can ignore this message.", "", "— The CouponDonation team",
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
    paragraphs: [escapeHtml(opts.intro)], link: { label: opts.ctaLabel, url: opts.ctaUrl }, footer: opts.footerNote,
  });
  const text = [opts.firstName ? `Hi ${opts.firstName},` : 'Hi there,', '', opts.intro, '', `${opts.ctaLabel}: ${opts.ctaUrl}`, '', '— The CouponDonation team', opts.footerNote ?? ''].join('\n');
  return { subject: opts.subject, html, text };
}

export const NOTIFY_SENDER = { from: 'CouponDonation <notifications@coupondonation.com>', replyTo: SUPPORT_EMAIL };
