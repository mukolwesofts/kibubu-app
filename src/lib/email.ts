import { Resend } from "resend";

let client: Resend | undefined;
function resend() {
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

async function send(to: string, subject: string, text: string) {
  const { error } = await resend().emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject,
    text,
  });
  if (error) throw new Error(error.message);
}

/** In dev without RESEND_API_KEY, log the email instead of sending it. */
async function sendOrLog(to: string, subject: string, text: string) {
  if (!process.env.RESEND_API_KEY && process.env.NODE_ENV !== "production") {
    console.log(`\n[dev email] to=${to} subject="${subject}"\n${text}\n`);
    return;
  }
  await send(to, subject, text);
}

export async function sendOtpEmail(email: string, code: string) {
  await sendOrLog(
    email,
    `${code} is your Kibubu login code`,
    `Your Kibubu login code is ${code}. It expires in 10 minutes.`,
  );
}

export async function sendReminderEmail(email: string, name: string | null) {
  await sendOrLog(
    email,
    "Don't forget to log today's spending",
    `Hi${name ? ` ${name}` : ""},\n\nYou haven't logged any spending today. Take a moment to add it:\n\n${appUrl("/spend")}\n\n— Kibubu`,
  );
}

export function appUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  return `${base}${path}`;
}
