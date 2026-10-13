import { eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { savingsEntries, savingsGoals } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatKES } from "@/lib/money";
import { NewGoalButton } from "./savings-forms";

export default async function SavingsPage() {
    const user = await requireUser();
    const goals = await db.query.savingsGoals.findMany({
        where: eq(savingsGoals.householdId, user.householdId),
    });
    const allEntries = goals.length
        ? await db.query.savingsEntries.findMany({
            where: inArray(
                savingsEntries.goalId,
                goals.map((g) => g.id),
            ),
        })
        : [];
    const byGoal = new Map<string, number>();
    for (const e of allEntries) {
        const signed = e.type === "deposit" ? e.amount : -e.amount;
        byGoal.set(e.goalId, (byGoal.get(e.goalId) ?? 0) + signed);
    }

    return (
        <div className="space-y-5">
            <h1 className="text-2xl font-extrabold">Savings</h1>

            <div className="divide-y divide-mist/60 rounded-2xl border border-mist bg-white px-4">
                {goals.length === 0 && (
                    <p className="py-4 text-sm text-muted">No goals yet.</p>
                )}
                {goals.map((g) => {
                    const balance = byGoal.get(g.id) ?? 0;
                    const pct = g.target
                        ? Math.min((balance / g.target) * 100, 100)
                        : null;
                    return (
                        <Link
                            key={g.id}
                            href={`/savings/${g.id}`}
                            className="block py-3.5"
                        >
                            <div className="flex items-baseline justify-between text-sm">
                                <span className="font-semibold">{g.name}</span>
                                <span className="font-bold tabular-nums">
                                    {formatKES(balance)}
                                    {g.target ? (
                                        <span className="font-normal text-muted">
                                            {" "}/ {formatKES(g.target)}
                                        </span>
                                    ) : null}
                                </span>
                            </div>
                            {pct !== null && (
                                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-mist/50">
                                    <div
                                        className="h-full rounded-full bg-navy"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            )}
                        </Link>
                    );
                })}
            </div>

            <NewGoalButton />
        </div>
    );
}
