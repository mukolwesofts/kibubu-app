import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = () => process.env.EMAIL_FROM!;

export async function sendOtpEmail(email: string, code: string) {
  await resend.emails.send({
    from: FROM(),
    to: email,
    subject: `${code} is your Kibubu login code`,
    text: `Your Kibubu login code is ${code}. It expires in 10 minutes.`,
  });
}

export async function sendReminderEmail(email: string, name: string | null) {
  await resend.emails.send({
    from: FROM(),
    to: email,
    subject: "Don't forget to log today's spending",
    text: `Hi${name ? ` ${name}` : ""},\n\nYou haven't logged any spending today. Take a moment to add it:\n\n${appUrl("/spend")}\n\n— Kibubu`,
  });
}

export function appUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base}${path}`;
}
