import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { budgetItems, income } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { todayNairobi } from "@/lib/dates";
import { formatKES } from "@/lib/money";
import { getActivePeriod } from "@/lib/periods";
import { NewPeriodForm } from "@/components/new-period-form";
import { BudgetItemList, IncomeList } from "./budget-forms";

export default async function BudgetPage() {
    const user = await requireUser();
    const period = await getActivePeriod(user.householdId);
    const today = todayNairobi();

    if (!period) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-extrabold">Budget</h1>
                <NewPeriodForm defaultDate={today} first />
            </div>
        );
    }

    const [incomeRows, itemRows] = await Promise.all([
        db.query.income.findMany({
            where: eq(income.periodId, period.id),
            orderBy: asc(income.date),
        }),
        db.query.budgetItems.findMany({
            where: eq(budgetItems.periodId, period.id),
            orderBy: asc(budgetItems.sort),
        }),
    ]);

    const totalIncome = incomeRows.reduce((s, r) => s + r.amount, 0);
    const totalPlanned = itemRows.reduce((s, r) => s + r.plannedAmount, 0);
    const buffer = totalIncome - totalPlanned;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-extrabold">Budget</h1>
                <p className="text-sm text-muted">{period.label}</p>
            </div>

            <section className="rounded-2xl border border-mist bg-white p-5">
                <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <dt className="text-muted">Total income</dt>
                        <dd className="font-bold tabular-nums">{formatKES(totalIncome)}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-muted">Total planned</dt>
                        <dd className="font-bold tabular-nums">{formatKES(totalPlanned)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-mist pt-2">
                        <dt className="font-semibold">Buffer</dt>
                        <dd
                            className={`font-extrabold tabular-nums ${buffer < 0 ? "text-danger" : ""}`}
                        >
                            {formatKES(buffer)}
                        </dd>
                    </div>
                </dl>
            </section>

            <section>
                <IncomeList entries={incomeRows} periodId={period.id} today={today} />
            </section>

            <section>
                <BudgetItemList items={itemRows} periodId={period.id} />
            </section>
        </div>
    );
}
