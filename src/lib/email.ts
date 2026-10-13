import { Resend } from "resend";
import { EMAIL_LOGO_BASE64 } from "./email-logo";

let client: Resend | undefined;
function resend() {
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

export function appUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  return `${base}${path}`;
}

const NAVY = "#313851";
const CREAM = "#F6F3ED";
const MIST = "#C2CBD3";
const MUTED = "#787679";

const LOGO_ATTACHMENT = {
  filename: "kibubu.png",
  content: EMAIL_LOGO_BASE64,
  contentId: "kibubu-logo",
  contentType: "image/png",
};

function layout(content: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${CREAM};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:40px 16px;">
    <tr><td align="center">
      <img src="cid:kibubu-logo" alt="Kibubu" width="160" style="display:block;width:160px;height:auto;margin:0 auto 32px;" />
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:420px;">
        ${content}
      </table>
      <p style="margin:32px 0 0;font-size:12px;color:${MUTED};">Kibubu — your shared household budget</p>
    </td></tr>
  </table>
</body></html>`;
}

function card(inner: string): string {
  return `<tr><td style="background:#ffffff;border:1px solid ${MIST};border-radius:16px;padding:28px;">
    ${inner}
  </td></tr>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px auto 0;"><tr>
    <td style="background:${NAVY};border-radius:12px;">
      <a href="${href}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:700;letter-spacing:0.04em;text-decoration:none;">${label}</a>
    </td></tr></table>`;
}

async function send(to: string, subject: string, text: string, html: string) {
  const { error } = await resend().emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject,
    text,
    html,
    attachments: [LOGO_ATTACHMENT],
  });
  if (error) throw new Error(error.message);
}

/** In dev without RESEND_API_KEY, log the email instead of sending it. */
async function sendOrLog(
  to: string,
  subject: string,
  text: string,
  html: string,
) {
  if (!process.env.RESEND_API_KEY && process.env.NODE_ENV !== "production") {
    console.log(`\n[dev email] to=${to} subject="${subject}"\n${text}\n`);
    return;
  }
  await send(to, subject, text, html);
}

export async function sendOtpEmail(email: string, code: string) {
  const html = layout(
    `` +
      card(`
        <p style="margin:0 0 12px;font-size:14px;color:${MUTED};">Hi,</p>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${NAVY};">Enter this one-time code to sign in to Kibubu:</p>
        <p style="margin:0;text-align:center;font-size:40px;font-weight:800;letter-spacing:0.2em;color:${NAVY};">${code}</p>
        <p style="margin:20px 0 0;font-size:13px;color:${MUTED};">This code expires in 10 minutes.</p>
      `) +
      `<tr><td align="center" style="padding-top:24px;">
        <p style="margin:0;font-size:13px;color:${MUTED};">If you didn't request this, you can ignore this email.</p>
      </td></tr>`,
  );
  await sendOrLog(
    email,
    `${code} is your Kibubu login code`,
    `Your Kibubu login code is ${code}. It expires in 10 minutes.`,
    html,
  );
}

export async function sendInviteEmail(
  email: string,
  inviterName: string | null,
  inviterEmail: string,
) {
  const who = inviterName ?? inviterEmail;
  const loginUrl = appUrl("/login");
  const html = layout(
    `<tr><td align="center" style="padding-bottom:24px;">
        <h1 style="margin:0;font-size:28px;font-weight:800;color:${NAVY};letter-spacing:-0.02em;">You're invited to Kibubu</h1>
      </td></tr>` +
      card(`
        <p style="margin:0 0 12px;font-size:14px;color:${MUTED};">Hi,</p>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${NAVY};"><strong>${who}</strong> invited you to share their household budget on Kibubu. Sign in with this email address to join them.</p>
        ${button(loginUrl, "SIGN IN TO KIBUBU")}
      `),
  );
  await sendOrLog(
    email,
    `${who} invited you to Kibubu`,
    `${who} invited you to share their household budget on Kibubu. Sign in with this email: ${loginUrl}`,
    html,
  );
}

export async function sendReminderEmail(email: string, name: string | null) {
  const spendUrl = appUrl("/spend");
  const html = layout(
    `<tr><td align="center" style="padding-bottom:24px;">
        <h1 style="margin:0;font-size:28px;font-weight:800;color:${NAVY};letter-spacing:-0.02em;">Don't forget today's spending</h1>
      </td></tr>` +
      card(`
        <p style="margin:0 0 12px;font-size:14px;color:${MUTED};">Hi${name ? ` ${name}` : ""},</p>
        <p style="margin:0 0 4px;font-size:14px;line-height:1.6;color:${NAVY};">You haven't logged any spending today. Take a moment to add it while it's fresh.</p>
        ${button(spendUrl, "LOG SPENDING")}
      `),
  );
  await sendOrLog(
    email,
    "Don't forget to log today's spending",
    `Hi${name ? ` ${name}` : ""},\n\nYou haven't logged any spending today. Take a moment to add it:\n\n${spendUrl}\n\n— Kibubu`,
    html,
  );
}
