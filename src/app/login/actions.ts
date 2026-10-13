"use server";

import { and, desc, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { households, invites, otpCodes, users } from "@/db/schema";
import { sendOtpEmail } from "@/lib/email";
import {
  generateOtp,
  hashOtp,
  OTP_MAX_ATTEMPTS,
  OTP_SEND_COOLDOWN_MS,
  OTP_SEND_MAX_PER_WINDOW,
  OTP_SEND_WINDOW_MS,
  OTP_TTL_MS,
} from "@/lib/otp";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/session";

export type LoginState = { error?: string; sent?: boolean; devCode?: string };

const devCode = (code: string) =>
  !process.env.RESEND_API_KEY && process.env.NODE_ENV !== "production"
    ? code
    : undefined;

const emailSchema = z.email().transform((v) => v.toLowerCase());
const codeSchema = z.string().regex(/^\d{6}$/, "Enter the 6-digit code");

export async function requestOtp(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email address" };
  const email = parsed.data;

  const windowStart = new Date(Date.now() - OTP_SEND_WINDOW_MS);
  const recent = await db.query.otpCodes.findMany({
    where: and(eq(otpCodes.email, email), gt(otpCodes.createdAt, windowStart)),
    orderBy: desc(otpCodes.createdAt),
  });

  if (recent.length >= OTP_SEND_MAX_PER_WINDOW) {
    return { error: "Too many codes requested. Try again later." };
  }
  const latest = recent[0];
  if (latest && Date.now() - latest.createdAt.getTime() < OTP_SEND_COOLDOWN_MS) {
    return { error: "Please wait a moment before requesting another code." };
  }

  const code = generateOtp();
  const row = await db
    .insert(otpCodes)
    .values({
      email,
      codeHash: hashOtp(email, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    })
    .returning({ id: otpCodes.id });

  try {
    await sendOtpEmail(email, code);
  } catch {
    // Roll back the insert so a failed send doesn't consume the rate limit.
    await db.delete(otpCodes).where(eq(otpCodes.id, row[0].id));
    return { error: "Couldn't send the email. Try again in a moment." };
  }
  return { sent: true, devCode: devCode(code) };
}

export async function verifyOtp(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const emailResult = emailSchema.safeParse(formData.get("email"));
  const codeResult = codeSchema.safeParse(formData.get("code"));
  if (!emailResult.success || !codeResult.success) {
    return { error: "Enter the 6-digit code" };
  }
  const email = emailResult.data;
  const code = codeResult.data;

  const otp = await db.query.otpCodes.findFirst({
    where: eq(otpCodes.email, email),
    orderBy: desc(otpCodes.createdAt),
  });

  if (!otp || otp.expiresAt.getTime() < Date.now()) {
    return { error: "Code expired. Request a new one." };
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    return { error: "Too many attempts. Request a new code." };
  }

  if (hashOtp(email, code) !== otp.codeHash) {
    await db
      .update(otpCodes)
      .set({ attempts: otp.attempts + 1 })
      .where(eq(otpCodes.id, otp.id));
    return { error: "Incorrect code" };
  }

  // Consume all outstanding codes for this email.
  await db.delete(otpCodes).where(eq(otpCodes.email, email));

  const user = await findOrCreateUser(email);

  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession({ sub: user.id, hid: user.householdId }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  redirect("/home");
}

async function findOrCreateUser(email: string) {
  // A pending invite always determines which household the user joins.
  const invite = await db.query.invites.findFirst({
    where: eq(invites.email, email),
    orderBy: desc(invites.createdAt),
  });

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    if (invite && existing.householdId !== invite.householdId) {
      await db
        .update(users)
        .set({ householdId: invite.householdId })
        .where(eq(users.id, existing.id));
      existing.householdId = invite.householdId;
    }
  } else {
    const householdId =
      invite?.householdId ??
      (await db
        .insert(households)
        .values({ name: "My Household" })
        .returning({ id: households.id }))[0].id;
    const created = await db
      .insert(users)
      .values({ email, householdId })
      .returning();
    if (invite) await db.delete(invites).where(eq(invites.email, email));
    return created[0];
  }

  if (invite) await db.delete(invites).where(eq(invites.email, email));
  return existing;
}
