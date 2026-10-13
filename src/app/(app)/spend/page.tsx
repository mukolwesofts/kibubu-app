import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { budgetItems, transactions, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDate, todayNairobi } from "@/lib/dates";
import { getActivePeriod } from "@/lib/periods";
import { NewPeriodForm } from "@/components/new-period-form";
import { AddTransactionForm, TransactionRow } from "./spend-ui";

export default async function SpendPage({
    searchParams,
}: {
    searchParams: Promise<{ cat?: string }>;
}) {
    const user = await requireUser();
    const { cat } = await searchParams;
    const period = await getActivePeriod(user.householdId);

    if (!period) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-extrabold">Spend</h1>
                <NewPeriodForm defaultDate={todayNairobi()} first />
            </div>
        );
    }

    const [items, txs, members] = await Promise.all([
        db.query.budgetItems.findMany({
            where: eq(budgetItems.periodId, period.id),
        }),
        db.query.transactions.findMany({
            where: eq(transactions.periodId, period.id),
            orderBy: [desc(transactions.date), desc(transactions.createdAt)],
        }),
        db.query.users.findMany({ where: eq(users.householdId, user.householdId) }),
    ]);

    const nameOf = (id: string) =>
        members.find((m) => m.id === id)?.name ??
        members.find((m) => m.id === id)?.email.split("@")[0] ??
        "—";

    const filtered = cat
        ? txs.filter((t) => (cat === "none" ? !t.budgetItemId : t.budgetItemId === cat))
        : txs;

    const groups = new Map<string, typeof filtered>();
    for (const t of filtered) {
        const g = groups.get(t.date) ?? [];
        g.push(t);
        groups.set(t.date, g);
    }

    const usedItemIds = new Set(txs.map((t) => t.budgetItemId).filter(Boolean));
    const filterItems = items.filter((i) => usedItemIds.has(i.id));
    const hasUncategorized = txs.some((t) => !t.budgetItemId);
    const today = todayNairobi();

    const chip = (label: string, value: string | undefined, active: boolean) => (
        <Link
            key={label}
            href={value ? `/spend?cat=${value}` : "/spend"}
            scroll={false}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${active ? "border-navy bg-navy text-white" : "border-mist bg-white text-muted"
                }`}
        >
            {label}
        </Link>
    );

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-extrabold">Spend</h1>
                <p className="text-sm text-muted">{period.label}</p>
            </div>

            <section className="rounded-2xl border border-mist bg-white p-4">
                <AddTransactionForm periodId={period.id} items={items} today={today} />
            </section>

            {(filterItems.length > 0 || hasUncategorized) && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {chip("All", undefined, !cat)}
                    {filterItems.map((i) => chip(i.name, i.id, cat === i.id))}
                    {hasUncategorized && chip("Uncategorized", "none", cat === "none")}
                </div>
            )}

            {filtered.length === 0 ? (
                <p className="pt-6 text-center text-sm text-muted">
                    No spending logged yet.
                </p>
            ) : (
                [...groups.entries()].map(([date, rows]) => (
                    <section key={date}>
                        <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
                            {date === today ? "Today" : formatDate(date)}
                        </h2>
                        <div className="divide-y divide-mist/60 rounded-2xl border border-mist bg-white px-3">
                            {rows.map((t) => (
                                <TransactionRow
                                    key={t.id}
                                    tx={t}
                                    items={items}
                                    who={nameOf(t.userId)}
                                    today={today}
                                />
                            ))}
                        </div>
                    </section>
                ))
            )}
        </div>
    );
}
