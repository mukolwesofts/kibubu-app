"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { budgetItems, transactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { requireOpenPeriod } from "@/lib/periods";
import {
  amountSchema,
  entryDateSchema,
  idSchema,
  noteSchema,
} from "@/lib/validation";

export type SpendState = { error?: string };

const txSchema = z.object({
  amount: amountSchema,
  budgetItemId: z
    .union([idSchema, z.literal("")])
    .optional()
    .transform((v) => (v === "" ? null : (v ?? null))),
  note: noteSchema,
  date: entryDateSchema,
});

/** Confirm a budget item belongs to the given period (or null). */
async function validItem(periodId: string, itemId: string | null) {
  if (!itemId) return null;
  const item = await db.query.budgetItems.findFirst({
    where: eq(budgetItems.id, itemId),
  });
  if (!item || item.periodId !== periodId) throw new Error("Invalid category");
  return item;
}

async function getOwnedTransaction(householdId: string, id: string) {
  const row = await db.query.transactions.findFirst({
    where: eq(transactions.id, id),
  });
  if (!row) return null;
  const period = await requireOpenPeriod(householdId, row.periodId).catch(
    () => null,
  );
  return period ? row : null;
}

function revalidate() {
  revalidatePath("/spend");
  revalidatePath("/home");
}

export async function addTransaction(
  _prev: SpendState,
  formData: FormData,
): Promise<SpendState> {
  const user = await requireUser();
  const periodId = idSchema.safeParse(formData.get("periodId"));
  if (!periodId.success) return { error: "Not found" };
  const parsed = txSchema.safeParse({
    amount: formData.get("amount"),
    budgetItemId: formData.get("budgetItemId") || undefined,
    note: formData.get("note") || undefined,
    date: formData.get("date"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await requireOpenPeriod(user.householdId, periodId.data);
    await validItem(periodId.data, parsed.data.budgetItemId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not found" };
  }

  await db.insert(transactions).values({
    ...parsed.data,
    periodId: periodId.data,
    userId: user.id,
  });
  revalidate();
  return {};
}

export async function updateTransaction(
  _prev: SpendState,
  formData: FormData,
): Promise<SpendState> {
  const user = await requireUser();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { error: "Not found" };
  const parsed = txSchema.safeParse({
    amount: formData.get("amount"),
    budgetItemId: formData.get("budgetItemId") || undefined,
    note: formData.get("note") || undefined,
    date: formData.get("date"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const row = await getOwnedTransaction(user.householdId, id.data);
  if (!row) return { error: "Not found" };

  try {
    await validItem(row.periodId, parsed.data.budgetItemId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid category" };
  }

  await db
    .update(transactions)
    .set(parsed.data)
    .where(eq(transactions.id, id.data));
  revalidate();
  return {};
}

export async function deleteTransaction(formData: FormData) {
  const user = await requireUser();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const row = await getOwnedTransaction(user.householdId, id.data);
  if (!row) return;
  await db.delete(transactions).where(eq(transactions.id, id.data));
  revalidate();
}
