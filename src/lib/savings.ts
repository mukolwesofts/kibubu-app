import { and, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { savingsEntries } from "@/db/schema";

/** Balance is always computed: deposits minus withdrawals. */
export async function goalBalance(goalId: string): Promise<number> {
  const entries = await db.query.savingsEntries.findMany({
    where: eq(savingsEntries.goalId, goalId),
  });
  return entriesBalance(entries);
}

/** Running balance counting only entries on or before `date` (YYYY-MM-DD). */
export async function goalBalanceAt(
  goalId: string,
  date: string,
): Promise<number> {
  const entries = await db.query.savingsEntries.findMany({
    where: and(eq(savingsEntries.goalId, goalId), lte(savingsEntries.date, date)),
  });
  return entriesBalance(entries);
}

export function entriesBalance(
  entries: { type: "deposit" | "withdrawal"; amount: number }[],
): number {
  return entries.reduce(
    (s, e) => s + (e.type === "deposit" ? e.amount : -e.amount),
    0,
  );
}
