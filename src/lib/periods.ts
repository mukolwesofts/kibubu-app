import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { periods, type Period } from "@/db/schema";

/** The active period is the one with end_date null. */
export async function getActivePeriod(householdId: string) {
  return db.query.periods.findFirst({
    where: and(eq(periods.householdId, householdId), isNull(periods.endDate)),
  });
}

export async function getAllPeriods(householdId: string): Promise<Period[]> {
  return db.query.periods.findMany({
    where: eq(periods.householdId, householdId),
    orderBy: desc(periods.startDate),
  });
}

/** Fetch a period by id, scoped to the household. Returns null if not found. */
export async function getPeriod(
  householdId: string,
  periodId: string,
): Promise<Period | null> {
  const period = await db.query.periods.findFirst({
    where: and(eq(periods.id, periodId), eq(periods.householdId, householdId)),
  });
  return period ?? null;
}

/** Verify a period id belongs to the household AND is still open (editable). */
export async function requireOpenPeriod(householdId: string, periodId: string) {
  const period = await getPeriod(householdId, periodId);
  if (!period) throw new Error("Period not found");
  if (period.endDate !== null) throw new Error("This period is closed");
  return period;
}
