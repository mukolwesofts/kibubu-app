import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { budgetItems, income, transactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { addDays, formatDate, todayNairobi } from "@/lib/dates";
import { formatKES } from "@/lib/money";
import { getAllPeriods, getPeriod } from "@/lib/periods";
import {
    computePeriodStats,
    periodEndForDisplay,
    type PeriodStatus,
} from "@/lib/stats";
import { NewPeriodButton, NewPeriodForm } from "@/components/new-period-form";
import { PeriodSelect } from "@/components/period-select";
import { QuickAddSheet } from "../spend/spend-ui";

const pillStyles: Record<PeriodStatus, string> = {
    good: "bg-navy text-white",
    watch: "bg-mist text-navy",
    over: "bg-danger text-white",
    ended: "bg-mist text-muted",
};

const pillLabels: Record<PeriodStatus, string> = {
    good: "Good",
    watch: "Watch",
    over: "Over",
    ended: "Ended",
};

export default async function HomePage({
    searchParams,
}: {
    searchParams: Promise<{ period?: string }>;
}) {
    const user = await requireUser();
    const params = await searchParams;
    const allPeriods = await getAllPeriods(user.householdId);
    const active = allPeriods.find((p) => p.endDate === null) ?? null;

    const period = params.period
        ? ((await getPeriod(user.householdId, params.period)) ?? active)
        : active;
    const today = todayNairobi();

    if (!period) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-extrabold">Home</h1>
                <NewPeriodForm defaultDate={today} first />
            </div>
        );
    }

    const isActive = period.id === active?.id;

    const [incomeRows, items, txs] = await Promise.all([
        db.query.income.findMany({ where: eq(income.periodId, period.id) }),
        db.query.budgetItems.findMany({
            where: eq(budgetItems.periodId, period.id),
            orderBy: asc(budgetItems.sort),
        }),
        db.query.transactions.findMany({
            where: eq(transactions.periodId, period.id),
        }),
    ]);

    const stats = computePeriodStats(period, incomeRows, items, txs, today);
    const dateRange = `${formatDate(period.startDate)} – ${formatDate(periodEndForDisplay(period))}`;

    return (
        <div className="space-y-5">
            {/* Period switcher */}
            <div className="flex items-center gap-2">
                <PeriodSelect
                    periods={allPeriods.map((p) => ({ id: p.id, label: p.label }))}
                    currentId={period.id}
                />
                <NewPeriodButton
                    defaultDate={today}
                    min={active ? addDays(active.startDate, 1) : undefined}
                />
            </div>

            {/* Hero */}
            <section className="rounded-2xl border border-mist bg-white p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-extrabold">{period.label}</h1>
                        <p className="text-xs text-muted">{dateRange}</p>
                    </div>
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${pillStyles[stats.status]}`}
                    >
                        {pillLabels[stats.status]}
                    </span>
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">
                    Remaining to spend
                </p>
                <p
                    className={`mt-1 text-4xl font-extrabold tabular-nums ${stats.remaining < 0 ? "text-danger" : ""}`}
                >
                    {formatKES(stats.remaining)}
                </p>
                <p className="mt-2 text-sm text-muted">
                    {stats.dailyAllowance !== null ? (
                        <>
                            <span className="font-semibold text-navy tabular-nums">
                                {formatKES(stats.dailyAllowance)}
                            </span>
                            /day · {stats.daysLeft} day{stats.daysLeft === 1 ? "" : "s"} left
                        </>
                    ) : period.endDate ? (
                        `Ended ${formatDate(period.endDate)}`
                    ) : (
                        "No days left in this period"
                    )}
                </p>
            </section>

            {/* Categories */}
            <section>
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
                    Categories
                </h2>
                <div className="divide-y divide-mist/60 rounded-2xl border border-mist bg-white px-4">
                    {stats.byItem.length === 0 && stats.uncategorized === 0 && (
                        <p className="py-4 text-sm text-muted">
                            No budget lines yet — add them on the Budget tab.
                        </p>
                    )}
                    {stats.byItem.map(({ item, spent }) => {
                        const pct =
                            item.plannedAmount > 0
                                ? Math.min((spent / item.plannedAmount) * 100, 100)
                                : spent > 0
                                    ? 100
                                    : 0;
                        const over = spent > item.plannedAmount;
                        return (
                            <div key={item.id} className="py-3">
                                <div className="flex items-baseline justify-between text-sm">
                                    <span className="font-semibold">{item.name}</span>
                                    <span className="tabular-nums text-muted">
                                        <span
                                            className={`font-bold ${over ? "text-danger" : "text-navy"}`}
                                        >
                                            {formatKES(spent)}
                                        </span>{" "}
                                        / {formatKES(item.plannedAmount)}
                                    </span>
                                </div>
                                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-mist/50">
                                    <div
                                        className={`h-full rounded-full ${over ? "bg-danger" : "bg-navy"}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                    {stats.uncategorized > 0 && (
                        <div className="flex items-baseline justify-between py-3 text-sm">
                            <span className="font-semibold text-muted">Uncategorized</span>
                            <span className="font-bold tabular-nums text-muted">
                                {formatKES(stats.uncategorized)}
                            </span>
                        </div>
                    )}
                </div>
            </section>

            {isActive && (
                <QuickAddSheet
                    periodId={period.id}
                    items={items.map(({ id, name }) => ({ id, name }))}
                    today={today}
                />
            )}
        </div>
    );
}
