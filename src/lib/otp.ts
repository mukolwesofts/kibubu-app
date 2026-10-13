import { createHash, randomInt } from "node:crypto";

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_SEND_COOLDOWN_MS = 60 * 1000; // 1 code per minute per email
export const OTP_SEND_WINDOW_MS = 60 * 60 * 1000; // rate-limit window
export const OTP_SEND_MAX_PER_WINDOW = 5;

export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtp(email: string, code: string): string {
  return createHash("sha256")
    .update(`${email}:${code}:${process.env.SESSION_SECRET}`)
    .digest("hex");
}
