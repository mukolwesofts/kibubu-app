"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { savingsEntries, savingsGoals } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { goalBalanceAt } from "@/lib/savings";
import {
  amountSchema,
  entryDateSchema,
  idSchema,
  noteSchema,
  textSchema,
} from "@/lib/validation";

export type SavingsState = { error?: string };

async function getOwnedGoal(householdId: string, goalId: string) {
  const goal = await db.query.savingsGoals.findFirst({
    where: eq(savingsGoals.id, goalId),
  });
  return goal?.householdId === householdId ? goal : null;
}

export async function addGoal(
  _prev: SavingsState,
  formData: FormData,
): Promise<SavingsState> {
  const user = await requireUser();
  const parsed = z
    .object({
      name: textSchema(60, "Name the goal"),
      target: amountSchema
        .optional()
        .or(z.literal("").transform(() => undefined)),
    })
    .safeParse({
      name: formData.get("name"),
      target: formData.get("target") || undefined,
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.insert(savingsGoals).values({
    householdId: user.householdId,
    name: parsed.data.name,
    target: parsed.data.target ?? null,
  });
  revalidatePath("/savings");
  return {};
}

export async function addEntry(
  _prev: SavingsState,
  formData: FormData,
): Promise<SavingsState> {
  const user = await requireUser();
  const parsed = z
    .object({
      goalId: idSchema,
      type: z.enum(["deposit", "withdrawal"]),
      amount: amountSchema,
      note: noteSchema,
      date: entryDateSchema,
    })
    .safeParse({
      goalId: formData.get("goalId"),
      type: formData.get("type"),
      amount: formData.get("amount"),
      note: formData.get("note") || undefined,
      date: formData.get("date"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const goal = await getOwnedGoal(user.householdId, parsed.data.goalId);
  if (!goal) return { error: "Goal not found" };

  if (parsed.data.type === "withdrawal") {
    // Balance as of the entry's date — can't withdraw money that isn't there yet.
    const balance = await goalBalanceAt(goal.id, parsed.data.date);
    if (parsed.data.amount > balance) {
      return { error: "Can't withdraw more than the balance on that date" };
    }
  }

  await db.insert(savingsEntries).values({
    ...parsed.data,
    goalId: goal.id,
    userId: user.id,
  });
  revalidatePath("/savings");
  revalidatePath(`/savings/${goal.id}`);
  return {};
}
