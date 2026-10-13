"use server";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { invites, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";

export type SettingsState = { error?: string; sent?: boolean };

const emailSchema = z.email().transform((v) => v.toLowerCase());

export async function inviteByEmail(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireUser();
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email address" };
  const email = parsed.data;

  if (email === user.email) return { error: "That's your own email" };

  const existingMember = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existingMember?.householdId === user.householdId) {
    return { error: "That person is already in your household" };
  }

  const existingInvite = await db.query.invites.findFirst({
    where: and(
      eq(invites.householdId, user.householdId),
      eq(invites.email, email),
    ),
  });
  if (existingInvite) return { error: "They've already been invited" };

  await db.insert(invites).values({ householdId: user.householdId, email });
  revalidatePath("/settings");
  return { sent: true };
}

export async function deleteInvite(formData: FormData) {
  const user = await requireUser();
  const id = z.string().min(1).parse(formData.get("id"));
  await db
    .delete(invites)
    .where(and(eq(invites.id, id), eq(invites.householdId, user.householdId)));
  revalidatePath("/settings");
}

export async function updateName(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireUser();
  const name = z
    .string()
    .trim()
    .max(60)
    .parse(formData.get("name") ?? "");
  await db.update(users).set({ name: name || null }).where(eq(users.id, user.id));
  revalidatePath("/settings");
  return { sent: true };
}

export async function toggleReminder() {
  const user = await requireUser();
  await db
    .update(users)
    .set({ reminderEnabled: !user.reminderEnabled })
    .where(eq(users.id, user.id));
  revalidatePath("/settings");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
