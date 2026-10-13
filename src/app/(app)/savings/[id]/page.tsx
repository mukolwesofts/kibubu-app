import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { savingsEntries, savingsGoals, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDate, todayNairobi } from "@/lib/dates";
import { formatKES } from "@/lib/money";
import { entriesBalance } from "@/lib/savings";
import { AddEntryForm } from "../savings-forms";

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const goal = await db.query.savingsGoals.findFirst({
    where: eq(savingsGoals.id, id),
  });
  if (!goal || goal.householdId !== user.householdId) notFound();

  const [entries, members] = await Promise.all([
    db.query.savingsEntries.findMany({
      where: eq(savingsEntries.goalId, goal.id),
      orderBy: [desc(savingsEntries.date), desc(savingsEntries.createdAt)],
    }),
    db.query.users.findMany({ where: eq(users.householdId, user.householdId) }),
  ]);

  const balance = entriesBalance(entries);
  const pct = goal.target ? Math.min((balance / goal.target) * 100, 100) : null;
  const nameOf = (uid: string) =>
    members.find((m) => m.id === uid)?.name ??
    members.find((m) => m.id === uid)?.email.split("@")[0] ??
    "—";

  return (
    <div className="space-y-5">
      <div>
        <Link href="/savings" className="text-xs font-semibold text-muted">
          ← Savings
        </Link>
        <h1 className="mt-1 text-2xl font-extrabold">{goal.name}</h1>
      </div>

      <section className="rounded-2xl border border-mist bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Balance
        </p>
        <p className="mt-1 text-4xl font-extrabold tabular-nums">
          {formatKES(balance)}
        </p>
        {goal.target && (
          <>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-mist/50">
              <div
                className="h-full rounded-full bg-navy"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-sm text-muted">
              {Math.round(pct ?? 0)}% of {formatKES(goal.target)}
            </p>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-mist bg-white p-4">
        <AddEntryForm goalId={goal.id} today={todayNairobi()} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
          History
        </h2>
        <div className="divide-y divide-mist/60 rounded-2xl border border-mist bg-white px-4">
          {entries.length === 0 && (
            <p className="py-4 text-sm text-muted">No entries yet.</p>
          )}
          {entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between py-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold capitalize">
                  {e.type}
                  {e.note && (
                    <span className="font-normal text-muted"> · {e.note}</span>
                  )}
                </p>
                <p className="text-xs text-muted">
                  {formatDate(e.date)} · {nameOf(e.userId)}
                </p>
              </div>
              <span
                className={`shrink-0 font-bold tabular-nums ${
                  e.type === "withdrawal" ? "text-danger" : ""
                }`}
              >
                {e.type === "withdrawal" ? "−" : "+"}
                {formatKES(e.amount)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
