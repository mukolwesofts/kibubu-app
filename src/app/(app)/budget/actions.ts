"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { budgetItems, income } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { requireOpenPeriod } from "@/lib/periods";

export type BudgetState = { error?: string };

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date");
const amountSchema = z.coerce
  .number()
  .int("Whole shillings only")
  .positive("Amount must be more than 0");

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
      periodId: z.string().min(1),
      source: z.string().trim().min(1, "Name the source").max(80),
      amount: amountSchema,
      date: dateSchema,
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
  await requireOpenPeriod(user.householdId, parsed.data.periodId).catch(() => {
    throw new Error("Period not found or closed");
  });
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
      id: z.string().min(1),
      source: z.string().trim().min(1).max(80),
      amount: amountSchema,
      date: dateSchema,
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
  const id = z.string().min(1).parse(formData.get("id"));
  const row = await getOwnedIncome(user.householdId, id);
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
      periodId: z.string().min(1),
      name: z.string().trim().min(1, "Name the category").max(60),
      plannedAmount: amountSchema,
    })
    .safeParse({
      periodId: formData.get("periodId"),
      name: formData.get("name"),
      plannedAmount: formData.get("plannedAmount"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await requireOpenPeriod(user.householdId, parsed.data.periodId).catch(() => {
    throw new Error("Period not found or closed");
  });
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
      id: z.string().min(1),
      name: z.string().trim().min(1).max(60),
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
  const id = z.string().min(1).parse(formData.get("id"));
  const row = await getOwnedItem(user.householdId, id);
  if (!row) return;
  await db.delete(budgetItems).where(eq(budgetItems.id, row.id));
  revalidatePath("/budget");
  revalidatePath("/home");
}
