import { eq } from "drizzle-orm";
import { db } from "@/db";
import { savingsEntries } from "@/db/schema";

/** Balance is always computed: deposits minus withdrawals. */
export async function goalBalance(goalId: string): Promise<number> {
  const entries = await db.query.savingsEntries.findMany({
    where: eq(savingsEntries.goalId, goalId),
  });
  return entries.reduce(
    (s, e) => s + (e.type === "deposit" ? e.amount : -e.amount),
    0,
  );
}

export function entriesBalance(
  entries: { type: "deposit" | "withdrawal"; amount: number }[],
): number {
  return entries.reduce(
    (s, e) => s + (e.type === "deposit" ? e.amount : -e.amount),
    0,
  );
}
