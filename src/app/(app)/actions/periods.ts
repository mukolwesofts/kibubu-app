"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { budgetItems, periods } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { addDays, monthLabel } from "@/lib/dates";
import { getActivePeriod } from "@/lib/periods";
import { dateOnlySchema } from "@/lib/validation";

export type PeriodState = { error?: string };

/**
 * Start a new budget period. Closes the current active period (sets its
 * end_date to the day before the new start) and copies its budget items —
 * not income or transactions — into the new period.
 */
export async function startNewPeriod(
  _prev: PeriodState,
  formData: FormData,
): Promise<PeriodState> {
  const user = await requireUser();
  const parsed = dateOnlySchema.safeParse(formData.get("startDate"));
  if (!parsed.success) return { error: "Pick a start date" };
  const startDate = parsed.data;

  const active = await getActivePeriod(user.householdId);
  if (active && startDate <= active.startDate) {
    return { error: "Start date must be after the current period began" };
  }

  const newPeriodId = crypto.randomUUID();
  await db.insert(periods).values({
    id: newPeriodId,
    householdId: user.householdId,
    startDate,
    label: monthLabel(startDate),
  });

  if (active) {
    await db
      .update(periods)
      .set({ endDate: addDays(startDate, -1) })
      .where(eq(periods.id, active.id));

    const oldItems = await db.query.budgetItems.findMany({
      where: eq(budgetItems.periodId, active.id),
    });
    if (oldItems.length > 0) {
      await db.insert(budgetItems).values(
        oldItems.map((item) => ({
          periodId: newPeriodId,
          name: item.name,
          plannedAmount: item.plannedAmount,
          sort: item.sort,
        })),
      );
    }
  }

  revalidatePath("/");
  return {};
}
