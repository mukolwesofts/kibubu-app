"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { budgetItems, income, transactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { requireOpenPeriod } from "@/lib/periods";
import {
  amountSchema,
  entryDateSchema,
  idSchema,
  textSchema,
} from "@/lib/validation";

export type BudgetState = { error?: string };

async function getOwnedIncome(householdId: string, id: string) {
  const row = await db.query.income.findFirst({ where: eq(income.id, id) });
  if (!row) return null;
  const period = await requireOpenPeriod(householdId, row.periodId).catch(
    () => null,
  );
  return period ? row : null;
}

async function getOwnedItem(householdId: string, id: string) {
  const row = await db.query.budgetItems.findFirst({
    where: eq(budgetItems.id, id),
  });
  if (!row) return null;
  const period = await requireOpenPeriod(householdId, row.periodId).catch(
    () => null,
  );
  return period ? row : null;
}

// ---- Income ----

export async function addIncome(
  _prev: BudgetState,
  formData: FormData,
): Promise<BudgetState> {
  const user = await requireUser();
  const parsed = z
    .object({
      periodId: idSchema,
      source: textSchema(80, "Name the source"),
      amount: amountSchema,
      date: entryDateSchema,
    })
    .safeParse({
      periodId: formData.get("periodId"),
      source: formData.get("source"),
      amount: formData.get("amount"),
      date: formData.get("date"),
    });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const period = await requireOpenPeriod(
    user.householdId,
    parsed.data.periodId,
  ).catch(() => null);
  if (!period) return { error: "Period not found or closed" };
  await db.insert(income).values({ ...parsed.data, userId: user.id });
  revalidatePath("/budget");
  revalidatePath("/home");
  return {};
}

export async function updateIncome(
  _prev: BudgetState,
  formData: FormData,
): Promise<BudgetState> {
  const user = await requireUser();
  const parsed = z
    .object({
      id: idSchema,
      source: textSchema(80, "Name the source"),
      amount: amountSchema,
      date: entryDateSchema,
    })
    .safeParse({
      id: formData.get("id"),
      source: formData.get("source"),
      amount: formData.get("amount"),
      date: formData.get("date"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const row = await getOwnedIncome(user.householdId, parsed.data.id);
  if (!row) return { error: "Not found" };

  await db
    .update(income)
    .set({
      source: parsed.data.source,
      amount: parsed.data.amount,
      date: parsed.data.date,
    })
    .where(eq(income.id, row.id));
  revalidatePath("/budget");
  revalidatePath("/home");
  return {};
}

export async function deleteIncome(formData: FormData) {
  const user = await requireUser();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const row = await getOwnedIncome(user.householdId, id.data);
  if (!row) return;
  await db.delete(income).where(eq(income.id, row.id));
  revalidatePath("/budget");
  revalidatePath("/home");
}

// ---- Budget items ----

export async function addBudgetItem(
  _prev: BudgetState,
  formData: FormData,
): Promise<BudgetState> {
  const user = await requireUser();
  const parsed = z
    .object({
      periodId: idSchema,
      name: textSchema(60, "Name the category"),
      plannedAmount: amountSchema,
    })
    .safeParse({
      periodId: formData.get("periodId"),
      name: formData.get("name"),
      plannedAmount: formData.get("plannedAmount"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const period = await requireOpenPeriod(
    user.householdId,
    parsed.data.periodId,
  ).catch(() => null);
  if (!period) return { error: "Period not found or closed" };
  const existing = await db.query.budgetItems.findMany({
    where: eq(budgetItems.periodId, parsed.data.periodId),
    orderBy: asc(budgetItems.sort),
  });
  const sort = existing.length ? existing[existing.length - 1].sort + 1 : 0;
  await db.insert(budgetItems).values({ ...parsed.data, sort });
  revalidatePath("/budget");
  revalidatePath("/home");
  return {};
}

export async function updateBudgetItem(
  _prev: BudgetState,
  formData: FormData,
): Promise<BudgetState> {
  const user = await requireUser();
  const parsed = z
    .object({
      id: idSchema,
      name: textSchema(60, "Name the category"),
      plannedAmount: amountSchema,
    })
    .safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
      plannedAmount: formData.get("plannedAmount"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const row = await getOwnedItem(user.householdId, parsed.data.id);
  if (!row) return { error: "Not found" };

  await db
    .update(budgetItems)
    .set({ name: parsed.data.name, plannedAmount: parsed.data.plannedAmount })
    .where(eq(budgetItems.id, row.id));
  revalidatePath("/budget");
  revalidatePath("/home");
  return {};
}

export async function deleteBudgetItem(formData: FormData) {
  const user = await requireUser();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const row = await getOwnedItem(user.householdId, id.data);
  if (!row) return;
  // Detach transactions before deleting so no FK references dangle.
  await db
    .update(transactions)
    .set({ budgetItemId: null })
    .where(eq(transactions.budgetItemId, row.id));
  await db.delete(budgetItems).where(eq(budgetItems.id, row.id));
  revalidatePath("/budget");
  revalidatePath("/home");
}
