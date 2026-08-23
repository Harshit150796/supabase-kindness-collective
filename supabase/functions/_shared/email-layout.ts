/**
 * Shared transactional email layout for CouponDonation.
 *
 * Design constraints (email client safe):
 *  - table-based layout, 600px max width, all styles inline
 *  - no external CSS, no web fonts, no base64 images (Gmail strips them)
 *  - logo served from a stable public URL on the production domain
 *  - light background with explicit colors so dark-mode clients do not invert text
 *  - every HTML email ships with a plain-text alternative
 */

const LOGO_URL = "https://coupondonation.com/favicon-192.png";
const SITE_URL = "https://www.coupondonation.com";
const SUPPORT_EMAIL = "connect@coupondonation.com";
const SECURITY_EMAIL = "security@coupondonation.com";
const COMPANY_LINE = "CouponDonation · United States";

const GREEN = "#2e7d32";
const BLUE = "#1565c0";
const EMERALD = "#10b981";
const INK = "#18181b";
const BODY_TEXT = "#52525b";
const MUTED = "#8a8a94";
const BORDER = "#e6e6eb";

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

function shell(opts: {
  preheader: string;
  heading: string;
  intro: string;
  bodyBlocks: string;
  securityLines: string[];
}): string {
  const security = opts.securityLines
    .map(
      (line) =>
        `<tr><td style="padding:0 0 8px 0;font-family:${FONT};font-size:13px;line-height:20px;color:${BODY_TEXT};">&bull;&nbsp;&nbsp;${line}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${escapeHtml(opts.heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
  <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(opts.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;">
          <!-- Header -->
          <tr>
            <td style="padding:28px 24px 16px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:10px;" valign="middle">
                    <img src="${LOGO_URL}" width="32" height="32" alt="CouponDonation" style="display:block;width:32px;height:32px;border:0;outline:none;text-decoration:none;" />
                  </td>
                  <td valign="middle" style="font-family:${FONT};font-size:18px;font-weight:700;letter-spacing:-0.2px;white-space:nowrap;">
                    <span style="color:${GREEN};">Coupon</span><span style="color:${BLUE};">Donation</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="border-top:1px solid ${BORDER};font-size:0;line-height:0;height:1px;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:24px 24px 4px 24px;">
              <h1 style="margin:0 0 10px 0;font-family:${FONT};font-size:21px;line-height:29px;font-weight:700;color:${INK};">${escapeHtml(opts.heading)}</h1>
              <p style="margin:0 0 20px 0;font-family:${FONT};font-size:15px;line-height:23px;color:${BODY_TEXT};">${opts.intro}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px;">${opts.bodyBlocks}</td>
          </tr>

          <!-- Security notice -->
          <tr>
            <td style="padding:26px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="border-top:1px solid ${BORDER};font-size:0;line-height:0;height:1px;">&nbsp;</td></tr>
              </table>
              <p style="margin:18px 0 10px 0;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:${INK};">Security notice</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${security}</table>
            </td>
          </tr>


          <!-- Footer -->
          <tr>
            <td style="padding:26px 24px 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="border-top:1px solid ${BORDER};font-size:0;line-height:0;height:1px;">&nbsp;</td></tr>
              </table>
              <p style="margin:16px 0 6px 0;font-family:${FONT};font-size:12px;line-height:19px;color:${MUTED};">
                This is an automated security message from ${COMPANY_LINE}. You are receiving it because someone used this email address on our platform. Transactional messages like this one cannot be unsubscribed from.
              </p>
              <p style="margin:0 0 6px 0;font-family:${FONT};font-size:12px;line-height:19px;color:${MUTED};">
                Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:${EMERALD};text-decoration:none;">${SUPPORT_EMAIL}</a> &nbsp;·&nbsp; Report abuse: <a href="mailto:${SECURITY_EMAIL}" style="color:${EMERALD};text-decoration:none;">${SECURITY_EMAIL}</a>
              </p>
              <p style="margin:0;font-family:${FONT};font-size:12px;line-height:19px;color:${MUTED};">
                <a href="${SITE_URL}" style="color:${MUTED};text-decoration:underline;">coupondonation.com</a>
                &nbsp;·&nbsp; <a href="${SITE_URL}/terms" style="color:${MUTED};text-decoration:underline;">Terms</a>
                &nbsp;·&nbsp; <a href="${SITE_URL}/privacy" style="color:${MUTED};text-decoration:underline;">Privacy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const SHARED_SECURITY_LINES = [
  `Never share this code or link with anyone. CouponDonation staff will never ask you for it.`,
  `We will never ask for your password, card number, or bank details by email.`,
  `Didn't request this? Ignore this email, or report it to <a href="mailto:${SECURITY_EMAIL}" style="color:${EMERALD};text-decoration:none;">${SECURITY_EMAIL}</a>.`,
];

/** Verification code (OTP) email. */
export function renderOtpEmail(opts: { code: string; expiresInMinutes: number }): RenderedEmail {
  const { code, expiresInMinutes } = opts;
  const spaced = code.split("").join(" ");

  const bodyBlocks = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0fdf6;border:1px solid #b9ecd2;border-radius:14px;">
      <tr>
        <td align="center" style="padding:22px 12px 18px 12px;">
          <div style="font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#0f7a53;">Verification code</div>
          <div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:30px;line-height:40px;font-weight:700;letter-spacing:6px;color:#064e3b;white-space:nowrap;margin-top:8px;">${escapeHtml(spaced)}</div>
          <div style="font-family:${FONT};font-size:13px;line-height:20px;color:#0f7a53;margin-top:6px;">Expires in ${expiresInMinutes} minutes</div>
        </td>
      </tr>
    </table>`;

  const html = shell({
    preheader: `Your CouponDonation verification code is ${code}. It expires in ${expiresInMinutes} minutes.`,
    heading: "Your verification code",
    intro:
      "Enter this code on CouponDonation to confirm your email address and finish setting up your account.",
    bodyBlocks,
    securityLines: SHARED_SECURITY_LINES,
  });

  const text = [
    "CouponDonation - Your verification code",
    "",
    `Code: ${code}`,
    `This code expires in ${expiresInMinutes} minutes.`,
    "",
    "Enter this code on CouponDonation to confirm your email address.",
    "",
    "SECURITY NOTICE",
    "- Never share this code with anyone. CouponDonation staff will never ask you for it.",
    "- We will never ask for your password, card number, or bank details by email.",
    `- Didn't request this? Ignore this email, or report it to ${SECURITY_EMAIL}.`,
    "",
    `Support: ${SUPPORT_EMAIL}`,
    `${COMPANY_LINE} · ${SITE_URL}`,
    "This is an automated transactional message.",
  ].join("\n");

  return { subject: `${code} is your CouponDonation verification code`, html, text };
}

/** Password reset email. */
export function renderPasswordResetEmail(opts: {
  resetUrl: string;
  expiresInMinutes: number;
}): RenderedEmail {
  const { resetUrl, expiresInMinutes } = opts;
  const safeUrl = escapeHtml(resetUrl);
  const minutesLabel =
    expiresInMinutes % 60 === 0
      ? `${expiresInMinutes / 60} hour${expiresInMinutes === 60 ? "" : "s"}`
      : `${expiresInMinutes} minutes`;

  const bodyBlocks = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding:4px 0 18px 0;">
          <a href="${safeUrl}" style="display:inline-block;background-color:${EMERALD};color:#ffffff;font-family:${FONT};font-size:15px;font-weight:600;line-height:20px;text-decoration:none;padding:14px 30px;border-radius:10px;">Reset my password</a>
        </td>
      </tr>
      <tr>
        <td style="font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">
          This link expires in <strong style="color:${BODY_TEXT};">${minutesLabel}</strong> and can be used once. If the button doesn't work, paste this address into your browser:<br />
          <a href="${safeUrl}" style="color:${EMERALD};word-break:break-all;text-decoration:none;">${safeUrl}</a>
        </td>
      </tr>
    </table>`;

  const html = shell({
    preheader: `Reset your CouponDonation password. This link expires in ${minutesLabel}.`,
    heading: "Reset your password",
    intro:
      "We received a request to reset the password for your CouponDonation account. Use the button below to choose a new one.",
    bodyBlocks,
    securityLines: SHARED_SECURITY_LINES,
  });

  const text = [
    "CouponDonation - Reset your password",
    "",
    "We received a request to reset the password for your CouponDonation account.",
    "",
    `Reset link: ${resetUrl}`,
    `This link expires in ${minutesLabel} and can be used once.`,
    "",
    "SECURITY NOTICE",
    "- Never share this link with anyone. CouponDonation staff will never ask you for it.",
    "- We will never ask for your password, card number, or bank details by email.",
    `- Didn't request this? Ignore this email, or report it to ${SECURITY_EMAIL}.`,
    "",
    `Support: ${SUPPORT_EMAIL}`,
    `${COMPANY_LINE} · ${SITE_URL}`,
    "This is an automated transactional message.",
  ].join("\n");

  return { subject: "Reset your CouponDonation password", html, text };
}

export const EMAIL_SENDER = {
  from: "CouponDonation Security <verify@coupondonation.com>",
  replyTo: SUPPORT_EMAIL,
};
